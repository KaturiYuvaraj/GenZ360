import type {
  JobSource,
  CompanySourceConfig,
  IngestionOptions,
  NormalizedJob,
} from "./types.ts";
import { validateNormalizedJob } from "./validator.ts";

/**
 * Universal interface that every ATS connector must implement.
 * Connectors only translate external formats to GenZ360 NormalizedJob.
 */
export interface JobSourceConnector<TRaw = unknown> {
  getSourceName(): JobSource;
  getSourceJobId(raw: TRaw): string;
  discoverJobs(
    config: CompanySourceConfig,
    options?: IngestionOptions,
  ): Promise<string[]>;
  fetchJobs(
    config: CompanySourceConfig,
    options?: IngestionOptions,
  ): Promise<TRaw[]>;
  normalizeJob(raw: TRaw, config: CompanySourceConfig): NormalizedJob;
  validateJob(job: NormalizedJob): { valid: boolean; errors?: string[] };
}

/**
 * Base abstract connector providing safe fetch utilities, rate limiting, and retries.
 */
export abstract class BaseConnector<TRaw = unknown>
  implements JobSourceConnector<TRaw>
{
  abstract getSourceName(): JobSource;
  abstract getSourceJobId(raw: TRaw): string;
  abstract fetchJobs(
    config: CompanySourceConfig,
    options?: IngestionOptions,
  ): Promise<TRaw[]>;
  abstract normalizeJob(raw: TRaw, config: CompanySourceConfig): NormalizedJob;

  async discoverJobs(
    config: CompanySourceConfig,
    options?: IngestionOptions,
  ): Promise<string[]> {
    const rawJobs = await this.fetchJobs(config, options);
    return rawJobs.map((r) => this.getSourceJobId(r));
  }

  validateJob(job: NormalizedJob): { valid: boolean; errors?: string[] } {
    return validateNormalizedJob(job);
  }

  /**
   * Resilient HTTP GET wrapper with timeout, retry backoff, and failure isolation.
   */
  protected async fetchWithRetry(
    url: string,
    options: {
      timeoutMs?: number;
      retries?: number;
      headers?: Record<string, string>;
    } = {},
  ): Promise<Response> {
    const timeoutMs = options.timeoutMs ?? 15000;
    const maxRetries = options.retries ?? 2;
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "GenZ360-JobAggregator/1.0 (+https://genz360.in)",
            ...options.headers,
          },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.status === 429) {
          // Rate limited: backoff exponentially
          const retryAfter = Number(res.headers.get("Retry-After")) || Math.pow(2, attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 10000)));
          attempt++;
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText} from ${url}`);
        }

        return res;
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    throw new Error(
      `[${this.getSourceName()}] Failed to fetch ${url} after ${maxRetries + 1} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }
}
