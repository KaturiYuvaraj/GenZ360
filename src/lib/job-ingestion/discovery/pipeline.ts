import { getSql } from "../../db.ts";
import { nid } from "../../ids.ts";
import { getActiveDiscoveryProvider, getDiscoveryProvider } from "./providers/index.ts";
import { deduplicateAndSaveCompany, updateCompanyDiscoveryStatus } from "./deduplication.ts";
import { validateOfficialWebsite } from "./website-validator.ts";
import { discoverCompanyCareerPage } from "./career-discovery.ts";
import { detectATSOnCareerPage } from "./ats-detector.ts";
import { validateATSBoard } from "./board-validator.ts";
import { registerValidatedJobSource } from "./source-registrar.ts";
import { getConnector } from "../connectors/registry.ts";
import { syncCompanySource } from "../services/ingestion-service.ts";
import type {
  DiscoveryPipelineOptions,
  DiscoveryRunSummary,
} from "./types.ts";

let isDiscoveryRunningGlobally = false;

export function isDiscoveryPipelineRunning(): boolean {
  return isDiscoveryRunningGlobally;
}

/**
 * Executes a controlled, end-to-end automatic company discovery and ATS registration run.
 * Follows the 8 distinct lifecycle stages:
 * A. Discover company candidate
 * B. Verify company official website (SSRF protected)
 * C. Find careers page
 * D. Detect ATS platform
 * E. Validate ATS board identifier
 * F. Register eligible job source
 * G. Ingest jobs via existing connector
 * H. Synchronize jobs
 *
 * Fully observable, retryable, and safe against concurrent execution.
 */
