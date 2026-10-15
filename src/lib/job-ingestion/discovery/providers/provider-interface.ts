import type {
  DiscoveredCompanyCandidate,
  DiscoverySearchOptions,
} from "../types.ts";

export interface CompanyDiscoveryProvider {
  getProviderName(): string;
  isConfigured(): boolean;
  getConfigurationStatus(): {
    configured: boolean;
    providerName: string;
    missingKeys?: string[];
    description: string;
  };
  searchCompanies(options: DiscoverySearchOptions): Promise<{
    companies: DiscoveredCompanyCandidate[];
    nextCursor?: string;
    totalAvailable?: number;
  }>;
  normalizeCompany(raw: unknown): DiscoveredCompanyCandidate;
}
