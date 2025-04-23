import fetch from 'node-fetch';
import { Job } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Define the API key source
// We prioritize the server-side environment variable
const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;

console.log('SERPAPI_KEY available:', Boolean(SERPAPI_KEY));

// Define interfaces for API response
interface SerpApiResponse {
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_jobs_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters?: {
    engine: string;
    q: string;
    location: string;
    google_domain: string;
    api_key: string;
  };
  jobs_results?: SerpApiJob[];
  error?: string;
}

interface SerpApiJob {
  title: string;
  company_name: string;
  location: string;
  description: string;
  via: string;
  job_id: string;
  thumbnail?: string;
  extensions?: string[];
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
    work_from_home?: boolean;
  };
  job_highlights?: {
    title: string;
    items: string[];
  }[];
  related_links?: {
    link: string;
    text: string;
  }[];
  apply_options?: {
    link: string;
    title: string;
  }[];
}

interface JobSearchParams {
  query: string;
  location: string;
  page?: number;
  limit?: number;
}

/**
 * Search for jobs using SerpAPI
 */
export async function searchJobs(params: JobSearchParams): Promise<{
  jobs: Job[];
  totalResults: number;
}> {
  try {
    if (!SERPAPI_KEY) {
      throw new Error('SERPAPI_KEY is not set. Please set it in your environment variables.');
    }

    console.log(`Starting job search for "${params.query}" in "${params.location}"`);
    const { query, location, page = 1, limit = 10 } = params;
    
    // Function to make API request with retries
    const fetchWithRetry = async (url: string, maxRetries = 3) => {
      let lastError;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`API request attempt ${attempt + 1} of ${maxRetries}`);
          const response = await fetch(url);
          
          if (response.ok) {
            return response;
          }
          
          const errorText = await response.text();
          lastError = new Error(`SerpAPI request failed with status: ${response.status}. ${errorText}`);
          console.error(`SerpAPI request attempt ${attempt + 1} failed:`, lastError.message);
          
          // If we're getting rate limited, wait longer
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`Network error on attempt ${attempt + 1}:`, error);
        }
        
        // Wait before retrying, with increasing delay (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
    
    // Construct the SerpAPI URL
    const apiUrl = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&api_key=${SERPAPI_KEY}`;
    
    // Make the API request with retry logic
    console.log('Sending request to SerpAPI...');
    const response = await fetchWithRetry(apiUrl);
    
    const data = await response.json() as SerpApiResponse;
    console.log('Received response from SerpAPI:', { 
      metadata: data.search_metadata,
      hasResults: Boolean(data.jobs_results?.length)
    });
    
    if (data.error) {
      console.error(`SerpAPI error: ${data.error}`);
      throw new Error(`SerpAPI error: ${data.error}`);
    }
    
    if (!data.jobs_results || !Array.isArray(data.jobs_results)) {
      console.log('No job results found in SerpAPI response');
      return { jobs: [], totalResults: 0 };
    }
    
    // Map the API response to our Job type
    const jobs: Job[] = data.jobs_results.map(job => {
      // Extract source from the "via" field (e.g., "via LinkedIn", "via Indeed")
      const source = job.via ? job.via.replace(/^via\s+/i, '') : 'Google Jobs';
      
      // Determine the best URL to use for applying
      let applyUrl = '';
      
      if (job.apply_options && job.apply_options.length > 0 && job.apply_options[0].link) {
        applyUrl = job.apply_options[0].link;
        console.log(`Using apply_options URL for ${job.title}: ${applyUrl}`);
      } else if (job.related_links && job.related_links.length > 0) {
        applyUrl = job.related_links[0].link;
        console.log(`Using related_links URL for ${job.title}: ${applyUrl}`);
      } else {
        applyUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company_name)}&ibp=htl;jobs`;
        console.log(`Using fallback Google URL for ${job.title}: ${applyUrl}`);
      }
      
      return {
        id: job.job_id || uuidv4(), // Use job_id if available, otherwise generate a UUID
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description,
        type: job.detected_extensions?.schedule_type || 'Full-time',
        posted: job.detected_extensions?.posted_at || 'Recently',
        url: applyUrl,
        source: source,
        isRemote: job.detected_extensions?.work_from_home || false,
      };
    });
    
    // Filter jobs by location
    // We need to do additional filtering on our end because the API might return jobs from related locations
    const filteredJobs = jobs.filter(job => {
      const requestedLocation = location.toLowerCase().trim();
      const jobLocation = job.location.toLowerCase();
      
      // Check if job location contains the requested location
      // or if the job is remote and the user is searching for remote jobs
      return jobLocation.includes(requestedLocation) || 
             (requestedLocation.includes('remote') && job.isRemote === true);
    });
    
    console.log(`Filtered ${jobs.length} jobs down to ${filteredJobs.length} matching "${location}"`);
    
    // Calculate total results
    const totalResults = filteredJobs.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit);
    
    return {
      jobs: paginatedJobs,
      totalResults,
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific job
 * 
 * This implementation attempts to parse a job ID that was encoded when generating
 * the job list, and performs a new search to find more details if needed.
 */
export async function getJobDetails(jobId: string): Promise<Job | null> {
  try {
    console.log(`Getting details for job ID: ${jobId}`);
    
    // For this implementation, we'll extract search parameters from the job ID
    // In a real application, you would likely store job details in a database
    
    // Try to decode the job ID if it's in a base64 format
    let decodedJobId: string | null = null;
    try {
      decodedJobId = Buffer.from(jobId, 'base64').toString('utf-8');
      console.log('Decoded job ID:', decodedJobId);
      
      // If this looks like a SerpAPI ID, use it directly
      if (decodedJobId.includes('serpapi') || decodedJobId.includes('google_jobs')) {
        console.log('Using decoded SerpAPI job ID');
        return {
          id: jobId,
          title: 'Job Title', // We would extract these from the decoded ID or make a new API call
          company: 'Company Name',
          location: 'Location',
          description: 'This is a placeholder job description. In a production application, we would store job details or make a new API call to fetch them.',
          url: `https://www.google.com/search?q=job&ibp=htl;jobs&fpstate=tldetail&htidocid=${decodedJobId}`,
          source: 'Google Jobs',
          isRemote: false,
        };
      }
    } catch (error) {
      console.log('Error decoding job ID, will use as-is');
    }
    
    // If we couldn't decode it or it's not a SerpAPI ID, use a direct lookup
    // In a real application, this would be a database lookup
    
    // For now we'll return a basic object with the job ID
    return {
      id: jobId,
      title: 'Job Details',
      company: 'Company',
      location: 'Location',
      description: 'Job details are not available. Please go back to the search results and try again.',
      url: '',
      source: 'Unknown',
      isRemote: false,
    };
  } catch (error) {
    console.error('Error getting job details:', error);
    return null;
  }
}