export async function runCompanyDiscoveryPipeline(
  options: DiscoveryPipelineOptions = {},
): Promise<DiscoveryRunSummary> {
  const sql = await getSql();

  // Concurrency Guard: prevent duplicate runs
  if (isDiscoveryRunningGlobally) {
    throw new Error("A company discovery run is already in progress. Concurrent runs are blocked.");
  }

  // Resolve provider
  const provider = options.provider
    ? getDiscoveryProvider(options.provider)
    : getActiveDiscoveryProvider({ allowTestFallback: false });

  if (!provider || !provider.isConfigured()) {
    const status = provider ? provider.getConfigurationStatus() : null;
    throw new Error(
      `Company discovery provider '${options.provider || "default"}' is not configured. ` +
        (status?.missingKeys?.length ? `Missing keys: ${status.missingKeys.join(", ")}. ` : "") +
        "Automatic company discovery is unavailable until configuration is completed.",
    );
  }

  isDiscoveryRunningGlobally = true;
  const runId = nid("run");
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const maxCompanies = options.maxCompanies ?? 15;
  const delayMs = options.delayBetweenCompaniesMs ?? 500;

  // Initialize discovery run log in database
  await sql`
    insert into discovery_runs (
      id, provider, query, location, industry, status,
      started_at, created_at
    ) values (
      ${runId}, ${provider.getProviderName()}, ${options.query ?? null},
      ${options.location ?? null}, ${options.industry ?? null},
      'running', now(), now()
    )
  `;

  const summary: DiscoveryRunSummary = {
    runId,
    provider: provider.getProviderName(),
    query: options.query,
    location: options.location,
    industry: options.industry,
    status: "completed",
    companiesFound: 0,
    companiesProcessed: 0,
    duplicatesFound: 0,
    websitesVerified: 0,
    careerPagesFound: 0,
    atsDetected: 0,
    sourcesValidated: 0,
    sourcesRegistered: 0,
    needsReviewCount: 0,
    failedCount: 0,
    durationMs: 0,
    startedAt,
    completedAt: "",
  };

  try {
    // ── STAGE A: Discover company candidates from provider ───────────────────
    console.info(
      `[Company Discovery] Starting run ${runId} with provider '${provider.getProviderName()}'...`,
    );

    const searchRes = await provider.searchCompanies({
      query: options.query,
      location: options.location,
      country: options.country || "India",
      state: options.state,
      city: options.city,
      industry: options.industry,
      limit: maxCompanies,
    });

    const candidates = searchRes.companies || [];
    summary.companiesFound = candidates.length;

    console.info(`[Company Discovery] Discovered ${candidates.length} candidate companies.`);

    // Process each candidate company through pipeline
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      summary.companiesProcessed++;

      console.info(
        `[Company Discovery] [${i + 1}/${candidates.length}] Processing candidate: ${candidate.name}...`,
      );

      try {
        // ── STAGE B: Deduplicate against existing companies ─────────────────
        const dedupRes = await deduplicateAndSaveCompany(candidate, "discovered");
        if (dedupRes.action === "matched_existing") {
          summary.duplicatesFound++;
        }

        const companyId = dedupRes.companyId;

        // ── STAGE C: Verify official company website ────────────────────────
        let targetWebsite = dedupRes.website || candidate.website;
        let websiteVerified = false;

        if (targetWebsite) {
          const siteRes = await validateOfficialWebsite(targetWebsite, {
            companyName: candidate.name,
            timeoutMs: options.timeoutMs ?? 7000,
          });

          if (siteRes.valid && siteRes.canonicalUrl) {
            websiteVerified = true;
            summary.websitesVerified++;
            targetWebsite = siteRes.canonicalUrl;
            await updateCompanyDiscoveryStatus(companyId, "website_pending", {
              website: targetWebsite,
              confidence: siteRes.confidence,
            });
          } else {
            await updateCompanyDiscoveryStatus(companyId, "needs_review", {
              reviewNotes: `Website unverified: ${siteRes.error || "failed check"}`,
            });
            summary.needsReviewCount++;
            continue;
          }
        } else {
          await updateCompanyDiscoveryStatus(companyId, "needs_review", {
            reviewNotes: "No official website provided by discovery source",
          });
          summary.needsReviewCount++;
          continue;
        }

        // ── STAGE D: Discover careers page ──────────────────────────────────
        await updateCompanyDiscoveryStatus(companyId, "career_page_pending");
        const careerRes = await discoverCompanyCareerPage({
          websiteUrl: targetWebsite,
          knownCareersUrl: dedupRes.careersUrl,
          timeoutMs: options.timeoutMs ?? 7000,
        });

        if (!careerRes.found || !careerRes.url) {
          await updateCompanyDiscoveryStatus(companyId, "unsupported_source", {
            reviewNotes: "No career or jobs page found on official domain",
          });
          summary.needsReviewCount++;
          continue;
        }

        summary.careerPagesFound++;
        const careerPageUrl = careerRes.url;

        // ── STAGE E: Detect ATS platform ────────────────────────────────────
        const atsDetection = await detectATSOnCareerPage(careerPageUrl, options.timeoutMs ?? 7000);
        if (!atsDetection) {
          await updateCompanyDiscoveryStatus(companyId, "unsupported_source", {
            careersUrl: careerPageUrl,
            reviewNotes: "No supported ATS platform detected on careers page",
          });
          continue;
        }

        summary.atsDetected++;
        await updateCompanyDiscoveryStatus(companyId, "ats_detected", {
          careersUrl: careerPageUrl,
          atsType: atsDetection.atsType,
          atsIdentifier: atsDetection.boardIdentifier,
          confidence: atsDetection.confidence,
        });

        // ── STAGE F: Validate ATS board endpoint ────────────────────────────
        const boardValidation = await validateATSBoard(
          atsDetection.atsType,
          atsDetection.boardIdentifier,
          options.timeoutMs ?? 8000,
        );

        if (!boardValidation.valid) {
          summary.failedCount++;
          await registerValidatedJobSource(
            { id: companyId, companyName: candidate.name, slug: dedupRes.slug, website: targetWebsite },
            atsDetection,
            boardValidation,
          );
          continue;
        }

        summary.sourcesValidated++;

        // ── STAGE G: Register job source ────────────────────────────────────
        const regRes = await registerValidatedJobSource(
          { id: companyId, companyName: candidate.name, slug: dedupRes.slug, website: targetWebsite },
          atsDetection,
          boardValidation,
        );

        if (regRes.action === "registered" || regRes.action === "already_registered") {
          summary.sourcesRegistered++;
        }

        // ── STAGE H: Synchronize jobs via existing connector ────────────────
        if (options.autoSyncJobs !== false && regRes.jobSourceId) {
          const connector = getConnector(atsDetection.atsType);
          if (connector) {
            try {
              console.info(
                `[Company Discovery] Triggering initial job sync for ${candidate.name} (${atsDetection.atsType}:${atsDetection.boardIdentifier})...`,
              );
              await syncCompanySource(
                connector,
                {
                  companyName: candidate.name,
                  companySlug: dedupRes.slug,
                  website: targetWebsite,
                  careersUrl: careerPageUrl,
                  source: atsDetection.atsType,
                  boardIdentifier: atsDetection.boardIdentifier,
                  enabled: true,
                },
                { dryRun: options.dryRun },
              );
            } catch (syncErr) {
              // Discovery separation rule: sync failure must NEVER fail the discovery registration
              console.warn(
                `[Company Discovery] Initial sync error for ${candidate.name}:`,
                syncErr,
              );
            }
          }
        }
      } catch (itemErr: any) {
        summary.failedCount++;
        console.error(`[Company Discovery] Error processing ${candidate.name}:`, itemErr);
      }

      // Throttling delay between companies
      if (i < candidates.length - 1 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  } catch (pipelineErr: any) {
    summary.status = "failed";
    summary.errorMessage = pipelineErr.message || String(pipelineErr);
    console.error(`[Company Discovery] Pipeline run ${runId} failed:`, pipelineErr);
  } finally {
    isDiscoveryRunningGlobally = false;
  }

  const durationMs = Date.now() - startTime;
  const completedAt = new Date().toISOString();
  summary.durationMs = durationMs;
  summary.completedAt = completedAt;

  // Persist run telemetry in discovery_runs table
  await sql`
    update discovery_runs set
      status = ${summary.status},
      companies_found = ${summary.companiesFound},
      companies_processed = ${summary.companiesProcessed},
      duplicates_found = ${summary.duplicatesFound},
      websites_verified = ${summary.websitesVerified},
      career_pages_found = ${summary.careerPagesFound},
      ats_detected = ${summary.atsDetected},
      sources_validated = ${summary.sourcesValidated},
      sources_registered = ${summary.sourcesRegistered},
      needs_review_count = ${summary.needsReviewCount},
      failed_count = ${summary.failedCount},
      error_message = ${summary.errorMessage ?? null},
      completed_at = now()
    where id = ${runId}
  `;

  console.info(
    `[Company Discovery] Run ${runId} completed (${summary.status}): ` +
      `${summary.sourcesRegistered} sources registered, ${summary.sourcesValidated} validated, ` +
      `${summary.atsDetected} ATS detected in ${(durationMs / 1000).toFixed(1)}s.`,
  );

  return summary;
}
