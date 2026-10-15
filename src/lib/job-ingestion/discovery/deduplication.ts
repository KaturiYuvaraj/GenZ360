import { getSql } from "../../db.ts";
import { nid } from "../../ids.ts";
import { normalizeCompanySlug } from "../core/normalizer.ts";
import type {
  DiscoveredCompanyCandidate,
  CompanyDiscoveryStatus,
} from "./types.ts";

export interface CompanyDeduplicationResult {
  action: "created" | "matched_existing" | "updated_missing_fields";
  companyId: string;
  companyName: string;
  slug: string;
  website: string | null;
  careersUrl: string | null;
  status: CompanyDiscoveryStatus;
  matchReason?: string;
  isExistingVerified: boolean;
}

function normalizeCompanySize(rawSize?: string | null): string {
  const allowed = ["1-10", "11-50", "51-200", "201-500", "500+"];
  if (rawSize && allowed.includes(rawSize)) return rawSize;
  if (rawSize === "50-200") return "51-200";
  return "51-200";
}

/**
 * Normalizes a website URL into a canonical domain host for deduplication.
 * e.g. "https://www.stripe.com/jobs?ref=1" -> "stripe.com"
 */
export function extractCanonicalDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const trimmed = rawUrl.trim();
    const withProto = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProto);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname || null;
  } catch {
    return null;
  }
}

/**
 * Evaluates and deduplicates a discovered candidate against existing companies in the database.
 * Strictly adheres to the priority order:
 * 1. Stable provider company identifier (if provider matches)
 * 2. Normalized official website / domain
 * 3. Existing verified company identifiers
 * 4. Conservative normalized company-name matching
 *
 * Never overwrites trusted manual employer entries with unverified discovery data.
 */
export async function deduplicateAndSaveCompany(
  candidate: DiscoveredCompanyCandidate,
  initialStatus: CompanyDiscoveryStatus = "discovered",
): Promise<CompanyDeduplicationResult> {
  const sql = await getSql();
  const slug = normalizeCompanySlug(candidate.name);
  const candidateDomain = extractCanonicalDomain(candidate.website);

  // 1. Check by stable provider company identifier
  if (candidate.providerIdentifier) {
    const matchedByProvider = await sql<{
      id: string;
      company_name: string;
      slug: string;
      website: string | null;
      careers_url: string | null;
      verified: boolean;
      is_external: boolean;
      discovery_status: string | null;
    }>`
      select id, company_name, slug, website, careers_url, verified,
             coalesce(is_external, false) as is_external, discovery_status
      from employers
      where discovery_provider = ${candidate.providerName}
        and provider_id = ${candidate.providerIdentifier}
      limit 1
    `;

    if (matchedByProvider[0]) {
      const match = matchedByProvider[0];
      return handleExistingCompanyMatch(sql, match, candidate, "matched_by_provider_id");
    }
  }

  // 2. Check by normalized domain / website
  if (candidateDomain) {
    const candidateLikePattern = `%${candidateDomain}%`;
    const candidatesWithWebsite = await sql<{
      id: string;
      company_name: string;
      slug: string;
      website: string | null;
      careers_url: string | null;
      verified: boolean;
      is_external: boolean;
      discovery_status: string | null;
    }>`
      select id, company_name, slug, website, careers_url, verified,
             coalesce(is_external, false) as is_external, discovery_status
      from employers
      where website is not null and lower(website) like ${candidateLikePattern}
      limit 10
    `;

    for (const row of candidatesWithWebsite) {
      const rowDomain = extractCanonicalDomain(row.website);
      if (rowDomain === candidateDomain) {
        return handleExistingCompanyMatch(sql, row, candidate, "matched_by_domain");
      }
    }
  }

  // 3. Check by conservative normalized company-name matching (exact slug or exact lowercase name)
  const matchedByName = await sql<{
    id: string;
    company_name: string;
    slug: string;
    website: string | null;
    careers_url: string | null;
    verified: boolean;
    is_external: boolean;
    discovery_status: string | null;
  }>`
    select id, company_name, slug, website, careers_url, verified,
           coalesce(is_external, false) as is_external, discovery_status
    from employers
    where slug = ${slug} or lower(company_name) = ${candidate.name.toLowerCase().trim()}
    limit 1
  `;

  if (matchedByName[0]) {
    return handleExistingCompanyMatch(sql, matchedByName[0], candidate, "matched_by_exact_name");
  }

  // 4. No duplicate found — create fresh external employer record
  const newId = nid("emp");
  const cleanName = candidate.name.trim();

  await sql`
    insert into employers (
      id, user_id, company_name, slug, website, careers_url,
      industry, company_size, headquarters, city, hiring_tier,
      verified, active_jobs_count, is_external, discovery_status,
      discovery_provider, provider_id, discovery_confidence,
      last_discovered_at, created_at, updated_at
    ) values (
      ${newId}, null, ${cleanName}, ${slug}, ${candidate.website || null}, null,
      ${candidate.industry || "Technology"}, ${normalizeCompanySize(candidate.sizeRange)},
      ${candidate.location || "India"}, ${candidate.city || null}, 'standard',
      false, 0, true, ${initialStatus},
      ${candidate.providerName}, ${candidate.providerIdentifier || null},
      ${candidate.confidence || 0.80},
      now(), now(), now()
    )
  `;

  return {
    action: "created",
    companyId: newId,
    companyName: cleanName,
    slug,
    website: candidate.website || null,
    careersUrl: null,
    status: initialStatus,
    isExistingVerified: false,
    matchReason: "new_record",
  };
}

