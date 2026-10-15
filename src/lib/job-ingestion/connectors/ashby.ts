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

export interface AshbyRawJob {
  id: string;
  title: string;
  department?: string | null;
  team?: string | null;
  location?: string | null;
  employmentType?: string | null;
  isRemote?: boolean;
  publishedAt?: string | null;
  descriptionHtml?: string;
  descriptionPlain?: string;
  jobUrl: string;
  applyUrl?: string;
  compensation?: {
    compensationTierSummary?: string;
  };
  secondaryLocations?: Array<{
    location?: string;
  }>;
}

interface AshbyApiResponse {
  apiVersion?: string;
  jobs?: AshbyRawJob[];
}

/**
 * Connector for Ashby Public Job Board API.
 * Uses official public API: https://api.ashbyhq.com/posting-api/job-board/{jobBoardName}?includeCompensation=true
 */
export class AshbyConnector extends BaseConnector<AshbyRawJob> {
  getSourceName(): JobSource {
    return "ashby";
  }

  getSourceJobId(raw: AshbyRawJob): string {
    return String(raw.id);
  }

  async fetchJobs(
    config: CompanySourceConfig,
    options: IngestionOptions = {},
  ): Promise<AshbyRawJob[]> {
    const board = config.boardIdentifier.trim().toLowerCase();
    if (!board) {
      throw new Error(`[Ashby] Missing boardIdentifier for company: ${config.companyName}`);
    }

    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`;

    const res = await this.fetchWithRetry(url, {
      timeoutMs: options.timeoutMs ?? 15000,
      headers: options.headers,
    });

    const data = (await res.json()) as AshbyApiResponse;
    if (!data || !Array.isArray(data.jobs)) {
      throw new Error(`[Ashby] Invalid response payload from ${url} — expected a jobs array`);
    }

    return data.jobs;
  }

  normalizeJob(raw: AshbyRawJob, config: CompanySourceConfig): NormalizedJob {
    const description =
      raw.descriptionPlain?.trim() ||
      cleanHtml(raw.descriptionHtml || "") ||
      `${raw.title} at ${config.companyName}`;

    const rawLoc = raw.location || (raw.isRemote ? "Remote" : "Onsite");
    const { location, city, country, isRemote } = normalizeLocation(rawLoc);

    const remoteType = raw.isRemote
      ? "remote"
      : normalizeRemoteType(location, raw.title);

    const employmentType = normalizeEmploymentType(raw.employmentType || raw.title);
    const experienceLevel = normalizeExperienceLevel(raw.title, description);

    // Extract compensation if explicitly provided in summary or description
    const salaryText = raw.compensation?.compensationTierSummary || description;
    const salaryInfo = normalizeSalary(salaryText);

    const department = raw.department || raw.team || null;
    const skills = extractSkills(`${raw.title} ${description}`);
    const contentHash = computeContentHash(raw.title, description, department);

    let postedAt = new Date().toISOString();
    if (raw.publishedAt && !isNaN(Date.parse(raw.publishedAt))) {
      postedAt = new Date(raw.publishedAt).toISOString();
    }

    const appUrl = raw.applyUrl || raw.jobUrl;

    return {
      title: raw.title.trim(),
      company: config.companyName.trim(),
      companySlug: config.companySlug,
      description,
      location,
      country,
      city,
      remoteType,
      remote: Boolean(raw.isRemote) || isRemote || remoteType === "remote",
      employmentType,
      experienceLevel,
      salary: salaryInfo.salary,
      salaryMin: salaryInfo.min,
      salaryMax: salaryInfo.max,
      currency: salaryInfo.currency,
      skills,
      department,
      postedAt,
      updatedAt: null,
      applicationUrl: appUrl,
      source: "ashby",
      sourceJobId: this.getSourceJobId(raw),
      sourceUrl: raw.jobUrl,
      contentHash,
      rawPayload: {
        id: raw.id,
        title: raw.title,
        department,
        publishedAt: raw.publishedAt,
      },
    };
  }
}
