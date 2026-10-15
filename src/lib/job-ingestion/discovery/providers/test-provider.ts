import type { CompanyDiscoveryProvider } from "./provider-interface.ts";
import type {
  DiscoveredCompanyCandidate,
  DiscoverySearchOptions,
} from "../types.ts";

/**
 * Mock & Test Provider used for unit testing, CI pipelines, and deterministic integration tests.
 */
export class TestDiscoveryProvider implements CompanyDiscoveryProvider {
  private mockCandidates: DiscoveredCompanyCandidate[];

  constructor(customCandidates?: DiscoveredCompanyCandidate[]) {
    this.mockCandidates = customCandidates || [
      {
        name: "Acme Cloud Technologies",
        website: "https://acme-cloud.example.com",
        industry: "Cloud Infrastructure",
        location: "Hyderabad, Telangana, India",
        city: "Hyderabad",
        state: "Telangana",
        country: "India",
        sizeRange: "51-200",
        providerIdentifier: "test-comp-101",
        providerName: "test-directory",
        confidence: 0.95,
      },
      {
        name: "FinPulse Payments",
        website: "https://finpulse.example.com",
        industry: "Fintech",
        location: "Bengaluru, Karnataka, India",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        sizeRange: "201-500",
        providerIdentifier: "test-comp-102",
        providerName: "test-directory",
        confidence: 0.92,
      },
      {
        name: "Nexus AI Labs",
        website: "https://nexus-ai.example.com",
        industry: "Artificial Intelligence",
        location: "Pune, Maharashtra, India",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        sizeRange: "11-50",
        providerIdentifier: "test-comp-103",
        providerName: "test-directory",
        confidence: 0.90,
      },
    ];
  }

  getProviderName(): string {
    return "test-directory";
  }

  isConfigured(): boolean {
    return true;
  }

  getConfigurationStatus() {
    return {
      configured: true,
      providerName: this.getProviderName(),
      description: "In-memory test provider for unit tests and local simulations.",
    };
  }

  normalizeCompany(raw: any): DiscoveredCompanyCandidate {
    return {
      name: String(raw.name),
      website: raw.website ? String(raw.website) : null,
      industry: String(raw.industry || "Technology"),
      location: String(raw.location || "India"),
      city: raw.city || null,
      state: raw.state || null,
      country: raw.country || "India",
      sizeRange: raw.sizeRange || null,
      providerIdentifier: raw.providerIdentifier || null,
      providerName: this.getProviderName(),
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.9,
    };
  }

  async searchCompanies(options: DiscoverySearchOptions): Promise<{
    companies: DiscoveredCompanyCandidate[];
    nextCursor?: string;
    totalAvailable?: number;
  }> {
    let filtered = [...this.mockCandidates];

    if (options.query) {
      const q = options.query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.industry && c.industry.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)),
      );
    }

    if (options.city) {
      const city = options.city.toLowerCase();
      filtered = filtered.filter((c) => c.city && c.city.toLowerCase().includes(city));
    }

    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      companies: filtered,
      totalAvailable: filtered.length,
    };
  }
}
