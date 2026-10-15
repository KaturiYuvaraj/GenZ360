import type { CompanyDiscoveryProvider } from "./provider-interface.ts";
import { DirectorySearchProvider } from "./directory-provider.ts";
import { GooglePlacesProvider } from "./google-places-provider.ts";
import { TestDiscoveryProvider } from "./test-provider.ts";

export * from "./provider-interface.ts";
export * from "./directory-provider.ts";
export * from "./google-places-provider.ts";
export * from "./test-provider.ts";

const providerRegistry = new Map<string, CompanyDiscoveryProvider>();

// Register standard providers
const directoryProvider = new DirectorySearchProvider();
providerRegistry.set(directoryProvider.getProviderName(), directoryProvider);

const googlePlacesProvider = new GooglePlacesProvider();
providerRegistry.set(googlePlacesProvider.getProviderName(), googlePlacesProvider);

const testProvider = new TestDiscoveryProvider();
providerRegistry.set(testProvider.getProviderName(), testProvider);

/**
 * Registers or overrides a discovery provider
 */
export function registerDiscoveryProvider(provider: CompanyDiscoveryProvider): void {
  providerRegistry.set(provider.getProviderName(), provider);
}

/**
 * Retrieves a provider by name
 */
export function getDiscoveryProvider(name: string): CompanyDiscoveryProvider | null {
  return providerRegistry.get(name) || null;
}

/**
 * Selects the active configured discovery provider, prioritizing real providers over test providers.
 * If no real provider has keys set, returns null unless allowTestFallback is true.
 */
export function getActiveDiscoveryProvider(options?: {
  preferProvider?: string;
  allowTestFallback?: boolean;
}): CompanyDiscoveryProvider | null {
  if (options?.preferProvider) {
    const requested = providerRegistry.get(options.preferProvider);
    if (requested && requested.isConfigured()) return requested;
  }

  // 1. Try business directory
  const dir = providerRegistry.get("business-directory");
  if (dir && dir.isConfigured()) return dir;

  // 2. Try Google Places
  const places = providerRegistry.get("google-places");
  if (places && places.isConfigured()) return places;

  // 3. Fallback to test provider if explicitly enabled (e.g. in test env)
  if (options?.allowTestFallback || process.env.NODE_ENV === "test") {
    return providerRegistry.get("test-directory") || null;
  }

  return null;
}

/**
 * Returns configuration telemetry for all available discovery providers
 */
export function listDiscoveryProviderStatuses(): Array<{
  name: string;
  configured: boolean;
  missingKeys?: string[];
  description: string;
}> {
  return Array.from(providerRegistry.values()).map((p) => {
    const status = p.getConfigurationStatus();
    return {
      name: p.getProviderName(),
      configured: status.configured,
      missingKeys: status.missingKeys,
      description: status.description,
    };
  });
}
