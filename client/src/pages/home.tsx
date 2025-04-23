import { useState } from 'react';
import ResumeUpload from '@/components/ResumeUpload';
import ResumeAnalysis from '@/components/ResumeAnalysis';
import JobSearch from '@/components/JobSearch';
import JobDetails from '@/components/JobDetails';
import { Resume, Job } from '@/types';

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isProcessingResume, setIsProcessingResume] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSearchingJobs, setIsSearchingJobs] = useState<boolean>(false);

  // Handle job selection for detailed view
  const handleJobSelect = (job: Job) => {
    console.log('Selected job URL:', job.url);
    setSelectedJob(job);
  };

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="px-4 py-8 md:py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Find Your Perfect Job Match</h2>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your resume, let our AI extract your skills, and discover job opportunities tailored to your profile.
        </p>
      </div>

      <div className="px-4 sm:px-0">
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Upload Section */}
          <div className="lg:col-span-1">
            <ResumeUpload 
              isProcessing={isProcessingResume} 
              setIsProcessing={setIsProcessingResume} 
              setResume={setResume}
            />
          </div>

          {/* Resume Analysis Results */}
          <div className="lg:col-span-2">
            <ResumeAnalysis 
              resume={resume} 
              isLoading={isProcessingResume} 
            />
          </div>
        </div>

        {/* Job Search Section */}
        <JobSearch 
          isSearching={isSearchingJobs}
          setIsSearching={setIsSearchingJobs}
          resume={resume}
          onJobSelect={handleJobSelect}
        />

        {/* Job Details Section (Hidden by default, shown when a job is selected) */}
        {selectedJob && (
          <JobDetails 
            selectedJob={selectedJob} 
            resume={resume}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </div>
    </main>
  );
}
