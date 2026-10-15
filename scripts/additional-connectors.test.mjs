import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { WorkableConnector } from "../src/lib/job-ingestion/connectors/workable.ts";
import { SmartRecruitersConnector } from "../src/lib/job-ingestion/connectors/smartrecruiters.ts";
import { getConnector, getAvailableSources } from "../src/lib/job-ingestion/connectors/registry.ts";
import { syncCompanySource } from "../src/lib/job-ingestion/services/ingestion-service.ts";

describe("Phase 8: Additional ATS Connectors (Workable & SmartRecruiters) Tests", () => {
  const workable = new WorkableConnector();
  const smartrecruiters = new SmartRecruitersConnector();

  test("Workable and SmartRecruiters are registered in connector registry", () => {
    assert.equal(workable.getSourceName(), "workable");
    assert.equal(smartrecruiters.getSourceName(), "smartrecruiters");

    const regWorkable = getConnector("workable");
    assert.ok(regWorkable);
    assert.equal(regWorkable.getSourceName(), "workable");

    const regSmart = getConnector("smartrecruiters");
    assert.ok(regSmart);
    assert.equal(regSmart.getSourceName(), "smartrecruiters");

    const sources = getAvailableSources();
    assert.ok(sources.includes("workable"));
    assert.ok(sources.includes("smartrecruiters"));
  });

  test("Normalizes official Workable job format", () => {
    const rawJob = {
      shortcode: "WKB-101",
      title: "Senior Fullstack Engineer (React / Node.js)",
      department: "Engineering",
      location: {
        city: "Hyderabad",
        region: "Telangana",
        country: "India",
        telecommuting: true,
      },
      employment_type: "Full-time",
      experience: "Senior",
      description: "<p>We are seeking a senior engineer to design high-scale services using Node.js, React, Docker, and PostgreSQL.</p>",
      requirements: "<p>5+ years experience with TypeScript and cloud architectures.</p>",
      benefits: "<p>Comprehensive health insurance and learning budget.</p>",
      salary: {
        from: 25,
        to: 35,
        currency: "INR",
      },
      application_url: "https://apply.workable.com/techcorp/j/WKB-101/apply/",
    };

    const config = {
      companyName: "TechCorp",
      companySlug: "techcorp",
      source: "workable",
      boardIdentifier: "techcorp",
      enabled: true,
    };

    const normalized = workable.normalizeJob(rawJob, config);

    assert.equal(normalized.title, "Senior Fullstack Engineer (React / Node.js)");
    assert.equal(normalized.company, "TechCorp");
    assert.equal(normalized.source, "workable");
    assert.equal(normalized.sourceJobId, "WKB-101");
    assert.equal(normalized.city, "Hyderabad");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.remote, true);
    assert.equal(normalized.remoteType, "remote");
    assert.equal(normalized.employmentType, "full_time");
    assert.equal(normalized.experienceLevel, "senior");
    assert.equal(normalized.department, "Engineering");
    assert.equal(normalized.salary, 35);
    assert.equal(normalized.currency, "INR");
    assert.equal(normalized.applicationUrl, "https://apply.workable.com/techcorp/j/WKB-101/apply/");

    // Check skill extraction
    assert.ok(normalized.skills.includes("React"));
    assert.ok(normalized.skills.includes("Node.js"));
    assert.ok(normalized.skills.includes("Docker"));
    assert.ok(normalized.skills.includes("PostgreSQL"));

    const validation = workable.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Normalizes official SmartRecruiters posting format", () => {
    const rawPosting = {
      id: "743999123456",
      name: "Lead Cloud Infrastructure Architect",
      company: {
        identifier: "globalscale",
        name: "GlobalScale Inc",
      },
      releasedDate: "2026-04-10T11:00:00.000Z",
      location: {
        city: "Bengaluru",
        region: "Karnataka",
        country: "India",
        remote: false,
      },
      department: {
        id: "dept-infra",
        label: "Platform Infrastructure",
      },
      typeOfEmployment: {
        id: "permanent",
        label: "Full-Time",
      },
      experienceLevel: {
        id: "lead",
        label: "Lead",
      },
      jobAd: {
        sections: {
          jobDescription: {
            text: "Design Kubernetes clusters and Terraform modules for multi-region systems on AWS and GCP.",
          },
          qualifications: {
            text: "Strong background in Kubernetes, Terraform, Go, and CI/CD pipelines.",
          },
          additionalInformation: {
            text: "Attractive compensation and flexible work hours.",
          },
        },
      },
      compensation: {
        min: 45,
        max: 60,
        currency: "INR",
      },
      ref: "https://jobs.smartrecruiters.com/globalscale/743999123456-lead-cloud-infrastructure-architect",
    };

    const config = {
      companyName: "GlobalScale Inc",
      companySlug: "globalscale-inc",
      source: "smartrecruiters",
      boardIdentifier: "globalscale",
      enabled: true,
    };

    const normalized = smartrecruiters.normalizeJob(rawPosting, config);

    assert.equal(normalized.title, "Lead Cloud Infrastructure Architect");
    assert.equal(normalized.company, "GlobalScale Inc");
    assert.equal(normalized.source, "smartrecruiters");
    assert.equal(normalized.sourceJobId, "743999123456");
    assert.equal(normalized.city, "Bengaluru");
    assert.equal(normalized.country, "India");
    assert.equal(normalized.remote, false);
    assert.equal(normalized.employmentType, "full_time");
    assert.equal(normalized.experienceLevel, "lead");
    assert.equal(normalized.department, "Platform Infrastructure");
    assert.equal(normalized.salary, 60);
    assert.equal(normalized.currency, "INR");
    assert.equal(
      normalized.applicationUrl,
      "https://jobs.smartrecruiters.com/globalscale/743999123456-lead-cloud-infrastructure-architect",
    );

    // Skill extraction
    assert.ok(normalized.skills.includes("Kubernetes"));
    assert.ok(normalized.skills.includes("Terraform"));
    assert.ok(normalized.skills.includes("AWS"));
    assert.ok(normalized.skills.includes("GCP"));

    const validation = smartrecruiters.validateJob(normalized);
    assert.equal(validation.valid, true);
  });

  test("Executes mock sync pass through Workable and SmartRecruiters pipelines", async () => {
    class MockWorkableConnector extends WorkableConnector {
      async fetchJobs() {
        return [
          {
            shortcode: "wkb_mock_1",
            title: "Data Analyst",
            location: { city: "Mumbai", country: "India" },
            employment_type: "Full-time",
            description: "Analyze user behaviors with SQL and Tableau",
            url: "https://apply.workable.com/test/j/wkb_mock_1/",
          },
        ];
      }
    }

    class MockSmartRecruitersConnector extends SmartRecruitersConnector {
      async fetchJobs() {
        return [
          {
            id: "smart_mock_1",
            name: "Backend Developer",
            location: { city: "Pune", country: "India", remote: true },
            typeOfEmployment: { label: "Contract" },
            jobAd: {
              sections: {
                jobDescription: { text: "Develop APIs with Python and PostgreSQL" },
              },
            },
            ref: "https://jobs.smartrecruiters.com/test/smart_mock_1",
          },
        ];
      }
    }

    const mockWkb = new MockWorkableConnector();
    const wkbConfig = {
      companyName: "Workable Test Co",
      companySlug: "workable-test-co",
      source: "workable",
      boardIdentifier: "workabletest",
      enabled: true,
    };

    const wkbResult = await syncCompanySource(mockWkb, wkbConfig);
    assert.equal(wkbResult.source, "workable");
    assert.equal(wkbResult.totalFetched, 1);
    assert.equal(wkbResult.newCount, 1);
    assert.equal(wkbResult.errorCount, 0);

    const mockSmr = new MockSmartRecruitersConnector();
    const smrConfig = {
      companyName: "Smart Test Co",
      companySlug: "smart-test-co",
      source: "smartrecruiters",
      boardIdentifier: "smarttest",
      enabled: true,
    };

    const smrResult = await syncCompanySource(mockSmr, smrConfig);
    assert.equal(smrResult.source, "smartrecruiters");
    assert.equal(smrResult.totalFetched, 1);
    assert.equal(smrResult.newCount, 1);
    assert.equal(smrResult.errorCount, 0);
  });

  test("Per-source error isolation for Workable and SmartRecruiters", async () => {
    class FailingConnector extends WorkableConnector {
      async fetchJobs() {
        throw new Error("HTTP 404: Account not found on Workable");
      }
    }

    const failing = new FailingConnector();
    const config = {
      companyName: "Nonexistent Co",
      companySlug: "nonexistent-co",
      source: "workable",
      boardIdentifier: "doesnotexist404",
      enabled: true,
    };

    const res = await syncCompanySource(failing, config);
    assert.equal(res.errorCount, 1);
    assert.ok(res.errors[0].includes("Account not found"));
    assert.equal(res.totalFetched, 0);
  });
});
