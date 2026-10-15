import type { CompanyDiscoveryProvider } from "./provider-interface.ts";
import type {
  DiscoveredCompanyCandidate,
  DiscoverySearchOptions,
} from "../types.ts";

export class DirectorySearchProvider implements CompanyDiscoveryProvider {
  private apiKey: string | null;
  private apiUrl: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey =
      apiKey ||
      process.env.COMPANY_SEARCH_API_KEY ||
      process.env.BUSINESS_DIRECTORY_API_KEY ||
      null;
    this.apiUrl =
      apiUrl ||
      process.env.COMPANY_SEARCH_API_URL ||
      "https://api.businessdirectory.io/v1/companies";
  }

  getProviderName(): string {
    return "business-directory";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getConfigurationStatus(): {
    configured: boolean;
    providerName: string;
    missingKeys?: string[];
    description: string;
  } {
    const configured = this.isConfigured();
    return {
      configured,
      providerName: this.getProviderName(),
      missingKeys: configured ? [] : ["COMPANY_SEARCH_API_KEY or BUSINESS_DIRECTORY_API_KEY"],
      description:
        "Licensed commercial business directory API for discovering registered corporate entities and websites.",
    };
  }

  normalizeCompany(raw: any): DiscoveredCompanyCandidate {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid company payload");
    }

    const name = String(raw.name || raw.company_name || raw.title || "").trim();
    if (!name) {
      throw new Error("Missing company name in directory payload");
    }

    const website = raw.website || raw.domain || raw.url || null;
    const industry = raw.industry || raw.category || raw.sector || "Technology";
    const city = raw.city || raw.locality || null;
    const state = raw.state || raw.region || null;
    const country = raw.country || "India";
    const location =
      raw.location ||
      [city, state, country].filter(Boolean).join(", ") ||
      "India";

    return {
      name,
      website: website ? String(website).trim() : null,
      industry: String(industry).trim(),
      location: String(location).trim(),
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      country: country ? String(country).trim() : null,
      sizeRange: raw.company_size || raw.size_range || null,
      providerIdentifier: raw.id || raw.company_id ? String(raw.id || raw.company_id) : null,
      providerName: this.getProviderName(),
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.85,
      metadata: {
        source_id: raw.id || null,
        registration_number: raw.registration_number || null,
        founded_year: raw.founded_year || null,
      },
    };
  }

  async searchCompanies(options: DiscoverySearchOptions): Promise<{
    companies: DiscoveredCompanyCandidate[];
    nextCursor?: string;
    totalAvailable?: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error(
        "Directory search provider is not configured. Set COMPANY_SEARCH_API_KEY in the environment.",
      );
    }

    const queryParams = new URLSearchParams();
    if (options.query) queryParams.set("q", options.query);
    if (options.location) queryParams.set("location", options.location);
    if (options.city) queryParams.set("city", options.city);
    if (options.state) queryParams.set("state", options.state);
    if (options.country) queryParams.set("country", options.country);
    if (options.industry) queryParams.set("industry", options.industry);
    if (options.companyName) queryParams.set("name", options.companyName);
    if (options.sizeRange) queryParams.set("size", options.sizeRange);
    if (options.limit) queryParams.set("limit", String(options.limit));
    if (options.cursor) queryParams.set("cursor", options.cursor);

    const targetUrl = `${this.apiUrl}?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
          "User-Agent": "GenZ360-CompanyDiscovery/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        throw new Error("Business directory API rate limit reached. Please retry later.");
      }

      if (!response.ok) {
        throw new Error(
          `Directory API error HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const rawList: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.companies)
        ? data.companies
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data)
        ? data.data
        : [];

      const companies = rawList
        .map((item) => {
          try {
            return this.normalizeCompany(item);
          } catch {
            return null;
          }
        })
        .filter((c): c is DiscoveredCompanyCandidate => c !== null);

      return {
        companies,
        nextCursor: data.next_cursor || data.nextCursor || undefined,
        totalAvailable: typeof data.total === "number" ? data.total : companies.length,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error("Directory search request timed out after 10,000ms");
      }
      throw err;
    }
  }
}
