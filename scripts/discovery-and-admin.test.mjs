import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  detectATSFromUrl,
  detectATSFromHtml,
  VERIFIED_COMPANY_SEEDS,
  seedVerifiedCompanySources,
} from "../src/lib/job-ingestion/services/discovery-service.ts";
import {
  getSchedulerStatus,
  startBackgroundScheduler,
  stopBackgroundScheduler,
  runIngestionCycle,
} from "../src/lib/job-ingestion/scheduler/scheduler.ts";
import { listJobSources } from "../src/lib/job-ingestion/services/company-service.ts";
import { queryJobs } from "../src/lib/data/catalog.ts";

describe("Phases 9 - 15: Company Discovery, Scheduler, & Catalog Filtering Tests", () => {
  test("ATS URL Detector correctly identifies all supported ATS platforms", () => {
    // Greenhouse
    const gh1 = detectATSFromUrl("https://boards.greenhouse.io/stripe");
    assert.deepEqual(gh1?.atsType, "greenhouse");
    assert.equal(gh1?.atsIdentifier, "stripe");

    const gh2 = detectATSFromUrl("https://job-boards.greenhouse.io/figma/jobs/1234");
    assert.deepEqual(gh2?.atsType, "greenhouse");
    assert.equal(gh2?.atsIdentifier, "figma");

    // Lever
    const lev = detectATSFromUrl("https://jobs.lever.co/netflix/abc-123");
    assert.deepEqual(lev?.atsType, "lever");
    assert.equal(lev?.atsIdentifier, "netflix");

    // Ashby
    const ash = detectATSFromUrl("https://jobs.ashbyhq.com/linear");
    assert.deepEqual(ash?.atsType, "ashby");
    assert.equal(ash?.atsIdentifier, "linear");

    // Workable
    const wkb = detectATSFromUrl("https://apply.workable.com/invision/j/XYZ");
    assert.deepEqual(wkb?.atsType, "workable");
    assert.equal(wkb?.atsIdentifier, "invision");

    // SmartRecruiters
    const smr = detectATSFromUrl("https://careers.smartrecruiters.com/smartrecruiters");
    assert.deepEqual(smr?.atsType, "smartrecruiters");
    assert.equal(smr?.atsIdentifier, "smartrecruiters");

    // Unknown or unsupported
    const unk = detectATSFromUrl("https://example.com/random-page");
    assert.equal(unk, null);
  });

  test("ATS HTML Detector identifies embedded widgets and scripts", () => {
    const htmlWithIframe = `
      <html>
        <body>
          <iframe src="https://boards.greenhouse.io/embed/job_board?for=airtable"></iframe>
        </body>
      </html>
    `;
    const res = detectATSFromHtml(htmlWithIframe, "https://airtable.com/careers");
    assert.equal(res?.atsType, "greenhouse");
    assert.equal(res?.atsIdentifier, "airtable");

    const htmlWithLever = `
      <div><a href="https://jobs.lever.co/spotify">Join our squad</a></div>
    `;
    const levRes = detectATSFromHtml(htmlWithLever);
    assert.equal(levRes?.atsType, "lever");
    assert.equal(levRes?.atsIdentifier, "spotify");
  });

  test("Verified Seed Catalog contains required top tech companies", () => {
    assert.ok(VERIFIED_COMPANY_SEEDS.length >= 5);
    const companies = VERIFIED_COMPANY_SEEDS.map((c) => c.companyName);
    assert.ok(companies.includes("Stripe"));
    assert.ok(companies.includes("Figma"));
    assert.ok(companies.includes("Netflix"));
    assert.ok(companies.includes("Linear"));
  });

  test("seedVerifiedCompanySources seeds job_sources table idempotently", async () => {
    const seedRes = await seedVerifiedCompanySources();
    assert.ok(seedRes.totalConfigured >= 5);

    const sources = await listJobSources();
    assert.ok(sources.length >= 5);

    const stripe = sources.find((s) => s.companySlug === "stripe");
    assert.ok(stripe);
    assert.equal(stripe.name, "greenhouse");
    assert.equal(stripe.boardIdentifier, "stripe");

    // Second call should not duplicate
    const secondSeed = await seedVerifiedCompanySources();
    assert.equal(secondSeed.sourcesCreated, 0);
  });

  test("Background Scheduler lifecycle and diagnostics function properly", async () => {
    const initialStatus = getSchedulerStatus();
    assert.equal(initialStatus.active, false);

    // Start scheduler with 10 second interval
    startBackgroundScheduler(10000);
    const activeStatus = getSchedulerStatus();
    assert.equal(activeStatus.active, true);
    assert.ok(activeStatus.nextRunAt);

    // Stop scheduler
    stopBackgroundScheduler();
    const stoppedStatus = getSchedulerStatus();
    assert.equal(stoppedStatus.active, false);
    assert.equal(stoppedStatus.nextRunAt, null);
  });

  test("queryJobs supports source filtering while preserving native jobs", async () => {
    const allJobs = await queryJobs();
    assert.ok(Array.isArray(allJobs));
    assert.ok(allJobs.length > 0);

    // Filter by GenZ360 native source
    const nativeJobs = await queryJobs({ source: "genz360" });
    assert.ok(Array.isArray(nativeJobs));
    assert.ok(nativeJobs.length > 0);
    for (const j of nativeJobs) {
      assert.equal(j.source || "genz360", "genz360");
    }

    // Filter by search query
    const queried = await queryJobs({ q: "Engineer" });
    assert.ok(Array.isArray(queried));
  });
});
