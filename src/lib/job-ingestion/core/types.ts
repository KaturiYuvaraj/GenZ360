/**
 * Core type definitions for GenZ360 Job Ingestion Engine.
 * Supports native GenZ360 jobs and multiple external ATS sources (Greenhouse, Lever, Ashby, etc.)
 */

export type JobSource =
  | "genz360"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workable"
  | "smartrecruiters"
  | "custom";

export type IngestionStatus =
  | "active"
  | "closed"
  | "expired"
  | "paused"
  | "error";

export type RemoteType = "remote" | "hybrid" | "onsite";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship";

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | null;

/**
 * Single unified internal GenZ360 job format across all ATS and native listings.
 * External sources normalize their proprietary responses into this structure.
 */
export interface NormalizedJob {
  title: string;
  company: string;
  companySlug?: string;
  description: string;
  location: string;
  country: string | null;
  city: string | null;
  remoteType: RemoteType;
  remote: boolean; // Backwards compatible boolean flag for existing UI
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salary: number | null; // Annualized CTC in LPA or numeric representation, null if not provided
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  skills: string[];
  department: string | null;
  postedAt: string; // ISO 8601 string
  updatedAt: string | null;
  applicationUrl: string;
  source: JobSource;
  sourceJobId: string;
  sourceUrl?: string | null;
  contentHash: string;
  rawPayload?: Record<string, unknown>;
}

/**
 * Company source configuration for ATS sync
 */
export interface CompanySourceConfig {
  id?: string;
  companyName: string;
  companySlug: string;
  website?: string | null;
  careersUrl?: string | null;
  source: JobSource;
  boardIdentifier: string; // e.g. "stripe" for Greenhouse, "netflix" for Lever
  enabled: boolean;
  lastSyncAt?: string | null;
  lastError?: string | null;
  errorCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Ingestion process metrics and diagnostics
 */
export interface SyncResult {
  source: JobSource;
  company: string;
  boardIdentifier: string;
  totalFetched: number;
  newCount: number;
  updatedCount: number;
  closedCount: number;
  duplicateCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  durationMs: number;
  timestamp: string;
}

/**
 * Runtime execution options for ingestion
 */
export interface IngestionOptions {
  forceRefresh?: boolean;
  dryRun?: boolean;
  maxConcurrency?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}
