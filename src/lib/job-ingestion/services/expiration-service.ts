import { getSql } from "../../db.ts";

/**
 * Marks jobs that were not observed during the sync cycle as expired.
 * Preserves historical records — never deletes them.
 */
export async function expireUnseenJobs(
  jobSourceId: string,
  syncStartTime: string,
): Promise<{ expiredCount: number }> {
  const sql = await getSql();

  // Find all active jobs belonging to this source whose last_seen_at is older than syncStartTime
  const expired = await sql<{ id: string }>`
    select id from jobs
    where job_source_id = ${jobSourceId}
      and ingestion_status = 'active'
      and last_seen_at < ${syncStartTime}
  `;

  if (expired.length === 0) {
    return { expiredCount: 0 };
  }

  const ids = expired.map((j) => j.id);

  // Update their status to 'expired'
  await sql`
    update jobs set
      ingestion_status = 'expired'
    where id = any(${ids})
  `;

  return { expiredCount: expired.length };
}

/**
 * Re-activates or pauses jobs manually
 */
export async function setJobIngestionStatus(
  jobId: string,
  status: "active" | "closed" | "expired" | "paused" | "error",
): Promise<void> {
  const sql = await getSql();
  await sql`
    update jobs set
      ingestion_status = ${status}
    where id = ${jobId}
  `;
}
