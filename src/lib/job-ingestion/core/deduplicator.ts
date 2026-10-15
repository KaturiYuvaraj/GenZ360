import { createHash } from "node:crypto";
import type { JobSource, NormalizedJob } from "./types.ts";

/**
 * Builds the canonical primary identity key for a job.
 * Format: `<source>:<source_job_id>`
 */
export function buildPrimaryJobKey(source: JobSource, sourceJobId: string): string {
  return `${source}:${sourceJobId.trim().toLowerCase()}`;
}

/**
 * Cleans string for fuzzy/normalized comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Strip punctuation
    .replace(/\b(inc|llc|pvt|ltd|limited|corporation|corp|technologies|solutions)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds secondary fallback fingerprint based on company, title, and location.
 * Used to catch duplicate postings across aggregators or re-posted roles.
 */
export function buildJobFingerprint(
  company: string,
  title: string,
  location: string,
): string {
  const normCompany = normalizeString(company);
  const normTitle = normalizeString(title)
    .replace(/\b(senior|sr|junior|jr|lead|principal|staff)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const normLocation = normalizeString(location);

  return `${normCompany}::${normTitle}::${normLocation}`;
}

/**
 * Computes deterministic SHA-256 hash of job content.
 * Enables zero-overhead change detection during sync cycles.
 */
export function computeContentHash(
  title: string,
  description: string,
  department?: string | null,
): string {
  const normalizedText = [
    title.trim(),
    department?.trim() || "",
    description.replace(/\s+/g, " ").trim(),
  ].join("||");

  return createHash("sha256").update(normalizedText).digest("hex").slice(0, 32);
}

/**
 * Evaluates duplicate status between an incoming job and an existing job.
 */
export interface DeduplicationDecision {
  isDuplicate: boolean;
  isSameSource: boolean;
  matchType: "exact_source_id" | "fingerprint" | "none";
  action: "insert" | "update" | "skip" | "flag_cross_source";
  reason: string;
}

export function evaluateDeduplication(
  incoming: NormalizedJob,
  existingBySourceId?: { id: string; contentHash: string; source: JobSource } | null,
  existingByFingerprint?: { id: string; source: JobSource; isNativeEmployer: boolean } | null,
): DeduplicationDecision {
  // Case 1: Same source and same source ID
  if (existingBySourceId) {
    const isSameSource = existingBySourceId.source === incoming.source;
    if (isSameSource) {
      if (existingBySourceId.contentHash === incoming.contentHash) {
        return {
          isDuplicate: true,
          isSameSource: true,
          matchType: "exact_source_id",
          action: "skip", // Content unchanged, only touch last_seen_at
          reason: "Identical source job ID with unchanged content hash",
        };
      }
      return {
        isDuplicate: true,
        isSameSource: true,
        matchType: "exact_source_id",
        action: "update",
        reason: "Existing job updated at external source",
      };
    }
  }

  // Case 2: Matching fingerprint from another source
  if (existingByFingerprint) {
    // CRITICAL: NEVER overwrite or delete a native GenZ360 employer job
    if (existingByFingerprint.isNativeEmployer || existingByFingerprint.source === "genz360") {
      return {
        isDuplicate: true,
        isSameSource: false,
        matchType: "fingerprint",
        action: "flag_cross_source",
        reason: "Matches an existing native GenZ360 employer posting; preserving native job",
      };
    }

    return {
      isDuplicate: true,
      isSameSource: false,
      matchType: "fingerprint",
      action: "skip",
      reason: `Matches existing job listing from source: ${existingByFingerprint.source}`,
    };
  }

  // Case 3: Fresh new job
  return {
    isDuplicate: false,
    isSameSource: false,
    matchType: "none",
    action: "insert",
    reason: "New distinct job posting",
  };
}
