import type {
  CompanySourceConfig,
  IngestionOptions,
  SyncResult,
} from "../core/types.ts";
import type { JobSourceConnector } from "../core/source-interface.ts";
import {
  findOrCreateJobSource,
  updateJobSourceTelemetry,
} from "./company-service.ts";
import { upsertAggregatedJob } from "./job-service.ts";
import { expireUnseenJobs } from "./expiration-service.ts";

/**
 * Orchestrates a complete ingestion and synchronization run for a single company board.
 * Fully isolates failures: one company's errors will never crash the ingestion runner.
 */
export async function syncCompanySource<TRaw = unknown>(
  connector: JobSourceConnector<TRaw>,
  config: CompanySourceConfig,
  options: IngestionOptions = {},
): Promise<SyncResult> {
  const startTime = Date.now();
  const syncStartTimeIso = new Date().toISOString();

  const result: SyncResult = {
    source: connector.getSourceName(),
    company: config.companyName,
    boardIdentifier: config.boardIdentifier,
    totalFetched: 0,
    newCount: 0,
    updatedCount: 0,
    closedCount: 0,
    duplicateCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
    durationMs: 0,
    timestamp: syncStartTimeIso,
  };

  try {
    // 1. Resolve or create Job Source configuration & company entity
    const jobSource = await findOrCreateJobSource(config);

    if (!jobSource.enabled && !options.forceRefresh) {
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // 2. Fetch raw jobs using source connector
    const rawJobs = await connector.fetchJobs(config, options);
    result.totalFetched = rawJobs.length;

    // 3. Normalize, Validate, and Upsert each job
    for (const raw of rawJobs) {
      try {
        const normalized = connector.normalizeJob(raw, config);
        const validation = connector.validateJob(normalized);

        if (!validation.valid) {
          result.errorCount++;
          result.errors.push(
            `Validation error on job ${normalized.sourceJobId || "unknown"}: ${
              validation.errors?.join(", ")
            }`,
          );
          continue;
        }

        if (options.dryRun) {
          result.newCount++;
          continue;
        }

        const upsertRes = await upsertAggregatedJob(
          normalized,
          jobSource.companyId || "",
          jobSource.id,
        );

        if (upsertRes.action === "inserted") result.newCount++;
        else if (upsertRes.action === "updated") result.updatedCount++;
        else if (upsertRes.action === "skipped") result.skippedCount++;
        else if (upsertRes.action === "duplicate") result.duplicateCount++;
      } catch (jobErr) {
        result.errorCount++;
        const errStr = jobErr instanceof Error ? jobErr.message : String(jobErr);
        result.errors.push(`Error processing job: ${errStr}`);
      }
    }

    // 4. Mark jobs missing in this sync cycle as expired (only in non-dry-run mode)
    if (!options.dryRun) {
      const expirationRes = await expireUnseenJobs(jobSource.id, syncStartTimeIso);
      result.closedCount = expirationRes.expiredCount;
    }

    result.durationMs = Date.now() - startTime;

    // 5. Update telemetry on job_sources record
    await updateJobSourceTelemetry(jobSource.id, {
      success: result.errorCount === 0 || result.newCount > 0,
      totalJobs: result.newCount + result.updatedCount + result.skippedCount,
      error: result.errors.length > 0 ? result.errors[0] : null,
    });

    return result;
  } catch (syncErr) {
    result.durationMs = Date.now() - startTime;
    result.errorCount++;
    const errMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
    result.errors.push(`Sync failed: ${errMsg}`);

    return result;
  }
}
