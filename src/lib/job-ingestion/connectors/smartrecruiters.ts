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

export interface SmartRecruitersRawPosting {
  id: string;
  name: string;
  uuid?: string;
  company?: {
    identifier?: string;
    name?: string;
  };
  releasedDate?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
    manual?: string;
  };
  department?: {
    id?: string;
    label?: string;
  };
  typeOfEmployment?: {
    id?: string;
    label?: string;
  };
  experienceLevel?: {
    id?: string;
    label?: string;
  };
  jobAd?: {
    sections?: {
      jobDescription?: { title?: string; text?: string };
      qualifications?: { title?: string; text?: string };
      additionalInformation?: { title?: string; text?: string };
      companyDescription?: { title?: string; text?: string };
    };
  };
  compensation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  ref?: string;
  creator?: {
    name?: string;
  };
}

/**
 * Connector for SmartRecruiters Public Posting API.
 * Uses official API: https://api.smartrecruiters.com/v1/companies/{company}/postings
 * Optional authentication via X-SmartToken if SMARTRECRUITERS_API_KEY is configured.
 */
export class SmartRecruitersConnector extends BaseConnector<SmartRecruitersRawPosting> {
  getSourceName(): JobSource {
    return "smartrecruiters";
  }

  getSourceJobId(raw: SmartRecruitersRawPosting): string {
    return String(raw.id);
  }

  async fetchJobs(
    config: CompanySourceConfig,
    options: IngestionOptions = {},
  ): Promise<SmartRecruitersRawPosting[]> {
    const company = config.boardIdentifier.trim();
    if (!company) {
      throw new Error(`[SmartRecruiters] Missing boardIdentifier for company: ${config.companyName}`);
    }

    const apiKey =
      (config.metadata?.apiKey as string | undefined) ||
      process.env.SMARTRECRUITERS_API_KEY;

    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (apiKey) {
      headers["X-SmartToken"] = apiKey;
    }

    const res = await this.fetchWithRetry(url, {
      timeoutMs: options.timeoutMs ?? 15000,
      headers,
    });

    const data = (await res.json()) as { content?: SmartRecruitersRawPosting[] };

    if (!data || !Array.isArray(data.content)) {
      throw new Error(`[SmartRecruiters] Invalid response format from ${url} — expected a 'content' array`);
    }

    return data.content;
  }

  normalizeJob(raw: SmartRecruitersRawPosting, config: CompanySourceConfig): NormalizedJob {
    // Compile description
    const descParts: string[] = [];
    const sections = raw.jobAd?.sections;
    if (sections) {
      if (sections.jobDescription?.text) {
        descParts.push(cleanHtml(sections.jobDescription.text));
      }
      if (sections.qualifications?.text) {
        descParts.push(`Qualifications:\n${cleanHtml(sections.qualifications.text)}`);
      }
      if (sections.additionalInformation?.text) {
        descParts.push(cleanHtml(sections.additionalInformation.text));
      }
    }

    const fullDescription =
      descParts.join("\n\n").trim() || `${raw.name} at ${config.companyName}`;

    // Location extraction
    const locParts: string[] = [];
    if (raw.location?.city) locParts.push(raw.location.city);
    if (raw.location?.region) locParts.push(raw.location.region);
    if (raw.location?.country) locParts.push(raw.location.country);
    if (raw.location?.manual) locParts.push(raw.location.manual);

    const rawLoc = locParts.join(", ") || (raw.location?.remote ? "Remote" : "Unknown");
    const { location, city, country, isRemote: locIsRemote } = normalizeLocation(rawLoc);

    const isExplicitRemote = Boolean(raw.location?.remote);
    const remoteType = normalizeRemoteType(
      location,
      raw.name,
      isExplicitRemote ? "remote" : undefined,
    );

    const employmentType = normalizeEmploymentType(
      raw.typeOfEmployment?.label || raw.typeOfEmployment?.id || raw.name,
    );
    const experienceLevel = normalizeExperienceLevel(
      raw.experienceLevel?.label || raw.experienceLevel?.id || raw.name,
      fullDescription,
    );

    // Compensation
    let salaryMin: number | null = raw.compensation?.min ?? null;
    let salaryMax: number | null = raw.compensation?.max ?? null;
    let currency: string | null = raw.compensation?.currency ?? null;
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

    const department = raw.department?.label || raw.department?.id || null;
    const skills = extractSkills(`${raw.name} ${fullDescription}`);
    const contentHash = computeContentHash(raw.name, fullDescription, department);

    let postedAt = new Date().toISOString();
    if (raw.releasedDate) {
      const dt = new Date(raw.releasedDate);
      if (!isNaN(dt.getTime())) postedAt = dt.toISOString();
    }

    const applicationUrl =
      raw.ref && raw.ref.startsWith("http")
        ? raw.ref
        : `https://jobs.smartrecruiters.com/${encodeURIComponent(config.boardIdentifier)}/${raw.id}`;

    return {
      title: raw.name.trim(),
      company: config.companyName.trim(),
      companySlug: config.companySlug,
      description: fullDescription,
      location,
      country,
      city,
      remoteType,
      remote: locIsRemote || isExplicitRemote || remoteType === "remote",
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
      source: "smartrecruiters",
      sourceJobId: this.getSourceJobId(raw),
      sourceUrl: applicationUrl,
      contentHash,
      rawPayload: {
        id: raw.id,
        name: raw.name,
        company: raw.company,
        location: raw.location,
        department: raw.department,
      },
    };
  }
}
