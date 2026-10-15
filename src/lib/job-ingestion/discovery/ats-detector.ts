import type { JobSource } from "../core/types.ts";
import type { ATSDetectionEvidence } from "./types.ts";
import { assertSafeUrlForFetch } from "./website-validator.ts";

interface ATSPatternRule {
  source: JobSource;
  regexes: RegExp[];
  confidence: number;
}

const ATS_RULES: ATSPatternRule[] = [
  {
    source: "greenhouse",
    confidence: 0.98,
    regexes: [
      /(?:boards\.greenhouse\.io|job-boards\.greenhouse\.io)\/embed\/job_board\?(?:.*&)?for=([a-zA-Z0-9_\-]+)/i,
      /[?&]for=([a-zA-Z0-9_\-]+)/i,
      /(?:boards\.greenhouse\.io|job-boards\.greenhouse\.io)\/([a-zA-Z0-9_\-]+)/i,
      /boards-api\.greenhouse\.io\/v1\/boards\/([a-zA-Z0-9_\-]+)/i,
      /gh_src=([a-zA-Z0-9_\-]+)/i,
      /data-gh-board=["']([a-zA-Z0-9_\-]+)["']/i,
      /data-greenhouse-board=["']([a-zA-Z0-9_\-]+)["']/i,
    ],
  },
  {
    source: "lever",
    confidence: 0.98,
    regexes: [
      /jobs\.lever\.co\/([a-zA-Z0-9_\-]+)/i,
      /api\.lever\.co\/v0\/postings\/([a-zA-Z0-9_\-]+)/i,
      /data-lever-site=["']([a-zA-Z0-9_\-]+)["']/i,
    ],
  },
  {
    source: "ashby",
    confidence: 0.98,
    regexes: [
      /jobs\.ashbyhq\.com\/([a-zA-Z0-9_\-]+)/i,
      /api\.ashbyhq\.com\/posting-api\/job-board\/([a-zA-Z0-9_\-]+)/i,
      /data-ashby-board=["']([a-zA-Z0-9_\-]+)["']/i,
      /data-ashby-job-board=["']([a-zA-Z0-9_\-]+)["']/i,
    ],
  },
  {
    source: "workable",
    confidence: 0.98,
    regexes: [
      /data-workable-account=["']([a-zA-Z0-9_\-]+)["']/i,
      /apply\.workable\.com\/api\/v1\/widget\/accounts\/([a-zA-Z0-9_\-]+)/i,
      /([a-zA-Z0-9_\-]+)\.workable\.com/i,
      /apply\.workable\.com\/([a-zA-Z0-9_\-]+)/i,
    ],
  },
  {
    source: "smartrecruiters",
    confidence: 0.98,
    regexes: [
      /data-smartrecruiters-company=["']([a-zA-Z0-9_\-]+)["']/i,
      /careers\.smartrecruiters\.com\/([a-zA-Z0-9_\-]+)/i,
      /jobs\.smartrecruiters\.com\/([a-zA-Z0-9_\-]+)/i,
      /api\.smartrecruiters\.com\/v1\/companies\/([a-zA-Z0-9_\-]+)/i,
    ],
  },
];

const GENERIC_EXCLUSIONS = new Set([
  "api", "embed", "v1", "v0", "widget", "jobs", "careers", "j", "search",
  "apply", "postings", "iframe", "view", "index", "all", "account",
  "assets", "static", "cdn", "dist", "js", "scripts", "app",
]);

/**
 * Detects supported ATS and extracts board identifier from a URL.
 */
export function detectATSFromUrlAdvanced(url: string): ATSDetectionEvidence | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  for (const rule of ATS_RULES) {
    for (const regex of rule.regexes) {
      const match = trimmed.match(regex);
      if (match && match[1]) {
        const identifier = match[1].toLowerCase();
        if (!GENERIC_EXCLUSIONS.has(identifier)) {
          return {
            atsType: rule.source,
            boardIdentifier: identifier,
            careerPageUrl: trimmed,
            confidence: rule.confidence,
            evidence: ["url_pattern_matched", `ats_${rule.source}`],
            requiresReview: false,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detects supported ATS and extracts board identifier from HTML markup.
 */
export function detectATSFromHtmlAdvanced(
  html: string,
  baseUrl: string,
): ATSDetectionEvidence | null {
  if (!html || typeof html !== "string") return null;

  for (const rule of ATS_RULES) {
    for (const regex of rule.regexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        const identifier = match[1].toLowerCase();
        if (!GENERIC_EXCLUSIONS.has(identifier)) {
          return {
            atsType: rule.source,
            boardIdentifier: identifier,
            careerPageUrl: baseUrl,
            confidence: 0.90,
            evidence: ["html_markup_matched", `ats_${rule.source}`],
            requiresReview: false,
          };
        }
      }
    }
  }

  // Also check if any anchor tags point to known ATS domains
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["']/gis;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const rawHref = linkMatch[1];
    const fromUrl = detectATSFromUrlAdvanced(rawHref);
    if (fromUrl) {
      return {
        ...fromUrl,
        careerPageUrl: baseUrl,
        confidence: 0.88,
        evidence: ["embedded_link_to_ats", ...fromUrl.evidence],
      };
    }
  }

  return null;
}

/**
 * Comprehensive ATS detection on a career page URL.
 * 1. Inspects the URL itself.
 * 2. If URL doesn't match directly, fetches the page (SSRF protected) and inspects HTML / scripts / iframes / redirect targets.
 */
export async function detectATSOnCareerPage(
  careerPageUrl: string,
  timeoutMs = 7000,
): Promise<ATSDetectionEvidence | null> {
  // 1. Direct URL pattern detection
  const fromUrl = detectATSFromUrlAdvanced(careerPageUrl);
  if (fromUrl) return fromUrl;

  // 2. Fetch page and inspect HTML markup with safe redirects
  try {
    await assertSafeUrlForFetch(careerPageUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(careerPageUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "GenZ360-Bot/1.0 (+https://genz360.in/bot)",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    // If redirected to an ATS-hosted board, detect from final URL
    if (res.url && res.url !== careerPageUrl) {
      const fromRedirectUrl = detectATSFromUrlAdvanced(res.url);
      if (fromRedirectUrl) {
        return {
          ...fromRedirectUrl,
          evidence: ["redirect_destination_matched", ...fromRedirectUrl.evidence],
        };
      }
    }

    if (res.ok) {
      const html = await res.text();
      return detectATSFromHtmlAdvanced(html, careerPageUrl);
    }
  } catch {
    // Network or fetch failed
  }

  return null;
}
