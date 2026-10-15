import { promises as dns } from "node:dns";
import type { WebsiteValidationResult } from "./types.ts";

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, or cloud-metadata ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  // Trim and normalize
  const cleanIp = ip.trim();

  // IPv6 checks
  if (cleanIp === "::1" || cleanIp === "::" || cleanIp.startsWith("fe80:") || cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) {
    return true;
  }

  // IPv4 checks
  const parts = cleanIp.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    // If not valid IPv4 and not IPv6, reject
    return true;
  }

  const [a, b] = parts;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 0.0.0.0/8 - Current network
  if (a === 0) return true;

  // 10.0.0.0/8 - Private RFC 1918
  if (a === 10) return true;

  // 172.16.0.0/12 - Private RFC 1918 (172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 - Private RFC 1918
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 - Link-Local / Cloud Metadata (169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 - Carrier-Grade NAT (100.64.0.0 - 100.127.255.255)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

/**
 * Validates a URL against strict SSRF constraints before any network request is attempted.
 */
export async function assertSafeUrlForFetch(urlStr: string): Promise<{
  url: URL;
  resolvedIp: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error(`Invalid URL format: ${urlStr}`);
  }

  // Scheme restriction: only http and https allowed
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL scheme '${parsed.protocol}'. Only http: and https: are permitted.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject explicit localhost or cloud metadata hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    throw new Error(`SSRF blocked: Access to forbidden host '${hostname}' is rejected.`);
  }

  // Resolve DNS to verify IP
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      throw new Error(`DNS lookup failed for host '${hostname}'.`);
    }

    for (const record of lookupResult) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new Error(
          `SSRF blocked: Host '${hostname}' resolved to private or reserved IP address '${record.address}'.`,
        );
      }
    }

    return {
      url: parsed,
      resolvedIp: lookupResult[0].address,
    };
  } catch (err: any) {
    if (err.message && err.message.startsWith("SSRF blocked")) {
      throw err;
    }
    throw new Error(`DNS resolution failed for '${hostname}': ${err.message || String(err)}`);
  }
}

/**
 * Validates an official company website with safe redirect following and SSRF protections.
 */
export async function validateOfficialWebsite(
  rawUrl: string,
  options: {
    companyName?: string;
    maxRedirects?: number;
    timeoutMs?: number;
    maxSizeBytes?: number;
  } = {},
): Promise<WebsiteValidationResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? 7000;
  const maxSizeBytes = options.maxSizeBytes ?? 1024 * 1024; // 1MB max

  let currentUrlStr = rawUrl.trim();
  if (!currentUrlStr.includes("://")) {
    currentUrlStr = `https://${currentUrlStr}`;
  }

  const visitedUrls = new Set<string>();
  const evidence: string[] = [];
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // Detect redirect loop
    if (visitedUrls.has(currentUrlStr)) {
      return {
        valid: false,
        confidence: 0.1,
        evidence: ["redirect_loop_detected"],
        error: `Redirect loop detected at ${currentUrlStr}`,
      };
    }
    visitedUrls.add(currentUrlStr);

    // SSRF Check
    try {
      await assertSafeUrlForFetch(currentUrlStr);
    } catch (ssrfErr: any) {
      return {
        valid: false,
        confidence: 0,
        evidence: ["ssrf_blocked"],
        error: ssrfErr.message,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrlStr, {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "GenZ360-Bot/1.0 (+https://genz360.in/bot)",
        },
        redirect: "manual", // Manually handle redirects so every step is SSRF verified!
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle 3xx redirects safely
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return {
            valid: false,
            confidence: 0.2,
            evidence: ["missing_redirect_location"],
            error: `HTTP ${response.status} redirect without Location header`,
          };
        }

        const nextUrl = new URL(location, currentUrlStr).toString();
        evidence.push(`redirected_to_${new URL(nextUrl).hostname}`);
        currentUrlStr = nextUrl;
        redirectCount++;
        continue;
      }

      if (!response.ok) {
        return {
          valid: false,
          confidence: 0.2,
          evidence: [`http_status_${response.status}`],
          error: `HTTP ${response.status}: ${response.statusText}`,
          httpStatus: response.status,
        };
      }

      // Check Content-Length if present
      const contentLength = Number(response.headers.get("content-length"));
      if (contentLength && contentLength > maxSizeBytes) {
        return {
          valid: false,
          confidence: 0.3,
          evidence: ["response_too_large"],
          error: `Response size ${contentLength} exceeds maximum ${maxSizeBytes} bytes`,
        };
      }

      // Read limited body text
      const bodyText = await response.text();
      if (bodyText.length > maxSizeBytes) {
        evidence.push("body_truncated_for_analysis");
      }

      const canonicalUrl = new URL(currentUrlStr);
      // Clean query params for canonical homepage
      canonicalUrl.search = "";
      canonicalUrl.hash = "";

      evidence.push("http_200_ok");
      if (currentUrlStr.startsWith("https://")) evidence.push("ssl_verified");

      // Verify domain match or company name snippet
      let confidence = 0.85;
      if (options.companyName) {
        const lowerBody = bodyText.slice(0, 100000).toLowerCase();
        const lowerName = options.companyName.toLowerCase();
        if (lowerBody.includes(lowerName)) {
          confidence = 0.95;
          evidence.push("company_name_found_in_page");
        }
      }

      return {
        valid: true,
        canonicalUrl: canonicalUrl.toString(),
        hostname: canonicalUrl.hostname.toLowerCase(),
        confidence,
        evidence,
        httpStatus: response.status,
      };
    } catch (fetchErr: any) {
      clearTimeout(timer);
      const isTimeout = fetchErr.name === "AbortError";
      return {
        valid: false,
        confidence: 0.1,
        evidence: [isTimeout ? "timeout" : "network_error"],
        error: isTimeout ? `Request timed out after ${timeoutMs}ms` : fetchErr.message,
      };
    }
  }

  return {
    valid: false,
    confidence: 0.2,
    evidence: ["exceeded_max_redirects"],
    error: `Exceeded maximum redirect limit of ${maxRedirects}`,
  };
}
