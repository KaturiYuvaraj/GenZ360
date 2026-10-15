import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled, setBearerToken } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Page } from "@/components/layout/Page";
import { getMyProfile, upsertProfile } from "@/lib/data/me";
import type { Role } from "@/lib/ids";
import {
  GraduationCap,
  Briefcase,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Copy,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/portal")({
  component: PartnerPortal,
  validateSearch: (s: Record<string, unknown>): { role?: string } => ({
    role: typeof s.role === "string" ? s.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Partner & Institution Portals — GenZ360" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type PartnerRole = "college" | "employer" | "ground_owner";

const PORTALS: Record<
  PartnerRole,
  {
    title: string;
    shortTitle: string;
    badge: string;
    icon: typeof GraduationCap;
    tagline: string;
    features: string[];
    demoEmail: string;
    demoPassword: string;
    demoName: string;
    demoOrg: string;
    accent: string;
    accentBg: string;
    description: string;
  }
> = {
  college: {
    title: "College TPO & Career Cell",
    shortTitle: "School / College",
    badge: "Institutional Access",
    icon: GraduationCap,
    tagline:
      "Track campus student skill distribution, verified badges, placement percentages, and coordinate company recruitment drives.",
    features: [
      "Real-time campus student directory with CGPA & skill badges",
      "Cryptographically verified SHA-256 certificate tracker",
      "Campus recruitment drive coordination and student shortlists",
      "Placement analytics & package distribution reports",
    ],
    demoEmail: "college.tpo@genz360.in",
    demoPassword: "partner1234",
    demoName: "Dr. Arvind Rao (TPO Head)",
    demoOrg: "RV Institute of Technology",
    accent: "#10B981",
    accentBg: "#10B98114",
    description: "For university TPO officers, career cells, and placement teams managing campus recruiting.",
  },
  employer: {
    title: "Corporate Recruiter & Hiring Desk",
    shortTitle: "Company / Employer",
    badge: "Employer Access",
    icon: Briefcase,
    tagline:
      "Discover verified Gen Z talent, review live project portfolios, schedule interviews, and manage internship and job pipelines.",
    features: [
      "Talent discovery filtered by verified skills & sports badges",
      "Post campus jobs and stipended internships",
      "Integrated candidate interview scheduler",
      "Live hiring funnel: Applied → Shortlisted → Offered → Hired",
    ],
    demoEmail: "recruiter@genz360.in",
    demoPassword: "partner1234",
    demoName: "Priya Menon (Talent Acquisition)",
    demoOrg: "CredX Digital Solutions",
    accent: "#E85A3C",
    accentBg: "#E85A3C14",
    description: "For HR managers, talent acquisition teams, and startup founders hiring campus talent.",
  },
  ground_owner: {
    title: "Turf & Sports Arena Manager",
    shortTitle: "Ground Owner",
    badge: "Arena Partner Access",
    icon: MapPin,
    tagline:
      "Manage your box cricket pitches, football turfs, slot schedules, real-time customer bookings, and automated revenue settlements.",
    features: [
      "Live slot occupancy calendar and booking ledger",
      "Hourly pricing management & peak-hour adjustments",
      "Automated platform ledger and settlement tracking",
      "Instant booking confirmations and slot blocking",
    ],
    demoEmail: "turf.manager@genz360.in",
    demoPassword: "partner1234",
    demoName: "Vikram Reddy (Turf Operations)",
    demoOrg: "Smash Arena Sports Complex",
    accent: "#F59E0B",
    accentBg: "#F59E0B14",
    description: "For sports facility owners and managers running box cricket, football turfs, or multi-sport arenas.",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className="flex items-center gap-1 text-[10px] font-mono text-mute hover:text-ink transition-colors px-1.5 py-0.5 rounded hover:bg-paper-2"
    >
      {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PartnerPortal() {
  const search = Route.useSearch();
  const queryRole = search && typeof search === "object" && "role" in search ? (search as { role?: string }).role : undefined;
  const initialRole: PartnerRole =
    queryRole === "employer" || queryRole === "ground_owner" ? queryRole : "college";

  const [activeRole, setActiveRole] = useState<PartnerRole>(initialRole);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();
  const { user } = useCurrentUserState();

  const currentPortal = PORTALS[activeRole];
  const Icon = currentPortal.icon;

  function fillCredentials() {
    setEmail(currentPortal.demoEmail);
    setPassword(currentPortal.demoPassword);
    if (mode === "up") {
      setName(currentPortal.demoName);
      setOrg(currentPortal.demoOrg);
    }
  }

  async function handlePartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "up") {
        const upRes = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (upRes.error) throw new Error(upRes.error.message || "Failed to register account.");
        if (upRes.data?.token) setBearerToken(upRes.data.token);
      } else {
        let inRes = await authClient.signIn.email({ email, password });
        if (inRes.error && (email === currentPortal.demoEmail || inRes.error.message?.toLowerCase().includes("user not found") || inRes.error.message?.toLowerCase().includes("invalid"))) {
          // Attempt auto sign up for demo credentials
          const upRes = await authClient.signUp.email({
            email,
            password,
            name: name || currentPortal.demoName || email.split("@")[0],
          });
          if (!upRes.error || (upRes.error.message && upRes.error.message.includes("exists"))) {
            inRes = await authClient.signIn.email({ email, password });
          }
        }
        if (inRes.error) throw new Error(inRes.error.message || "Invalid credentials.");
        if (inRes.data?.token) setBearerToken(inRes.data.token);
      }

      await upsertProfile({
        data: {
          role: activeRole,
          display_name: name || (mode === "in" ? currentPortal.demoName : email.split("@")[0]),
          org_name: org || currentPortal.demoOrg,
          city: city || "Bengaluru",
          headline: `${currentPortal.title} at ${org || currentPortal.demoOrg}`,
        },
      });

      if (activeRole === "ground_owner") {
        window.location.href = `/admin?portal=ground_owner`;
      } else {
        window.location.href = "/app";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOneClickDemo(roleKey: PartnerRole) {
    setBusy(true);
    setError("");
    const portalConfig = PORTALS[roleKey];
    try {
      let inRes = await authClient.signIn.email({
        email: portalConfig.demoEmail,
        password: portalConfig.demoPassword,
      });

      if (inRes.error) {
        const upRes = await authClient.signUp.email({
          email: portalConfig.demoEmail,
          password: portalConfig.demoPassword,
          name: portalConfig.demoName,
        });
        if (upRes.error && !(upRes.error.message && upRes.error.message.includes("exists"))) {
          throw new Error(upRes.error.message || "Demo creation failed.");
        }
        inRes = await authClient.signIn.email({
          email: portalConfig.demoEmail,
          password: portalConfig.demoPassword,
        });
      }

      if (inRes.data?.token) {
        setBearerToken(inRes.data.token);
      }

      await upsertProfile({
        data: {
          role: roleKey,
          display_name: portalConfig.demoName,
          org_name: portalConfig.demoOrg,
          city: "Bengaluru",
          headline: `${portalConfig.title} · ${portalConfig.demoOrg}`,
        },
      });

      if (roleKey === "ground_owner") {
        window.location.href = `/admin?portal=ground_owner`;
      } else {
        window.location.href = "/app";
      }
    } catch (err) {
      console.error("handleOneClickDemo error:", err);
      setError(err instanceof Error ? err.message : "One-click demo sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page bare>
      <div className="gz-wrap py-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-gz-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Link to="/" className="text-xs text-mute hover:text-ink transition-colors flex items-center gap-1 mb-3">
                ← Return to public website
              </Link>
              <div className="flex items-center gap-2 mb-1">
                <span className="gz-beacon text-accent">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </span>
                <p className="gz-kicker">Partner & Institution Gate</p>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                Partner Portal Sign In
              </h1>
              <p className="mt-1 text-sm text-ink-soft max-w-[52ch]">
                Dedicated access for schools, companies, and sports ground owners on the GenZ360 platform.
              </p>
            </div>
            <Link to="/login" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs shrink-0">
              Student Sign In →
            </Link>
          </div>
        </div>

        {/* Portal Type Selector — prominent cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 animate-gz-fade-in">
          {(["college", "employer", "ground_owner"] as PartnerRole[]).map((r) => {
            const p = PORTALS[r];
            const TabIcon = p.icon;
            const isSelected = activeRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setActiveRole(r);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className={`gz-card-interactive relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-ink bg-white shadow-sm"
                    : "border-line bg-paper hover:border-ink/30 hover:bg-white"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-ink">
                    <Check className="h-3 w-3 text-paper" />
                  </span>
                )}
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                  style={{ backgroundColor: p.accentBg }}
                >
                  <TabIcon className="h-5 w-5" style={{ color: p.accent }} />
                </span>
                <p className="font-display text-sm font-bold text-ink">{p.shortTitle}</p>
                <p className="text-[11px] text-mute mt-0.5 leading-relaxed">{p.description}</p>
              </button>
            );
          })}
        </div>

        {/* Portal Body */}
        <div key={activeRole} className="animate-gz-fade-in grid gap-8 lg:grid-cols-[1fr_1fr] items-start">

          {/* Left: Credentials + Features */}
          <div className="space-y-5">
            {/* ── CREDENTIALS CARD (the key feature the user asked for) ── */}
            <div
              className="gz-card-interactive rounded-2xl border-2 p-5 space-y-4"
              style={{ borderColor: `${currentPortal.accent}40`, backgroundColor: currentPortal.accentBg }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: currentPortal.accent }} />
                  <span className="text-xs font-semibold text-ink" style={{ color: currentPortal.accent }}>
                    {currentPortal.badge} — Login Credentials
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/70 border border-line px-2 py-0.5 rounded-full text-mute">
                  Demo Account
                </span>
              </div>

              <div className="grid gap-2.5">
                <div className="flex items-center justify-between bg-white rounded-xl border border-line px-4 py-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-mute mb-0.5">Email</p>
                    <p className="font-mono text-sm font-semibold text-ink">{currentPortal.demoEmail}</p>
                  </div>
                  <CopyButton text={currentPortal.demoEmail} />
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl border border-line px-4 py-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-mute mb-0.5">Password</p>
                    <p className="font-mono text-sm font-semibold text-ink">{currentPortal.demoPassword}</p>
                  </div>
                  <CopyButton text={currentPortal.demoPassword} />
                </div>
                <div className="flex items-center justify-between bg-white/60 rounded-xl border border-line/60 px-4 py-2.5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-mute mb-0.5">Demo Name</p>
                    <p className="text-xs font-medium text-ink-soft">{currentPortal.demoName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/60 rounded-xl border border-line/60 px-4 py-2.5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-mute mb-0.5">Organization</p>
                    <p className="text-xs font-medium text-ink-soft">{currentPortal.demoOrg}</p>
                  </div>
                </div>
              </div>

              {/* One-click entry */}
              <button
                type="button"
                onClick={() => handleOneClickDemo(activeRole)}
                disabled={busy}
                className="w-full gz-btn !min-h-10 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 text-white"
                style={{ backgroundColor: currentPortal.accent, borderColor: currentPortal.accent }}
              >
                <Zap className="h-3.5 w-3.5" />
                {busy ? "Signing in…" : `One-Click ${currentPortal.shortTitle} Login`}
              </button>
            </div>

            {/* Features */}
            <div className="gz-card-interactive rounded-2xl border border-line bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: currentPortal.accent }} />
                <p className="gz-kicker">{currentPortal.title} — Features</p>
              </div>
              {currentPortal.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: currentPortal.accent }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="gz-panel rounded-[24px] p-6 sm:p-8 bg-white border border-line shadow-xs animate-gz-scale-in">
            <div className="flex items-center gap-3 mb-1">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl animate-gz-float"
                style={{ backgroundColor: currentPortal.accentBg }}
              >
                <Icon className="h-5 w-5" style={{ color: currentPortal.accent }} />
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: currentPortal.accent }}>
                  {currentPortal.badge}
                </span>
                <h2 className="font-display text-xl font-bold text-ink leading-tight">
                  {mode === "in" ? "Sign In" : "Register"}
                </h2>
              </div>
            </div>
            <p className="text-xs text-mute mb-5 mt-1">
              {mode === "in"
                ? `Authorized ${currentPortal.shortTitle.toLowerCase()} representatives sign in below.`
                : `Register your ${activeRole === "college" ? "institution" : activeRole === "employer" ? "company" : "sports facility"} on GenZ360.`}
            </p>

            {/* Quick fill from credentials */}
            <button
              type="button"
              onClick={fillCredentials}
              className="w-full mb-4 flex items-center justify-center gap-2 text-xs font-medium border border-dashed border-line rounded-xl py-2.5 text-mute hover:text-ink hover:border-ink/40 hover:bg-paper transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              Auto-fill demo credentials
            </button>

            <form className="space-y-3.5" onSubmit={handlePartnerSubmit}>
              {mode === "up" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">Representative Name</label>
                    <input
                      className="gz-input"
                      required
                      placeholder={currentPortal.demoName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">
                      {activeRole === "college"
                        ? "College / University Name"
                        : activeRole === "employer"
                        ? "Company / Organization"
                        : "Sports Facility / Turf Name"}
                    </label>
                    <input
                      className="gz-input"
                      required
                      placeholder={currentPortal.demoOrg}
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">City</label>
                    <input
                      className="gz-input"
                      required
                      placeholder="e.g. Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  className="gz-input"
                  placeholder={currentPortal.demoEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={8}
                    className="gz-input pr-10"
                    placeholder="Password (8+ chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full gz-btn gz-btn-primary !min-h-10 text-sm font-semibold mt-1"
              >
                {busy
                  ? "Authenticating…"
                  : mode === "in"
                  ? `Sign In as ${currentPortal.shortTitle}`
                  : "Complete Registration"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setError("");
                }}
                className="text-mute hover:text-ink transition-colors"
              >
                {mode === "in" ? "New partner? Register here" : "Already registered? Sign in"}
              </button>
              <Link to="/login" className="text-accent hover:underline">
                Student Login →
              </Link>
            </div>
          </div>
        </div>

        {/* All credentials summary at bottom */}
        <div className="mt-10 rounded-2xl border border-line bg-paper-2/60 p-5 animate-gz-fade-in">
          <p className="gz-kicker mb-4">All Partner Login Credentials — Quick Reference</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["college", "employer", "ground_owner"] as PartnerRole[]).map((r) => {
              const p = PORTALS[r];
              const RI = p.icon;
              return (
                <div
                  key={r}
                  className="gz-card-interactive bg-white rounded-xl border border-line p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: p.accentBg }}
                    >
                      <RI className="h-3.5 w-3.5" style={{ color: p.accent }} />
                    </span>
                    <span className="text-xs font-bold text-ink">{p.shortTitle}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-mute truncate">{p.demoEmail}</span>
                      <CopyButton text={p.demoEmail} />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-mute">{p.demoPassword}</span>
                      <CopyButton text={p.demoPassword} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole(r);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-[10px] font-semibold font-mono uppercase tracking-wider mt-1 py-1.5 rounded-lg border transition-colors hover:bg-paper"
                    style={{ borderColor: `${p.accent}60`, color: p.accent }}
                  >
                    Use this login →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Page>
  );
}
