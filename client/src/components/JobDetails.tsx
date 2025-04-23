import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resume, Job } from '@/types';
import { X, Save, ExternalLink } from 'lucide-react';

interface JobDetailsProps {
  selectedJob: Job;
  resume: Resume | null;
  onClose: () => void;
}

export default function JobDetails({ selectedJob, resume, onClose }: JobDetailsProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveJob = () => {
    setIsSaved(!isSaved);
  };

  // Calculate skills match if resume is available
  let skillMatchPercentage = 0;
  if (resume && resume.skills && resume.skills.length > 0) {
    // Extract skills from job description
    const jobSkills = selectedJob.description?.toLowerCase().split(/\s+/) || [];
    
    // Count matching skills
    const matchingSkills = resume.skills.filter(skill => 
      jobSkills.some(word => word.includes(skill.toLowerCase()))
    );
    
    // Calculate percentage
    skillMatchPercentage = Math.round((matchingSkills.length / resume.skills.length) * 100);
  }

  return (
    <div className="mt-8">
      <Card className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{selectedJob.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedJob.company} • {selectedJob.location}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              aria-label="Close job details"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <CardContent className="px-6 py-5">
          <div className="prose max-w-none">
            <h4 className="text-lg font-medium mb-2">Job Description</h4>
            <p className="text-gray-700 mb-4">
              {selectedJob.description || 
                "This job listing doesn't provide a detailed description. Please click Apply to learn more about this position."}
            </p>
            
            {/* Job Metadata */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-md font-medium mb-2">Job Details</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <Badge variant="outline" className="mr-2">Type</Badge>
                    <span>{selectedJob.type || "Full-time"}</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Badge variant="outline" className="mr-2">Posted</Badge>
                    <span>{selectedJob.posted || "Recently"}</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Badge variant="outline" className="mr-2">Location</Badge>
                    <span>{selectedJob.location} {selectedJob.isRemote && "(Remote Eligible)"}</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Badge variant="outline" className="mr-2">Source</Badge>
                    <span>{selectedJob.source || "Google Jobs"}</span>
                  </li>
                </ul>
              </div>
              
              {/* Skills Match */}
              {resume && (
                <div>
                  <h4 className="text-md font-medium mb-2">Skills Match</h4>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${skillMatchPercentage}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 text-right">{skillMatchPercentage}% match with your skills</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={handleSaveJob}
                className={isSaved ? "bg-blue-50" : ""}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaved ? "Saved" : "Save Job"}
              </Button>
              {selectedJob.url ? (
                <a 
                  href={selectedJob.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2"
                  onClick={() => console.log('Apply button clicked with URL:', selectedJob.url)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </a>
              ) : (
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(selectedJob.title + ' ' + selectedJob.company + ' job')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Search for Job
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
