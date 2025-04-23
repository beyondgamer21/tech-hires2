// Import types from shared schema
import type { 
  Resume as ResumeType,
  Job as JobType
} from '@shared/schema';

// Re-export shared types
export type Resume = ResumeType;
export type Job = JobType;

// Add any additional frontend-specific types here
