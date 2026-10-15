import type { JobSource } from "../core/types.ts";

export type CompanyDiscoveryStatus =
  | "discovered"
  | "website_pending"
  | "career_page_pending"
  | "ats_detected"
  | "source_registered"
  | "unsupported_source"
  | "needs_review"
  | "discovery_failed";

export interface DiscoveredCompanyCandidate {
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  sizeRange?: string | null;
  providerIdentifier?: string | null;
  providerName: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoverySearchOptions {
  query?: string;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  industry?: string;
  companyName?: string;
  website?: string;
  sizeRange?: string;
  limit?: number;
  cursor?: string;
}

export interface WebsiteValidationResult {
  valid: boolean;
  canonicalUrl?: string;
  hostname?: string;
  confidence: number;
  evidence: string[];
  error?: string;
  httpStatus?: number;
}

export type CareerDiscoveryMethod =
  | "stored"
  | "nav_links"
  | "sitemap"
  | "json_ld"
  | "path_probing"
  | "search_fallback"
  | "none";

export interface CareerPageDiscoveryResult {
  found: boolean;
  url?: string;
  discoveryMethod: CareerDiscoveryMethod;
  confidence: number;
  evidence: string[];
  httpStatus?: number;
  error?: string;
}

export interface ATSDetectionEvidence {
  atsType: JobSource;
  boardIdentifier: string;
  careerPageUrl: string;
  confidence: number; // 0.0 to 1.0
  evidence: string[];
  requiresReview: boolean;
}

export interface BoardValidationResult {
  valid: boolean;
  atsType: JobSource;
  boardIdentifier: string;
  jobCount: number;
  sampleJobs?: Array<{ id: string; title: string; url?: string }>;
  error?: string;
  emptyBoard?: boolean;
}

export interface DiscoveryPipelineOptions {
  provider?: string;
  query?: string;
  location?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  maxCompanies?: number;
  maxConcurrency?: number;
  timeoutMs?: number;
  autoRegisterSources?: boolean;
  autoSyncJobs?: boolean;
  delayBetweenCompaniesMs?: number;
  dryRun?: boolean;
}

export interface DiscoveryRunSummary {
  runId: string;
  provider: string;
  query?: string;
  location?: string;
  industry?: string;
  status: "completed" | "failed" | "paused";
  companiesFound: number;
  companiesProcessed: number;
  duplicatesFound: number;
  websitesVerified: number;
  careerPagesFound: number;
  atsDetected: number;
  sourcesValidated: number;
  sourcesRegistered: number;
  needsReviewCount: number;
  failedCount: number;
  durationMs: number;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
}
