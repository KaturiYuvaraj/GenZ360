import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { GreenhouseConnector } from "../src/lib/job-ingestion/connectors/greenhouse.ts";
import { getConnector, getAvailableSources } from "../src/lib/job-ingestion/connectors/registry.ts";
import { syncCompanySource } from "../src/lib/job-ingestion/services/ingestion-service.ts";

describe("Phase 5: Greenhouse Connector Tests", () => {
  const connector = new GreenhouseConnector();

  test("Greenhouse connector is registered in registry", () => {
    assert.equal(connector.getSourceName(), "greenhouse");
    const registered = getConnector("greenhouse");
    assert.ok(registered);
    assert.equal(registered.getSourceName(), "greenhouse");
    assert.ok(getAvailableSources().includes("greenhouse"));
  });

  test("Normalizes real-world Greenhouse API payload format", () => {
    const rawJob = {
      id: 4892182003,
      title: "Senior Full Stack Engineer - Growth",
      updated_at: "2026-03-15T10:45:00Z",
      requisition_id: "REQ-901",
      absolute_url: "https://boards.greenhouse.io/stripe/jobs/4892182003",
      location: {
        name: "Bengaluru, Karnataka, India",
      },
      departments: [
        { id: 101, name: "Engineering" },
      ],
      offices: [
        { id: 201, name: "Bengaluru Office", location: "Bengaluru, India" },
      ],
      content: `
        <h2>About the Role</h2>
        <p>We are seeking a <strong>Senior Full Stack Engineer</strong> to build merchant onboarding experiences.</p>
        <h3>Requirements</h3>
        <ul>
          <li>Experience with React, TypeScript, Node.js, and SQL</li>
          <li>Strong background in distributed cloud systems (AWS/GCP)</li>
        </ul>
        <p>Compensation: 32 - 38 LPA based on experience.</p>
      `,
    };

    const config = {
      companyName: "Stripe",
      companySlug: "stripe",
      source: "greenhouse",
      boardIdentifier: "stripe",
      enabled: true,
    };

    const normalized = connector.normalizeJob(rawJob, config);

    assert.equal(normalized.title, "Senior Full Stack Engineer - Growth");
    assert.equal(normalized.company, "Stripe");
    assert.equal(normalized.companySlug, "stripe");
    assert.equal(normalized.source, "greenhouse");
    assert.equal(normalized.sourceJobId, "4892182003");
    assert.equal(normalized.location, "Bengaluru, Karnataka, India");
    assert.equal(normalized.city, "Bengaluru");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.remote, false);
    assert.equal(normalized.experienceLevel, "senior");
    assert.equal(normalized.employmentType, "full_time");
    assert.equal(normalized.department, "Engineering");
    assert.equal(normalized.applicationUrl, "https://boards.greenhouse.io/stripe/jobs/4892182003");
    assert.equal(normalized.salary, 35); // (32 + 38) / 2
    assert.equal(normalized.currency, "INR");

    // Skills extraction verification
    assert.ok(normalized.skills.includes("React"));
    assert.ok(normalized.skills.includes("TypeScript"));
    assert.ok(normalized.skills.includes("Node.js"));
    assert.ok(normalized.skills.includes("SQL"));

    // Description cleaned
    assert.ok(!normalized.description.includes("<p>"));
    assert.ok(!normalized.description.includes("<h2>"));
    assert.ok(normalized.description.includes("About the Role"));

    // Validation passes
    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Handles minimal Greenhouse payload without content gracefully", () => {
    const minimalJob = {
      id: 550011,
      title: "Product Designer",
      absolute_url: "https://boards.greenhouse.io/figma/jobs/550011",
      location: {
        name: "Remote",
      },
    };

    const config = {
      companyName: "Figma",
      companySlug: "figma",
      source: "greenhouse",
      boardIdentifier: "figma",
      enabled: true,
    };

    const normalized = connector.normalizeJob(minimalJob, config);
    assert.equal(normalized.title, "Product Designer");
    assert.equal(normalized.remote, true);
    assert.equal(normalized.salary, null); // never fabricated
    assert.ok(normalized.contentHash);

    const validation = connector.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Greenhouse mock sync pass executes without crashing", async () => {
    class MockGreenhouseBoardConnector extends GreenhouseConnector {
      async fetchJobs() {
        return [
          {
            id: 1001,
            title: "Frontend Engineer",
            absolute_url: "https://boards.greenhouse.io/test/jobs/1001",
            location: { name: "Bengaluru" },
            content: "<p>React developer needed</p>",
          },
          {
            id: 1002,
            title: "DevOps Engineer",
            absolute_url: "https://boards.greenhouse.io/test/jobs/1002",
            location: { name: "Remote" },
            content: "<p>AWS and Kubernetes expert</p>",
          },
        ];
      }
    }

    const mockConnector = new MockGreenhouseBoardConnector();
    const config = {
      companyName: "Test Co",
      companySlug: "test-co",
      source: "greenhouse",
      boardIdentifier: "testco",
      enabled: true,
    };

    const syncRes = await syncCompanySource(mockConnector, config);
    assert.equal(syncRes.source, "greenhouse");
    assert.equal(syncRes.company, "Test Co");
    assert.equal(syncRes.totalFetched, 2);
    assert.equal(syncRes.newCount, 2);
    assert.equal(syncRes.errorCount, 0);
  });

  test("Sync failure isolation: bad board does not throw uncaught error", async () => {
    class FailingGreenhouseConnector extends GreenhouseConnector {
      async fetchJobs() {
        throw new Error("HTTP 404: Not Found from Greenhouse API");
      }
    }

    const failingConnector = new FailingGreenhouseConnector();
    const config = {
      companyName: "Nonexistent Co",
      companySlug: "nonexistent-co",
      source: "greenhouse",
      boardIdentifier: "nonexistent-board-12345",
      enabled: true,
    };

    // Must return result with error captured, not throw
    const syncRes = await syncCompanySource(failingConnector, config);
    assert.equal(syncRes.errorCount, 1);
    assert.ok(syncRes.errors[0].includes("HTTP 404"));
    assert.equal(syncRes.totalFetched, 0);
  });
});
