import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { AshbyConnector } from "../src/lib/job-ingestion/connectors/ashby.ts";
import { getConnector, getAvailableSources } from "../src/lib/job-ingestion/connectors/registry.ts";
import { syncCompanySource } from "../src/lib/job-ingestion/services/ingestion-service.ts";

describe("Phase 7: Ashby Connector Tests", () => {
  const connector = new AshbyConnector();

  test("Ashby connector is registered in registry", () => {
    assert.equal(connector.getSourceName(), "ashby");
    const registered = getConnector("ashby");
    assert.ok(registered);
    assert.equal(registered.getSourceName(), "ashby");
    assert.ok(getAvailableSources().includes("ashby"));
  });

  test("Normalizes official Ashby Job Board API payload format", () => {
    const rawJob = {
      id: "a9103c84-18be-405e-85a7-96a836da10c8",
      title: "Senior Product Engineer - AI Systems",
      department: "Engineering",
      team: "Intelligence",
      location: "Bengaluru, India",
      employmentType: "FullTime",
      isRemote: false,
      publishedAt: "2026-03-20T09:00:00.000Z",
      descriptionPlain: "Build foundational LLM tools, agent workflows, and reactive frontend experiences using React, TypeScript, Python, and FastAPI.",
      descriptionHtml: "<p>Build foundational LLM tools, agent workflows, and reactive frontend experiences using React, TypeScript, Python, and FastAPI.</p>",
      jobUrl: "https://jobs.ashbyhq.com/openai/a9103c84-18be-405e-85a7-96a836da10c8",
      applyUrl: "https://jobs.ashbyhq.com/openai/a9103c84-18be-405e-85a7-96a836da10c8/application",
      compensation: {
        compensationTierSummary: "35 - 45 LPA base salary + equity",
      },
      secondaryLocations: [
        { location: "Remote - India" },
      ],
    };

    const config = {
      companyName: "OpenAI",
      companySlug: "openai",
      source: "ashby",
      boardIdentifier: "openai",
      enabled: true,
    };

    const normalized = connector.normalizeJob(rawJob, config);

    assert.equal(normalized.title, "Senior Product Engineer - AI Systems");
    assert.equal(normalized.company, "OpenAI");
    assert.equal(normalized.companySlug, "openai");
    assert.equal(normalized.source, "ashby");
    assert.equal(normalized.sourceJobId, "a9103c84-18be-405e-85a7-96a836da10c8");
    assert.equal(normalized.location, "Bengaluru, India");
    assert.equal(normalized.city, "Bengaluru");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.remote, false);
    assert.equal(normalized.employmentType, "full_time");
    assert.equal(normalized.experienceLevel, "senior");
    assert.equal(normalized.department, "Engineering");
    assert.equal(normalized.applicationUrl, "https://jobs.ashbyhq.com/openai/a9103c84-18be-405e-85a7-96a836da10c8/application");
    assert.equal(normalized.salary, 40); // (35 + 45) / 2
    assert.equal(normalized.currency, "INR");

    // Skills extraction
    assert.ok(normalized.skills.includes("React"));
    assert.ok(normalized.skills.includes("TypeScript"));
    assert.ok(normalized.skills.includes("Python"));
    assert.ok(normalized.skills.includes("FastAPI"));
    assert.ok(normalized.skills.includes("LLM"));

    // Validation passes
    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Handles remote Ashby posting with HTML description and fallback applyUrl", () => {
    const remoteJob = {
      id: "ash_remote_99",
      title: "Junior QA Engineer",
      isRemote: true,
      employmentType: "Internship",
      descriptionHtml: "<div>Automated testing for web platform using Playwright and Jest.</div>",
      jobUrl: "https://jobs.ashbyhq.com/linear/ash_remote_99",
    };

    const config = {
      companyName: "Linear",
      companySlug: "linear",
      source: "ashby",
      boardIdentifier: "linear",
      enabled: true,
    };

    const normalized = connector.normalizeJob(remoteJob, config);
    assert.equal(normalized.title, "Junior QA Engineer");
    assert.equal(normalized.remote, true);
    assert.equal(normalized.remoteType, "remote");
    assert.equal(normalized.employmentType, "internship");
    assert.equal(normalized.experienceLevel, "entry");
    assert.equal(normalized.applicationUrl, "https://jobs.ashbyhq.com/linear/ash_remote_99");
    assert.equal(normalized.salary, null); // never fabricated
    assert.ok(normalized.skills.includes("Playwright"));
    assert.ok(normalized.skills.includes("Jest"));

    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Ashby mock sync pass executes through pipeline successfully", async () => {
    class MockAshbyBoardConnector extends AshbyConnector {
      async fetchJobs() {
        return [
          {
            id: "ash_1",
            title: "Frontend Architect",
            location: "Bengaluru",
            isRemote: false,
            employmentType: "FullTime",
            descriptionPlain: "Build modern web interfaces with Next.js and TypeScript",
            jobUrl: "https://jobs.ashbyhq.com/test/ash_1",
          },
          {
            id: "ash_2",
            title: "Staff Security Specialist",
            location: "Remote",
            isRemote: true,
            employmentType: "FullTime",
            descriptionPlain: "Cloud security and compliance on AWS",
            jobUrl: "https://jobs.ashbyhq.com/test/ash_2",
          },
        ];
      }
    }

    const mockConnector = new MockAshbyBoardConnector();
    const config = {
      companyName: "Ashby Test Co",
      companySlug: "ashby-test-co",
      source: "ashby",
      boardIdentifier: "ashbytest",
      enabled: true,
    };

    const syncRes = await syncCompanySource(mockConnector, config);
    assert.equal(syncRes.source, "ashby");
    assert.equal(syncRes.company, "Ashby Test Co");
    assert.equal(syncRes.totalFetched, 2);
    assert.equal(syncRes.newCount, 2);
    assert.equal(syncRes.errorCount, 0);
  });

  test("Sync failure isolation: handles 404 or bad response gracefully", async () => {
    class FailingAshbyConnector extends AshbyConnector {
      async fetchJobs() {
        throw new Error("[Ashby] Invalid response payload — expected a jobs array");
      }
    }

    const failingConnector = new FailingAshbyConnector();
    const config = {
      companyName: "Bad Ashby Co",
      companySlug: "bad-ashby-co",
      source: "ashby",
      boardIdentifier: "invalidboard",
      enabled: true,
    };

    const syncRes = await syncCompanySource(failingConnector, config);
    assert.equal(syncRes.errorCount, 1);
    assert.ok(syncRes.errors[0].includes("expected a jobs array"));
    assert.equal(syncRes.totalFetched, 0);
  });
});
