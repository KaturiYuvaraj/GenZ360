import { getSql } from "../../db.ts";
import { nid } from "../../ids.ts";
import { findOrCreateJobSource, type JobSourceRecord } from "../services/company-service.ts";
import { updateCompanyDiscoveryStatus } from "./deduplication.ts";
import type { ATSDetectionEvidence, BoardValidationResult } from "./types.ts";

export interface SourceRegistrationResult {
  action: "registered" | "already_registered" | "preserved_disabled" | "rejected";
  jobSourceId?: string;
  sourceRecord?: JobSourceRecord;
  discoveredSourceId?: string;
  status: "active" | "disabled" | "needs_review" | "failed";
  reason: string;
}

/**
 * Idempotently registers a validated ATS board into `job_sources` and records telemetry in `discovered_company_sources`.
 * Guarantees:
 * - Never reactivates an existing source if admin previously disabled it.
 * - Never creates duplicate (name, board_identifier) entries.
 * - Preserves manual configuration.
 * - Links to `employers` table and updates `discovery_status`.
 */
export async function registerValidatedJobSource(
  company: {
    id: string;
    companyName: string;
    slug: string;
    website?: string | null;
  },
  detection: ATSDetectionEvidence,
  validation: BoardValidationResult,
): Promise<SourceRegistrationResult> {
  const sql = await getSql();

  // If validation failed, record candidate in discovered_company_sources with 'invalid' status and exit
  if (!validation.valid) {
    const discId = nid("dsc");
    await sql`
      insert into discovered_company_sources (
        id, company_id, company_name, website, career_page_url,
        ats_type, board_identifier, confidence, evidence,
        validation_status, validation_error, created_at, updated_at
      ) values (
        ${discId}, ${company.id}, ${company.companyName}, ${company.website || null},
        ${detection.careerPageUrl}, ${detection.atsType}, ${detection.boardIdentifier},
        ${detection.confidence}, ${JSON.stringify(detection.evidence)},
        'invalid', ${validation.error || "Board validation failed"}, now(), now()
      )
      on conflict (company_name, ats_type, board_identifier) do update set
        validation_status = 'invalid',
        validation_error = ${validation.error || "Board validation failed"},
        updated_at = now()
    `;

    await updateCompanyDiscoveryStatus(company.id, "discovery_failed", {
      reviewNotes: `ATS board validation failed: ${validation.error}`,
    });

    return {
      action: "rejected",
      status: "failed",
      reason: `Board validation failed: ${validation.error}`,
    };
  }

  // Check if job source already exists by (name, board_identifier)
  const existingSource = await sql<{
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
    where name = ${detection.atsType} and board_identifier = ${detection.boardIdentifier}
    limit 1
  `;

  let jobSourceRecord: JobSourceRecord;
  let action: SourceRegistrationResult["action"] = "registered";

  if (existingSource[0]) {
    const existing = existingSource[0];
    jobSourceRecord = {
      id: existing.id,
      name: existing.name,
      companyId: existing.company_id,
      companyName: existing.company_name,
      companySlug: existing.company_slug,
      boardIdentifier: existing.board_identifier,
      careersUrl: existing.careers_url,
      enabled: existing.enabled,
      lastSyncAt: existing.last_sync_at,
      lastSuccessAt: existing.last_success_at,
      lastError: existing.last_error,
      errorCount: existing.error_count,
      totalJobsCount: existing.total_jobs_count,
    };

    // If source was previously disabled by admin, preserve disabled state!
    if (!existing.enabled) {
      action = "preserved_disabled";
    } else {
      action = "already_registered";
    }

    // Update metadata and careersUrl if missing
    await sql`
      update job_sources set
        careers_url = coalesce(careers_url, ${detection.careerPageUrl}),
        updated_at = now()
      where id = ${existing.id}
    `;
  } else {
    // New source registration
    jobSourceRecord = await findOrCreateJobSource({
      companyName: company.companyName,
      companySlug: company.slug,
      website: company.website,
      careersUrl: detection.careerPageUrl,
      source: detection.atsType,
      boardIdentifier: detection.boardIdentifier,
      enabled: true,
    });
  }

  // Record candidate in discovered_company_sources table
  const discId = nid("dsc");
  await sql`
    insert into discovered_company_sources (
      id, company_id, company_name, website, career_page_url,
      ats_type, board_identifier, confidence, evidence,
      validation_status, validation_error, job_source_id, created_at, updated_at
    ) values (
      ${discId}, ${company.id}, ${company.companyName}, ${company.website || null},
      ${detection.careerPageUrl}, ${detection.atsType}, ${detection.boardIdentifier},
      ${detection.confidence}, ${JSON.stringify(detection.evidence)},
      'valid', null, ${jobSourceRecord.id}, now(), now()
    )
    on conflict (company_name, ats_type, board_identifier) do update set
      validation_status = 'valid',
      validation_error = null,
      job_source_id = ${jobSourceRecord.id},
      updated_at = now()
  `;

  // Update employer discovery status to 'source_registered'
  await updateCompanyDiscoveryStatus(company.id, "source_registered", {
    careersUrl: detection.careerPageUrl,
    atsType: detection.atsType,
    atsIdentifier: detection.boardIdentifier,
    confidence: detection.confidence,
  });

  return {
    action,
    jobSourceId: jobSourceRecord.id,
    sourceRecord: jobSourceRecord,
    discoveredSourceId: discId,
    status: jobSourceRecord.enabled ? "active" : "disabled",
    reason:
      action === "registered"
        ? `Successfully registered new ${detection.atsType} source (${validation.jobCount} open jobs found)`
        : action === "preserved_disabled"
        ? "Existing source matched; preserved disabled state set by administrator"
        : "Source already registered; updated metadata",
  };
}
