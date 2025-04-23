import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Resume } from '@/types';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ResumeAnalysisProps {
  resume: Resume | null;
  isLoading: boolean;
}

export default function ResumeAnalysis({ resume, isLoading }: ResumeAnalysisProps) {
  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-800">Resume Analysis</h3>
          <p className="mt-1 text-sm text-gray-500">
            {resume ? "We've extracted the following information" : "Upload a resume to see the analysis"}
          </p>
        </div>
        {resume && !isLoading && (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" /> Processed
          </span>
        )}
        {isLoading && (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing
          </span>
        )}
      </div>
      <CardContent className="px-6 py-5">
        {isLoading ? (
          <ResumeAnalysisSkeleton />
        ) : resume ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Personal Information</h4>
              <div className="mt-3 space-y-4">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Name</h5>
                  <p className="text-sm text-gray-800">{resume.name || "Not detected"}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Email</h5>
                  <p className="text-sm text-gray-800">{resume.email || "Not detected"}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Phone</h5>
                  <p className="text-sm text-gray-800">{resume.phone || "Not detected"}</p>
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Qualifications</h4>
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-500">Degrees</h5>
                {resume.qualifications && resume.qualifications.length > 0 ? (
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-800 space-y-1">
                    {resume.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No qualifications detected</p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Skills</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {resume.skills && resume.skills.length > 0 ? (
                  resume.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills detected</p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Experience</h4>
              <div className="mt-3 space-y-4">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Total Years</h5>
                  <p className="text-sm text-gray-800">{resume.totalYears || "Not detected"}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Last Position</h5>
                  <p className="text-sm text-gray-800">{resume.lastPosition || "Not detected"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800">No Resume Detected</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">
              Upload your resume to get started with the analysis and job search.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeAnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Info Skeleton */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Personal Information</h4>
        <div className="mt-3 space-y-4">
          <div>
            <h5 className="text-xs font-medium text-gray-500">Name</h5>
            <Skeleton className="h-4 w-40 mt-1" />
          </div>
          <div>
            <h5 className="text-xs font-medium text-gray-500">Email</h5>
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <div>
            <h5 className="text-xs font-medium text-gray-500">Phone</h5>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>

      {/* Qualifications Skeleton */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Qualifications</h4>
        <div className="mt-3">
          <h5 className="text-xs font-medium text-gray-500">Degrees</h5>
          <div className="mt-1 space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>

      {/* Skills Skeleton */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Skills</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </div>

      {/* Experience Skeleton */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Experience</h4>
        <div className="mt-3 space-y-4">
          <div>
            <h5 className="text-xs font-medium text-gray-500">Total Years</h5>
            <Skeleton className="h-4 w-16 mt-1" />
          </div>
          <div>
            <h5 className="text-xs font-medium text-gray-500">Last Position</h5>
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
