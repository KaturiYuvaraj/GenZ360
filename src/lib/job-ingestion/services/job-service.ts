import { getSql } from "../../db.ts";
import { nid } from "../../ids.ts";
import {
  buildJobFingerprint,
  evaluateDeduplication,
} from "../core/deduplicator.ts";
import type { NormalizedJob } from "../core/types.ts";

export type UpsertJobResult = {
  id: string;
  action: "inserted" | "updated" | "skipped" | "duplicate";
  reason: string;
};

/**
 * Upserts a normalized job while enforcing strict deduplication rules
 * and guaranteeing native GenZ360 employer postings are never compromised.
 */
export async function upsertAggregatedJob(
  job: NormalizedJob,
  companyId: string,
  sourceId: string,
): Promise<UpsertJobResult> {
  const sql = await getSql();

  // 1. Check primary identity: source + source_job_id
  const existingBySource = await sql<{
    id: string;
    content_hash: string | null;
    source: string;
    external_job: boolean;
  }>`
    select id, content_hash, source, coalesce(external_job, false) as external_job
    from jobs
    where source = ${job.source} and source_job_id = ${job.sourceJobId}
    limit 1
  `;

  // 2. Check secondary fingerprint (only if not found by primary source ID)
  let existingByFp: {
    id: string;
    source: string;
    isNativeEmployer: boolean;
  } | null = null;

  if (!existingBySource[0]) {
    const incomingFp = buildJobFingerprint(job.company, job.title, job.location);
    const candidateMatches = await sql<{
      id: string;
      company: string;
      role: string;
      location: string;
      source: string;
      external_job: boolean;
    }>`
      select id, company, role, location, source, coalesce(external_job, false) as external_job
      from jobs
      where lower(company) = ${job.company.toLowerCase().trim()}
        and ingestion_status = 'active'
      limit 20
    `;

    for (const row of candidateMatches) {
      const rowFp = buildJobFingerprint(row.company, row.role, row.location);
      if (rowFp === incomingFp) {
        existingByFp = {
          id: row.id,
          source: row.source,
          isNativeEmployer: !row.external_job || row.source === "genz360",
        };
        break;
      }
    }
  }

  // 3. Evaluate deduplication decision
  const decision = evaluateDeduplication(
    job,
    existingBySource[0]
      ? {
          id: existingBySource[0].id,
          contentHash: existingBySource[0].content_hash || "",
          source: existingBySource[0].source as any,
        }
      : null,
    existingByFp
      ? {
          id: existingByFp.id,
          source: existingByFp.source as any,
          isNativeEmployer: existingByFp.isNativeEmployer,
        }
      : null,
  );

  // 4. Execute according to decision

  // Case A: Skip (unchanged content, only refresh last_seen_at)
  if (decision.action === "skip") {
    const existingId = existingBySource[0]?.id || existingByFp?.id;
    if (existingId) {
      await sql`
        update jobs set
          last_seen_at = now(),
          ingestion_status = 'active'
        where id = ${existingId}
      `;
      return { id: existingId, action: "skipped", reason: decision.reason };
    }
  }

  // Case B: Flag cross-source (potential duplicate of native or other source)
  if (decision.action === "flag_cross_source") {
    return {
      id: existingByFp?.id || "",
      action: "duplicate",
      reason: decision.reason,
    };
  }

  // Case C: Update existing job
  if (decision.action === "update" && existingBySource[0]) {
    const id = existingBySource[0].id;
    await sql`
      update jobs set
        role = ${job.title},
        description = ${job.description},
        location = ${job.location},
        country = ${job.country},
        city = ${job.city},
        remote = ${job.remote},
        remote_type = ${job.remoteType},
        type = ${job.employmentType},
        employment_type = ${job.employmentType},
        experience_level = ${job.experienceLevel},
        ctc_lpa = ${job.salary},
        salary_min = ${job.salaryMin},
        salary_max = ${job.salaryMax},
        currency = ${job.currency},
        skills = ${job.skills.join(",")},
        department = ${job.department},
        application_url = ${job.applicationUrl},
        source_url = ${job.sourceUrl ?? null},
        content_hash = ${job.contentHash},
        source_updated_at = ${job.updatedAt ? new Date(job.updatedAt).toISOString() : null},
        last_seen_at = now(),
        ingestion_status = 'active'
      where id = ${id}
    `;
    return { id, action: "updated", reason: decision.reason };
  }

  // Case D: Insert fresh job
  const id = nid("job");
  await sql`
    insert into jobs (
      id, company, role, category, skills, location, country, city,
      remote, remote_type, type, employment_type, experience_level, ctc_lpa, salary_min, salary_max,
      currency, description, department, application_url, source_url, source,
      source_job_id, external_job, employer_id, job_source_id, content_hash,
      source_updated_at, last_seen_at, ingestion_status, created_at
    ) values (
      ${id}, ${job.company}, ${job.title}, ${job.department || "Engineering"},
      ${job.skills.join(",")}, ${job.location}, ${job.country}, ${job.city},
      ${job.remote}, ${job.remoteType}, ${job.employmentType}, ${job.employmentType}, ${job.experienceLevel},
      ${job.salary}, ${job.salaryMin}, ${job.salaryMax}, ${job.currency},
      ${job.description}, ${job.department}, ${job.applicationUrl}, ${job.sourceUrl ?? null},
      ${job.source}, ${job.sourceJobId}, true, ${companyId}, ${sourceId},
      ${job.contentHash}, ${job.updatedAt ? new Date(job.updatedAt).toISOString() : null},
      now(), 'active', ${new Date(job.postedAt).toISOString()}
    )
  `;

  // Increment employer active jobs count
  await sql`
    update employers set
      active_jobs_count = active_jobs_count + 1,
      updated_at = now()
    where id = ${companyId}
  `.catch(() => {});

  return { id, action: "inserted", reason: "Successfully ingested new job" };
}
