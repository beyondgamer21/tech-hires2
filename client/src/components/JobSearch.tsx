import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Resume, Job } from '@/types';
import { jobSearchSchema, JobSearch as JobSearchType } from '@shared/schema';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobSearchProps {
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  resume: Resume | null;
  onJobSelect: (job: Job) => void;
}

export default function JobSearch({ isSearching, setIsSearching, resume, onJobSelect }: JobSearchProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define the form
  const form = useForm<JobSearchType>({
    resolver: zodResolver(jobSearchSchema),
    defaultValues: {
      jobTitle: '',
      location: '',
    },
  });

  // Get resume skills as recommended skills for job search
  const recommendedSkills = resume?.skills || [];

  // Add a skill to the job title field
  const handleSkillClick = (skill: string) => {
    const currentValue = form.getValues('jobTitle');
    
    // If there's already text in the field
    if (currentValue) {
      // Check if the skill is already in the list
      const skills = currentValue.split(',').map(s => s.trim());
      if (!skills.includes(skill)) {
        form.setValue('jobTitle', `${currentValue}, ${skill}`);
      }
    } else {
      // If the field is empty, just set it to the skill
      form.setValue('jobTitle', skill);
    }
  };

  // Submit handler for the search form
  const onSubmit = async (data: JobSearchType) => {
    setIsSearching(true);
    setCurrentPage(1);
    
    try {
      // Show search is starting
      toast({
        title: "Searching jobs",
        description: `Looking for ${data.jobTitle} jobs in ${data.location}`,
      });

      // Save the search parameters for potential retries
      sessionStorage.setItem('lastJobSearch', JSON.stringify({
        jobTitle: data.jobTitle,
        location: data.location
      }));
      
      // Clear previous results and trigger new search
      await queryClient.invalidateQueries({ queryKey: ['/api/jobs/search'] });
      queryClient.setQueryData(['/api/jobs/search'], null);
      
    } catch (error) {
      console.error('Error during job search:', error);
      toast({
        title: "Search failed",
        description: "There was an error searching for jobs",
        variant: "destructive"
      });
    } finally {
      // Small delay before setting isSearching to false to ensure query starts
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };

  // Helper function for retrying failed requests
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let retries = 0;
    let lastError;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        
        const errorText = await response.text();
        lastError = new Error(`Request failed with status ${response.status}: ${errorText}`);
        console.warn(`Retry ${retries + 1}/${maxRetries} - Search failed:`, lastError.message);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Retry ${retries + 1}/${maxRetries} - Network error:`, error);
      }
      
      // Exponential backoff for retries
      retries++;
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  // Query for job search results
  const { data: jobs = null, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs/search'],
    enabled: form.formState.isSubmitted,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    queryFn: async () => {
      // Create request body with search parameters
      const searchData = {
        jobTitle: form.getValues('jobTitle'),
        location: form.getValues('location'),
        page: currentPage,
        limit: resultsPerPage,
      };
      
      console.log('Searching jobs with data:', searchData);
      
      // Use POST request with retry for more complex search parameters
      try {
        const response = await fetchWithRetry('/api/jobs/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchData),
        });
        
        const data = await response.json();
        console.log('Job search response:', data);
        setTotalResults(data.totalResults || (data?.length || 0));
        return data.jobs || data || [];
      } catch (error) {
        console.error('Job search failed after retries:', error);
        toast({
          title: "Search error",
          description: "Failed to get search results. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Handle pagination
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Update the query when the page changes
  useEffect(() => {
    if (form.formState.isSubmitted) {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/search'] });
    }
  }, [currentPage, queryClient, form.formState.isSubmitted]);

  return (
    <div className="mt-8">
      <Card className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Find Jobs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Search for jobs based on your skills and preferences
          </p>
        </div>
        <CardContent className="px-6 py-5">
          {/* Search Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Job Title(s)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Python Developer, SQL, Data Analyst" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">You can enter multiple job titles separated by commas</p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. San Francisco" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-1 flex items-end">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={isLoading || isSearching}
                >
                  {isLoading || isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Jobs
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Recommended Skills Section */}
          {recommendedSkills.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500">Recommended Skills from Your Resume</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {recommendedSkills.map((skill, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSkillClick(skill)}
                    className="text-xs"
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {((jobs && Array.isArray(jobs) && jobs.length > 0) || isLoading) && (
            <div className="mt-8">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Search Results
                </h4>
                {jobs && Array.isArray(jobs) && jobs.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Showing {Math.min(resultsPerPage, jobs.length)} of {totalResults} results
                  </span>
                )}
              </div>
              
              {/* Results Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-3 w-20" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-40 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      jobs && Array.isArray(jobs) && jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.type || "Full-time"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.company}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.source || "Google Jobs"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.location}</div>
                            <div className="text-sm text-gray-500">{job.isRemote ? "Remote Eligible" : "On-site"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.posted || "Recently"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => onJobSelect(job)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {jobs && Array.isArray(jobs) && jobs.length > 0 && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * resultsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * resultsPerPage, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Logic to show current page and adjacent pages
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="icon"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNum 
                                  ? "bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" 
                                  : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
