import { createFileRoute } from "@tanstack/react-router";
import {
  runCompanyDiscoveryPipeline,
  isDiscoveryPipelineRunning,
  getActiveDiscoveryProvider,
} from "@/lib/job-ingestion/services/discovery-service";

export const Route = createFileRoute("/api/discovery/cron")({
  server: {
    handlers: {
      GET: async ({ request }) => handleCron(request),
      POST: async ({ request }) => handleCron(request),
    },
  },
});

async function handleCron(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization") || "";
  const expectedSecret =
    process.env.DISCOVERY_CRON_SECRET ||
    process.env.CRON_SECRET ||
    "genz360-discovery-cron-secret";

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  // Protect cron endpoint from unauthorized public invocation
  if (!token || token !== expectedSecret) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized: Invalid or missing DISCOVERY_CRON_SECRET authorization token.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (isDiscoveryPipelineRunning()) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Discovery run already in progress. Skipping duplicate cron execution.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  const provider = getActiveDiscoveryProvider({ allowTestFallback: false });
  if (!provider || !provider.isConfigured()) {
    return new Response(
      JSON.stringify({
        ok: false,
        message:
          "Discovery provider unconfigured. Please configure COMPANY_SEARCH_API_KEY, BUSINESS_DIRECTORY_API_KEY, or GOOGLE_MAPS_API_KEY.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const summary = await runCompanyDiscoveryPipeline({
      provider: provider.getProviderName(),
      maxCompanies: Number(process.env.DISCOVERY_MAX_COMPANIES_PER_RUN) || 15,
      autoRegisterSources: true,
      autoSyncJobs: true,
    });

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
