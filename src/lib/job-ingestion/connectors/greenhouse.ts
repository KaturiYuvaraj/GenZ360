import { BaseConnector } from "../core/source-interface.ts";
import type {
  JobSource,
  CompanySourceConfig,
  IngestionOptions,
  NormalizedJob,
} from "../core/types.ts";
import {
  cleanHtml,
  normalizeLocation,
  normalizeRemoteType,
  normalizeEmploymentType,
  normalizeExperienceLevel,
  normalizeSalary,
  extractSkills,
} from "../core/normalizer.ts";
import { computeContentHash } from "../core/deduplicator.ts";

export interface GreenhouseRawJob {
  id: number | string;
  title: string;
  updated_at?: string;
  absolute_url: string;
  location?: {
    name?: string;
  };
  metadata?: Array<{
    id: number;
    name: string;
    value: unknown;
    value_type: string;
  }>;
  departments?: Array<{
    id: number;
    name: string;
  }>;
  offices?: Array<{
    id: number;
    name: string;
    location?: string;
  }>;
  content?: string;
}

interface GreenhouseApiResponse {
  jobs: GreenhouseRawJob[];
  meta?: {
    total?: number;
  };
}

/**
 * Connector for Greenhouse Public Job Board API.
 * Uses official public API: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 */
export class GreenhouseConnector extends BaseConnector<GreenhouseRawJob> {
  getSourceName(): JobSource {
    return "greenhouse";
  }

  getSourceJobId(raw: GreenhouseRawJob): string {
    return String(raw.id);
  }

  async fetchJobs(
    config: CompanySourceConfig,
    options: IngestionOptions = {},
  ): Promise<GreenhouseRawJob[]> {
    const board = config.boardIdentifier.trim().toLowerCase();
    if (!board) {
      throw new Error(`[Greenhouse] Missing boardIdentifier for company: ${config.companyName}`);
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;

    const res = await this.fetchWithRetry(url, {
      timeoutMs: options.timeoutMs ?? 15000,
      headers: options.headers,
    });

    const data = (await res.json()) as GreenhouseApiResponse;
    if (!data || !Array.isArray(data.jobs)) {
      throw new Error(`[Greenhouse] Invalid response payload from ${url}`);
    }

    return data.jobs;
  }

  normalizeJob(raw: GreenhouseRawJob, config: CompanySourceConfig): NormalizedJob {
    const rawContent = raw.content || "";
    const description = cleanHtml(rawContent) || `${raw.title} at ${config.companyName}`;
    const rawLoc = raw.location?.name || (raw.offices?.[0]?.location || raw.offices?.[0]?.name) || "Remote";

    const { location, city, country, isRemote } = normalizeLocation(rawLoc);
    const remoteType = normalizeRemoteType(location, raw.title);
    const employmentType = normalizeEmploymentType(raw.title);
    const experienceLevel = normalizeExperienceLevel(raw.title, description);
    const salaryInfo = normalizeSalary(description);
    const department = raw.departments?.[0]?.name || null;
    const skills = extractSkills(`${raw.title} ${description}`);

    const contentHash = computeContentHash(raw.title, description, department);

    return {
      title: raw.title.trim(),
      company: config.companyName.trim(),
      companySlug: config.companySlug,
      description,
      location,
      country,
      city,
      remoteType,
      remote: isRemote || remoteType === "remote",
      employmentType,
      experienceLevel,
      salary: salaryInfo.salary,
      salaryMin: salaryInfo.min,
      salaryMax: salaryInfo.max,
      currency: salaryInfo.currency,
      skills,
      department,
      postedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : new Date().toISOString(),
      updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : null,
      applicationUrl: raw.absolute_url,
      source: "greenhouse",
      sourceJobId: this.getSourceJobId(raw),
      sourceUrl: raw.absolute_url,
      contentHash,
      rawPayload: {
        id: raw.id,
        title: raw.title,
        updated_at: raw.updated_at,
        department,
      },
    };
  }
}
