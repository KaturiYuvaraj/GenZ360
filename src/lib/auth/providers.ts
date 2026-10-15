/**
 * Authentication identity providers for GenZ360.
 */
export type AuthProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream social provider id. */
  idp: string;
  /** Human label for the sign-in button. */
  label: string;
};

export const AUTH_PROVIDERS: readonly AuthProvider[] = [
  { providerId: "google", idp: "google", label: "Google" },
  { providerId: "x", idp: "twitter", label: "X" },
];
