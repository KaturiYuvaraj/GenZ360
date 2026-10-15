/**
 * OAuth client configuration for GenZ360 (server-only — NEVER import from the client).
 */
export const PREVIEW_CLIENT_ID = "genz360_auth";
export const PREVIEW_CLIENT_SECRET =
  "8bcdb7fc5a33874ad933ca568918d5790388a0795e44c4d1dea691f801b17ec5";

/** The shared auth broker issuer (OIDC discovery lives under it). */
export const AUTH_ISSUER_DEFAULT = "https://auth.genz360.in";

/**
 * Host patterns whose callbacks the client accepts.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.genz360.in", "localhost"] as const;
