import { getSql } from "../../db.ts";
import { nid } from "../../ids.ts";
import { normalizeCompanySlug } from "../core/normalizer.ts";
import type { CompanySourceConfig } from "../core/types.ts";

export interface CompanyRecord {
  id: string;
  companyName: string;
  slug: string;
  isExternal: boolean;
  website: string | null;
  careersUrl: string | null;
}

export interface JobSourceRecord {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string;
  companySlug: string;
  boardIdentifier: string;
  careersUrl: string | null;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  errorCount: number;
  totalJobsCount: number;
}

/**
 * Finds or creates an employer / company record.
 * Avoids duplicate companies by matching against slug or case-insensitive name.
 */
export async function findOrCreateCompany(
  companyName: string,
  options: {
    website?: string | null;
    careersUrl?: string | null;
    atsType?: string | null;
    atsIdentifier?: string | null;
  } = {},
): Promise<CompanyRecord> {
  const sql = await getSql();
  const slug = normalizeCompanySlug(companyName);

  // Check existing by slug or company name
  const existing = await sql<{
    id: string;
    company_name: string;
    slug: string;
    is_external: boolean;
    website: string | null;
    careers_url: string | null;
  }>`
    select id, company_name, slug, coalesce(is_external, false) as is_external, website, careers_url
    from employers
    where slug = ${slug} or lower(company_name) = ${companyName.toLowerCase().trim()}
    limit 1
  `;

  if (existing[0]) {
    // If external company details need updating and existing is external
    if (existing[0].is_external && (options.atsType || options.careersUrl)) {
      await sql`
        update employers set
          ats_type = coalesce(${options.atsType ?? null}, ats_type),
          ats_identifier = coalesce(${options.atsIdentifier ?? null}, ats_identifier),
          careers_url = coalesce(${options.careersUrl ?? null}, careers_url),
          website = coalesce(${options.website ?? null}, website),
          updated_at = now()
        where id = ${existing[0].id}
      `;
    }
    return {
      id: existing[0].id,
      companyName: existing[0].company_name,
      slug: existing[0].slug,
      isExternal: existing[0].is_external,
      website: existing[0].website,
      careersUrl: existing[0].careers_url,
    };
  }

  // Create new external company record
  const id = nid("emp");
  await sql`
    insert into employers (
      id, user_id, company_name, slug, website, careers_url,
      industry, company_size, hiring_tier, verified,
      active_jobs_count, is_external, ats_type, ats_identifier, created_at, updated_at
    ) values (
      ${id}, null, ${companyName.trim()}, ${slug}, ${options.website ?? null}, ${options.careersUrl ?? null},
      'Technology', '51-200', 'standard', true,
      0, true, ${options.atsType ?? null}, ${options.atsIdentifier ?? null}, now(), now()
    )
  `;

  return {
    id,
    companyName: companyName.trim(),
    slug,
    isExternal: true,
    website: options.website ?? null,
    careersUrl: options.careersUrl ?? null,
  };
}

/**
 * Finds or creates a job_source configuration entry
 */
export async function findOrCreateJobSource(
  config: CompanySourceConfig,
): Promise<JobSourceRecord> {
  const sql = await getSql();

  // Ensure company exists first
  const company = await findOrCreateCompany(config.companyName, {
    website: config.website,
    careersUrl: config.careersUrl,
    atsType: config.source,
    atsIdentifier: config.boardIdentifier,
  });

  const existing = await sql<{
    id: string;
    name: string;
    company_id: string | null;
    company_name: string;
    company_slug: string;
    board_identifier: string;
    careers_url: string | null;
    enabled: boolean;
    last_sync_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
    error_count: number;
    total_jobs_count: number;
  }>`
    select id, name, company_id, company_name, company_slug, board_identifier,
           careers_url, enabled, last_sync_at, last_success_at, last_error,
           error_count, total_jobs_count
    from job_sources
    where name = ${config.source} and board_identifier = ${config.boardIdentifier}
    limit 1
  `;

  if (existing[0]) {
    return {
      id: existing[0].id,
      name: existing[0].name,
      companyId: existing[0].company_id,
      companyName: existing[0].company_name,
      companySlug: existing[0].company_slug,
      boardIdentifier: existing[0].board_identifier,
      careersUrl: existing[0].careers_url,
      enabled: existing[0].enabled,
      lastSyncAt: existing[0].last_sync_at,
      lastSuccessAt: existing[0].last_success_at,
      lastError: existing[0].last_error,
      errorCount: existing[0].error_count,
      totalJobsCount: existing[0].total_jobs_count,
    };
  }

  const id = nid("src");
  await sql`
    insert into job_sources (
      id, name, company_id, company_name, company_slug,
      board_identifier, careers_url, enabled, created_at, updated_at
    ) values (
      ${id}, ${config.source}, ${company.id}, ${config.companyName}, ${company.slug},
      ${config.boardIdentifier}, ${config.careersUrl ?? null}, ${config.enabled}, now(), now()
    )
  `;

  return {
    id,
    name: config.source,
    companyId: company.id,
    companyName: config.companyName,
    companySlug: company.slug,
    boardIdentifier: config.boardIdentifier,
    careersUrl: config.careersUrl ?? null,
    enabled: config.enabled,
    lastSyncAt: null,
    lastSuccessAt: null,
    lastError: null,
    errorCount: 0,
    totalJobsCount: 0,
  };
}

/**
 * Lists all registered company sources
 */
export async function listJobSources(): Promise<JobSourceRecord[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    company_id: string | null;
    company_name: string;
    company_slug: string;
    board_identifier: string;
    careers_url: string | null;
    enabled: boolean;
    last_sync_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
    error_count: number;
    total_jobs_count: number;
  }>`
    select id, name, company_id, company_name, company_slug, board_identifier,
           careers_url, enabled, last_sync_at, last_success_at, last_error,
           error_count, total_jobs_count
    from job_sources
    order by company_name asc
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    companyId: r.company_id,
    companyName: r.company_name,
    companySlug: r.company_slug,
    boardIdentifier: r.board_identifier,
    careersUrl: r.careers_url,
    enabled: r.enabled,
    lastSyncAt: r.last_sync_at,
    lastSuccessAt: r.last_success_at,
    lastError: r.last_error,
    errorCount: r.error_count,
    totalJobsCount: r.total_jobs_count,
  }));
}

/**
 * Updates status and statistics after a sync pass
 */
export async function updateJobSourceTelemetry(
  sourceId: string,
  stats: {
    success: boolean;
    error?: string | null;
    totalJobs?: number;
  },
): Promise<void> {
  const sql = await getSql();
  if (stats.success) {
    await sql`
      update job_sources set
        last_sync_at = now(),
        last_success_at = now(),
        last_error = null,
        error_count = 0,
        total_jobs_count = coalesce(${stats.totalJobs ?? null}, total_jobs_count),
        updated_at = now()
      where id = ${sourceId}
    `;
  } else {
    await sql`
      update job_sources set
        last_sync_at = now(),
        last_error = ${stats.error ?? "Unknown error during sync"},
        error_count = error_count + 1,
        updated_at = now()
      where id = ${sourceId}
    `;
  }
}
