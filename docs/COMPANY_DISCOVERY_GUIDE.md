# GenZ360 — Automated Company Discovery & ATS Source Registration Guide

## 1. Overview & Architecture

The **GenZ360 Automated Company Discovery & ATS Source Registration Pipeline** automates the discovery of technology companies, verification of official websites, detection of Applicant Tracking Systems (ATS), and validation of public job boards. Once validated, candidate boards are registered idempotently as active job sources and seamlessly ingested by the existing job ingestion engine into the GenZ360 jobs catalog.

### Complete Lifecycle Flow

```text
Discovery Provider (Directory / Google Places)
               │
               ▼
   [Stage A] Discover Candidates
               │
               ▼
   [Stage B] Normalize & Deduplicate
               │  (Priority: Provider ID -> Domain -> Verified -> Conservative Slug)
               ▼
   [Stage C] Verify Official Website
               │  (Strict SSRF Guard: Blocks localhost, RFC 1918, 169.254.169.254)
               ▼
   [Stage D] Discover Career Page
               │  (Nav/Footer Links -> JSON-LD Schema -> Path Probing -> Sitemap XML)
               ▼
   [Stage E] Detect ATS Platform
               │  (Greenhouse, Lever, Ashby, Workable, SmartRecruiters)
               ▼
   [Stage F] Validate ATS Board
               │  (Queries public API; distinguishes valid empty boards from 404s)
               ▼
   [Stage G] Idempotent Source Registration
               │  (Inserts into job_sources; preserves manual config and disabled state)
               ▼
   [Stage H] Job Ingestion & Synchronization
               │  (Executes existing connector -> normalizes -> upserts jobs in GenZ360)
               ▼
   GenZ360 Job Catalog & Search UI
```

All 8 stages are strictly separated, observable, retryable, and safe to execute repeatedly. A discovery failure at any stage will never mark existing jobs as closed or expired.

---

## 2. Supported Discovery Providers

GenZ360 integrates with legitimate, authorized company discovery providers. It does **not** scrape search engine result pages (SERPs).

### A. Commercial Business Directory API
- **Provider Name**: `business-directory`
- **Environment Variables**: `COMPANY_SEARCH_API_KEY` or `BUSINESS_DIRECTORY_API_KEY`
- **Endpoint**: Configurable via `COMPANY_SEARCH_API_URL` (defaults to `https://api.businessdirectory.io/v1/companies`).
- **Use Case**: Discovers legally registered corporations, official web domains, industry categories, headquarters, and workforce size ranges.

### B. Google Places API
- **Provider Name**: `google-places`
- **Environment Variables**: `GOOGLE_MAPS_API_KEY`
- **Use Case**: Discovers company offices, verified corporate domains, and cities.
- **Terms & Non-Retention Compliance**:
  - GenZ360 adheres strictly to Google Places terms of service and retention restrictions.
  - Places data is used exclusively during the ephemeral discovery step to extract official company website domains.
  - Proprietary Google Places data (geocoordinates, user reviews, photos, place IDs) is **never** permanently stored or cached in the GenZ360 database.

### C. In-Memory Test Provider
- **Provider Name**: `test-directory`
- **Use Case**: Used for unit tests, local test simulations, and continuous integration.
- **Behavior**: Deterministic candidates with zero external network dependencies.

### Safe Unconfigured Fallback
If no provider credentials are configured, GenZ360 reports that automatic discovery is unavailable. It **never** fabricates results or simulates successful discovery with hardcoded dummy companies. Manually configured ATS boards, employer-posted jobs, and catalog search remain 100% operational.

---

## 3. Environment Configuration

