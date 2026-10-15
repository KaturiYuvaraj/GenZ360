import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  findOrCreateCompany,
  findOrCreateJobSource,
  listJobSources,
} from "../src/lib/job-ingestion/services/company-service.ts";
import { upsertAggregatedJob } from "../src/lib/job-ingestion/services/job-service.ts";
import { expireUnseenJobs } from "../src/lib/job-ingestion/services/expiration-service.ts";
import { syncCompanySource } from "../src/lib/job-ingestion/services/ingestion-service.ts";
import { BaseConnector } from "../src/lib/job-ingestion/core/source-interface.ts";
import { computeContentHash } from "../src/lib/job-ingestion/core/deduplicator.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

describe("Phase 2: Database Extension Tests", () => {
  test("Migration 0005_job_aggregation.sql exists and contains required fields", () => {
    const sql = readFileSync(join(migrationsDir, "0005_job_aggregation.sql"), "utf8");
    assert.ok(sql.includes("job_sources"));
    assert.ok(sql.includes("source text not null default 'genz360'"));
    assert.ok(sql.includes("source_job_id"));
    assert.ok(sql.includes("source_url"));
    assert.ok(sql.includes("application_url"));
    assert.ok(sql.includes("external_job boolean not null default false"));
    assert.ok(sql.includes("last_seen_at"));
    assert.ok(sql.includes("source_updated_at"));
    assert.ok(sql.includes("ingestion_status"));
    assert.ok(sql.includes("content_hash"));
    assert.ok(sql.includes("jobs_source_idx"));
    assert.ok(sql.includes("jobs_source_job_id_idx"));
  });

  test("PGLite bootstrap applies 0005_job_aggregation.sql successfully", async () => {
    const pg = new PGlite();
    await pg.waitReady;

    const m1 = readFileSync(join(migrationsDir, "0001_auth.sql"), "utf8");
    const m2 = readFileSync(join(migrationsDir, "0002_schema.sql"), "utf8");
    const m3 = readFileSync(join(migrationsDir, "0003_skills_learning.sql"), "utf8");
    const m4 = readFileSync(join(migrationsDir, "0004_core_entities.sql"), "utf8");
    const m5 = readFileSync(join(migrationsDir, "0005_job_aggregation.sql"), "utf8");

    await pg.exec(m1);
    await pg.exec(m2);
    await pg.exec(m3);
    await pg.exec(m4);
    await pg.exec(m5);

    const cols = await pg.query(
      "select column_name from information_schema.columns where table_name = 'jobs'"
    );
    const colNames = cols.rows.map((r) => r.column_name);

    assert.ok(colNames.includes("source"));
    assert.ok(colNames.includes("source_job_id"));
    assert.ok(colNames.includes("application_url"));
    assert.ok(colNames.includes("external_job"));
    assert.ok(colNames.includes("last_seen_at"));
    assert.ok(colNames.includes("ingestion_status"));
    assert.ok(colNames.includes("content_hash"));

    const jsCols = await pg.query(
      "select column_name from information_schema.columns where table_name = 'job_sources'"
    );
    const jsColNames = jsCols.rows.map((r) => r.column_name);
    assert.ok(jsColNames.includes("name"));
    assert.ok(jsColNames.includes("board_identifier"));
    assert.ok(jsColNames.includes("enabled"));
    assert.ok(jsColNames.includes("total_jobs_count"));
  });

  test("Native GenZ360 jobs have source = 'genz360' and external_job = false", async () => {
    const pg = new PGlite();
    await pg.waitReady;
    await pg.exec(readFileSync(join(migrationsDir, "0001_auth.sql"), "utf8"));
    await pg.exec(readFileSync(join(migrationsDir, "0002_schema.sql"), "utf8"));
    await pg.exec(readFileSync(join(migrationsDir, "0003_skills_learning.sql"), "utf8"));
    await pg.exec(readFileSync(join(migrationsDir, "0004_core_entities.sql"), "utf8"));
    await pg.exec(readFileSync(join(migrationsDir, "0005_job_aggregation.sql"), "utf8"));

    await pg.query(
      "insert into jobs (id, company, role, category, skills, location, description) values ($1, $2, $3, $4, $5, $6, $7)",
      ["native_test", "Razorpay", "Frontend Engineer", "Coding", "React", "Bengaluru", "Native job description"]
    );

    const res = await pg.query("select source, external_job, ingestion_status from jobs where id = 'native_test'");
    assert.equal(res.rows[0].source, "genz360");
    assert.equal(res.rows[0].external_job, false);
    assert.equal(res.rows[0].ingestion_status, "active");
  });

  test("Company service resolves without duplicate companies", async () => {
    const c1 = await findOrCreateCompany("Stripe", {
      website: "https://stripe.com",
      atsType: "greenhouse",
      atsIdentifier: "stripe",
    });
    assert.ok(c1.id);
    assert.equal(c1.companyName, "Stripe");

    // Calling again with case variations returns exact same company ID
    const c2 = await findOrCreateCompany("stripe");
    assert.equal(c2.id, c1.id);

    const js = await findOrCreateJobSource({
      companyName: "Stripe",
      companySlug: "stripe",
      source: "greenhouse",
      boardIdentifier: "stripe",
      enabled: true,
    });
    assert.ok(js.id);
    assert.equal(js.boardIdentifier, "stripe");

    const sources = await listJobSources();
    assert.ok(sources.some((s) => s.boardIdentifier === "stripe"));
  });

  test("Job service upserts, deduplicates, and updates properly", async () => {
    const jobSource = await findOrCreateJobSource({
      companyName: "Stripe",
      companySlug: "stripe",
      source: "greenhouse",
      boardIdentifier: "stripe",
      enabled: true,
    });

    const testJob = {
      title: "Backend Engineer, Payments",
      company: "Stripe",
      companySlug: "stripe",
      description: "Build distributed payment ledger systems.",
      location: "Bengaluru, India",
      country: "India",
      city: "Bengaluru",
      remoteType: "hybrid",
      remote: false,
      employmentType: "full_time",
      experienceLevel: "mid",
      salary: 28.0,
      salaryMin: 25.0,
      salaryMax: 32.0,
      currency: "INR",
      skills: ["Java", "SQL", "Distributed Systems"],
      department: "Payments",
      postedAt: new Date().toISOString(),
      updatedAt: null,
      applicationUrl: "https://boards.greenhouse.io/stripe/jobs/998877",
      source: "greenhouse",
      sourceJobId: "gh_998877",
      sourceUrl: "https://stripe.com/jobs/998877",
      contentHash: computeContentHash("Backend Engineer, Payments", "Build distributed payment ledger systems."),
    };

    // 1. Initial insert
    const insertRes = await upsertAggregatedJob(testJob, jobSource.companyId, jobSource.id);
    assert.equal(insertRes.action, "inserted");
    assert.ok(insertRes.id);

    // 2. Re-sync identical job -> should be skipped (content hash unchanged)
    const skipRes = await upsertAggregatedJob(testJob, jobSource.companyId, jobSource.id);
    assert.equal(skipRes.action, "skipped");
    assert.equal(skipRes.id, insertRes.id);

    // 3. Re-sync modified job -> should be updated
    const modifiedJob = {
      ...testJob,
      description: "Updated description with new team details.",
      contentHash: computeContentHash("Backend Engineer, Payments", "Updated description with new team details."),
    };
    const updateRes = await upsertAggregatedJob(modifiedJob, jobSource.companyId, jobSource.id);
    assert.equal(updateRes.action, "updated");
    assert.equal(updateRes.id, insertRes.id);
  });

  test("Expiration service marks missing jobs as expired without deletion", async () => {
    const js = await findOrCreateJobSource({
      companyName: "Expiration Test Co",
      companySlug: "expiration-test-co",
      source: "greenhouse",
      boardIdentifier: "exp-test",
      enabled: true,
    });

    const oldJob = {
      title: "Old Role",
      company: "Expiration Test Co",
      description: "Old description",
      location: "Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: "onsite",
      remote: false,
      employmentType: "full_time",
      experienceLevel: "mid",
      salary: null,
      salaryMin: null,
      salaryMax: null,
      currency: null,
      skills: ["React"],
      department: null,
      postedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: null,
      applicationUrl: "https://example.com/job/old",
      source: "greenhouse",
      sourceJobId: "gh_old_1",
      contentHash: "hash_old_1",
    };

    await upsertAggregatedJob(oldJob, js.companyId, js.id);

    // Run expiration with sync start time set in the future
    const futureTime = new Date(Date.now() + 1000).toISOString();
    const expireRes = await expireUnseenJobs(js.id, futureTime);
    assert.ok(expireRes.expiredCount >= 1);
  });

  test("End-to-end syncCompanySource pipeline succeeds and collects telemetry", async () => {
    class MockGreenhouseConnector extends BaseConnector {
      getSourceName() {
        return "greenhouse";
      }
      getSourceJobId(raw) {
        return raw.id;
      }
      async fetchJobs() {
        return [
          { id: "e2e_1", title: "Site Reliability Engineer", location: "Bengaluru" },
          { id: "e2e_2", title: "Security Analyst", location: "Remote" },
        ];
      }
      normalizeJob(raw, config) {
        return {
          title: raw.title,
          company: config.companyName,
          companySlug: config.companySlug,
          description: `Full job description for ${raw.title}.`,
          location: raw.location,
          country: "India",
          city: raw.location.includes("Remote") ? null : raw.location,
          remoteType: raw.location.includes("Remote") ? "remote" : "onsite",
          remote: raw.location.includes("Remote"),
          employmentType: "full_time",
          experienceLevel: "mid",
          salary: null,
          salaryMin: null,
          salaryMax: null,
          currency: null,
          skills: ["Linux", "Cloud"],
          department: "Infrastructure",
          postedAt: new Date().toISOString(),
          updatedAt: null,
          applicationUrl: `https://example.com/jobs/${raw.id}`,
          source: "greenhouse",
          sourceJobId: raw.id,
          contentHash: computeContentHash(raw.title, `Full job description for ${raw.title}.`),
        };
      }
    }

    const connector = new MockGreenhouseConnector();
    const syncRes = await syncCompanySource(connector, {
      companyName: "Acme Cloud",
      companySlug: "acme-cloud",
      source: "greenhouse",
      boardIdentifier: "acmecloud",
      enabled: true,
    });

    assert.equal(syncRes.source, "greenhouse");
    assert.equal(syncRes.totalFetched, 2);
    assert.equal(syncRes.newCount, 2);
    assert.equal(syncRes.errorCount, 0);
    assert.ok(syncRes.durationMs >= 0);
  });
});
