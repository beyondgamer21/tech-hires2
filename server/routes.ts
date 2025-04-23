import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import path from 'path';
import { storage } from "./storage";
import { processResume } from "./resumeParser";
import { searchJobs, getJobDetails } from "./jobSearch";
import { resumeSchema, jobSearchSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check for allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.post('/api/resume/upload', async (req: Request, res: Response) => {
    try {
      // Apply multer middleware manually to better handle errors
      upload.single('resume')(req, res, async (err) => {
        if (err) {
          console.error('Multer file upload error:', err);
          return res.status(400).json({ 
            message: err.message || 'File upload failed' 
          });
        }
        
        try {
          // Check if file was uploaded
          if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
          }
          
          console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'MIME type:', req.file.mimetype);
          
          // Extract text and analyze the resume
          const file = req.file;
          const resumeData = await processResume(file);
          
          // Validate the processed resume data
          const validatedData = resumeSchema.parse(resumeData);
          
          // Return the processed resume data
          res.json(validatedData);
        } catch (processingError) {
          console.error('Error processing resume:', processingError);
          res.status(500).json({ 
            message: processingError instanceof Error ? processingError.message : 'Failed to process resume' 
          });
        }
      });
    } catch (error) {
      console.error('Critical server error during file upload:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Unexpected server error' 
      });
    }
  });

  app.all('/api/jobs/search', async (req: Request, res: Response) => {
    try {
      console.log('Job search request received:', { 
        method: req.method, 
        query: req.query, 
        body: req.body 
      });
      
      // Get parameters from either query or body
      const jobTitle = req.query.jobTitle || req.body.jobTitle;
      const location = req.query.location || req.body.location;
      const page = req.query.page || req.body.page || '1';
      const limit = req.query.limit || req.body.limit || '10';
      
      // Validate required parameters
      if (!jobTitle || !location) {
        return res.status(400).json({ message: 'Job title and location are required' });
      }
      
      // Validate with Zod schema
      jobSearchSchema.parse({ 
        jobTitle: jobTitle.toString(), 
        location: location.toString() 
      });
      
      // Convert pagination parameters
      const pageNum = parseInt(page.toString(), 10);
      const limitNum = parseInt(limit.toString(), 10);
      
      // Process comma-separated job titles
      const jobTitleString: string = jobTitle.toString();
      const jobTitles: string[] = jobTitleString.split(',').map(title => title.trim()).filter(Boolean);
      
      // If multiple job titles, search for each and combine results
      if (jobTitles.length > 1) {
        console.log(`Searching for multiple job titles: ${jobTitles.join(', ')}`);
        
        // For now, search only with the first job title
        // Note: A more advanced implementation could search for all job titles
        // and combine the results, but would require multiple API calls
        console.log(`Using first job title for search: ${jobTitles[0]}`);
      }
      
      const results = await searchJobs({
        query: jobTitles[0],
        location: location.toString(),
        page: pageNum,
        limit: limitNum
      });
      
      // Return search results
      console.log(`Job search completed for ${jobTitle} in ${location}, found ${results.totalResults} results`);
      res.json(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to search jobs' 
      });
    }
  });

  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const jobId = req.params.id;
      
      if (!jobId) {
        return res.status(400).json({ message: 'Job ID is required' });
      }
      
      const jobDetails = await getJobDetails(jobId);
      
      if (!jobDetails) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(jobDetails);
    } catch (error) {
      console.error('Error getting job details:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to get job details' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
