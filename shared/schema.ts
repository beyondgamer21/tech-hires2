import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Resume schema
export const resumeSchema = z.object({
  id: z.string().optional(),
  filename: z.string(),
  contentType: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  qualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  totalYears: z.string().optional(),
  lastPosition: z.string().optional(),
  rawText: z.string(),
});

export type Resume = z.infer<typeof resumeSchema>;
export const insertResumeSchema = resumeSchema.omit({ id: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;

// Job search schema
export const jobSearchSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
});

export type JobSearch = z.infer<typeof jobSearchSchema>;

// Job listing schema
export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  posted: z.string().optional(),
  url: z.string().optional(),
  source: z.string().optional(),
  isRemote: z.boolean().optional(),
  matchScore: z.number().optional(),
});

export type Job = z.infer<typeof jobSchema>;
