import { Resume } from '@/types';

/**
 * Client-side helper functions for resume data
 */

/**
 * Extracts skills from raw resume text for highlighting
 */
export function extractKeySkills(resumeText: string): string[] {
  // Common programming languages
  const programmingLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP',
    'Swift', 'Kotlin', 'Go', 'Rust', 'Scala', 'Perl', 'R'
  ];
  
  // Common frameworks and libraries
  const frameworks = [
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django',
    'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'TensorFlow', 'PyTorch',
    'Pandas', 'NumPy', 'jQuery', 'Bootstrap', 'Tailwind CSS'
  ];
  
  // Common tools and technologies
  const tools = [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'Jenkins',
    'GitHub Actions', 'REST API', 'GraphQL', 'SQL', 'NoSQL', 'MongoDB', 'MySQL',
    'PostgreSQL', 'Redis', 'Firebase', 'Webpack', 'Babel'
  ];
  
  // Combine all keywords
  const allKeywords = [...programmingLanguages, ...frameworks, ...tools];
  
  // Find keywords in the resume text
  const foundSkills = allKeywords.filter(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(resumeText)
  );
  
  return [...new Set(foundSkills)]; // Remove duplicates
}

/**
 * Formats a Resume object for display 
 */
export function formatResumeForDisplay(resume: Resume): Resume {
  // If skills are empty, try to extract them from raw text
  if (!resume.skills || resume.skills.length === 0) {
    resume.skills = extractKeySkills(resume.rawText);
  }
  
  return resume;
}
