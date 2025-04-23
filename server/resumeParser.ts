import { extractTextFromFile } from './fileHandlers';
import { InsertResume, Resume } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process a resume file to extract structured information
 */
export async function processResume(file: Express.Multer.File): Promise<Resume> {
  // Extract text from the uploaded file
  const text = await extractTextFromFile(file.buffer, file.mimetype);
  
  // Generate a unique ID for the resume
  const id = uuidv4();
  
  // Parse the resume text to extract structured information
  const resumeData: Resume = {
    id,
    filename: file.originalname,
    contentType: file.mimetype,
    rawText: text,
    ...parseResumeText(text)
  };
  
  return resumeData;
}

/**
 * Parse the raw text of a resume to extract structured information
 */
function parseResumeText(text: string): Partial<Resume> {
  // Initialize resume data
  const resumeData: Partial<Resume> = {};
  
  // Extract name (usually one of the first lines)
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/m);
  if (nameMatch) {
    resumeData.name = nameMatch[1].trim();
  }
  
  // Extract email
  const emailMatch = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    resumeData.email = emailMatch[0].trim();
  }
  
  // Extract phone number
  const phoneMatch = text.match(/(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    resumeData.phone = phoneMatch[0].trim();
  }
  
  // Extract qualifications/degrees
  const degrees = [];
  const degreePatterns = [
    /(?:B\.?S\.?|Bachelor of Science|Bachelor'?s Degree)(?:\sin\s|\s-\s)?([^,\n.]+)/gi,
    /(?:B\.?A\.?|Bachelor of Arts|Bachelor'?s Degree)(?:\sin\s|\s-\s)?([^,\n.]+)/gi,
    /(?:M\.?S\.?|Master of Science|Master'?s Degree)(?:\sin\s|\s-\s)?([^,\n.]+)/gi,
    /(?:M\.?B\.?A\.?|Master of Business Administration)/gi,
    /(?:Ph\.?D\.?|Doctor of Philosophy)(?:\sin\s|\s-\s)?([^,\n.]+)/gi,
    /(?:M\.?D\.?|Doctor of Medicine)/gi,
    /(?:J\.?D\.?|Juris Doctor)/gi,
  ];
  
  for (const pattern of degreePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        degrees.push(`${match[0].split(/\sin\s|\s-\s/)[0]} in ${match[1].trim()}`);
      } else {
        degrees.push(match[0].trim());
      }
    }
  }
  
  resumeData.qualifications = [...new Set(degrees)]; // Remove duplicates
  
  // Extract skills
  const skills = [];
  const skillPatterns = [
    // Programming languages
    /(?:JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|PHP|Swift|Kotlin|Go|Rust|SQL|HTML|CSS)/gi,
    
    // Frameworks and libraries
    /(?:React|Angular|Vue\.?js|Node\.?js|Express|Django|Flask|Spring|Laravel|Ruby on Rails|TensorFlow|PyTorch|Pandas|NumPy)/gi,
    
    // Databases
    /(?:MongoDB|MySQL|PostgreSQL|Oracle|SQL Server|Redis|Cassandra|DynamoDB)/gi,
    
    // Cloud services
    /(?:AWS|Amazon Web Services|Azure|Google Cloud|GCP|Heroku|Firebase)/gi,
    
    // DevOps
    /(?:Docker|Kubernetes|Jenkins|CI\/CD|Git|GitHub|GitLab|Terraform)/gi,
    
    // Design
    /(?:Photoshop|Illustrator|Figma|Sketch|UI\/UX|Adobe XD)/gi,
    
    // Soft skills - more likely to be in a "Skills" section
    /(?:Leadership|Communication|Teamwork|Problem[\s-]Solving|Critical Thinking|Project Management|Agile|Scrum)/gi
  ];
  
  for (const pattern of skillPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      skills.push(match[0].trim());
    }
  }
  
  // Try to find a "Skills" section and extract more skills
  const skillsSection = text.match(/skills(?:[\s\n]*:[\s\n]*|[\s\n]+)([\s\S]*?)(?:\n\n|\n[A-Z])/i);
  if (skillsSection && skillsSection[1]) {
    const additionalSkills = skillsSection[1]
      .split(/[,•\n]+/) // Split by commas, bullets, or newlines
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2 && skill.length < 30); // Filter out too short or too long strings
    
    skills.push(...additionalSkills);
  }
  
  resumeData.skills = [...new Set(skills)]; // Remove duplicates
  
  // Extract work experience years
  const experienceMatch = text.match(/(\d+)(?:\+)?\s+years?(?:\s+of)?\s+experience/i);
  if (experienceMatch) {
    resumeData.totalYears = `${experienceMatch[1]} years`;
  }
  
  // Extract last position (look for titles)
  const positions = [
    'Software Engineer', 'Software Developer', 'Front-end Developer', 'Back-end Developer',
    'Full-stack Developer', 'Data Scientist', 'Data Engineer', 'Machine Learning Engineer',
    'DevOps Engineer', 'Product Manager', 'Project Manager', 'UX Designer', 'UI Designer'
  ];
  
  // Try to find "Experience" section first
  const experienceSection = text.match(/experience(?:[\s\n]*:[\s\n]*|[\s\n]+)([\s\S]*?)(?:\n\n|\n[A-Z])/i);
  if (experienceSection && experienceSection[1]) {
    // Look for a job title at the beginning of a line, possibly followed by "at" or "|" and a company name
    const jobMatch = experienceSection[1].match(/^([\w\s]+)(?:\s+(?:at|@|\|)\s+([\w\s&]+))?/m);
    if (jobMatch) {
      resumeData.lastPosition = jobMatch[0].trim();
    } else {
      // Try to find any of the common positions in the experience section
      for (const position of positions) {
        if (experienceSection[1].includes(position)) {
          resumeData.lastPosition = position;
          
          // Try to extract company name
          const companyMatch = experienceSection[1].match(new RegExp(`${position}[\\s\n]+(?:at|@|\\|)\\s+([\\w\\s&]+)`, 'i'));
          if (companyMatch && companyMatch[1]) {
            resumeData.lastPosition += ` at ${companyMatch[1].trim()}`;
          }
          
          break;
        }
      }
    }
  }
  
  return resumeData;
}
