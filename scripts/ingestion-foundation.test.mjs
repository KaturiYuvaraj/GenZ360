import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  cleanHtml,
  normalizeLocation,
  normalizeRemoteType,
  normalizeEmploymentType,
  normalizeExperienceLevel,
  normalizeSalary,
  extractSkills,
} from "../src/lib/job-ingestion/core/normalizer.ts";
import { validateNormalizedJob } from "../src/lib/job-ingestion/core/validator.ts";
import {
  buildPrimaryJobKey,
  buildJobFingerprint,
  computeContentHash,
  evaluateDeduplication,
} from "../src/lib/job-ingestion/core/deduplicator.ts";
import { BaseConnector } from "../src/lib/job-ingestion/core/source-interface.ts";

describe("Phase 1: Job Ingestion Foundation Tests", () => {
  describe("Normalizer", () => {
    test("cleanHtml strips dangerous tags and converts formatting cleanly", () => {
      const dirty = `<script>alert('xss')</script><h3>Software Engineer</h3><p>We need a <b>React</b> dev.<br/>Apply now &amp; grow!</p>`;
      const cleaned = cleanHtml(dirty);
      assert.ok(!cleaned.includes("<script>"));
      assert.ok(!cleaned.includes("alert"));
      assert.ok(cleaned.includes("Software Engineer"));
      assert.ok(cleaned.includes("We need a React dev."));
      assert.ok(cleaned.includes("Apply now & grow!"));
    });

    test("normalizeLocation detects Indian cities and remote flags", () => {
      const r1 = normalizeLocation("Bengaluru, Karnataka, India");
      assert.equal(r1.city, "Bengaluru");
      assert.equal(r1.country, "India");
      assert.equal(r1.isRemote, false);

      const r2 = normalizeLocation("Remote - India");
      assert.equal(r2.country, "India");
      assert.equal(r2.isRemote, true);

      const r3 = normalizeLocation("Hyderabad, Telangana");
      assert.equal(r3.city, "Hyderabad");
    });

    test("normalizeRemoteType accurately distinguishes remote, hybrid, and onsite", () => {
      assert.equal(normalizeRemoteType("Bengaluru", "Remote Backend Engineer"), "remote");
      assert.equal(normalizeRemoteType("Hyderabad", "Software Engineer", "Hybrid"), "hybrid");
      assert.equal(normalizeRemoteType("Mumbai Office", "Data Analyst"), "onsite");
    });

    test("normalizeEmploymentType maps variations to canonical types", () => {
      assert.equal(normalizeEmploymentType("Summer Intern 2026"), "internship");
      assert.equal(normalizeEmploymentType("Contractor - 6 months"), "contract");
      assert.equal(normalizeEmploymentType("Part-time Support"), "part_time");
      assert.equal(normalizeEmploymentType("Regular Employee"), "full_time");
    });

    test("normalizeExperienceLevel categorizes seniority without assumptions", () => {
      assert.equal(normalizeExperienceLevel("Junior Frontend Engineer"), "entry");
      assert.equal(normalizeExperienceLevel("Senior Backend Engineer"), "senior");
      assert.equal(normalizeExperienceLevel("Principal Software Architect"), "lead");
      assert.equal(normalizeExperienceLevel("VP of Engineering"), "executive");
      assert.equal(normalizeExperienceLevel("Software Engineer"), "mid");
    });

    test("normalizeSalary never invents missing salary", () => {
      const empty = normalizeSalary(null);
      assert.equal(empty.salary, null);
      assert.equal(empty.currency, null);

      const lpa = normalizeSalary("12 - 18 LPA");
      assert.equal(lpa.salary, 15);
      assert.equal(lpa.min, 12);
      assert.equal(lpa.max, 18);
      assert.equal(lpa.currency, "INR");

      const single = normalizeSalary("24 LPA");
      assert.equal(single.salary, 24);
      assert.equal(single.currency, "INR");
    });

    test("extractSkills extracts explicit mentions without fabrication", () => {
      const desc = "We are seeking a developer with hands-on experience in React, TypeScript, and PostgreSQL on AWS.";
      const skills = extractSkills(desc);
      assert.ok(skills.includes("React"));
      assert.ok(skills.includes("TypeScript"));
      assert.ok(skills.includes("PostgreSQL"));
      assert.ok(skills.includes("AWS"));
      assert.ok(!skills.includes("Ruby")); // Not in text
    });
  });

  describe("Validator", () => {
    test("validates a compliant NormalizedJob", () => {
      const validJob = {
        title: "Software Engineer",
        company: "Stripe",
        companySlug: "stripe",
        description: "Build payment infrastructure used by millions of businesses.",
        location: "Bengaluru, India",
        country: "India",
        city: "Bengaluru",
        remoteType: "hybrid",
        remote: false,
        employmentType: "full_time",
        experienceLevel: "mid",
        salary: 22.0,
        salaryMin: 20.0,
        salaryMax: 24.0,
        currency: "INR",
        skills: ["React", "TypeScript", "Node.js"],
        department: "Core Engineering",
        postedAt: new Date().toISOString(),
        updatedAt: null,
        applicationUrl: "https://boards.greenhouse.io/stripe/jobs/123456",
        source: "greenhouse",
        sourceJobId: "gh_123456",
        sourceUrl: "https://stripe.com/jobs/123456",
        contentHash: computeContentHash("Software Engineer", "Build payment infrastructure"),
      };

      const result = validateNormalizedJob(validJob);
      assert.equal(result.valid, true);
      assert.equal(result.errors, undefined);
    });

    test("rejects jobs with invalid URLs or missing required fields", () => {
      const badJob = {
        title: "X", // Too short
        company: "", // Empty
        description: "short", // Under 10 chars
        location: "Bengaluru",
        country: "India",
        city: "Bengaluru",
        remoteType: "onsite",
        remote: false,
        employmentType: "full_time",
        experienceLevel: "entry",
        salary: null,
        salaryMin: null,
        salaryMax: null,
        currency: null,
        skills: [],
        department: null,
        postedAt: "not-a-date",
        updatedAt: null,
        applicationUrl: "javascript:alert(1)", // Malicious URL scheme
        source: "greenhouse",
        sourceJobId: "",
        contentHash: "123",
      };

      const result = validateNormalizedJob(badJob);
      assert.equal(result.valid, false);
      assert.ok(result.errors && result.errors.length > 0);
    });
  });

  describe("Deduplicator", () => {
    test("buildPrimaryJobKey generates deterministic source keys", () => {
      assert.equal(buildPrimaryJobKey("greenhouse", "12345"), "greenhouse:12345");
      assert.equal(buildPrimaryJobKey("lever", " abc-def "), "lever:abc-def");
    });

    test("buildJobFingerprint normalizes company, title, and location", () => {
      const fp1 = buildJobFingerprint("Razorpay Pvt Ltd", "Senior Frontend Engineer", "Bengaluru, India");
      const fp2 = buildJobFingerprint("Razorpay", "Frontend Engineer", "Bengaluru India");
      assert.equal(fp1, fp2);
    });

    test("computeContentHash generates deterministic SHA-256 hash", () => {
      const hash1 = computeContentHash("Software Engineer", "Build scalable microservices");
      const hash2 = computeContentHash("Software Engineer", "Build scalable microservices");
      const hash3 = computeContentHash("Software Engineer", "Different description");
      assert.equal(hash1, hash2);
      assert.notEqual(hash1, hash3);
    });

    test("evaluateDeduplication never overwrites native GenZ360 employer jobs", () => {
      const incoming = {
        title: "Graduate Engineer",
        company: "Razorpay",
        description: "Product engineering squad.",
        location: "Bengaluru",
        country: "India",
        city: "Bengaluru",
        remoteType: "onsite",
        remote: false,
        employmentType: "full_time",
        experienceLevel: "entry",
        salary: 18.0,
        salaryMin: 18.0,
        salaryMax: 18.0,
        currency: "INR",
        skills: ["React"],
        department: "Engineering",
        postedAt: new Date().toISOString(),
        updatedAt: null,
        applicationUrl: "https://razorpay.com/jobs/1",
        source: "greenhouse",
        sourceJobId: "gh_rzp_1",
        contentHash: "hash123",
      };

      const decision = evaluateDeduplication(
        incoming,
        null,
        { id: "job_rzp", source: "genz360", isNativeEmployer: true },
      );

      assert.equal(decision.isDuplicate, true);
      assert.equal(decision.action, "flag_cross_source");
      assert.ok(decision.reason.includes("preserving native job"));
    });

    test("evaluateDeduplication detects unchanged vs updated jobs for same source", () => {
      const incoming = {
        title: "Engineer",
        company: "Stripe",
        description: "Desc",
        location: "Remote",
        country: null,
        city: null,
        remoteType: "remote",
        remote: true,
        employmentType: "full_time",
        experienceLevel: "mid",
        salary: null,
        salaryMin: null,
        salaryMax: null,
        currency: null,
        skills: [],
        department: null,
        postedAt: new Date().toISOString(),
        updatedAt: null,
        applicationUrl: "https://stripe.com",
        source: "greenhouse",
        sourceJobId: "gh_100",
        contentHash: "hash_current",
      };

      // Unchanged
      const skipDecision = evaluateDeduplication(
        incoming,
        { id: "job_1", contentHash: "hash_current", source: "greenhouse" },
      );
      assert.equal(skipDecision.action, "skip");

      // Updated
      const updateDecision = evaluateDeduplication(
        incoming,
        { id: "job_1", contentHash: "hash_old", source: "greenhouse" },
      );
      assert.equal(updateDecision.action, "update");
    });
  });

  describe("Source Interface Contract", () => {
    test("mock connector implements JobSourceConnector properly", async () => {
      class MockConnector extends BaseConnector {
        getSourceName() {
          return "custom";
        }
        getSourceJobId(raw) {
          return raw.id;
        }
        async fetchJobs(config) {
          return [{ id: "mock_1", title: "Test Role" }];
        }
        normalizeJob(raw, config) {
          return {
            title: raw.title,
            company: config.companyName,
            description: "Mock job description for testing.",
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
            skills: ["Testing"],
            department: null,
            postedAt: new Date().toISOString(),
            updatedAt: null,
            applicationUrl: "https://example.com/jobs/1",
            source: "custom",
            sourceJobId: raw.id,
            contentHash: computeContentHash(raw.title, "Mock job description"),
          };
        }
      }

      const connector = new MockConnector();
      assert.equal(connector.getSourceName(), "custom");

      const config = {
        companyName: "Acme Corp",
        companySlug: "acme",
        source: "custom",
        boardIdentifier: "acme",
        enabled: true,
      };

      const discovered = await connector.discoverJobs(config);
      assert.deepEqual(discovered, ["mock_1"]);

      const rawList = await connector.fetchJobs(config);
      assert.equal(rawList.length, 1);

      const normalized = connector.normalizeJob(rawList[0], config);
      assert.equal(normalized.company, "Acme Corp");
      assert.equal(normalized.title, "Test Role");

      const validation = connector.validateJob(normalized);
      assert.equal(validation.valid, true);
    });
  });
});
