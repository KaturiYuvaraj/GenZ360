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

export interface LeverRawPosting {
  id: string;
  text: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  categories?: {
    commitment?: string;
    department?: string;
    team?: string;
    location?: string;
    allLocations?: string[];
    workplaceType?: string;
  };
  description?: string;
  descriptionPlain?: string;
  lists?: Array<{
    text: string;
    content: string;
  }>;
  additional?: string;
  additionalPlain?: string;
  hostedUrl: string;
  applyUrl?: string;
}

/**
 * Connector for Lever Public Postings API.
 * Uses official public API: https://api.lever.co/v0/postings/{site}?mode=json
 */
export class LeverConnector extends BaseConnector<LeverRawPosting> {
  getSourceName(): JobSource {
    return "lever";
  }

  getSourceJobId(raw: LeverRawPosting): string {
    return String(raw.id);
  }

  async fetchJobs(
    config: CompanySourceConfig,
    options: IngestionOptions = {},
  ): Promise<LeverRawPosting[]> {
    const site = config.boardIdentifier.trim().toLowerCase();
    if (!site) {
      throw new Error(`[Lever] Missing boardIdentifier for company: ${config.companyName}`);
    }

    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`;

    const res = await this.fetchWithRetry(url, {
      timeoutMs: options.timeoutMs ?? 15000,
      headers: options.headers,
    });

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error(`[Lever] Invalid response format from ${url} — expected an array of postings`);
    }

    return data as LeverRawPosting[];
  }

  normalizeJob(raw: LeverRawPosting, config: CompanySourceConfig): NormalizedJob {
    // Compile comprehensive description from Lever's multi-part sections
    const descParts: string[] = [];

    const baseDesc = raw.descriptionPlain || cleanHtml(raw.description || "");
    if (baseDesc) descParts.push(baseDesc);

    if (Array.isArray(raw.lists)) {
      for (const section of raw.lists) {
        const header = section.text ? `${section.text}:\n` : "";
        const body = cleanHtml(section.content || "");
        if (body) descParts.push(`${header}${body}`);
      }
    }

    const additional = raw.additionalPlain || cleanHtml(raw.additional || "");
    if (additional) descParts.push(additional);

    const fullDescription = descParts.join("\n\n").trim() || `${raw.text} at ${config.companyName}`;

    const rawLoc = raw.categories?.location || "Remote";
    const { location, city, country, isRemote } = normalizeLocation(rawLoc);
    const remoteType = normalizeRemoteType(
      location,
      raw.text,
      raw.categories?.workplaceType,
    );
    const employmentType = normalizeEmploymentType(
      raw.categories?.commitment || raw.text,
    );
    const experienceLevel = normalizeExperienceLevel(raw.text, fullDescription);
    const salaryInfo = normalizeSalary(fullDescription);
    const department = raw.categories?.department || raw.categories?.team || null;
    const skills = extractSkills(`${raw.text} ${fullDescription}`);

    const contentHash = computeContentHash(raw.text, fullDescription, department);

    let postedAt = new Date().toISOString();
    if (raw.createdAt) {
      const dt = typeof raw.createdAt === "number" ? new Date(raw.createdAt) : new Date(Date.parse(raw.createdAt));
      if (!isNaN(dt.getTime())) postedAt = dt.toISOString();
    }

    let updatedAt: string | null = null;
    if (raw.updatedAt) {
      const udt = typeof raw.updatedAt === "number" ? new Date(raw.updatedAt) : new Date(Date.parse(raw.updatedAt));
      if (!isNaN(udt.getTime())) updatedAt = udt.toISOString();
    }

    const appUrl = raw.applyUrl || raw.hostedUrl;

    return {
      title: raw.text.trim(),
      company: config.companyName.trim(),
      companySlug: config.companySlug,
      description: fullDescription,
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
      postedAt,
      updatedAt,
      applicationUrl: appUrl,
      source: "lever",
      sourceJobId: this.getSourceJobId(raw),
      sourceUrl: raw.hostedUrl,
      contentHash,
      rawPayload: {
        id: raw.id,
        text: raw.text,
        categories: raw.categories,
      },
    };
  }
}