Add the applicable variables to your `.env` file (see [`.env.example`](file:///c:/Users/YUVARAJ/Downloads/GenZ360_grok/.env.example)):

```bash
# --- Discovery Provider 1: Business Directory API ---
COMPANY_SEARCH_API_KEY=your_directory_api_key_here

# --- Discovery Provider 2: Google Places API ---
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# --- Discovery Engine Controls & Rate Limits ---
DISCOVERY_MAX_COMPANIES_PER_RUN=20   # Maximum candidate companies per execution
DISCOVERY_MAX_CONCURRENCY=3          # Parallel request limit
DISCOVERY_REQUEST_TIMEOUT_MS=8000    # HTTP timeout for probe requests

# --- Scheduled Cron / Worker Security Secret ---
DISCOVERY_CRON_SECRET=your_secure_cron_secret_here
```

---

## 4. How to Start a Discovery Run

### 1. From the GenZ360 Admin Dashboard
1. Log in to the GenZ360 Admin interface at `/admin`.
2. Navigate to the **Job Aggregation Engine** tab, then select the **Automatic Discovery & Pipeline** sub-tab.
3. Review the **Provider Status Banner** to verify provider configuration.
4. Fill in the optional filters (Location, Industry, Search Query, Candidate Limit).
5. Click **Trigger Company Discovery**. The run will execute asynchronously in the background.

### 2. Via Scheduled Endpoint (Cron / Vercel / External Worker)
Automate recurring discovery runs using a `POST` request to `/api/discovery/cron` with the bearer secret:

```bash
curl -X POST "https://your-domain.com/api/discovery/cron" \
  -H "Authorization: Bearer your_secure_cron_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Bengaluru",
    "industry": "Technology",
    "limit": 15
  }'
```

### 3. Concurrency Protection
The pipeline implements an in-memory and database coordination lock (`isDiscoveryPipelineRunning()`). If a run is already active, subsequent requests return an immediate error indicating that a run is in progress.

---

## 5. Security & SSRF Protection

All outbound website validation and probing requests pass through strict SSRF (Server-Side Request Forgery) guards:
- **Forbidden Hostnames**: `localhost`, `*.localhost`, `127.0.0.1`, cloud metadata endpoints (`169.254.169.254`).
- **Forbidden IP Ranges**:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
  - `169.254.0.0/16` (Link-Local / Cloud Instance Metadata)
  - `100.64.0.0/10` (Carrier-Grade NAT)
  - `::1`, `fe80::/10`, `fc00::/7` (IPv6 loopback/link-local/ULA)
- **DNS Resolution Check**: Performs async DNS resolution on hostnames prior to each request and verifies that all resolved IPs are public.
- **Redirect Hop Validation**: Redirects are inspected individually (`redirect: "manual"`). Redirect loops and hops to internal or prohibited addresses are immediately aborted.
- **Payload Constraints**: Responses are capped at 1MB to prevent memory exhaustion from unexpected binary downloads.

---

## 6. Supported ATS Platforms & Board Validation

GenZ360 supports five major Applicant Tracking Systems:

| ATS Platform | Canonical URL Pattern | Public Job API Endpoint |
| :--- | :--- | :--- |
| **Greenhouse** | `boards.greenhouse.io/{board}` or `job-boards.greenhouse.io/{board}` | `https://boards-api.greenhouse.io/v1/boards/{board}/jobs` |
| **Lever** | `jobs.lever.co/{board}` | `https://api.lever.co/v0/postings/{board}?mode=json` |
| **Ashby** | `jobs.ashbyhq.com/{board}` | `https://api.ashbyhq.com/posting-api/job-board/{board}` |
| **Workable** | `apply.workable.com/{board}` or `{board}.workable.com` | `https://apply.workable.com/api/v1/widget/accounts/{board}` |
| **SmartRecruiters** | `careers.smartrecruiters.com/{board}` | `https://api.smartrecruiters.com/v1/companies/{board}/postings` |

### Distinguishing Empty Boards from Failures
- **Active Board**: Returns HTTP 200 with 1 or more jobs. Marked as `valid: true`, `emptyBoard: false`.
- **Empty Board**: Company currently has 0 open positions. The API returns HTTP 200 with an empty job list (`[]`). Marked as `valid: true`, `emptyBoard: true`. Successfully registered so future sync cycles can ingest jobs when postings open.
- **Invalid Board / Failure**: Returns HTTP 404, 400, or network error. Marked as `valid: false`. The source is **never** registered.

---

## 7. Idempotent Source Registration & Deduplication

### Company Deduplication Precedence
1. **Stable Provider Identifier**: Matches on `(discovery_provider, provider_id)`.
2. **Canonical Domain Host**: Strips `www.`, protocol, and path (e.g. `https://www.stripe.com/about` -> `stripe.com`).
3. **Existing Verified Employer**: Preserves verified native employers; never overwrites trusted names with discovery snippets.
4. **Conservative Normalized Slug**: Matches on URL-safe normalized slug (`stripe`).

### Source Registration Rules
- **Idempotence**: Re-discovering an existing board updates metadata (`last_validation_time`, `confidence`) without creating duplicate records.
- **Preserve Disabled State**: If an administrator previously disabled a source (`enabled: false`), discovery updates validation telemetry but **never** silently re-enables it.
- **Review Queue**: Ambiguous matches (low confidence < 0.70 or unverified redirects) are sent to `discovered_company_sources` with status `pending` for admin approval.

---

## 8. Ingestion & Job Synchronization

Once registered, the source is automatically enqueued for the existing ingestion engine:
1. `syncCompanySource` invokes the corresponding ATS connector from `src/lib/job-ingestion/connectors/`.
2. Raw postings are fetched and mapped into standard GenZ360 job records.
3. Content hashes (`sha256(company + title + description + location)`) ensure duplicate jobs are skipped.
4. Newly imported jobs are assigned `source = "{atsType}"` and `external_job = true`.
5. Existing employer jobs (`source = "genz360"`, `external_job = false`) are completely untouched.

---

## 9. Observability & Logging

Every execution writes a structured summary record to the `discovery_runs` table:

```json
{
  "provider": "business-directory",
  "status": "completed",
  "companiesFound": 20,
  "companiesProcessed": 20,
  "duplicatesFound": 4,
  "websitesVerified": 16,
  "careerPagesFound": 12,
  "atsDetected": 9,
  "sourcesValidated": 8,
  "sourcesRegistered": 8,
  "needsReviewCount": 1,
  "failedCount": 3
}
```

Administrators can inspect full run history, error breakdowns, and individual company candidates in the **Execution Run History** sub-tab at `/admin`.

---

## 10. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **"Provider is not configured"** | Missing API key in environment variables | Add `COMPANY_SEARCH_API_KEY` or `GOOGLE_MAPS_API_KEY` to `.env` |
| **"SSRF blocked: forbidden host"** | Target domain resolves to a private IP, loopback, or metadata service | Company website is hosted on an internal network; candidate is flagged as `discovery_failed` |
| **"ATS board validation failed: HTTP 404"** | Discovered identifier does not exist on the public ATS API | Ensure the career page links to an active board. If vanity domain, check for embedded iframe |
| **"Source already registered"** | Board is already tracked in `job_sources` | System updates `last_validation_at` without duplicating the record |
| **"Concurrent run blocked"** | Another discovery run is currently running | Wait for previous run to complete, or check `/admin` run history |

---

## 11. Known Limitations & Compliance

1. **Not Exhaustive**: The discovery engine cannot discover every company on the internet; discovery is bound by what is indexed by configured licensed directories or Google Places.
2. **Anti-Bot & WAF Protections**: Career portals behind Cloudflare Bot Management, CAPTCHA, or requiring authenticated logins are intentionally not bypassed; they are flagged as `unsupported_source` or `needs_review`.
3. **Licensing**: Always verify commercial terms and quotas before using paid directory APIs in large-scale production environments.
