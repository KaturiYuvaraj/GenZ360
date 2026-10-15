import { useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { AUTH_PROVIDERS, authEnabled, signIn, signOut } from "./client";
import { resolveSignInGateState } from "./sign-in-gate";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

/**
 * Auth state components — plain wrappers around `useCurrentUserState()`.
 *
 * With auth on, visitors are signed out until they authenticate — in the sandbox
 * live preview too, which does real sign-in. The shared dev user appears only
 * when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
 * While the session is still resolving, gates that care about signed-out state
 * render nothing so there's no signed-out flash on hard reload.
 */

/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
export const SIGN_IN_PATH = "/login";

/** Render children only when a user is present (real session, or the disabled-auth dev user). */
export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

/**
 * Render children only once we KNOW the visitor is signed out (`isPending` has
 * cleared and there is no user). Hidden while the session is still loading.
 */
export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

/**
 * Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
 * `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
 * session loading, which feels like a second "Loading…" on /login.
 *
 * Guard routes by waiting out `isPending` first (see `use-current-user`), then
 * render this.
 */
export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function SignInGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  const state = resolveSignInGateState({ isPending, hasUser: user !== null });
  if (state === "pending") return null;
  if (state === "signed_in") return <>{children}</>;
  return <>{fallback ?? <SignInButtons />}</>;
}

export function SignInButtons() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {AUTH_PROVIDERS.map((p) => (
        <button
          key={p.providerId}
          type="button"
          onClick={() => signIn(p.providerId, { callbackURL: "/" })}
          className="w-full cursor-pointer rounded-md border border-neutral-300 px-4 py-2 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Continue with {p.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Minimal signed-in identity chip + sign-out.
 */
import { LogOut } from "lucide-react";

export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-paper/60 pl-1 pr-2.5 py-1 shadow-2xs hover:border-line-strong hover:bg-paper transition-all">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt={label}
          className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10"
        />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-white text-xs font-bold shadow-2xs">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-xs font-semibold text-ink max-w-[120px] truncate">{label}</span>
      {authEnabled && (
        <>
          <span className="h-3.5 w-px bg-line/80 mx-0.5" />
          <button
            type="button"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            }}
            className="cursor-pointer inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-soft hover:bg-coral/10 hover:text-coral transition-colors disabled:cursor-wait"
            title="Sign out of account"
          >
            <LogOut className="h-3 w-3 text-coral/80" />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </>
      )}
    </div>
  );
}