/**
 * Handles merging fields into existing record without overwriting trusted or verified data.
 */
async function handleExistingCompanyMatch(
  sql: any,
  existing: {
    id: string;
    company_name: string;
    slug: string;
    website: string | null;
    careers_url: string | null;
    verified: boolean;
    is_external: boolean;
    discovery_status: string | null;
  },
  candidate: DiscoveredCompanyCandidate,
  reason: string,
): Promise<CompanyDeduplicationResult> {
  const isVerified = existing.verified || !existing.is_external;

  // If company is an existing native verified employer, NEVER overwrite core details
  if (isVerified) {
    // Only record discovery timestamp, without changing name or website
    await sql`
      update employers set
        last_discovered_at = now()
      where id = ${existing.id}
    `;

    return {
      action: "matched_existing",
      companyId: existing.id,
      companyName: existing.company_name,
      slug: existing.slug,
      website: existing.website,
      careersUrl: existing.careers_url,
      status: (existing.discovery_status as CompanyDiscoveryStatus) || "discovered",
      matchReason: `${reason}_preserved_verified`,
      isExistingVerified: true,
    };
  }

  // If external non-verified company, update only missing or stale fields
  const shouldUpdateWebsite = !existing.website && Boolean(candidate.website);
  const shouldUpdateProvider = Boolean(candidate.providerIdentifier);

  if (shouldUpdateWebsite || shouldUpdateProvider) {
    await sql`
      update employers set
        website = coalesce(website, ${candidate.website || null}),
        discovery_provider = coalesce(discovery_provider, ${candidate.providerName}),
        provider_id = coalesce(provider_id, ${candidate.providerIdentifier || null}),
        last_discovered_at = now(),
        updated_at = now()
      where id = ${existing.id}
    `;

    return {
      action: "updated_missing_fields",
      companyId: existing.id,
      companyName: existing.company_name,
      slug: existing.slug,
      website: existing.website || candidate.website || null,
      careersUrl: existing.careers_url,
      status: (existing.discovery_status as CompanyDiscoveryStatus) || "discovered",
      matchReason: reason,
      isExistingVerified: false,
    };
  }

  return {
    action: "matched_existing",
    companyId: existing.id,
    companyName: existing.company_name,
    slug: existing.slug,
    website: existing.website,
    careersUrl: existing.careers_url,
    status: (existing.discovery_status as CompanyDiscoveryStatus) || "discovered",
    matchReason: reason,
    isExistingVerified: false,
  };
}

/**
 * Updates the discovery lifecycle status on an employer record.
 */
export async function updateCompanyDiscoveryStatus(
  companyId: string,
  status: CompanyDiscoveryStatus,
  options?: {
    website?: string | null;
    careersUrl?: string | null;
    atsType?: string | null;
    atsIdentifier?: string | null;
    reviewNotes?: string | null;
    confidence?: number;
  },
): Promise<void> {
  const sql = await getSql();

  await sql`
    update employers set
      discovery_status = ${status},
      website = coalesce(${options?.website ?? null}, website),
      careers_url = coalesce(${options?.careersUrl ?? null}, careers_url),
      ats_type = coalesce(${options?.atsType ?? null}, ats_type),
      ats_identifier = coalesce(${options?.atsIdentifier ?? null}, ats_identifier),
      review_notes = coalesce(${options?.reviewNotes ?? null}, review_notes),
      discovery_confidence = coalesce(${options?.confidence ?? null}, discovery_confidence),
      updated_at = now()
    where id = ${companyId}
  `;
}
