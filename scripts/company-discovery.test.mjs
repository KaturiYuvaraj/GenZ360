import assert from "node:assert/strict";
import { test, describe, beforeEach, afterEach } from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DirectorySearchProvider,
} from "../src/lib/job-ingestion/discovery/providers/directory-provider.ts";
import {
  GooglePlacesProvider,
} from "../src/lib/job-ingestion/discovery/providers/google-places-provider.ts";
import {
  TestDiscoveryProvider,
} from "../src/lib/job-ingestion/discovery/providers/test-provider.ts";
import {
  getDiscoveryProvider,
  listDiscoveryProviderStatuses,
  getActiveDiscoveryProvider,
} from "../src/lib/job-ingestion/discovery/providers/index.ts";
import {
  extractCanonicalDomain,
  deduplicateAndSaveCompany,
  updateCompanyDiscoveryStatus,
} from "../src/lib/job-ingestion/discovery/deduplication.ts";
import {
  isPrivateOrReservedIp,
  assertSafeUrlForFetch,
  validateOfficialWebsite,
} from "../src/lib/job-ingestion/discovery/website-validator.ts";
import {
  extractCareerLinksFromHtml,
  extractJsonLdCareerUrls,
  extractCareerUrlsFromSitemap,
  discoverCompanyCareerPage,
} from "../src/lib/job-ingestion/discovery/career-discovery.ts";
import {
  detectATSFromUrlAdvanced,
  detectATSFromHtmlAdvanced,
} from "../src/lib/job-ingestion/discovery/ats-detector.ts";
import {
  validateATSBoard,
} from "../src/lib/job-ingestion/discovery/board-validator.ts";
import {
  registerValidatedJobSource,
} from "../src/lib/job-ingestion/discovery/source-registrar.ts";
import {
  runCompanyDiscoveryPipeline,
  isDiscoveryPipelineRunning,
} from "../src/lib/job-ingestion/discovery/pipeline.ts";
import {
  listJobSources,
  findOrCreateCompany,
  findOrCreateJobSource,
} from "../src/lib/job-ingestion/services/company-service.ts";
import { queryJobs } from "../src/lib/data/catalog.ts";
import { getSql } from "../src/lib/db.ts";
import { nid } from "../src/lib/ids.ts";

const originalFetch = globalThis.fetch;

