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

export interface WorkableRawJob {
  id?: string | number;
  shortcode: string;
  title: string;
  department?: string;
  url?: string;
  application_url?: string;
  shortlink?: string;
  created_at?: string;
  published_on?: string;
  location?:
    | {
        location_str?: string;
        city?: string;
        subregion?: string;
        region?: string;
        country?: string;
        country_code?: string;
        telecommuting?: boolean;
      }
    | string;
  telecommuting?: boolean;
  employment_type?: string;
  experience?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
  };
}

/**
 * Connector for Workable ATS.
 * Supports both public widget feed and authenticated SPI v3 endpoint.
 * Public feed: https://apply.workable.com/api/v1/widget/accounts/{account}
 * SPI v3 API: https://{subdomain}.workable.com/spi/v3/jobs?state=published (requires WORKABLE_API_KEY)
 */
export class WorkableConnector extends BaseConnector<WorkableRawJob> {
  getSourceName(): JobSource {
    return "workable";
  }

  getSourceJobId(raw: WorkableRawJob): string {
    return raw.shortcode || String(raw.id || "");
  }

  async fetchJobs(
    config: CompanySourceConfig,
    options: IngestionOptions = {},
  ): Promise<WorkableRawJob[]> {
    const subdomain = config.boardIdentifier.trim().toLowerCase();
    if (!subdomain) {
      throw new Error(`[Workable] Missing boardIdentifier for company: ${config.companyName}`);
    }

    const apiKey =
      (config.metadata?.apiKey as string | undefined) ||
      process.env.WORKABLE_API_KEY;

    let url: string;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (apiKey) {
      url = `https://${encodeURIComponent(subdomain)}.workable.com/spi/v3/jobs?state=published&limit=100`;
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      url = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(subdomain)}`;
    }

    const res = await this.fetchWithRetry(url, {
      timeoutMs: options.timeoutMs ?? 15000,
      headers,
    });

    const data = (await res.json()) as { jobs?: WorkableRawJob[]; results?: WorkableRawJob[] } | WorkableRawJob[];

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object") {
      if (Array.isArray(data.jobs)) {
        return data.jobs;
      }
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }

    throw new Error(
      `[Workable] Invalid response format from ${url} — expected a list or jobs array`,
    );
  }

  normalizeJob(raw: WorkableRawJob, config: CompanySourceConfig): NormalizedJob {
    // Build full description from Workable's description, requirements, benefits
    const descParts: string[] = [];
    if (raw.description) descParts.push(cleanHtml(raw.description));
    if (raw.requirements) descParts.push(`Requirements:\n${cleanHtml(raw.requirements)}`);
    if (raw.benefits) descParts.push(`Benefits:\n${cleanHtml(raw.benefits)}`);

    const fullDescription =
      descParts.join("\n\n").trim() || `${raw.title} at ${config.companyName}`;

    // Extract location
    let locationStr = "Remote";
    let isTelecommuting = Boolean(raw.telecommuting);

    if (raw.location) {
      if (typeof raw.location === "string") {
        locationStr = raw.location;
      } else {
        const parts = [raw.location.city, raw.location.region, raw.location.country].filter(Boolean);
        locationStr = raw.location.location_str || parts.join(", ") || "Remote";
        if (raw.location.telecommuting) {
          isTelecommuting = true;
        }
      }
    }

    const { location, city, country, isRemote: locIsRemote } = normalizeLocation(locationStr);
    const remoteType = normalizeRemoteType(
      location,
      raw.title,
      isTelecommuting ? "remote" : undefined,
    );
    const employmentType = normalizeEmploymentType(raw.employment_type || raw.title);
    const experienceLevel = normalizeExperienceLevel(raw.experience || raw.title, fullDescription);

    let salaryMin: number | null = raw.salary?.from ?? null;
    let salaryMax: number | null = raw.salary?.to ?? null;
    let currency: string | null = raw.salary?.currency ?? null;
    let salary: number | null = null;

    if (salaryMin !== null || salaryMax !== null) {
      salary = salaryMax ?? salaryMin;
    } else {
      const parsedSalary = normalizeSalary(fullDescription);
      salary = parsedSalary.salary;
      salaryMin = parsedSalary.min;
      salaryMax = parsedSalary.max;
      currency = parsedSalary.currency;
    }

    const department = raw.department?.trim() || null;
    const skills = extractSkills(`${raw.title} ${fullDescription}`);
    const contentHash = computeContentHash(raw.title, fullDescription, department);

    let postedAt = new Date().toISOString();
    const rawDate = raw.published_on || raw.created_at;
    if (rawDate) {
      const dt = new Date(rawDate);
      if (!isNaN(dt.getTime())) postedAt = dt.toISOString();
    }

    const applicationUrl =
      raw.application_url ||
      raw.shortlink ||
      raw.url ||
      `https://apply.workable.com/${config.boardIdentifier}/j/${raw.shortcode}/`;

    return {
      title: raw.title.trim(),
      company: config.companyName.trim(),
      companySlug: config.companySlug,
      description: fullDescription,
      location,
      country,
      city,
      remoteType,
      remote: locIsRemote || isTelecommuting || remoteType === "remote",
      employmentType,
      experienceLevel,
      salary,
      salaryMin,
      salaryMax,
      currency,
      skills,
      department,
      postedAt,
      updatedAt: null,
      applicationUrl,
      source: "workable",
      sourceJobId: this.getSourceJobId(raw),
      sourceUrl: raw.url || raw.shortlink || applicationUrl,
      contentHash,
      rawPayload: {
        shortcode: raw.shortcode,
        title: raw.title,
        department: raw.department,
      },
    };
  }
}
