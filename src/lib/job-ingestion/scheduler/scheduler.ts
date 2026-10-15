import { listJobSources, updateJobSourceTelemetry } from "../services/company-service.ts";
import { getConnector } from "../connectors/registry.ts";
import { syncCompanySource } from "../services/ingestion-service.ts";
import type { SyncResult, IngestionOptions } from "../core/types.ts";

export interface SchedulerStatus {
  active: boolean;
  intervalMs: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isRunningCycle: boolean;
  lastCycleResults: SyncResult[];
  lastCycleSummary: {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    totalFetched: number;
    totalNew: number;
    totalUpdated: number;
    totalExpired: number;
    durationMs: number;
  } | null;
}

let schedulerTimer: NodeJS.Timeout | null = null;
let isCurrentlyRunning = false;
let lastRunTimestamp: string | null = null;
let nextRunTimestamp: string | null = null;
let lastCycleResultsCache: SyncResult[] = [];
let lastCycleSummaryCache: SchedulerStatus["lastCycleSummary"] = null;
let currentIntervalMs = 2 * 60 * 60 * 1000; // Default: 2 hours

/**
 * Runs a single coordinated ingestion cycle across all enabled job sources.
 * Enforces rate limiting, concurrency bounds, and strict per-source failure isolation.
 */
export async function runIngestionCycle(
  options: IngestionOptions & {
    delayBetweenSourcesMs?: number;
  } = {},
): Promise<{
  results: SyncResult[];
  summary: NonNullable<SchedulerStatus["lastCycleSummary"]>;
}> {
  if (isCurrentlyRunning) {
    console.warn("[Job Scheduler] Ingestion cycle already in progress — skipping concurrent trigger.");
    return {
      results: lastCycleResultsCache,
      summary: lastCycleSummaryCache || {
        totalSources: 0,
        successfulSources: 0,
        failedSources: 0,
        totalFetched: 0,
        totalNew: 0,
        totalUpdated: 0,
        totalExpired: 0,
        durationMs: 0,
      },
    };
  }

  isCurrentlyRunning = true;
  lastRunTimestamp = new Date().toISOString();
  const startTime = Date.now();

  const delayMs = options.delayBetweenSourcesMs ?? 1000;
  const results: SyncResult[] = [];

  console.info(`[Job Scheduler] Starting ingestion cycle at ${lastRunTimestamp}...`);

  try {
    const sources = await listJobSources();
    const enabledSources = sources.filter((s) => s.enabled);

    console.info(`[Job Scheduler] Found ${enabledSources.length} enabled job sources out of ${sources.length} total.`);

    for (let i = 0; i < enabledSources.length; i++) {
      const sourceRecord = enabledSources[i];
      const connector = getConnector(sourceRecord.name as any);

      if (!connector) {
        console.warn(
          `[Job Scheduler] No connector registered for source type '${sourceRecord.name}' (Company: ${sourceRecord.companyName})`,
        );
        continue;
      }

      console.info(
        `[Job Scheduler] [${i + 1}/${enabledSources.length}] Syncing ${sourceRecord.companyName} (${sourceRecord.name}:${sourceRecord.boardIdentifier})...`,
      );

      try {
        const syncRes = await syncCompanySource(connector, {
          companyName: sourceRecord.companyName,
          companySlug: sourceRecord.companySlug,
          source: sourceRecord.name as any,
          boardIdentifier: sourceRecord.boardIdentifier,
          enabled: sourceRecord.enabled,
          careersUrl: sourceRecord.careersUrl,
        }, options);

        results.push(syncRes);

        // Update telemetry on source record
        await updateJobSourceTelemetry(sourceRecord.id, {
          success: syncRes.errorCount === 0,
          error: syncRes.errors[0] || null,
          totalJobs: syncRes.totalFetched,
        });

        console.info(
          `[Job Scheduler] [${sourceRecord.companyName}] Fetched: ${syncRes.totalFetched}, New: ${syncRes.newCount}, Updated: ${syncRes.updatedCount}, Closed/Expired: ${syncRes.closedCount}, Duration: ${syncRes.durationMs}ms`,
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Job Scheduler] Error syncing ${sourceRecord.companyName}: ${errorMsg}`);

        await updateJobSourceTelemetry(sourceRecord.id, {
          success: false,
          error: errorMsg,
        });

        results.push({
          source: sourceRecord.name as any,
          company: sourceRecord.companyName,
          boardIdentifier: sourceRecord.boardIdentifier,
          totalFetched: 0,
          newCount: 0,
          updatedCount: 0,
          closedCount: 0,
          duplicateCount: 0,
          skippedCount: 0,
          errorCount: 1,
          errors: [errorMsg],
          durationMs: 0,
          timestamp: new Date().toISOString(),
        });
      }

      // Polite throttling delay between different companies
      if (i < enabledSources.length - 1 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  } catch (globalErr) {
    console.error("[Job Scheduler] Fatal error during ingestion cycle:", globalErr);
  } finally {
    isCurrentlyRunning = false;
  }

  const durationMs = Date.now() - startTime;
  const summary: NonNullable<SchedulerStatus["lastCycleSummary"]> = {
    totalSources: results.length,
    successfulSources: results.filter((r) => r.errorCount === 0).length,
    failedSources: results.filter((r) => r.errorCount > 0).length,
    totalFetched: results.reduce((acc, r) => acc + r.totalFetched, 0),
    totalNew: results.reduce((acc, r) => acc + r.newCount, 0),
    totalUpdated: results.reduce((acc, r) => acc + r.updatedCount, 0),
    totalExpired: results.reduce((acc, r) => acc + r.closedCount, 0),
    durationMs,
  };

  lastCycleResultsCache = results;
  lastCycleSummaryCache = summary;

  console.info(
    `[Job Scheduler] Cycle completed in ${(durationMs / 1000).toFixed(1)}s: ${summary.successfulSources}/${summary.totalSources} sources succeeded, ${summary.totalNew} new jobs, ${summary.totalUpdated} updated.`,
  );

  return { results, summary };
}

/**
 * Starts the background polling timer.
 */
export function startBackgroundScheduler(intervalMs = 2 * 60 * 60 * 1000): void {
  stopBackgroundScheduler();
  currentIntervalMs = intervalMs;

  console.info(`[Job Scheduler] Background timer started (interval: ${intervalMs / 1000}s).`);
  nextRunTimestamp = new Date(Date.now() + intervalMs).toISOString();

  schedulerTimer = setInterval(async () => {
    try {
      await runIngestionCycle();
    } catch (err) {
      console.error("[Job Scheduler] Scheduled execution error:", err);
    } finally {
      nextRunTimestamp = new Date(Date.now() + currentIntervalMs).toISOString();
    }
  }, intervalMs);

  // Prevent scheduler from blocking graceful process termination
  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }
}

/**
 * Stops the background scheduler timer.
 */
export function stopBackgroundScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    nextRunTimestamp = null;
    console.info("[Job Scheduler] Background timer stopped.");
  }
}

/**
 * Returns current health and diagnostic status of the scheduler.
 */
export function getSchedulerStatus(): SchedulerStatus {
  return {
    active: schedulerTimer !== null,
    intervalMs: currentIntervalMs,
    lastRunAt: lastRunTimestamp,
    nextRunAt: nextRunTimestamp,
    isRunningCycle: isCurrentlyRunning,
    lastCycleResults: lastCycleResultsCache,
    lastCycleSummary: lastCycleSummaryCache,
  };
}
