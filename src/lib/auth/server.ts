/**
 * Self-hosted Better Auth for GenZ360 (server-only).
 *
 * Pre-wired for local dev + production deploy. To enable local email/password,
 * flip the flag in `./email-password`.
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in federates to OAuth providers via the
 * `genericOAuth` plugin.
 *
 * NEVER import this from client code — it pulls in `pg` + server-only Better Auth internals.
 * The client uses `@/lib/auth/client`; components read the user via `@/lib/auth/use-current-user`;
 * server functions get a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { AUTH_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  AUTH_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __genz360AuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__genz360AuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__genz360AuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. Set VITE_AUTH_ENABLED=false to force auth off (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

// OAuth credentials
const oauthIssuer = env("AUTH_ISSUER") ?? AUTH_ISSUER_DEFAULT;
const oauthClientId = env("AUTH_CLIENT_ID") ?? PREVIEW_CLIENT_ID;
const oauthClientSecret = env("AUTH_CLIENT_SECRET") ?? PREVIEW_CLIENT_SECRET;

/** True when federated sign-in is active (real auth is enforced). */
export const authConfigured =
  !authDisabled && Boolean(oauthClientId && oauthClientSecret);

const explicitBaseURL = env("BETTER_AUTH_URL");
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];

const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://[::1]:8081",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:*",
  "http://127.0.0.1:*",
  "http://[::1]:*",
  "https://localhost:*",
  "https://127.0.0.1:*",
  "http://localhost",
  "http://127.0.0.1",
  "http://[::1]",
];

const baseURL = explicitBaseURL ?? {
  allowedHosts: [
    ...previewAllowedHosts,
    "localhost",
    "127.0.0.1",
    "[::1]",
    "localhost:*",
    "127.0.0.1:*",
    "[::1]:*",
  ],
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
};

// Base list of trusted origins
const staticTrustedOrigins: string[] = explicitBaseURL
  ? [explicitBaseURL, ...LOCAL_DEV_ORIGINS]
  : [
      ...previewAllowedHosts,
      ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
      ...LOCAL_DEV_ORIGINS,
    ];

// Dynamic trustedOrigins resolver to accept requests from any local development port or private network
const trustedOrigins = async (request?: Request): Promise<string[]> => {
  const origins = new Set<string>(staticTrustedOrigins);
  if (request) {
    const rawOrigin = request.headers.get("origin") || request.headers.get("referer");
    if (rawOrigin) {
      try {
        const parsed = new URL(rawOrigin);
        const host = parsed.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "::1" ||
          host === "[::1]" ||
          host.endsWith(".localhost") ||
          host.startsWith("192.168.") ||
          host.startsWith("10.") ||
          host.startsWith("172.") ||
          host.endsWith(".vercel.app")
        ) {
          origins.add(parsed.origin);
        }
      } catch {
        // Invalid origin format
      }
    }
  }
  return Array.from(origins);
};

const databaseUrl = env("DATABASE_URL");

const issuerBase = oauthIssuer.replace(/\/+$/, "");
const oauthAuthorizationUrl = `${issuerBase}/api/auth/oauth2/authorize`;
const oauthTokenUrl = `${issuerBase}/api/auth/oauth2/token`;
const oauthUserInfoUrl = `${issuerBase}/api/auth/oauth2/userinfo`;

const isLocalDb =
  Boolean(databaseUrl?.includes("localhost") || databaseUrl?.includes("127.0.0.1"));
const database = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: isLocalDb ? false : { rejectUnauthorized: false },
    })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name — also read by the sign-in popup completion page. */
export const SESSION_TOKEN_COOKIE = "__Host-genz360-auth.session_token";

const federatedOAuthPlugin = authConfigured
  ? genericOAuth({
      config: AUTH_PROVIDERS.map(({ providerId, idp }) => ({
        providerId,
        clientId: oauthClientId as string,
        clientSecret: oauthClientSecret as string,
        authorizationUrl: oauthAuthorizationUrl,
        tokenUrl: oauthTokenUrl,
        userInfoUrl: oauthUserInfoUrl,
        scopes: ["openid", "profile", "email"],
        authorizationUrlParams: { idp, prompt: "login" },
      })),
    })
  : null;

export const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,
  trustedOrigins,

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: AUTH_PROVIDERS.map((p) => p.providerId),
      requireLocalEmailVerified: false,
    },
  },

  session: { cookieCache: { enabled: true, maxAge: 300 } },

  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),

  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-genz360-auth.session_data" },
      account_data: { name: "__Host-genz360-auth.account_data" },
      dont_remember: { name: "__Host-genz360-auth.dont_remember" },
    },
  },

  plugins: [
    ...(federatedOAuthPlugin ? [federatedOAuthPlugin] : []),
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

export { AUTH_PROVIDERS } from "./providers";
