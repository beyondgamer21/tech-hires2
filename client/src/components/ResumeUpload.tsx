import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Resume } from '@/types';
import { UploadCloud, CheckCircle, X, Loader2 } from 'lucide-react';

interface ResumeUploadProps {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  setResume: (resume: Resume | null) => void;
}

export default function ResumeUpload({ isProcessing, setIsProcessing, setResume }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const uploadedFile = fileList[0];
    const fileType = uploadedFile.type;
    
    // Check file type
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (10MB max)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }
    
    setFile(uploadedFile);
    setIsProcessing(true);
    
    try {
      console.log('Starting resume upload for file:', uploadedFile.name);
      const formData = new FormData();
      formData.append('resume', uploadedFile);
      
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', response.status, errorData);
        throw new Error(errorData.message || `Server error ${response.status}: Failed to upload resume`);
      }
      
      const data: Resume = await response.json();
      console.log('Resume successfully processed:', data);
      setResume(data);
      
      toast({
        title: "Resume uploaded",
        description: "Your resume has been successfully processed",
        variant: "default"
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process your resume",
        variant: "destructive"
      });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setResume, toast]);

  const handleRemoveFile = () => {
    setFile(null);
    setResume(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      fileInput.files = e.dataTransfer.files;
      
      // Manually trigger change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Upload Resume</h3>
        <p className="mt-1 text-sm text-gray-500">
          We support PDF, DOCX, and TXT formats
        </p>
      </div>
      <CardContent className="p-0">
        <div className="px-6 py-5">
          {/* File Upload Area */}
          <div 
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, DOCX or TXT up to 10MB
              </p>
            </div>
          </div>

          {/* File Processing Status */}
          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-700">Processing your resume...</span>
              </div>
            </div>
          )}

          {/* Uploaded File */}
          {file && !isProcessing && (
            <div className="mt-6">
              <div className="bg-gray-50 px-4 py-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span className="ml-2 text-sm font-medium text-gray-700">{file.name}</span>
                </div>
                <button 
                  className="text-sm text-red-500 hover:text-red-700"
                  onClick={handleRemoveFile}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