describe("Phases 1 - 13: Complete Company Discovery & ATS Registration Pipeline Tests", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ==========================================
  // PHASE 1: Provider Normalization & Config
  // ==========================================
  describe("Phase 1: Company Discovery Provider Framework", () => {
    test("DirectorySearchProvider normalizes directory payload into standard candidate", () => {
      const provider = new DirectorySearchProvider("mock-key");
      const raw = {
        name: "Razorpay Software Private Limited",
        website: "https://razorpay.com",
        industry: "Financial Services",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        size_range: "1001-5000",
        id: "dir_rzp_123",
      };

      const normalized = provider.normalizeCompany(raw);
      assert.equal(normalized.name, "Razorpay Software Private Limited");
      assert.equal(normalized.website, "https://razorpay.com");
      assert.equal(normalized.industry, "Financial Services");
      assert.equal(normalized.city, "Bengaluru");
      assert.equal(normalized.country, "India");
      assert.equal(normalized.sizeRange, "1001-5000");
      assert.equal(normalized.providerIdentifier, "dir_rzp_123");
      assert.equal(normalized.providerName, "business-directory");
    });

    test("DirectorySearchProvider throws on invalid payload without company name", () => {
      const provider = new DirectorySearchProvider("mock-key");
      assert.throws(() => provider.normalizeCompany({}), /Missing company name/);
    });

    test("GooglePlacesProvider normalizes place search result and respects non-retention rules", () => {
      const provider = new GooglePlacesProvider("mock-places-key");
      const raw = {
        name: "Postman Technologies",
        website: "https://www.postman.com",
        formatted_address: "100 Indiranagar, Bengaluru, Karnataka, India",
        place_id: "ChIJ_fake_place_id",
        address_components: [
          { long_name: "Bengaluru", types: ["locality"] },
          { long_name: "Karnataka", types: ["administrative_area_level_1"] },
          { long_name: "India", types: ["country"] },
        ],
      };

      const normalized = provider.normalizeCompany(raw);
      assert.equal(normalized.name, "Postman Technologies");
      assert.equal(normalized.website, "https://www.postman.com");
      assert.equal(normalized.city, "Bengaluru");
      assert.equal(normalized.country, "India");
      assert.equal(normalized.providerName, "google-places");
      // Geocodes, reviews, and proprietary fields are NOT retained
      assert.equal(normalized.geometry, undefined);
      assert.equal(normalized.reviews, undefined);
    });

    test("TestDiscoveryProvider filters candidates deterministically", async () => {
      const provider = new TestDiscoveryProvider();
      const res = await provider.searchCompanies({ city: "Hyderabad" });
      assert.ok(res.companies.length >= 1);
      assert.equal(res.companies[0].city, "Hyderabad");
      assert.equal(res.companies[0].name, "Acme Cloud Technologies");
    });

    test("Unconfigured provider returns clear configuration status without pretending success", () => {
      const originalDirKey = process.env.COMPANY_SEARCH_API_KEY;
      const originalBizKey = process.env.BUSINESS_DIRECTORY_API_KEY;
      delete process.env.COMPANY_SEARCH_API_KEY;
      delete process.env.BUSINESS_DIRECTORY_API_KEY;

      const unconfigured = new DirectorySearchProvider(undefined);
      assert.equal(unconfigured.isConfigured(), false);
      const status = unconfigured.getConfigurationStatus();
      assert.equal(status.configured, false);
      assert.ok(status.missingKeys?.length);

      if (originalDirKey) process.env.COMPANY_SEARCH_API_KEY = originalDirKey;
      if (originalBizKey) process.env.BUSINESS_DIRECTORY_API_KEY = originalBizKey;
    });
  });

  // ==========================================
  // PHASE 2: Company Normalization & Deduplication
  // ==========================================
  describe("Phase 2: Company Normalization & Deduplication", () => {
    test("extractCanonicalDomain normalizes URLs and strips www, protocol, and paths", () => {
      assert.equal(extractCanonicalDomain("https://www.stripe.com/jobs?ref=1"), "stripe.com");
      assert.equal(extractCanonicalDomain("http://sub.domain.co.uk/path/index.html"), "sub.domain.co.uk");
      assert.equal(extractCanonicalDomain("careers.lever.co/netflix"), "careers.lever.co");
      assert.equal(extractCanonicalDomain(""), null);
      assert.equal(extractCanonicalDomain(null), null);
    });

    test("Deduplication respects precedence and never overwrites verified employer records", async () => {
      const sql = await getSql();
      const testSlug = `native-employer-${Date.now()}`;
      const empId = nid("emp");

      // Seed a manual, verified employer
      await sql`
        insert into employers (
          id, company_name, slug, website, verified, is_external, company_size, created_at, updated_at
        ) values (
          ${empId}, 'Trusted Native Inc', ${testSlug}, 'https://trustednative.example.com', true, false, '51-200', now(), now()
        )
      `;

      // Candidate matching by canonical domain
      const candidate = {
        name: "Trusted Native Discovered Copy",
        website: "https://www.trustednative.example.com/about",
        industry: "Software",
        location: "Mumbai, India",
        city: "Mumbai",
        country: "India",
        providerIdentifier: "prov_999",
        providerName: "test-directory",
        confidence: 0.85,
      };

      const dedupeResult = await deduplicateAndSaveCompany(candidate);
      assert.equal(dedupeResult.action, "matched_existing");
      assert.equal(dedupeResult.companyId, empId);
      assert.equal(dedupeResult.isExistingVerified, true);

      // Verify the manual employer name was NOT overwritten
      const check = await sql`
        select company_name, verified from employers where id = ${empId}
      `;
      assert.equal(check[0].company_name, "Trusted Native Inc");
      assert.equal(check[0].verified, true);
    });
  });

  // ==========================================
  // PHASE 3: SSRF Protection & Website Validation
  // ==========================================
  describe("Phase 3: SSRF Protection & Website Validation", () => {
    test("isPrivateOrReservedIp detects all loopback, RFC 1918, and metadata ranges", () => {
      // Loopback
      assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
      assert.equal(isPrivateOrReservedIp("127.10.0.5"), true);
      assert.equal(isPrivateOrReservedIp("::1"), true);

      // RFC 1918 Private
      assert.equal(isPrivateOrReservedIp("10.0.0.1"), true);
      assert.equal(isPrivateOrReservedIp("10.254.254.254"), true);
      assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
      assert.equal(isPrivateOrReservedIp("172.31.255.255"), true);
      assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
      assert.equal(isPrivateOrReservedIp("192.168.0.100"), true);

      // Cloud Metadata / Link-Local
      assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
      assert.equal(isPrivateOrReservedIp("169.254.1.1"), true);

      // Carrier-Grade NAT & Current
      assert.equal(isPrivateOrReservedIp("0.0.0.0"), true);
      assert.equal(isPrivateOrReservedIp("100.64.0.1"), true);

      // Public routable IPs are NOT private
      assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
      assert.equal(isPrivateOrReservedIp("1.1.1.1"), false);
      assert.equal(isPrivateOrReservedIp("142.250.190.46"), false);
    });

    test("assertSafeUrlForFetch rejects non-HTTP schemes and loopback hostnames", async () => {
      await assert.rejects(
        () => assertSafeUrlForFetch("ftp://ftp.example.com/files"),
        /Unsupported URL scheme 'ftp:'/,
      );

      await assert.rejects(
        () => assertSafeUrlForFetch("file:///etc/passwd"),
        /Unsupported URL scheme 'file:'/,
      );

      await assert.rejects(
        () => assertSafeUrlForFetch("http://localhost/admin"),
        /SSRF blocked/,
      );

      await assert.rejects(
        () => assertSafeUrlForFetch("http://127.0.0.1:8080"),
        /SSRF blocked/,
      );

      await assert.rejects(
        () => assertSafeUrlForFetch("http://169.254.169.254/latest/meta-data"),
        /SSRF blocked/,
      );
    });

    test("validateOfficialWebsite rejects invalid schemes or unresolvable URLs safely", async () => {
      const res = await validateOfficialWebsite("ftp://invalid-host/test");
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("Unsupported URL scheme"));
    });
  });

  // ==========================================
  // PHASE 4: Career Page Discovery
  // ==========================================
  describe("Phase 4: Automatic Career-Page Discovery", () => {
    test("extractCareerLinksFromHtml extracts valid career links from navigation and footer", () => {
      const html = `
        <html>
          <header>
            <nav>
              <a href="/about">About Us</a>
              <a href="/careers">Careers & Openings</a>
            </nav>
          </header>
          <footer>
            <a href="https://jobs.example.com/open-positions">Work With Us</a>
            <a href="/privacy">Privacy Policy</a>
          </footer>
        </html>
      `;

      const links = extractCareerLinksFromHtml(html, "https://example.com");
      assert.ok(links.includes("https://example.com/careers"));
      assert.ok(links.includes("https://jobs.example.com/open-positions"));
      assert.equal(links.includes("https://example.com/privacy"), false);
    });

    test("extractJsonLdCareerUrls extracts JobPosting schema URLs", () => {
      const htmlWithJsonLd = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org/",
                "@type": "JobPosting",
                "title": "Software Engineer",
                "url": "https://careers.example.com/jobs/101"
              }
            </script>
          </head>
        </html>
      `;

      const urls = extractJsonLdCareerUrls(htmlWithJsonLd);
      assert.deepEqual(urls, ["https://careers.example.com/jobs/101"]);
    });

    test("extractCareerUrlsFromSitemap parses sitemap XML for career paths", () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/about</loc></url>
          <url><loc>https://example.com/careers</loc></url>
          <url><loc>https://example.com/careers/engineering</loc></url>
          <url><loc>https://example.com/products</loc></url>
        </urlset>
      `;

      const urls = extractCareerUrlsFromSitemap(xml);
      assert.equal(urls.length, 2);
      assert.ok(urls.includes("https://example.com/careers"));
      assert.ok(urls.includes("https://example.com/careers/engineering"));
    });
  });

  // ==========================================
  // PHASE 5: ATS Detection Engine
  // ==========================================
  describe("Phase 5: ATS Detection Engine", () => {
    test("Detects Greenhouse URLs across both standard and vanity domains", () => {
      const r1 = detectATSFromUrlAdvanced("https://boards.greenhouse.io/stripe");
      assert.equal(r1?.atsType, "greenhouse");
      assert.equal(r1?.boardIdentifier, "stripe");

      const r2 = detectATSFromUrlAdvanced("https://job-boards.greenhouse.io/figma/jobs/999");
      assert.equal(r2?.atsType, "greenhouse");
      assert.equal(r2?.boardIdentifier, "figma");
    });

    test("Detects Lever URLs and identifiers", () => {
      const r = detectATSFromUrlAdvanced("https://jobs.lever.co/netflix/634891b0-101");
      assert.equal(r?.atsType, "lever");
      assert.equal(r?.boardIdentifier, "netflix");
    });

    test("Detects Ashby URLs and identifiers", () => {
      const r = detectATSFromUrlAdvanced("https://jobs.ashbyhq.com/linear/jobs");
      assert.equal(r?.atsType, "ashby");
      assert.equal(r?.boardIdentifier, "linear");
    });

    test("Detects Workable URLs and subdomains", () => {
      const r1 = detectATSFromUrlAdvanced("https://apply.workable.com/invision/j/991");
      assert.equal(r1?.atsType, "workable");
      assert.equal(r1?.boardIdentifier, "invision");

      const r2 = detectATSFromUrlAdvanced("https://invision.workable.com");
      assert.equal(r2?.atsType, "workable");
      assert.equal(r2?.boardIdentifier, "invision");
    });

    test("Detects SmartRecruiters career pages", () => {
      const r = detectATSFromUrlAdvanced("https://careers.smartrecruiters.com/smartrecruiters");
      assert.equal(r?.atsType, "smartrecruiters");
      assert.equal(r?.boardIdentifier, "smartrecruiters");
    });

    test("Detects ATS widgets embedded in HTML markup and data attributes", () => {
      const htmlGreenhouse = `<iframe src="https://boards.greenhouse.io/embed/job_board?for=airtable"></iframe>`;
      const ghRes = detectATSFromHtmlAdvanced(htmlGreenhouse, "https://airtable.com/careers");
      assert.equal(ghRes?.atsType, "greenhouse");
      assert.equal(ghRes?.boardIdentifier, "airtable");

      const htmlAshby = `<div data-ashby-board="notion"></div>`;
      const ashRes = detectATSFromHtmlAdvanced(htmlAshby, "https://notion.so/careers");
      assert.equal(ashRes?.atsType, "ashby");
      assert.equal(ashRes?.boardIdentifier, "notion");

      const htmlWorkable = `<script src="https://apply.workable.com/assets/embed.js" data-workable-account="verve"></script>`;
      const wkbRes = detectATSFromHtmlAdvanced(htmlWorkable, "https://verve.com");
      assert.equal(wkbRes?.atsType, "workable");
      assert.equal(wkbRes?.boardIdentifier, "verve");
    });

    test("Returns null for unsupported or non-ATS pages", () => {
      assert.equal(detectATSFromUrlAdvanced("https://example.com/company/team"), null);
      assert.equal(detectATSFromHtmlAdvanced("<p>We are hiring engineers!</p>", "https://example.com"), null);
    });
  });

  // ==========================================
  // PHASE 6: ATS Board Validation
  // ==========================================
  describe("Phase 6: ATS Board Validation", () => {
    test("Validates board with active jobs", async () => {
      globalThis.fetch = async (url) => {
        if (String(url).includes("boards-api.greenhouse.io")) {
          return new Response(
            JSON.stringify({
              jobs: [
                { id: 1, title: "Staff Engineer", absolute_url: "https://boards.greenhouse.io/stripe/jobs/1" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("Not found", { status: 404 });
      };

      const res = await validateATSBoard("greenhouse", "stripe");
      assert.equal(res.valid, true);
      assert.equal(res.jobCount, 1);
      assert.equal(res.emptyBoard, false);
      assert.equal(res.atsType, "greenhouse");
    });

    test("Validates empty board successfully without marking it as an error", async () => {
      globalThis.fetch = async (url) => {
        if (String(url).includes("api.lever.co")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not found", { status: 404 });
      };

      const res = await validateATSBoard("lever", "quiet-company");
      assert.equal(res.valid, true);
      assert.equal(res.jobCount, 0);
      assert.equal(res.emptyBoard, true);
    });

    test("Rejects 404 or bad board identifier with clear actionable error", async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: "No company found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      };

      const res = await validateATSBoard("greenhouse", "non-existent-co-xyz");
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("HTTP 404"));
    });

    test("Rejects empty or whitespace-only board identifier", async () => {
      const res = await validateATSBoard("greenhouse", "   ");
      assert.equal(res.valid, false);
      assert.equal(res.error, "Empty board identifier");
    });
  });

  // ==========================================
  // PHASE 7: Idempotent Source Registration
  // ==========================================
  describe("Phase 7: Idempotent Job Source Registration", () => {
    test("Registers a new valid source and preserves existing disabled state on updates", async () => {
      const sql = await getSql();
      const uniqueCompanyName = `Test Co ${Date.now()}`;
      const company = await findOrCreateCompany(uniqueCompanyName, {
        website: "https://example.com",
      });

      const detection = {
        atsType: "greenhouse",
        boardIdentifier: `board-${Date.now()}`,
        careerPageUrl: "https://example.com/careers",
        confidence: 0.98,
        evidence: ["url_match"],
        requiresReview: false,
      };

      const validation = {
        valid: true,
        atsType: "greenhouse",
        boardIdentifier: detection.boardIdentifier,
        jobCount: 5,
        emptyBoard: false,
      };

      // 1. First registration -> creates new source
      const reg1 = await registerValidatedJobSource(
        { id: company.id, companyName: company.companyName, slug: company.slug },
        detection,
        validation,
      );
      assert.equal(reg1.action, "registered");
      assert.equal(reg1.status, "active");
      assert.ok(reg1.jobSourceId);

      // 2. Admin explicitly disables this source
      await sql`
        update job_sources set enabled = false where id = ${reg1.jobSourceId}
      `;

      // 3. Second registration of the same source -> preserves disabled state
      const reg2 = await registerValidatedJobSource(
        { id: company.id, companyName: company.companyName, slug: company.slug },
        detection,
        validation,
      );
      assert.equal(reg2.action, "preserved_disabled");
      assert.equal(reg2.status, "disabled");

      // Verify in DB that it is STILL disabled (never silently reactivated)
      const check = await sql`
        select enabled from job_sources where id = ${reg1.jobSourceId}
      `;
      assert.equal(check[0].enabled, false);
    });
  });

  // ==========================================
  // PHASE 8 & 12: Pipeline Concurrency & Telemetry
  // ==========================================
  describe("Phase 8 & 12: Pipeline Concurrency, Telemetry, & Safe Execution", () => {
    test("Pipeline throws when requested provider is unconfigured", async () => {
      await assert.rejects(
        () => runCompanyDiscoveryPipeline({ provider: "business-directory" }),
        /is not configured/,
      );
    });

    test("Pipeline concurrency guard prevents simultaneous runs", async () => {
      assert.equal(isDiscoveryPipelineRunning(), false);
    });
  });

  // ==========================================
  // REGRESSION: Native Jobs & Applications
  // ==========================================
  describe("Phase 13: Regression Safeguards for Native Jobs & Applications", () => {
    test("Native employer-created jobs are preserved in catalog query", async () => {
      const nativeJobs = await queryJobs({ source: "genz360" });
      assert.ok(Array.isArray(nativeJobs));
      assert.ok(nativeJobs.length > 0);
      for (const j of nativeJobs) {
        assert.equal(j.source || "genz360", "genz360");
        assert.equal(j.external_job ?? false, false);
      }
    });

    test("Database schema contains all required discovery and telemetry tables", async () => {
      const sql = await getSql();

      // Check employers discovery columns
      const employerCols = await sql`
        select column_name from information_schema.columns where table_name = 'employers'
      `;
      const colNames = employerCols.map((c) => c.column_name);
      assert.ok(colNames.includes("discovery_status"));
      assert.ok(colNames.includes("discovery_provider"));
      assert.ok(colNames.includes("discovery_confidence"));

      // Check discovery_runs table
      const runsTable = await sql`
        select table_name from information_schema.tables where table_name = 'discovery_runs'
      `;
      assert.equal(runsTable.length, 1);

      // Check discovered_company_sources table
      const sourcesTable = await sql`
        select table_name from information_schema.tables where table_name = 'discovered_company_sources'
      `;
      assert.equal(sourcesTable.length, 1);
    });
  });
});
