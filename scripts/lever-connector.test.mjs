import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { LeverConnector } from "../src/lib/job-ingestion/connectors/lever.ts";
import { getConnector, getAvailableSources } from "../src/lib/job-ingestion/connectors/registry.ts";
import { syncCompanySource } from "../src/lib/job-ingestion/services/ingestion-service.ts";

describe("Phase 6: Lever Connector Tests", () => {
  const connector = new LeverConnector();

  test("Lever connector is registered in registry", () => {
    assert.equal(connector.getSourceName(), "lever");
    const registered = getConnector("lever");
    assert.ok(registered);
    assert.equal(registered.getSourceName(), "lever");
    assert.ok(getAvailableSources().includes("lever"));
  });

  test("Normalizes realistic Lever Postings API payload format", () => {
    const rawPosting = {
      id: "7b89d421-a3f2-4e09-9b6e-f14d89a71234",
      text: "Lead Backend Architect",
      createdAt: 1710500000000,
      updatedAt: 1710586400000,
      categories: {
        commitment: "Full time",
        department: "Core Engineering",
        team: "Platform",
        location: "Hyderabad, India",
        workplaceType: "hybrid",
      },
      description: "<p>We are seeking a Lead Backend Architect to scale our event streaming pipelines.</p>",
      descriptionPlain: "We are seeking a Lead Backend Architect to scale our event streaming pipelines.",
      lists: [
        {
          text: "What you will do",
          content: "<ul><li>Design distributed systems in Go, Python, and Kafka</li><li>Manage PostgreSQL and Redis caching tiers</li></ul>",
        },
        {
          text: "Qualifications",
          content: "<ul><li>6+ years building high-throughput systems on AWS</li><li>Strong grasp of microservices architectures</li></ul>",
        },
      ],
      additional: "<p>Package: 45 - 55 LPA with equity and comprehensive health coverage.</p>",
      additionalPlain: "Package: 45 - 55 LPA with equity and comprehensive health coverage.",
      hostedUrl: "https://jobs.lever.co/netflix/7b89d421-a3f2-4e09-9b6e-f14d89a71234",
      applyUrl: "https://jobs.lever.co/netflix/7b89d421-a3f2-4e09-9b6e-f14d89a71234/apply",
    };

    const config = {
      companyName: "Netflix",
      companySlug: "netflix",
      source: "lever",
      boardIdentifier: "netflix",
      enabled: true,
    };

    const normalized = connector.normalizeJob(rawPosting, config);

    assert.equal(normalized.title, "Lead Backend Architect");
    assert.equal(normalized.company, "Netflix");
    assert.equal(normalized.companySlug, "netflix");
    assert.equal(normalized.source, "lever");
    assert.equal(normalized.sourceJobId, "7b89d421-a3f2-4e09-9b6e-f14d89a71234");
    assert.equal(normalized.location, "Hyderabad, India");
    assert.equal(normalized.city, "Hyderabad");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.remoteType, "hybrid");
    assert.equal(normalized.remote, false);
    assert.equal(normalized.experienceLevel, "lead");
    assert.equal(normalized.employmentType, "full_time");
    assert.equal(normalized.department, "Core Engineering");
    assert.equal(normalized.applicationUrl, "https://jobs.lever.co/netflix/7b89d421-a3f2-4e09-9b6e-f14d89a71234/apply");
    assert.equal(normalized.salary, 50); // (45 + 55) / 2
    assert.equal(normalized.currency, "INR");

    // Skills extraction from multi-section lists
    assert.ok(normalized.skills.includes("Go"));
    assert.ok(normalized.skills.includes("Python"));
    assert.ok(normalized.skills.includes("Kafka"));
    assert.ok(normalized.skills.includes("PostgreSQL"));
    assert.ok(normalized.skills.includes("Redis"));
    assert.ok(normalized.skills.includes("AWS"));

    // Description includes lists
    assert.ok(normalized.description.includes("What you will do:"));
    assert.ok(normalized.description.includes("Qualifications:"));
    assert.ok(!normalized.description.includes("<ul>"));

    // Validation passes
    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Handles remote Lever posting with applyUrl fallback to hostedUrl", () => {
    const remotePosting = {
      id: "9900aa-11bb",
      text: "Junior Data Analyst",
      categories: {
        commitment: "Internship",
        location: "Remote - Anywhere",
        workplaceType: "remote",
      },
      descriptionPlain: "Analyze campus engagement metrics using Python and SQL.",
      hostedUrl: "https://jobs.lever.co/spotify/9900aa-11bb",
    };

    const config = {
      companyName: "Spotify",
      companySlug: "spotify",
      source: "lever",
      boardIdentifier: "spotify",
      enabled: true,
    };

    const normalized = connector.normalizeJob(remotePosting, config);
    assert.equal(normalized.title, "Junior Data Analyst");
    assert.equal(normalized.remote, true);
    assert.equal(normalized.remoteType, "remote");
    assert.equal(normalized.employmentType, "internship");
    assert.equal(normalized.experienceLevel, "entry");
    assert.equal(normalized.applicationUrl, "https://jobs.lever.co/spotify/9900aa-11bb"); // fallback to hostedUrl
    assert.equal(normalized.salary, null); // never fabricated

    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Lever mock sync pass executes through pipeline successfully", async () => {
    class MockLeverBoardConnector extends LeverConnector {
      async fetchJobs() {
        return [
          {
            id: "lev_1",
            text: "Frontend Developer",
            categories: { location: "Bengaluru", commitment: "Full time" },
            descriptionPlain: "Build React dashboards",
            hostedUrl: "https://jobs.lever.co/test/lev_1",
          },
          {
            id: "lev_2",
            text: "Mobile App Engineer",
            categories: { location: "Remote", commitment: "Full time" },
            descriptionPlain: "Build iOS and Android client",
            hostedUrl: "https://jobs.lever.co/test/lev_2",
          },
        ];
      }
    }

    const mockConnector = new MockLeverBoardConnector();
    const config = {
      companyName: "Lever Test Inc",
      companySlug: "lever-test-inc",
      source: "lever",
      boardIdentifier: "levertest",
      enabled: true,
    };

    const syncRes = await syncCompanySource(mockConnector, config);
    assert.equal(syncRes.source, "lever");
    assert.equal(syncRes.company, "Lever Test Inc");
    assert.equal(syncRes.totalFetched, 2);
    assert.equal(syncRes.newCount, 2);
    assert.equal(syncRes.errorCount, 0);
  });

  test("Sync failure isolation: handles 404 or non-array response without uncaught crash", async () => {
    class MalformedLeverConnector extends LeverConnector {
      async fetchJobs() {
        throw new Error("[Lever] Invalid response format from API — expected an array of postings");
      }
    }

    const malformedConnector = new MalformedLeverConnector();
    const config = {
      companyName: "Bad Lever Co",
      companySlug: "bad-lever-co",
      source: "lever",
      boardIdentifier: "badboard",
      enabled: true,
    };

    const syncRes = await syncCompanySource(malformedConnector, config);
    assert.equal(syncRes.errorCount, 1);
    assert.ok(syncRes.errors[0].includes("expected an array"));
    assert.equal(syncRes.totalFetched, 0);
  });
});
