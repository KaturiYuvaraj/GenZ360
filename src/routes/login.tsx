import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  authClient,
  authEnabled,
  setBearerToken,
} from "@/lib/auth/client";
import { Page } from "@/components/layout/Page";
import { getMyProfile, upsertProfile } from "@/lib/data/me";
import { activateProSubscription } from "@/lib/data/actions";
import { ArrowRight, Sparkles, Zap, AlertCircle, Crown } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (s: Record<string, unknown>): { mode?: string; redirect?: string } => ({
    mode: typeof s.mode === "string" ? s.mode : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Student Sign In — GenZ360" }] }),
});

const DEMO_STUDENT = {
  email: "student@genz360.in",
  password: "GenZ360SecurePass!",
  name: "Aarav Sharma",
  college: "RV College of Engineering, Bengaluru",
  course: "B.Tech in Computer Science",
  gradYear: "2027",
};

const PRO_STUDENT = {
  email: "katuriyuvaraj@gmail.com",
  password: "Sindhusha@7",
  name: "Yuvaraj Katuri",
  college: "RV College of Engineering, Bengaluru",
  course: "B.Tech Computer Science",
  gradYear: "2026",
};

function Login() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [proBusy, setProBusy] = useState(false);

  // If someone lands with mode=up, redirect them directly to the profile registration form
  useEffect(() => {
    if (search.mode === "up") {
      nav({ to: "/join", search: search.redirect ? { redirect: search.redirect } : undefined });
    }
  }, [search.mode, search.redirect, nav]);

  // Handle standard Email & Password Sign In
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      let res = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      // If user doesn't exist yet and it's the pro account, auto-provision
      if (res.error && trimmedEmail === PRO_STUDENT.email) {
        await authClient.signUp.email({
          email: PRO_STUDENT.email,
          password: PRO_STUDENT.password,
          name: PRO_STUDENT.name,
        });
        res = await authClient.signIn.email({
          email: PRO_STUDENT.email,
          password: PRO_STUDENT.password,
        });
      }

      if (res.error) {
        // Provide helpful feedback if account does not exist
        const msg = res.error.message || "";
        if (msg.toLowerCase().includes("user not found") || msg.toLowerCase().includes("invalid")) {
          throw new Error("No student account found with this email, or password incorrect. If you don't have an account, please fill the registration form to create your profile.");
        }
        throw new Error(msg || "Could not sign in.");
      }

      const token = (res.data as any)?.token || (res.data as any)?.session?.token;
      if (token) setBearerToken(token);

      // If logging in with the pro account, ensure pro tier is activated
      if (trimmedEmail === PRO_STUDENT.email) {
        await activateProSubscription().catch(() => {});
      }

      // Enforce student-only access to the website: non-students must use the admin panel
      const profile = await getMyProfile().catch(() => null);
      if (profile && profile.role && profile.role !== "student") {
        await authClient.signOut().catch(() => {});
        throw new Error("Access Denied: This portal is exclusively for students. Turf owners and partner administrators must sign in through the Admin Panel at /admin.");
      }

      // Perform a clean navigation so session rehydrates completely
      window.location.href = search.redirect || "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setBusy(false);
    }
  }

  // One-click pro student sign in
  async function handleOneClickPro() {
    setProBusy(true);
    setError("");
    try {
      let res = await authClient.signIn.email({
        email: PRO_STUDENT.email,
        password: PRO_STUDENT.password,
      });

      if (res.error) {
        const upRes = await authClient.signUp.email({
          email: PRO_STUDENT.email,
          password: PRO_STUDENT.password,
          name: PRO_STUDENT.name,
        });
        if (!upRes.error || upRes.error.message?.includes("exists")) {
          res = await authClient.signIn.email({
            email: PRO_STUDENT.email,
            password: PRO_STUDENT.password,
          });
        }
      }

      if (res.error) {
        throw new Error(res.error.message || "Could not log into Pro account.");
      }

      const token = (res.data as any)?.token || (res.data as any)?.session?.token;
      if (token) setBearerToken(token);

      try {
        await upsertProfile({
          data: {
            role: "student",
            display_name: PRO_STUDENT.name,
            city: "Bengaluru",
            phone: "+91 98765 43210",
            org_name: PRO_STUDENT.college,
            course: PRO_STUDENT.course,
            year_of_study: `Class of ${PRO_STUDENT.gradYear}`,
            headline: "Pro Student Builder · GenZ360 Certified",
            bio: "Pro Student Pass Holder with verified placement credentials, unlimited applications, and active turf discounts.",
          },
        });
        await activateProSubscription();
      } catch (pErr) {
        console.warn("Pro sync:", pErr);
      }

      window.location.href = search.redirect || "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Pro student account.");
      setProBusy(false);
    }
  }

  // One-click demo student sign in
  async function handleOneClickDemo() {
    setDemoBusy(true);
    setError("");
    try {
      let res = await authClient.signIn.email({
        email: DEMO_STUDENT.email,
        password: DEMO_STUDENT.password,
      });

      // If demo student doesn't exist yet in DB, automatically create it
      if (res.error) {
        const upRes = await authClient.signUp.email({
          email: DEMO_STUDENT.email,
          password: DEMO_STUDENT.password,
          name: DEMO_STUDENT.name,
        });
        if (!upRes.error || upRes.error.message?.includes("exists")) {
          res = await authClient.signIn.email({
            email: DEMO_STUDENT.email,
            password: DEMO_STUDENT.password,
          });
        }
      }

      if (res.error) {
        throw new Error(res.error.message || "Could not log into demo student.");
      }

      const token = (res.data as any)?.token || (res.data as any)?.session?.token;
      if (token) setBearerToken(token);

      // Ensure profile exists in profiles table
      try {
        await upsertProfile({
          data: {
            role: "student",
            display_name: DEMO_STUDENT.name,
            city: "Bengaluru",
            phone: "+91 98450 12345",
            org_name: DEMO_STUDENT.college,
            course: DEMO_STUDENT.course,
            year_of_study: `Class of ${DEMO_STUDENT.gradYear}`,
            headline: "CS Student @ RVCE · Full-Stack & Applied AI",
            bio: "Passionate about building performant web apps, competitive sports box cricket, and tech internships.",
          },
        });
      } catch (pErr) {
        console.warn("Demo profile sync:", pErr);
      }

      window.location.href = search.redirect || "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo account.");
      setDemoBusy(false);
    }
  }

  return (
    <Page bare>
      <div className="gz-wrap grid min-h-[75vh] items-center gap-12 py-12 lg:grid-cols-2">
        <div className="animate-gz-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="gz-beacon text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="gz-kicker">Student Portal</p>
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.05em]">
            Student sign in.
          </h1>
          <p className="mt-4 max-w-[38ch] text-ink-soft leading-relaxed text-sm sm:text-base">
            Access your student profile, verified skill certifications, sports bookings, internships, and campus placement drives.
          </p>

          {/* Quick Pro & Demo Student Access Callout */}
          <div className="mt-8 space-y-3 max-w-md">
            {/* Pro Student Pass Callout */}
            <div className="p-4 rounded-2xl border-2 border-amber-400/40 bg-amber-50/60 backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span>Pro Student Pass Account</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold border border-amber-300">
                  PRO MEMBER
                </span>
              </div>
              <p className="text-xs text-ink-soft mb-2.5">
                <strong>Yuvaraj Katuri</strong> ({PRO_STUDENT.email}) — Pre-activated with unlimited applications, AI ATS optimizer & 15% turf discounts.
              </p>
              <button
                type="button"
                onClick={handleOneClickPro}
                disabled={proBusy || busy || demoBusy}
                className="gz-btn bg-ink text-white hover:bg-ink-soft w-full text-xs py-2 flex items-center justify-center gap-2 shadow-xs cursor-pointer font-bold"
              >
                <span>{proBusy ? "Loading Pro Dashboard…" : "Enter as Pro Student (Yuvaraj Katuri)"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Demo Student Explorer Callout */}
            <div className="p-3.5 rounded-2xl border border-line bg-paper/60 backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span>Explorer Demo Access</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-2 text-mute font-semibold">
                  Free Tier
                </span>
              </div>
              <button
                type="button"
                onClick={handleOneClickDemo}
                disabled={demoBusy || busy || proBusy}
                className="gz-btn gz-btn-ghost w-full text-xs py-1.5 flex items-center justify-center gap-1.5 border border-line mt-2"
              >
                <span>{demoBusy ? "Accessing…" : "Demo Explorer (Aarav Sharma)"}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="gz-panel rounded-[24px] p-6 sm:p-8 animate-gz-scale-in shadow-lift bg-white border border-line">
          {authEnabled ? (
            <>
              {search.redirect && (
                <div className="mb-4 rounded-xl border border-accent/25 bg-accent/5 p-3.5 text-xs text-accent font-medium flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                  <span>
                    Please sign in to access{" "}
                    <strong>
                      {search.redirect === "/resume"
                        ? "the ATS Resume Builder"
                        : "this feature"}
                    </strong>
                    . You'll be redirected right back after login.
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-sm font-semibold text-ink">Sign In to Student Account</h2>
                <p className="text-xs text-mute mt-0.5">Enter your registered email and password to continue</p>
              </div>

              {error ? (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Sign In Form */}
              <form className="space-y-3" onSubmit={handleSignIn}>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                    Student Email
                  </label>
                  <input
                    className="gz-input"
                    type="email"
                    required
                    placeholder="e.g. student@college.edu or personal email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute">
                      Password
                    </label>
                  </div>
                  <input
                    className="gz-input"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Your 8+ character password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <button className="gz-btn gz-btn-primary w-full mt-2" disabled={busy || demoBusy}>
                  {busy ? "Signing in…" : "Sign in as Student"}
                </button>
              </form>

              {/* Prompt to fill registration form and create profile */}
              <div className="mt-6 pt-5 border-t border-line/60">
                <div className="rounded-2xl bg-paper/70 p-4 border border-line text-center">
                  <p className="text-xs font-semibold text-ink">Don't have an account?</p>
                  <p className="text-[11px] text-mute mt-1 mb-3 leading-relaxed">
                    First-time students must fill the 5-step registration form to set up their verified student passport & profile.
                  </p>
                  <Link
                    to="/join"
                    search={search.redirect ? { redirect: search.redirect } : undefined}
                    className="gz-btn gz-btn-accent w-full text-xs flex items-center justify-center gap-2 shadow-xs font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Fill Form & Create Student Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Partner & Institution Link */}
              <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-center text-xs text-mute">
                <span>Are you a partner, recruiter or turf owner? </span>
                <a
                  href="/portal"
                  className="ml-1.5 font-medium text-accent hover:underline flex items-center gap-1"
                >
                  Partner & Institution Portal ↗
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-mute">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </Page>
  );
}
