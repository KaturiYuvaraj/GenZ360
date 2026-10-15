import type { JobSource, CompanySourceConfig } from "../core/types.ts";
import { findOrCreateJobSource, listJobSources } from "./company-service.ts";

export interface ATSDetectionResult {
  atsType: JobSource;
  atsIdentifier: string;
  careersUrl?: string;
  confidence: "high" | "medium" | "low";
}

// Re-export full automated discovery pipeline modules
export * from "../discovery/types.ts";
export * from "../discovery/providers/index.ts";
export * from "../discovery/website-validator.ts";
export * from "../discovery/career-discovery.ts";
export * from "../discovery/ats-detector.ts";
export * from "../discovery/board-validator.ts";
export * from "../discovery/deduplication.ts";
export * from "../discovery/source-registrar.ts";
export * from "../discovery/pipeline.ts";

/**
 * Common regex patterns to detect ATS providers and extract their account/board slugs.
 */
const ATS_PATTERNS: Array<{
  source: JobSource;
  regexes: RegExp[];
}> = [
  {
    source: "greenhouse",
    regexes: [
      /(?:boards\.greenhouse\.io|job-boards\.greenhouse\.io)\/embed\/job_board\?(?:.*&)?for=([a-zA-Z0-9_\-]+)/i,
      /[?&]for=([a-zA-Z0-9_\-]+)/i,
      /(?:boards\.greenhouse\.io|job-boards\.greenhouse\.io)\/([a-zA-Z0-9_\-]+)/i,
      /boards-api\.greenhouse\.io\/v1\/boards\/([a-zA-Z0-9_\-]+)/i,
      /gh_src=([a-zA-Z0-9_\-]+)/i,
      /data-gh-board="([a-zA-Z0-9_\-]+)"/i,
    ],
  },
  {
    source: "lever",
    regexes: [
      /jobs\.lever\.co\/([a-zA-Z0-9_\-]+)/i,
      /api\.lever\.co\/v0\/postings\/([a-zA-Z0-9_\-]+)/i,
      /data-lever-site="([a-zA-Z0-9_\-]+)"/i,
    ],
  },
  {
    source: "ashby",
    regexes: [
      /jobs\.ashbyhq\.com\/([a-zA-Z0-9_\-]+)/i,
      /api\.ashbyhq\.com\/posting-api\/job-board\/([a-zA-Z0-9_\-]+)/i,
      /data-ashby-board="([a-zA-Z0-9_\-]+)"/i,
    ],
  },
  {
    source: "workable",
    regexes: [
      /apply\.workable\.com\/([a-zA-Z0-9_\-]+)/i,
      /([a-zA-Z0-9_\-]+)\.workable\.com/i,
      /apply\.workable\.com\/api\/v1\/widget\/accounts\/([a-zA-Z0-9_\-]+)/i,
    ],
  },
  {
    source: "smartrecruiters",
    regexes: [
      /careers\.smartrecruiters\.com\/([a-zA-Z0-9_\-]+)/i,
      /jobs\.smartrecruiters\.com\/([a-zA-Z0-9_\-]+)/i,
      /api\.smartrecruiters\.com\/v1\/companies\/([a-zA-Z0-9_\-]+)/i,
    ],
  },
];

/**
 * Analyzes a URL to detect which ATS is in use and extract the board identifier.
 */
export function detectATSFromUrl(url: string): ATSDetectionResult | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  for (const provider of ATS_PATTERNS) {
    for (const regex of provider.regexes) {
      const match = trimmed.match(regex);
      if (match && match[1]) {
        const identifier = match[1].toLowerCase();
        // Ignore generic path segments like "api", "embed", "v1"
        if (!["api", "embed", "v1", "v0", "widget", "jobs", "careers", "j"].includes(identifier)) {
          return {
            atsType: provider.source,
            atsIdentifier: identifier,
            careersUrl: trimmed,
            confidence: "high",
          };
        }
      }
    }
  }

  return null;
}

/**
 * Analyzes raw HTML markup of a company careers page to detect linked or embedded ATS widgets.
 */
export function detectATSFromHtml(html: string, baseUrl?: string): ATSDetectionResult | null {
  if (!html || typeof html !== "string") return null;

  for (const provider of ATS_PATTERNS) {
    for (const regex of provider.regexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        const identifier = match[1].toLowerCase();
        if (!["api", "embed", "v1", "v0", "widget", "jobs", "careers", "j"].includes(identifier)) {
          return {
            atsType: provider.source,
            atsIdentifier: identifier,
            careersUrl: baseUrl,
            confidence: "medium",
          };
        }
      }
    }
  }

  return null;
}

/**
 * Curated list of verified seed tech companies with public ATS endpoints.
 */
export const VERIFIED_COMPANY_SEEDS: CompanySourceConfig[] = [
  {
    companyName: "Stripe",
    companySlug: "stripe",
    source: "greenhouse",
    boardIdentifier: "stripe",
    website: "https://stripe.com",
    careersUrl: "https://stripe.com/jobs",
    enabled: true,
  },
  {
    companyName: "Figma",
    companySlug: "figma",
    source: "greenhouse",
    boardIdentifier: "figma",
    website: "https://figma.com",
    careersUrl: "https://figma.com/careers",
    enabled: true,
  },
  {
    companyName: "Netflix",
    companySlug: "netflix",
    source: "lever",
    boardIdentifier: "netflix",
    website: "https://netflix.com",
    careersUrl: "https://jobs.lever.co/netflix",
    enabled: true,
  },
  {
    companyName: "Linear",
    companySlug: "linear",
    source: "ashby",
    boardIdentifier: "linear",
    website: "https://linear.app",
    careersUrl: "https://jobs.ashbyhq.com/linear",
    enabled: true,
  },
  {
    companyName: "Ramp",
    companySlug: "ramp",
    source: "ashby",
    boardIdentifier: "ramp",
    website: "https://ramp.com",
    careersUrl: "https://jobs.ashbyhq.com/ramp",
    enabled: true,
  },
  {
    companyName: "InVision",
    companySlug: "invision",
    source: "workable",
    boardIdentifier: "invision",
    website: "https://invisionapp.com",
    careersUrl: "https://apply.workable.com/invision",
    enabled: true,
  },
  {
    companyName: "SmartRecruiters",
    companySlug: "smartrecruiters",
    source: "smartrecruiters",
    boardIdentifier: "smartrecruiters",
    website: "https://smartrecruiters.com",
    careersUrl: "https://careers.smartrecruiters.com/smartrecruiters",
    enabled: true,
  },
];

/**
 * Seeds verified companies into the job_sources table.
 * Idempotent: will not duplicate existing job sources or companies.
 */
export async function seedVerifiedCompanySources(): Promise<{
  totalConfigured: number;
  sourcesCreated: number;
}> {
  const existing = await listJobSources();
  const existingKeys = new Set(
    existing.map((s) => `${s.name}::${s.boardIdentifier.toLowerCase()}`),
  );

  let createdCount = 0;

  for (const seed of VERIFIED_COMPANY_SEEDS) {
    const key = `${seed.source}::${seed.boardIdentifier.toLowerCase()}`;
    if (!existingKeys.has(key)) {
      await findOrCreateJobSource(seed);
      createdCount++;
    }
  }

  return {
    totalConfigured: VERIFIED_COMPANY_SEEDS.length,
    sourcesCreated: createdCount,
  };
}
