import type { CompanyDiscoveryProvider } from "./provider-interface.ts";
import type {
  DiscoveredCompanyCandidate,
  DiscoverySearchOptions,
} from "../types.ts";

/**
 * Google Places API Integration.
 * Subject to Google Places applicable terms of service and retention policies:
 * - We only use Places to discover company names, official websites, and cities.
 * - We do NOT permanently copy Google Places geocodes, reviews, or proprietary details.
 * - Follows Google attribution guidelines.
 */
export class GooglePlacesProvider implements CompanyDiscoveryProvider {
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      null;
  }

  getProviderName(): string {
    return "google-places";
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
      missingKeys: configured ? [] : ["GOOGLE_MAPS_API_KEY"],
      description:
        "Google Places API for finding company offices, verified official websites, and corporate headquarters.",
    };
  }

  normalizeCompany(raw: any): DiscoveredCompanyCandidate {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid Google Places place object");
    }

    const name = String(raw.name || "").trim();
    if (!name) {
      throw new Error("Missing name in Google Places result");
    }

    const website = raw.website || null;
    const address = raw.formatted_address || raw.vicinity || "";
    
    // Extract city from address if possible
    let city: string | null = null;
    if (raw.address_components && Array.isArray(raw.address_components)) {
      const localityComp = raw.address_components.find((c: any) =>
        c.types?.includes("locality"),
      );
      if (localityComp) city = localityComp.long_name;
    }

    return {
      name,
      website: website ? String(website).trim() : null,
      industry: "Technology",
      location: address || "India",
      city: city,
      country: "India",
      providerIdentifier: raw.place_id ? String(raw.place_id) : null,
      providerName: this.getProviderName(),
      confidence: 0.90, // Places verified entities have high naming confidence
      metadata: {
        place_id: raw.place_id || null,
        data_source: "Google Places API (official website discovery)",
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
        "Google Places provider is not configured. Set GOOGLE_MAPS_API_KEY in the environment.",
      );
    }

    // Build search text query e.g. "Software companies in Bengaluru"
    const queryParts = [
      options.companyName || options.query || options.industry || "Software companies",
      options.location || options.city || "Bengaluru",
      options.country || "India",
    ].filter(Boolean);
    const textQuery = queryParts.join(" in ");

    const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      textQuery,
    )}&key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Google Places HTTP error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
        throw new Error(`Google Places API error: ${data.error_message || data.status}`);
      }

      const places = Array.isArray(data.results) ? data.results : [];
      const limit = options.limit ? Math.min(options.limit, places.length) : places.length;
      const candidates: DiscoveredCompanyCandidate[] = [];

      // For top candidates, fetch website via Place Details if not in Text Search
      for (let i = 0; i < limit; i++) {
        const place = places[i];
        let website = place.website;

        // If place details can provide the official website
        if (!website && place.place_id) {
          try {
            const detailsRes = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,formatted_address,address_components&key=${this.apiKey}`,
            );
            if (detailsRes.ok) {
              const detailsData = await detailsRes.json();
              if (detailsData.result?.website) {
                website = detailsData.result.website;
                place.website = website;
              }
              if (detailsData.result?.address_components) {
                place.address_components = detailsData.result.address_components;
              }
            }
          } catch {
            // Ignore place details failure and continue
          }
        }

        try {
          candidates.push(this.normalizeCompany(place));
        } catch {
          // Skip invalid place item
        }
      }

      return {
        companies: candidates,
        nextCursor: data.next_page_token || undefined,
        totalAvailable: candidates.length,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error("Google Places request timed out after 10,000ms");
      }
      throw err;
    }
  }
}
