import { assertSafeUrlForFetch } from "./website-validator.ts";
import type { CareerPageDiscoveryResult, CareerDiscoveryMethod } from "./types.ts";

const CAREER_LINK_KEYWORDS = [
  "careers",
  "career",
  "jobs",
  "job-openings",
  "work-with-us",
  "join-us",
  "join-our-team",
  "we-are-hiring",
  "hiring",
  "openings",
  "positions",
];

const CANDIDATE_PATHS = [
  "/careers",
  "/jobs",
  "/company/careers",
  "/work-with-us",
  "/join-us",
  "/about/careers",
];

/**
 * Parses raw HTML string to find links whose anchor text, title, or href
 * indicates a career or job listing page.
 */
export function extractCareerLinksFromHtml(html: string, baseUrl: string): string[] {
  if (!html || typeof html !== "string") return [];

  const foundLinks: string[] = [];
  const base = new URL(baseUrl);

  // Match anchor tags <a href="..." ...>text</a>
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const anchorText = match[2].replace(/<[^>]+>/g, "").trim().toLowerCase();
    const hrefLower = rawHref.toLowerCase();

    // Ignore anchors like "#", "javascript:...", "mailto:...", "tel:..."
    if (
      rawHref.startsWith("#") ||
      rawHref.startsWith("javascript:") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:")
    ) {
      continue;
    }

    const isMatch = CAREER_LINK_KEYWORDS.some(
      (kw) => hrefLower.includes(kw) || anchorText.includes(kw),
    );

    if (isMatch) {
      try {
        const resolved = new URL(rawHref, base);
        if (resolved.protocol === "http:" || resolved.protocol === "https:") {
          foundLinks.push(resolved.toString());
        }
      } catch {
        // Skip unresolvable URLs
      }
    }
  }

  return Array.from(new Set(foundLinks));
}

/**
 * Extracts job posting URLs from JSON-LD schema metadata in HTML.
 */
export function extractJsonLdCareerUrls(html: string): string[] {
  if (!html || typeof html !== "string") return [];

  const urls: string[] = [];
  const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item["@type"] === "JobPosting" && item.url) {
          urls.push(String(item.url));
        }
        if (item.hasOfferCatalog?.itemListElement) {
          for (const offer of item.hasOfferCatalog.itemListElement) {
            if (offer.url) urls.push(String(offer.url));
          }
        }
      }
    } catch {
      // Skip invalid JSON-LD
    }
  }

  return Array.from(new Set(urls));
}

/**
 * Parses XML sitemap text to locate potential careers or jobs URLs.
 */
export function extractCareerUrlsFromSitemap(xml: string): string[] {
  if (!xml || typeof xml !== "string") return [];

  const urls: string[] = [];
  const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    const lower = loc.toLowerCase();
    if (
      lower.includes("/career") ||
      lower.includes("/careers") ||
      lower.includes("/jobs") ||
      lower.includes("/job/") ||
      lower.includes("/join-us")
    ) {
      urls.push(loc);
    }
  }

  return urls;
}

/**
 * Executes automatic career-page discovery for a company.
 * Safely tries:
 * 1. Stored known career URL
 * 2. Homepage navigation / footer links
 * 3. JSON-LD structured data
 * 4. Candidate path probing (/careers, /jobs, /work-with-us)
 * 5. Sitemap indexing
 */
export async function discoverCompanyCareerPage(options: {
  websiteUrl: string;
  knownCareersUrl?: string | null;
  timeoutMs?: number;
}): Promise<CareerPageDiscoveryResult> {
  const timeoutMs = options.timeoutMs ?? 7000;

  // 1. Check stored known career URL if provided
  if (options.knownCareersUrl) {
    const trimmed = options.knownCareersUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return {
        found: true,
        url: trimmed,
        discoveryMethod: "stored",
        confidence: 0.95,
        evidence: ["stored_known_career_url"],
      };
    }
  }

  let websiteUrl = options.websiteUrl.trim();
  if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
    websiteUrl = `https://${websiteUrl}`;
  }

  // 2. Fetch homepage and inspect navigation / footer links & JSON-LD
  try {
    await assertSafeUrlForFetch(websiteUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const homepageRes = await fetch(websiteUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "GenZ360-Bot/1.0 (+https://genz360.in/bot)",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (homepageRes.ok) {
      const html = await homepageRes.text();

      // Check navigation and footer links
      const navLinks = extractCareerLinksFromHtml(html, websiteUrl);
      if (navLinks.length > 0) {
        // Prioritize links on same domain or recognized ATS domains
        return {
          found: true,
          url: navLinks[0],
          discoveryMethod: "nav_links",
          confidence: 0.90,
          evidence: ["official_homepage_navigation_link", `link_count_${navLinks.length}`],
          httpStatus: homepageRes.status,
        };
      }

      // Check JSON-LD
      const jsonLdUrls = extractJsonLdCareerUrls(html);
      if (jsonLdUrls.length > 0) {
        return {
          found: true,
          url: jsonLdUrls[0],
          discoveryMethod: "json_ld",
          confidence: 0.92,
          evidence: ["schema_org_job_posting_json_ld"],
          httpStatus: homepageRes.status,
        };
      }
    }
  } catch {
    // Continue to next discovery steps
  }

  // 3. Probe common candidate career paths: /careers, /jobs, /work-with-us
  const base = new URL(websiteUrl);
  for (const path of CANDIDATE_PATHS) {
    const candidateUrl = new URL(path, base).toString();
    try {
      await assertSafeUrlForFetch(candidateUrl);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 4000));

      const probeRes = await fetch(candidateUrl, {
        method: "HEAD", // Quick HEAD probe
        headers: {
          "User-Agent": "GenZ360-Bot/1.0 (+https://genz360.in/bot)",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (probeRes.ok || probeRes.status === 405) {
        // If 200 OK or 405 Method Not Allowed (some servers reject HEAD but accept GET)
        return {
          found: true,
          url: candidateUrl,
          discoveryMethod: "path_probing",
          confidence: 0.85,
          evidence: [`probed_${path}_status_${probeRes.status}`],
          httpStatus: probeRes.status,
        };
      }
    } catch {
      // Continue to next candidate path
    }
  }

  // 4. Try sitemap.xml fallback
  try {
    const sitemapUrl = new URL("/sitemap.xml", base).toString();
    await assertSafeUrlForFetch(sitemapUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const sitemapRes = await fetch(sitemapUrl, {
      method: "GET",
      headers: { "User-Agent": "GenZ360-Bot/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const sitemapLinks = extractCareerUrlsFromSitemap(xml);
      if (sitemapLinks.length > 0) {
        return {
          found: true,
          url: sitemapLinks[0],
          discoveryMethod: "sitemap",
          confidence: 0.88,
          evidence: ["sitemap_xml_entry"],
          httpStatus: sitemapRes.status,
        };
      }
    }
  } catch {
    // Sitemap not found or inaccessible
  }

  return {
    found: false,
    discoveryMethod: "none",
    confidence: 0,
    evidence: ["no_career_page_detected"],
    error: "No career or jobs page found on official company domain",
  };
}
