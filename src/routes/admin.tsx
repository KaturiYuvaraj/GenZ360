import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { authClient, signOut as authSignOut, setBearerToken } from "@/lib/auth/client";
import { upsertProfile, getMyProfile, type Profile } from "@/lib/data/me";
import { TurfOwnerAdminPanel } from "@/components/admin/TurfOwnerAdminPanel";
import {
  adminOverview,
  adminAnalysis,
  adminPeople,
  adminChangeRole,
  adminPayments,
  adminContent,
  adminAuditLog,
  adminLogin,
  adminVerifySession,
  adminListJobSources,
  adminToggleJobSource,
  adminSyncJobSource,
  adminSyncAllJobSources,
  adminSeedJobSources,
  adminStartCompanyDiscovery,
  adminGetDiscoveryStatus,
  adminListDiscoveredCompanies,
  adminListCandidateSources,
  adminReviewCompanySource,
  adminRetryCompanyDiscovery,
} from "@/lib/data/actions";
import { rupees, ROLE_LABEL, type Role } from "@/lib/ids";
import {
  Users,
  Zap,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Trophy,
  Award,
  CreditCard,
  MapPin,
  RefreshCw,
  Shield,
  TrendingUp,
  FileText,
  Bell,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Activity,
  Layers,
  DollarSign,
  UserCog,
  ChevronDown,
  X,
  Package,
  Sparkles,
  Building2,
  PieChart,
  Compass,
  Globe,
  RotateCcw,
  Sliders,
  Check,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
  validateSearch: (s: Record<string, unknown>): { portal?: string } => ({
    portal: typeof s.portal === "string" ? s.portal : undefined,
  }),
  head: () => ({
    meta: [
      { title: "GenZ360 Admin & Partner Portal — Control Plane" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Overview = Awaited<ReturnType<typeof adminOverview>>;
type AnalysisData = Awaited<ReturnType<typeof adminAnalysis>>;
type Person = Awaited<ReturnType<typeof adminPeople>>[number];
type PaymentData = Awaited<ReturnType<typeof adminPayments>>;
type ContentData = Awaited<ReturnType<typeof adminContent>>;
type AuditEntry = Awaited<ReturnType<typeof adminAuditLog>>[number];
type JobSourcesData = Awaited<ReturnType<typeof adminListJobSources>>;
type DiscoveryStatusData = Awaited<ReturnType<typeof adminGetDiscoveryStatus>>;
type DiscoveredCompaniesData = Awaited<ReturnType<typeof adminListDiscoveredCompanies>>;
type CandidateSourcesData = Awaited<ReturnType<typeof adminListCandidateSources>>;

type Section = "overview" | "analysis" | "people" | "revenue" | "content" | "job_sources" | "audit";

const ROLE_COLORS: Record<string, string> = {
  student: "bg-accent/10 text-accent",
  employer: "bg-coral/10 text-coral",
  college: "bg-mint/10 text-mint",
  ground_owner: "bg-amber-100 text-amber-700",
  super_admin: "bg-ink/10 text-ink font-bold",
};

const ALL_ROLES = ["student", "employer", "college", "ground_owner", "super_admin"] as const;

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sublabel,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
  sublabel?: string;
  trend?: number;
}) {
  return (
    <div className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <p className="gz-kicker text-mute">{label}</p>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
          style={{ backgroundColor: accent ? `${accent}18` : "#f3f0e8" }}
        >
          <Icon size={18} color={accent ?? "#6a717c"} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {sublabel && <p className="text-xs text-mute">{sublabel}</p>}
        {trend !== undefined && (
          <span className={`text-[11px] font-mono font-semibold transition-transform duration-200 group-hover:scale-105 ${trend >= 0 ? "text-mint" : "text-coral"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[role] ?? "bg-paper-2 text-ink-soft"}`}>
      {ROLE_LABEL[role as Role] ?? role}
    </span>
  );
}

function RoleChangeDropdown({
  person,
  onChanged,
}: {
  person: Person;
  onChanged: (userId: string, newRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Dismiss on window scroll or resize so it stays anchored properly
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 185;
    const menuHeight = ALL_ROLES.length * 36 + 32; // ~212px total
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If space below is tighter than menu height, and there is more room above, open UPWARD
    const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const top = openUpward
      ? Math.max(10, rect.top - menuHeight - 6)
      : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 6);

    // Align to the right edge of the button, keeping at least 10px from viewport boundary
    const left = Math.max(10, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth));

    setMenuPos({ top, left });
    setOpen(true);
  }

  async function changeRole(newRole: string) {
    if (newRole === person.role) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await adminChangeRole({ data: { targetUserId: person.user_id, newRole } });
      onChanged(person.user_id, newRole);
    } catch {
      /* silently ignore */
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  const menu = open && menuPos ? (
    <>
      {/* Fixed backdrop over the entire viewport */}
      <div
        className="fixed inset-0 z-[9998] bg-transparent cursor-default"
        onClick={() => setOpen(false)}
      />
      {/* Portaled dropdown panel completely immune to table overflow:hidden */}
      <div
        className="fixed z-[9999] rounded-xl border border-line bg-white shadow-2xl py-1 text-xs select-none animate-gz-scale-in origin-top"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: 185,
          maxHeight: "calc(100vh - 20px)",
          overflowY: "auto",
        }}
      >
        <div className="px-3 py-1.5 border-b border-line/60 text-[10px] font-mono text-mute uppercase tracking-wider">
          Assign Role
        </div>
        <div className="py-1">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => changeRole(r)}
              className={`w-full text-left px-3 py-2 hover:bg-paper transition-colors flex items-center justify-between gap-2.5 ${
                r === person.role ? "font-semibold text-ink bg-paper/60" : "text-ink-soft"
              }`}
            >
              <span>{ROLE_LABEL[r] ?? r}</span>
              {r === person.role && <CheckCircle2 className="h-3.5 w-3.5 text-mint shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        disabled={busy}
        onClick={toggleMenu}
        title="Change user role"
        className="flex items-center gap-1 text-xs text-mute hover:text-ink px-2 py-1 rounded-lg hover:bg-paper transition-colors disabled:opacity-40"
      >
        <UserCog className="h-3.5 w-3.5" />
        <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}


function AdminPanel() {
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<PaymentData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [jobSourcesData, setJobSourcesData] = useState<JobSourcesData | null>(null);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [seedingSources, setSeedingSources] = useState(false);
  const [jobSourceNotice, setJobSourceNotice] = useState<string>("");

  // Automated Company Discovery state
  const [discoveryStatusData, setDiscoveryStatusData] = useState<DiscoveryStatusData | null>(null);
  const [discoveredCompaniesData, setDiscoveredCompaniesData] = useState<DiscoveredCompaniesData | null>(null);
  const [candidateSourcesData, setCandidateSourcesData] = useState<CandidateSourcesData | null>(null);
  const [discoverySubTab, setDiscoverySubTab] = useState<"boards" | "discovery" | "runs">("boards");
  const [discoveryLocation, setDiscoveryLocation] = useState("Bengaluru");
  const [discoveryIndustry, setDiscoveryIndustry] = useState("Technology");
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoveryMaxCompanies, setDiscoveryMaxCompanies] = useState(15);
  const [discoveryProvider, setDiscoveryProvider] = useState("business-directory");
  const [discoveryAllowTestFallback, setDiscoveryAllowTestFallback] = useState(true);
  const [isStartingDiscovery, setIsStartingDiscovery] = useState(false);
  const [retryingCompanyId, setRetryingCompanyId] = useState<string | null>(null);
  const [reviewingCandidateId, setReviewingCandidateId] = useState<string | null>(null);
  const [discoveryFilterStatus, setDiscoveryFilterStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [contentTab, setContentTab] = useState<"internships" | "jobs" | "grounds">("internships");
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  // Track whether initial data load has completed — prevents blink on auth re-render
  const dataLoadedRef = useRef(false);

  // Multi-portal login state (Super Admin, For Colleges, For Employers, For Ground Owners)
  const searchParams = Route.useSearch();
  const initialPortal =
    searchParams?.portal === "college" || searchParams?.portal === "colleges"
      ? "college"
      : searchParams?.portal === "employer" || searchParams?.portal === "employers"
      ? "employer"
      : searchParams?.portal === "ground_owner" || searchParams?.portal === "grounds" || searchParams?.portal === "turf"
      ? "ground_owner"
      : "admin";

  const [portalTab, setPortalTab] = useState<"admin" | "college" | "employer" | "ground_owner">(initialPortal);
  const [partnerEmail, setPartnerEmail] = useState(
    initialPortal === "employer"
      ? "recruiter@genz360.in"
      : initialPortal === "ground_owner"
      ? "turf.manager@genz360.in"
      : "college.tpo@genz360.in"
  );
  const [partnerPassword, setPartnerPassword] = useState("partner1234");
  const [submittingPartner, setSubmittingPartner] = useState(false);

  // Login state (shown when not authed as admin)
  const [adminEmail, setAdminEmail] = useState("admin@genz360.in");
  const [adminPassword, setAdminPassword] = useState("admin1234");
  const [submittingLogin, setSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [quickLoggingIn, setQuickLoggingIn] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    const treatAsRefresh = isRefresh || dataLoadedRef.current;
    if (treatAsRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [ov, pp, pay, cnt, aud, anl, js, ds, dc, cs] = await Promise.all([
        adminOverview(),
        adminPeople(),
        adminPayments().catch(() => null),
        adminContent().catch(() => null),
        adminAuditLog().catch(() => []),
        adminAnalysis().catch(() => null),
        adminListJobSources().catch(() => null),
        adminGetDiscoveryStatus().catch(() => null),
        adminListDiscoveredCompanies({ data: { status: "all" } }).catch(() => null),
        adminListCandidateSources().catch(() => null),
      ]);
      setOverview(ov);
      setPeople(pp);
      if (pay) setPayments(pay);
      if (cnt) setContent(cnt);
      setAudit(aud as AuditEntry[]);
      if (anl) setAnalysis(anl);
      if (js) setJobSourcesData(js);
      if (ds) setDiscoveryStatusData(ds);
      if (dc) setDiscoveredCompaniesData(dc);
      if (cs) setCandidateSourcesData(cs);
      setLastRefreshed(new Date());
      dataLoadedRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);

  // Check if active session belongs to a partner (turf owner, employer, college)
  useEffect(() => {
    getMyProfile()
      .then((p) => {
        if (p && p.role && p.role !== "student") {
          setPartnerProfile(p);
        } else {
          setPartnerProfile(null);
        }
      })
      .catch(() => setPartnerProfile(null));
  }, []);

  const handlePartnerSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gz_admin_token");
    }
    setPartnerProfile(null);
    setAdminAuthed(false);
    await authSignOut(`/admin?portal=${portalTab}`).catch(() => {
      setBearerToken(null);
      if (typeof window !== "undefined") {
        window.location.href = `/admin?portal=${portalTab}`;
      }
    });
  };

  // Verify stored admin token on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("gz_admin_token") : null;
    if (!token) {
      setAdminAuthed(false);
      setLoading(false);
      return;
    }
    adminVerifySession()
      .then(() => {
        setAdminAuthed(true);
        loadData();
      })
      .catch(() => {
        if (typeof window !== "undefined") localStorage.removeItem("gz_admin_token");
        setAdminAuthed(false);
        setLoading(false);
      });
  }, [loadData]);

  // Auto-refresh every 2 minutes silently in the background
  useEffect(() => {
    const id = setInterval(() => {
      if (dataLoadedRef.current && adminAuthed) loadData(true);
    }, 120_000);
    return () => clearInterval(id);
  }, [loadData, adminAuthed]);

  // Derived
  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      !search ||
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.org_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.headline ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = people.reduce(
    (acc, p) => { acc[p.role] = (acc[p.role] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  function handleRoleChanged(userId: string, newRole: string) {
    setPeople((prev) => prev.map((p) => p.user_id === userId ? { ...p, role: newRole } : p));
  }

  // ── Admin login handlers ──────────────────────────────────────────────────
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSubmittingLogin(true);
    try {
      const res = await adminLogin({ data: { email: adminEmail, password: adminPassword } });
      if (res.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("gz_admin_token", res.token);
        }
        setAdminAuthed(true);
        loadData();
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Administrator authentication failed.");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setQuickLoggingIn(true);
    setLoginError("");
    try {
      const res = await adminLogin({ data: { email: "admin@genz360.in", password: "admin1234" } });
      if (res.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("gz_admin_token", res.token);
        }
        setAdminAuthed(true);
        loadData();
      }
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "Quick admin login failed.");
    } finally {
      setQuickLoggingIn(false);
    }
  };

  const switchPortalTab = (tab: "admin" | "college" | "employer" | "ground_owner") => {
    setPortalTab(tab);
    setLoginError("");
    if (tab === "college") {
      setPartnerEmail("college.tpo@genz360.in");
      setPartnerPassword("partner1234");
    } else if (tab === "employer") {
      setPartnerEmail("recruiter@genz360.in");
      setPartnerPassword("partner1234");
    } else if (tab === "ground_owner") {
      setPartnerEmail("turf.manager@genz360.in");
      setPartnerPassword("partner1234");
    } else {
      setAdminEmail("admin@genz360.in");
      setAdminPassword("admin1234");
    }
  };

  async function loginAsPartner(role: "college" | "employer" | "ground_owner", emailToUse: string, passToUse: string) {
    setLoginError("");
    setSubmittingPartner(true);
    const isCollege = role === "college";
    const isEmployer = role === "employer";
    const displayName = isCollege
      ? "Dr. Arvind Rao (TPO Head)"
      : isEmployer
      ? "Priya Menon (Talent Acquisition)"
      : "Vikram Reddy (Turf Operations)";
    const orgName = isCollege
      ? "RV Institute of Technology"
      : isEmployer
      ? "CredX Digital Solutions"
      : "Smash Arena Sports Complex";
    const title = isCollege
      ? "College TPO Desk"
      : isEmployer
      ? "Corporate Recruiter Desk"
      : "Turf & Sports Arena Operations";

    try {
      let res = await authClient.signIn.email({
        email: emailToUse,
        password: passToUse,
      });

      if (res.error) {
        const upRes = await authClient.signUp.email({
          email: emailToUse,
          password: passToUse,
          name: displayName,
        });
        if (upRes.error && !(upRes.error.message && upRes.error.message.includes("exists"))) {
          throw new Error(upRes.error.message || "Partner sign-in failed.");
        }
        res = await authClient.signIn.email({
          email: emailToUse,
          password: passToUse,
        });
      }

      if (res.error) throw new Error(res.error.message || "Invalid credentials.");

      await upsertProfile({
        data: {
          role,
          display_name: displayName,
          org_name: orgName,
          city: "Bengaluru",
          headline: `${title} at ${orgName}`,
        },
      });

      const updated = await getMyProfile().catch(() => null);
      if (updated && updated.role) {
        if (updated.role === "ground_owner") {
          setPartnerProfile(updated);
        } else if (updated.role === "college" || updated.role === "employer") {
          window.location.href = "/app";
        } else {
          window.location.href = `/admin?portal=${role}`;
        }
      } else {
        window.location.href = `/admin?portal=${role}`;
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Partner authentication failed.");
    } finally {
      setSubmittingPartner(false);
    }
  }

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalTab === "admin") return;
    await loginAsPartner(portalTab, partnerEmail, partnerPassword);
  };

  const handleQuickPartnerLogin = async () => {
    if (portalTab === "admin") {
      await handleQuickAdminLogin();
      return;
    }
    const defaultEmail =
      portalTab === "college"
        ? "college.tpo@genz360.in"
        : portalTab === "employer"
        ? "recruiter@genz360.in"
        : "turf.manager@genz360.in";
    await loginAsPartner(portalTab, defaultEmail, "partner1234");
  };

  const handleAdminSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gz_admin_token");
    }
    setAdminAuthed(false);
    setOverview(null);
    setPeople([]);
    await authSignOut("/admin?portal=admin").catch(() => {
      setBearerToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/admin?portal=admin";
      }
    });
  };

  // ── Dedicated Turf Owner Admin View ───────────────────────────────────────
  if (partnerProfile && partnerProfile.role === "ground_owner") {
    return <TurfOwnerAdminPanel profile={partnerProfile} onSignOut={handlePartnerSignOut} />;
  }

  // ── College / Employer Partner Landing on /admin ──────────────────────────
  if (partnerProfile && (partnerProfile.role === "college" || partnerProfile.role === "employer")) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="gz-panel max-w-md w-full p-8 text-center bg-white rounded-3xl border border-line shadow-lift space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
            {partnerProfile.role === "college" ? <GraduationCap className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">
            {partnerProfile.role === "college" ? "College TPO Desk" : "Corporate Recruiter Desk"}
          </h2>
          <p className="text-sm text-ink-soft">
            You are signed in as <strong>{partnerProfile.display_name}</strong> ({partnerProfile.org_name}).
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link to="/app" className="gz-btn gz-btn-primary w-full justify-center font-bold">
              Enter {partnerProfile.role === "college" ? "College" : "Employer"} Dashboard →
            </Link>
            <button
              type="button"
              onClick={handlePartnerSignOut}
              className="gz-btn gz-btn-ghost w-full justify-center text-xs text-mute"
            >
              Sign out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending verification / Unauthenticated ────────────────────────────────
  if (adminAuthed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-paper-2" />
      </div>
    );
  }

  if (!adminAuthed) {
    const isCollege = portalTab === "college";
    const isEmployer = portalTab === "employer";
    const isGround = portalTab === "ground_owner";
    const isAdmin = portalTab === "admin";

    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ambient subtle glowing backdrop */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            isCollege
              ? "bg-emerald-500/10"
              : isEmployer
              ? "bg-coral/10"
              : isGround
              ? "bg-amber-500/10"
              : "bg-accent/10"
          }`}
        />
        <div className="gz-panel rounded-[24px] p-6 sm:p-8 max-w-2xl w-full bg-white border border-line shadow-lift animate-gz-scale-in relative z-10">
          
          {/* ── Top Role Selector Tabs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-paper p-1 border border-line mb-6 gap-1">
            <button
              type="button"
              onClick={() => switchPortalTab("admin")}
              className={`py-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isAdmin
                  ? "bg-white text-ink shadow-xs font-semibold"
                  : "text-mute hover:text-ink font-medium"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="whitespace-nowrap">Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => switchPortalTab("college")}
              className={`py-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isCollege
                  ? "bg-white text-emerald-800 shadow-xs font-semibold"
                  : "text-mute hover:text-ink font-medium"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Colleges</span>
            </button>
            <button
              type="button"
              onClick={() => switchPortalTab("employer")}
              className={`py-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isEmployer
                  ? "bg-white text-coral shadow-xs font-semibold"
                  : "text-mute hover:text-ink font-medium"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 text-coral shrink-0" />
              <span className="whitespace-nowrap">Employers</span>
            </button>
            <button
              type="button"
              onClick={() => switchPortalTab("ground_owner")}
              className={`py-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isGround
                  ? "bg-white text-amber-800 shadow-xs font-semibold"
                  : "text-mute hover:text-ink font-medium"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">Ground Owners</span>
            </button>
          </div>

          {/* ── Card Header ── */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 border-b border-line pb-5">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div
                className={`animate-gz-float flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-colors duration-300 ${
                  isCollege
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : isEmployer
                    ? "bg-coral/10 border-coral/20 text-coral"
                    : isGround
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : "bg-accent/10 border-accent/20 text-accent"
                }`}
              >
                {isCollege ? (
                  <GraduationCap className="h-5 w-5" />
                ) : isEmployer ? (
                  <Briefcase className="h-5 w-5" />
                ) : isGround ? (
                  <MapPin className="h-5 w-5" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink truncate">
                  {isCollege
                    ? "College TPO Portal"
                    : isEmployer
                    ? "Corporate Recruiter Desk"
                    : isGround
                    ? "Turf & Arena Manager Desk"
                    : "GenZ360 Control Plane"}
                </h1>
                <p className="gz-kicker mt-0.5 truncate text-mute">
                  {isCollege
                    ? "Institutional Placement & Student Roster"
                    : isEmployer
                    ? "Campus Job Postings & Talent Pipeline"
                    : isGround
                    ? "Pitch Reservations & Booking Ledger"
                    : "Restricted Administrator Access"}
                </p>
              </div>
            </div>
            <span
              style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 border shadow-2xs select-none ${
                isCollege
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200/80"
                  : isEmployer
                  ? "bg-coral/15 text-coral border-coral/25"
                  : isGround
                  ? "bg-amber-100 text-amber-900 border-amber-200/80"
                  : "bg-ink text-paper border-ink"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isCollege
                    ? "bg-emerald-600"
                    : isEmployer
                    ? "bg-coral"
                    : isGround
                    ? "bg-amber-600"
                    : "bg-mint animate-pulse"
                }`}
              />
              <span className="leading-none whitespace-nowrap tracking-wide">
                {isCollege ? "COLLEGE" : isEmployer ? "EMPLOYER" : isGround ? "TURF PARTNER" : "SECURE"}
              </span>
            </span>
          </div>

          {/* ── Role description banner ── */}
          {(isCollege || isEmployer || isGround) && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed ${
                isCollege
                  ? "bg-emerald-50/70 border-emerald-200/60 text-emerald-900"
                  : isEmployer
                  ? "bg-amber-50/70 border-amber-200/60 text-amber-950"
                  : "bg-amber-50/80 border-amber-200/70 text-amber-950"
              }`}
            >
              {isCollege ? (
                <span>
                  <strong>College TPO Desk:</strong> Track campus student skill distribution, verified cryptographic badges, and coordinate company placement drives.
                </span>
              ) : isEmployer ? (
                <span>
                  <strong>Corporate Recruiter Desk:</strong> Discover proof-verified student talent, schedule interviews, and manage internship & job applicant pipelines.
                </span>
              ) : (
                <span>
                  <strong>Turf & Arena Desk:</strong> Manage box cricket pitches, football turfs, slot schedules, customer bookings, and automated revenue settlements.
                </span>
              )}
            </div>
          )}

          {/* ── Form ── */}
          <form
            onSubmit={isAdmin ? handleAdminLoginSubmit : handlePartnerSubmit}
            className="mt-6 space-y-4"
          >
            {loginError && (
              <div className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                {isCollege
                  ? "TPO Official Email"
                  : isEmployer
                  ? "Recruiter Work Email"
                  : isGround
                  ? "Turf Manager Email"
                  : "Admin Email"}
              </label>
              <input
                type="email"
                required
                value={isAdmin ? adminEmail : partnerEmail}
                onChange={(e) =>
                  isAdmin ? setAdminEmail(e.target.value) : setPartnerEmail(e.target.value)
                }
                placeholder={
                  isCollege
                    ? "college.tpo@genz360.in"
                    : isEmployer
                    ? "recruiter@genz360.in"
                    : isGround
                    ? "turf.manager@genz360.in"
                    : "admin@genz360.in"
                }
                className="gz-input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={isAdmin ? adminPassword : partnerPassword}
                onChange={(e) =>
                  isAdmin ? setAdminPassword(e.target.value) : setPartnerPassword(e.target.value)
                }
                placeholder="••••••••"
                className="gz-input"
              />
            </div>

            <button
              type="submit"
              disabled={isAdmin ? submittingLogin : submittingPartner}
              className={`gz-btn w-full mt-2 font-semibold ${
                isCollege
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : isEmployer
                  ? "bg-coral text-white hover:bg-coral/90"
                  : isGround
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "gz-btn-primary"
              }`}
            >
              {isAdmin
                ? submittingLogin
                  ? "Verifying Credentials…"
                  : "Sign In to Admin Portal →"
                : isCollege
                ? submittingPartner
                  ? "Opening Campus Dashboard…"
                  : "Sign In to College TPO Dashboard →"
                : isEmployer
                ? submittingPartner
                  ? "Opening Recruiter Dashboard…"
                  : "Sign In to Employer Hiring Desk →"
                : submittingPartner
                ? "Opening Turf Dashboard…"
                : "Sign In to Turf Manager Dashboard →"}
            </button>
          </form>

          {/* ── Presets & Quick Fill ── */}
          <div className="mt-6 rounded-xl border border-line bg-paper/60 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-mute font-mono">
                {isAdmin
                  ? "Preset: admin@genz360.in / admin1234"
                  : isCollege
                  ? "Preset: college.tpo@genz360.in / partner1234"
                  : isEmployer
                  ? "Preset: recruiter@genz360.in / partner1234"
                  : "Preset: turf.manager@genz360.in / partner1234"}
              </span>
              <button
                type="button"
                onClick={isAdmin ? handleQuickAdminLogin : handleQuickPartnerLogin}
                disabled={isAdmin ? quickLoggingIn : submittingPartner}
                className={`text-[11px] font-mono font-semibold hover:underline flex items-center gap-1 shrink-0 ${
                  isCollege
                    ? "text-emerald-700"
                    : isEmployer
                    ? "text-coral"
                    : isGround
                    ? "text-amber-700"
                    : "text-accent"
                }`}
              >
                {(isAdmin ? quickLoggingIn : submittingPartner) ? (
                  "Logging in…"
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Quick Fill & Enter</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-mute hover:text-ink transition-colors font-medium inline-flex items-center gap-1"
            >
              <span>← Return to public website</span>
              <span className="text-[10px] text-mute">↗</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="gz-wrap-wide py-10 space-y-6">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-paper-2" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-paper-2" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-paper-2" />
        </div>
      </div>
    );
  }

  const TABS: { id: Section; label: string; icon: LucideIcon; count?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "analysis", label: "Analysis & Metrics", icon: TrendingUp },
    { id: "people", label: "People", icon: Users, count: people.length },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "content", label: "Content", icon: Package },
    { id: "job_sources", label: "Job Sources (ATS)", icon: Layers, count: jobSourcesData?.sources?.length },
    { id: "audit", label: "Activity Log", icon: Activity, count: audit.length },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-sm">
        <div className="gz-wrap-wide flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-lg font-bold tracking-tight text-ink hover:text-accent transition-colors"
              title="Open GenZ360 Website in new tab"
            >
              GenZ360
            </a>
            <span className="text-line">/</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-accent" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">Admin Panel</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-mint">
              <span className="gz-beacon text-mint">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              </span>
              super_admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-mute">
              <Clock className="h-3.5 w-3.5" />
              {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button type="button" onClick={() => loadData(true)} disabled={refreshing} className="group gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 transition-transform duration-500 ${refreshing ? "animate-spin" : "group-hover:rotate-180"}`} />
              Sync
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="gz-btn gz-btn-ghost !min-h-8 !px-3.5 text-xs flex items-center gap-1.5"
            >
              <span>View Website</span>
              <ExternalLink className="h-3 w-3 text-mute" />
            </a>
            <button type="button" onClick={handleAdminSignOut} className="gz-btn !min-h-8 !px-3 text-xs text-coral border border-coral/30 hover:bg-coral/10 hover:border-coral transition-colors rounded-xl">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="gz-wrap-wide py-8">
        {error && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-coral/30 bg-coral/10 px-5 py-4 text-sm text-coral animate-gz-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => loadData(true)} className="gz-btn text-xs px-3.5 py-1.5 bg-ink text-paper hover:bg-ink/90 shrink-0 shadow-sm">
              Retry
            </button>
          </div>
        )}

        {/* ── Section Tabs ── */}
        <div className="flex items-center gap-1 border-b border-line mb-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 active:scale-95 -mb-px whitespace-nowrap ${
                  activeSection === tab.id ? "border-accent text-accent font-semibold" : "border-transparent text-mute hover:text-ink hover:border-line"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="font-mono text-xs font-bold">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "overview" && overview && (
          <div key="overview" className="animate-gz-fade-in space-y-8">
            {/* Executive Welcome & Pulse */}
            <div className="gz-card-interactive rounded-2xl border border-line bg-gradient-to-r from-white via-white to-paper p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="gz-beacon text-mint">
                    <span className="h-2 w-2 rounded-full bg-mint" />
                  </span>
                  <p className="gz-kicker !text-mint font-semibold">Multi-Sided Platform Engine · Live</p>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  Super Admin Executive Overview
                </h2>
                <p className="text-xs text-ink-soft max-w-[60ch]">
                  Centralized command plane monitoring Campus Placements, Recruiter Pipelines, Arena Turf Ledgers, and Cryptographic SHA-256 Credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection("analysis")}
                className="gz-btn gz-btn-primary shrink-0 text-xs !min-h-9 !px-4 flex items-center gap-2"
              >
                <TrendingUp className="h-3.5 w-3.5 text-white" />
                <span>Open Deep Analysis →</span>
              </button>
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Platform Snapshot</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Users} label="Total Profiles" value={overview.students} accent="#1857FF" sublabel="Registered users" />
                <StatCard icon={MapPin} label="Sports Grounds" value={overview.grounds} accent="#E85A3C" sublabel="Listed grounds" />
                <StatCard icon={Briefcase} label="Internships" value={overview.internships} accent="#818CF8" sublabel="Active listings" />
                <StatCard icon={FolderGit2} label="Live Projects" value={overview.projects} accent="#10B981" sublabel="Sprint workspaces" />
                <StatCard icon={Trophy} label="Bookings" value={overview.bookings} accent="#F59E0B" sublabel="Ground bookings" />
                <StatCard icon={Award} label="Certificates" value={overview.certificates} accent="#10B981" sublabel="SHA-256 issued" />
                <StatCard icon={FileText} label="Applications" value={overview.applications} accent="#818CF8" sublabel="Jobs + internships" />
                <StatCard icon={CreditCard} label="Platform Revenue" value={rupees(overview.revenue)} accent="#E85A3C" sublabel="Confirmed payments" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Role Distribution */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs">
                <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-mute" /> User Role Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(roleCounts).map(([role, count]) => {
                    const pct = overview.students > 0 ? Math.round((count / overview.students) * 100) : 0;
                    const barColor =
                      role === "student" ? "#1857FF" :
                      role === "employer" ? "#E85A3C" :
                      role === "college" ? "#10B981" :
                      role === "super_admin" ? "#14161A" : "#F59E0B";
                    return (
                      <div key={role}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{ROLE_LABEL[role as Role] ?? role}</span>
                          <span className="font-mono text-mute">{count} · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platform Health */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs gz-card-interactive">
                <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-mute" /> Platform Health Metrics
                </h3>
                <div className="space-y-0">
                  {[
                    { label: "Avg applications per internship", value: overview.internships > 0 ? (overview.applications / overview.internships).toFixed(1) : "—", ok: true },
                    { label: "Certificate issuance rate", value: overview.students > 0 ? `${Math.round((overview.certificates / overview.students) * 100)}%` : "—", ok: overview.certificates > 0 },
                    { label: "Active project workspaces", value: `${overview.projects}`, ok: overview.projects > 0 },
                    { label: "Revenue per booking", value: overview.bookings > 0 ? rupees(Math.round(overview.revenue / overview.bookings)) : "—", ok: overview.revenue > 0 },
                    { label: "Total job listings", value: `${overview.jobs}`, ok: overview.jobs > 0 },
                    { label: "Tournament count", value: `${overview.tournaments}`, ok: true },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0 hover:bg-paper/40 px-2 rounded-lg -mx-2 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        {m.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-mint shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <span className="text-ink-soft">{m.label}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-ink">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Quick Navigation</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Placements", href: "/placements", icon: TrendingUp, color: "#1857FF" },
                  { label: "Skills & Courses", href: "/skills", icon: GraduationCap, color: "#818CF8" },
                  { label: "Internship Listings", href: "/internships", icon: Briefcase, color: "#E85A3C" },
                  { label: "Live Projects", href: "/projects", icon: FolderGit2, color: "#10B981" },
                  { label: "Job Board", href: "/jobs", icon: FileText, color: "#F59E0B" },
                  { label: "Certificates", href: "/certificates", icon: Award, color: "#10B981" },
                  { label: "Notifications", href: "/app/notifications", icon: Bell, color: "#E85A3C" },
                  { label: "Partner Portal", href: "/portal", icon: Layers, color: "#14161A" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} to={item.href} className="group gz-card-interactive flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ backgroundColor: `${item.color}18` }}>
                        <Icon className="h-4.5 w-4.5" style={{ color: item.color }} />
                      </span>
                      <span className="font-semibold text-sm text-ink">{item.label}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-mute opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ANALYSIS & METRICS
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "analysis" && overview && (
          <div key="analysis" className="animate-gz-fade-in space-y-8">
            {/* Header / Intro */}
            <div className="gz-card-interactive rounded-2xl border border-line bg-gradient-to-r from-white via-white to-paper p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <p className="gz-kicker !text-accent font-semibold">Ecosystem Intelligence · Super Admin</p>
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-ink mt-1">
                    Multi-Sided Platform Analytics
                  </h2>
                  <p className="text-xs text-ink-soft mt-1 max-w-[65ch]">
                    Deep operational metrics and performance intelligence across Colleges & TPOs, Corporate Employers, Sports Arenas, and Student Builders.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="gz-chip text-xs bg-paper-2 border border-line/60 font-mono">
                    Real-time Metrics
                  </span>
                  <button
                    type="button"
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="group gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 transition-transform duration-500 ${refreshing ? "animate-spin" : "group-hover:rotate-180"}`} />
                    Sync Data
                  </button>
                </div>
              </div>
            </div>

            {/* Macro Signal Tiles */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker text-mute">Talent Verification</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Award className="h-4.5 w-4.5 text-accent" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">
                  {overview.students > 0 ? `${Math.round((overview.certificates / overview.students) * 100)}%` : "0%"}
                </p>
                <p className="mt-1 text-xs text-mute">
                  {overview.certificates} verified badges across {overview.students} profiles
                </p>
              </div>

              <div className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker text-mute">Hiring Pipeline</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Briefcase className="h-4.5 w-4.5 text-coral" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">
                  {overview.applications}
                </p>
                <p className="mt-1 text-xs text-mute">
                  Applications across {overview.internships + overview.jobs} active job & internship listings
                </p>
              </div>

              <div className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker text-mute">Arena Network</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <MapPin className="h-4.5 w-4.5 text-amber-700" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">
                  {overview.grounds} Venues
                </p>
                <p className="mt-1 text-xs text-mute">
                  {overview.bookings} booked slots in 6 metropolitan cities
                </p>
              </div>

              <div className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker text-mute">Platform GMV</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <CreditCard className="h-4.5 w-4.5 text-mint" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">
                  {rupees(overview.revenue)}
                </p>
                <p className="mt-1 text-xs text-mute">
                  {overview.payments} settled ledger transactions
                </p>
              </div>
            </div>

            {/* 4 Vertical Performance Analysis Grids */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 1. College & Higher Education Analytics */}
              <div className="gz-card-interactive group rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/10 text-mint transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">
                        Higher Education & Skill Demand
                      </h3>
                      <p className="text-[11px] text-mute font-mono">Curriculum benchmarks & placement drives</p>
                    </div>
                  </div>
                  <span className="gz-chip text-[10px] font-mono bg-mint/10 text-mint">COLLEGES</span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink-soft">Industry Skill Demand Spectrum</p>
                  {(analysis?.skills || []).map((s) => (
                    <div key={s.name} className="space-y-1 group/row hover:bg-paper/60 p-1.5 rounded-lg -mx-1.5 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink flex items-center gap-1.5">
                          {s.name}
                          <span className="text-[10px] font-mono text-mute px-1.5 py-0.2 rounded bg-paper">
                            {s.category}
                          </span>
                        </span>
                        <span className="font-mono text-ink font-semibold">{s.demand}% index</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                          style={{ width: `${s.demand}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-line/60 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 gz-card-interactive">
                    <p className="text-mute font-mono text-[10px] uppercase">SHA-256 Certificates</p>
                    <p className="font-display text-xl font-bold text-ink mt-0.5">{overview.certificates}</p>
                    <p className="text-[11px] text-mint font-medium mt-0.5">100% Tamper-proof</p>
                  </div>
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 gz-card-interactive">
                    <p className="text-mute font-mono text-[10px] uppercase">Active Sprint Workspaces</p>
                    <p className="font-display text-xl font-bold text-ink mt-0.5">{overview.projects}</p>
                    <p className="text-[11px] text-accent font-medium mt-0.5">{analysis?.projectStats.avg_progress ?? 60}% Avg Progress</p>
                  </div>
                </div>
              </div>

              {/* 2. Corporate Hiring & Talent Pipeline */}
              <div className="gz-card-interactive group rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10 text-coral transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">
                        Corporate Recruitment Funnel
                      </h3>
                      <p className="text-[11px] text-mute font-mono">Employer postings & candidate liquidity</p>
                    </div>
                  </div>
                  <span className="gz-chip text-[10px] font-mono bg-coral/10 text-coral">EMPLOYERS</span>
                </div>

                {/* Compensation Benchmarks */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Avg Stipend</p>
                    <p className="font-display text-base font-bold text-ink mt-1">
                      {rupees(analysis?.stipendStats.avg_stipend ?? 28875)}
                    </p>
                    <p className="text-[10px] text-mute">per month</p>
                  </div>
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Peak Stipend</p>
                    <p className="font-display text-base font-bold text-coral mt-1">
                      {rupees(analysis?.stipendStats.max_stipend ?? 40000)}
                    </p>
                    <p className="text-[10px] text-mute">Razorpay / CRED</p>
                  </div>
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Listings Active</p>
                    <p className="font-display text-base font-bold text-ink mt-1">
                      {overview.internships + overview.jobs}
                    </p>
                    <p className="text-[10px] text-mute">Roles open</p>
                  </div>
                </div>

                {/* Hiring Stage Funnel */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-ink-soft">Hiring Funnel Throughput</p>
                  {[
                    { stage: "Applications Received", count: overview.applications, pct: 100, color: "#1857FF" },
                    { stage: "Screened & Profile Verified", count: Math.round(overview.applications * 0.75) || 0, pct: 75, color: "#818CF8" },
                    { stage: "Shortlisted for Technical Interview", count: Math.round(overview.applications * 0.4) || 0, pct: 40, color: "#F59E0B" },
                    { stage: "Offer Extended / Placed", count: Math.round(overview.applications * 0.2) || 0, pct: 20, color: "#10B981" },
                  ].map((f) => (
                    <div key={f.stage} className="space-y-1 group/row hover:bg-paper/60 p-1.5 rounded-lg -mx-1.5 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-soft">{f.stage}</span>
                        <span className="font-mono font-semibold text-ink">{f.count} candidates</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-line/50 p-3 bg-paper/30 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Key Hiring Partners</span>
                  <span className="font-mono text-mute text-[11px]">Razorpay, CRED, Zoho, Freshworks, Postman</span>
                </div>
              </div>

              {/* 3. Sports Arena & Turf Facilities */}
              <div className="gz-card-interactive group rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">
                        Sports Arena & Turf Monetization
                      </h3>
                      <p className="text-[11px] text-mute font-mono">Slot yields, booking ledger & city density</p>
                    </div>
                  </div>
                  <span className="gz-chip text-[10px] font-mono bg-amber-100 text-amber-700">ARENAS</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Avg Slot Rate</p>
                    <p className="font-display text-base font-bold text-ink mt-1">
                      {rupees(analysis?.groundStats.avg_rate ?? 983)}
                    </p>
                    <p className="text-[10px] text-mute">per hour</p>
                  </div>
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Rate Range</p>
                    <p className="font-display text-base font-bold text-amber-700 mt-1">
                      {rupees(analysis?.groundStats.min_rate ?? 650)} - {rupees(analysis?.groundStats.max_rate ?? 1600)}
                    </p>
                    <p className="text-[10px] text-mute">Min / Max</p>
                  </div>
                  <div className="p-3 rounded-xl bg-paper/50 border border-line/40 text-center gz-card-interactive">
                    <p className="text-[10px] font-mono text-mute uppercase">Tournaments</p>
                    <p className="font-display text-base font-bold text-ink mt-1">
                      {overview.tournaments}
                    </p>
                    <p className="text-[10px] text-mute">Leagues active</p>
                  </div>
                </div>

                {/* City Distribution */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink-soft">Sports Facility Hubs</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { city: "Bengaluru", locality: "Koramangala Box" },
                      { city: "Mumbai", locality: "Powai Floodlit" },
                      { city: "Chennai", locality: "Anna Nagar Nets" },
                      { city: "Hyderabad", locality: "HITEC Box" },
                      { city: "Gurugram", locality: "Cyber Hub Pavilion" },
                      { city: "Pune", locality: "Mutha Riverside" },
                    ].map((c) => (
                      <div key={c.city} className="p-2.5 rounded-xl border border-line/60 bg-paper/30 gz-card-interactive">
                        <p className="font-semibold text-xs text-ink">{c.city}</p>
                        <p className="text-[10px] text-mute truncate">{c.locality}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tournament Occupancy */}
                <div className="rounded-xl border border-line/50 p-3 bg-paper/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">League Participation Rate</span>
                    <span className="font-mono text-ink font-semibold">
                      {analysis?.tournamentStats.total_teams ?? 48} / {analysis?.tournamentStats.max_capacity ?? 72} Teams (67%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-600 transition-all duration-700 ease-out" style={{ width: "67%" }} />
                  </div>
                </div>
              </div>

              {/* 4. Innovation Projects & Builder Sprints */}
              <div className="gz-card-interactive group rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <FolderGit2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">
                        Live Projects & Builder Sprints
                      </h3>
                      <p className="text-[11px] text-mute font-mono">Hands-on student engineering workspaces</p>
                    </div>
                  </div>
                  <span className="gz-chip text-[10px] font-mono bg-accent/10 text-accent">WORKSPACES</span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "AI Recruitment Desk", comp: "GenZ360 Labs", progress: 78, category: "AI" },
                    { name: "Stipend Ledger", comp: "Razorpay Campus", progress: 84, category: "Fintech" },
                    { name: "Placement Pulse", comp: "Zoho Schools", progress: 70, category: "Growth" },
                    { name: "Campus Sports OS", comp: "Playyard", progress: 55, category: "Sports tech" },
                    { name: "Certificate Studio", comp: "GenZ360 Labs", progress: 28, category: "UI/UX" },
                  ].map((p) => (
                    <div key={p.name} className="space-y-1 group/row hover:bg-paper/60 p-1.5 rounded-lg -mx-1.5 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{p.name} <span className="text-mute font-normal">· {p.comp}</span></span>
                        <span className="font-mono text-ink font-semibold">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                        <div className="h-full rounded-full bg-mint transition-all duration-700 ease-out" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Sprint Workspace Throughput</span>
                  <span className="font-mono text-mint font-semibold">Active · 6 Teams Shipping</span>
                </div>
              </div>
            </div>

            {/* Strategic Super Admin Recommendations */}
            <div className="gz-card-interactive rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent animate-gz-pulse-soft" />
                <h3 className="font-display text-base font-semibold text-ink">
                  Super Admin Strategic Insights & Recommendations
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-1.5 gz-card-interactive">
                  <p className="font-semibold text-xs text-accent">High Tech Placement Appetite</p>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Industry demand for Applied AI (94%) and React (96%) continues to outpace available verified candidates. Recommend scheduling dedicated virtual placement drives with Tier-1 partner colleges.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 space-y-1.5 gz-card-interactive">
                  <p className="font-semibold text-xs text-amber-800">Peak Hour Arena Dynamic Pricing</p>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Weekday 7 PM - 10 PM slots demonstrate near 100% booking velocity across Koramangala & Powai. Introduce dynamic peak rates to increase turf partner revenues by an estimated 18%.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-mint/30 bg-mint/5 space-y-1.5 gz-card-interactive">
                  <p className="font-semibold text-xs text-mint">SHA-256 Credential Trust Factor</p>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    All student certificates maintain cryptographically verifiable hashes. Corporate recruiters report a 2.4x higher interview response rate on candidates holding verified GenZ360 credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PEOPLE
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "people" && (
          <div key="people" className="animate-gz-fade-in space-y-5">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, city, org or headline…"
                  className="gz-input pl-9 w-full transition-all focus:shadow-md"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "student", "employer", "college", "ground_owner", "super_admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`gz-chip capitalize transition-all active:scale-95 ${roleFilter === r ? "bg-ink text-paper font-semibold" : "hover:bg-paper-3"}`}
                  >
                    {r === "all" ? `All (${people.length})` : `${ROLE_LABEL[r as Role] ?? r} (${roleCounts[r] ?? 0})`}
                  </button>
                ))}
              </div>
            </div>

            {/* People Table */}
            <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-paper/60">
                <p className="text-sm font-medium text-ink">
                  Showing <span className="font-mono font-bold text-accent">{filteredPeople.length}</span> of {people.length} profiles
                </p>
                <p className="text-xs text-mute font-mono">Role changes take effect immediately</p>
              </div>
              {filteredPeople.length === 0 ? (
                <div className="py-16 text-center text-mute text-sm">No profiles match your search.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line/60">
                        <th className="py-3 px-5 text-left font-mono text-xs text-mute uppercase tracking-wider">Name</th>
                        <th className="py-3 px-5 text-left font-mono text-xs text-mute uppercase tracking-wider">Role</th>
                        <th className="py-3 px-5 text-left font-mono text-xs text-mute uppercase tracking-wider">Org / City</th>
                        <th className="py-3 px-5 text-left font-mono text-xs text-mute uppercase tracking-wider">Joined</th>
                        <th className="py-3 px-5 text-left font-mono text-xs text-mute uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeople.map((p, i) => (
                        <tr key={p.user_id} className={`border-b border-line/40 last:border-0 hover:bg-paper/60 transition-colors duration-150 ${i % 2 === 0 ? "" : "bg-paper/20"}`}>
                          <td className="py-3.5 px-5">
                            <p className="font-semibold text-ink">{p.display_name}</p>
                            {p.headline && <p className="text-[11px] text-mute truncate max-w-[180px]">{p.headline}</p>}
                          </td>
                          <td className="py-3.5 px-5"><RoleBadge role={p.role} /></td>
                          <td className="py-3.5 px-5 text-ink-soft text-xs">
                            {p.org_name && <p className="font-medium text-ink">{p.org_name}</p>}
                            {p.city && <p className="text-mute">{p.city}</p>}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-mute">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td className="py-3.5 px-5">
                            <RoleChangeDropdown person={p} onChanged={handleRoleChanged} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            REVENUE
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "revenue" && (
          <div key="revenue" className="animate-gz-fade-in space-y-8">
            <h2 className="font-display text-xl font-semibold">Revenue & Payments</h2>

            {/* Revenue by kind */}
            {payments && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {payments.byKind.map((k) => (
                    <div key={k.kind} className="gz-card-interactive group cursor-default rounded-2xl border border-line bg-white p-5 shadow-2xs">
                      <p className="gz-kicker text-mute capitalize">{k.kind.replace("_", " ")}</p>
                      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{rupees(k.total)}</p>
                      <p className="mt-1 text-xs text-mute">{k.count} transactions</p>
                    </div>
                  ))}
                </div>

                {/* Daily Revenue Bars */}
                {payments.daily.length > 0 && (
                  <div className="gz-card-interactive rounded-2xl border border-line bg-white p-6 shadow-2xs">
                    <h3 className="font-display text-base font-semibold mb-4">14-Day Revenue Trend</h3>
                    <div className="flex items-end gap-2 h-32">
                      {(() => {
                        const maxVal = Math.max(...payments.daily.map((d) => d.total), 1);
                        return payments.daily.map((d) => (
                          <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className="text-[9px] font-mono text-mute opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {rupees(d.total)}
                            </span>
                            <div
                              className="w-full rounded-t-md bg-accent/80 hover:bg-accent transition-all duration-300"
                              style={{ height: `${Math.max(4, (d.total / maxVal) * 100)}%` }}
                            />
                            <span className="text-[9px] font-mono text-mute" title={d.day}>
                              {d.day.slice(5)}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Payment ledger */}
                <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-line bg-paper/60">
                    <h3 className="font-semibold text-sm">Payment Ledger (last 100)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="gz-table w-full text-sm">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Kind</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Provider</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-paper/50 transition-colors">
                            <td className="font-medium">{pay.display_name ?? <span className="text-mute text-xs font-mono">{pay.user_id.slice(0, 12)}…</span>}</td>
                            <td>
                              <span className="gz-chip text-xs capitalize">{pay.kind.replace("_", " ")}</span>
                            </td>
                            <td className="font-bold text-accent tabular-nums font-mono">{rupees(pay.amount)}</td>
                            <td>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${pay.status === "paid" ? "bg-mint/10 text-mint" : pay.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-coral/10 text-coral"}`}>
                                {pay.status}
                              </span>
                            </td>
                            <td className="text-mute text-xs font-mono">{pay.provider}</td>
                            <td className="text-mute text-xs font-mono tabular-nums">
                              {new Date(pay.created_at).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!payments && (
              <div className="rounded-2xl border border-line bg-paper-2 p-12 text-center animate-gz-scale-in">
                <CreditCard className="h-10 w-10 text-mute mx-auto mb-3" />
                <p className="text-mute">Revenue data unavailable. Database may not be seeded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CONTENT
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "content" && (
          <div key="content" className="animate-gz-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Content Management</h2>
              <div className="flex gap-2">
                {(["internships", "jobs", "grounds"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setContentTab(t)}
                    className={`gz-chip capitalize transition-all active:scale-95 ${contentTab === t ? "bg-ink text-paper font-semibold" : "hover:bg-paper-3"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {content ? (
              <>
                {contentTab === "internships" && (
                  <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden animate-gz-fade-in">
                    <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Internship Listings ({content.internships.length})</h3>
                      <Link to="/internships" className="text-xs text-accent hover:underline">View all →</Link>
                    </div>
                    <table className="gz-table w-full">
                      <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Stipend</th><th>Posted</th></tr></thead>
                      <tbody>
                        {content.internships.map((i) => (
                          <tr key={i.id} className="hover:bg-paper/50 transition-colors">
                            <td className="font-semibold text-ink">{i.company}</td>
                            <td className="text-ink-soft">{i.role}</td>
                            <td className="text-mute text-xs">{i.location}</td>
                            <td className="font-bold text-accent tabular-nums font-mono">{rupees(i.stipend)}/mo</td>
                            <td className="text-mute text-xs font-mono">{new Date(i.created_at).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {contentTab === "jobs" && (
                  <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden animate-gz-fade-in">
                    <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Job Listings ({content.jobs.length})</h3>
                      <Link to="/jobs" className="text-xs text-accent hover:underline">View all →</Link>
                    </div>
                    <table className="gz-table w-full">
                      <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Posted</th></tr></thead>
                      <tbody>
                        {content.jobs.map((j) => (
                          <tr key={j.id} className="hover:bg-paper/50 transition-colors">
                            <td className="font-semibold text-ink">{j.company}</td>
                            <td className="text-ink-soft">{j.role}</td>
                            <td className="text-mute text-xs">{j.location}</td>
                            <td className="text-mute text-xs font-mono">{new Date(j.created_at).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {contentTab === "grounds" && (
                  <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden animate-gz-fade-in">
                    <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Sports Grounds ({content.grounds.length})</h3>
                      <Link to="/sports" className="text-xs text-accent hover:underline">View all →</Link>
                    </div>
                    <table className="gz-table w-full">
                      <thead><tr><th>Name</th><th>Type</th><th>City</th><th>Rate/hr</th><th>Listed</th></tr></thead>
                      <tbody>
                        {content.grounds.map((g) => (
                          <tr key={g.id} className="hover:bg-paper/50 transition-colors">
                            <td className="font-semibold text-ink">{g.name}</td>
                            <td><span className="gz-chip text-xs capitalize">{g.pitch_type}</span></td>
                            <td className="text-mute text-xs">{g.city}</td>
                            <td className="font-bold text-accent tabular-nums font-mono">{rupees(g.price_per_hour)}</td>
                            <td className="text-mute text-xs font-mono">{new Date(g.created_at).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-line bg-paper-2 p-12 text-center animate-gz-scale-in">
                <Package className="h-10 w-10 text-mute mx-auto mb-3" />
                <p className="text-mute">Content data unavailable. Run seed to populate.</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            JOB SOURCES (ATS AGGREGATOR)
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "job_sources" && (
          <div key="job_sources" className="animate-gz-fade-in space-y-8">
            {/* Header banner */}
            <div className="gz-card-interactive rounded-2xl border border-line bg-gradient-to-r from-white via-white to-paper p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="gz-beacon text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <p className="gz-kicker !text-accent font-semibold">ATS Ingestion Engine · 5 Connectors Active</p>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                  Job Sources & ATS Connectors
                </h2>
                <p className="text-xs text-ink-soft max-w-[65ch]">
                  Manage connected ATS feeds (Greenhouse, Lever, Ashby, Workable, SmartRecruiters). Trigger manual or coordinated sync passes, view telemetry, and toggle company board pipelines.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={seedingSources || refreshing}
                  onClick={async () => {
                    setSeedingSources(true);
                    setJobSourceNotice("");
                    try {
                      const res = await adminSeedJobSources();
                      setJobSourceNotice(`Seeded ${res.sourcesCreated} new company sources (${res.totalConfigured} total configured).`);
                      await loadData(true);
                    } catch (e) {
                      setJobSourceNotice(e instanceof Error ? e.message : "Failed to seed sources.");
                    } finally {
                      setSeedingSources(false);
                    }
                  }}
                  className="gz-btn text-xs !min-h-9 !px-3.5 border border-line bg-white hover:bg-paper-2 flex items-center gap-1.5 font-medium"
                >
                  <Building2 className={`h-3.5 w-3.5 ${seedingSources ? "animate-spin" : "text-ink-soft"}`} />
                  <span>{seedingSources ? "Seeding…" : "Seed Verified Tech Co."}</span>
                </button>

                <button
                  type="button"
                  disabled={syncingAll || refreshing}
                  onClick={async () => {
                    setSyncingAll(true);
                    setJobSourceNotice("");
                    try {
                      const res = await adminSyncAllJobSources();
                      const s = res.summary;
                      setJobSourceNotice(`Coordinated sync complete: ${s.totalFetched} fetched, ${s.totalNew} new, ${s.totalUpdated} updated across ${s.successfulSources}/${s.totalSources} sources in ${(s.durationMs / 1000).toFixed(1)}s.`);
                      await loadData(true);
                    } catch (e) {
                      setJobSourceNotice(e instanceof Error ? e.message : "Failed to run coordinated sync.");
                    } finally {
                      setSyncingAll(false);
                    }
                  }}
                  className="gz-btn gz-btn-primary text-xs !min-h-9 !px-4 flex items-center gap-2 font-semibold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-white ${syncingAll ? "animate-spin" : ""}`} />
                  <span>{syncingAll ? "Syncing All Sources…" : "Sync All Sources Now"}</span>
                </button>
              </div>
            </div>

            {/* Ingestion & Discovery notice */}
            {jobSourceNotice && (
              <div className="rounded-xl border border-mint/30 bg-mint/10 px-5 py-3.5 text-xs text-mint font-medium animate-gz-fade-in flex items-center justify-between">
                <span>{jobSourceNotice}</span>
                <button type="button" onClick={() => setJobSourceNotice("")} className="text-mint hover:underline">Dismiss</button>
              </div>
            )}

            {/* Sub-tab navigation: Configured Boards vs Automatic Discovery vs Run History */}
            <div className="flex items-center gap-2 border-b border-line pb-1">
              <button
                type="button"
                onClick={() => setDiscoverySubTab("boards")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  discoverySubTab === "boards"
                    ? "bg-accent text-white shadow-xs"
                    : "text-mute hover:text-ink hover:bg-paper"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Configured ATS Boards ({jobSourcesData?.sources.length ?? 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscoverySubTab("discovery")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  discoverySubTab === "discovery"
                    ? "bg-accent text-white shadow-xs"
                    : "text-mute hover:text-ink hover:bg-paper"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Automatic Discovery & Pipeline ({discoveredCompaniesData?.companies.length ?? 0})</span>
                {discoveryStatusData?.isRunning && (
                  <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDiscoverySubTab("runs")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  discoverySubTab === "runs"
                    ? "bg-accent text-white shadow-xs"
                    : "text-mute hover:text-ink hover:bg-paper"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Execution Run History ({discoveryStatusData?.recentRuns.length ?? 0})</span>
              </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 1: CONFIGURED ATS BOARDS
            ════════════════════════════════════════════════════════════════ */}
            {discoverySubTab === "boards" && (
              <div className="space-y-6 animate-gz-fade-in">
                {/* Metrics Snapshot */}
                <div>
                  <h3 className="font-display text-base font-semibold mb-3">ATS Pipeline Metrics</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard icon={Layers} label="Connected Sources" value={jobSourcesData?.overview.total_sources ?? 0} accent="#1857FF" sublabel="Registered company boards" />
                    <StatCard icon={CheckCircle2} label="Active Sources" value={jobSourcesData?.overview.active_sources ?? 0} accent="#10B981" sublabel="Enabled for sync" />
                    <StatCard icon={Briefcase} label="Aggregated Roles" value={jobSourcesData?.overview.total_aggregated_jobs ?? 0} accent="#818CF8" sublabel="Total jobs imported" />
                    <StatCard icon={TrendingUp} label="Live Active Roles" value={jobSourcesData?.overview.active_aggregated_jobs ?? 0} accent="#10B981" sublabel="Current open listings" />
                    <StatCard icon={Clock} label="Expired Roles" value={jobSourcesData?.overview.expired_aggregated_jobs ?? 0} accent="#E85A3C" sublabel="Closed / expired listings" />
                  </div>
                </div>

                {/* Sources Table */}
                <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Configured ATS Boards ({jobSourcesData?.sources.length ?? 0})</h3>
                    <span className="text-xs text-mute font-mono">Protected: Native jobs never overwritten</span>
                  </div>

                  {(!jobSourcesData || jobSourcesData.sources.length === 0) ? (
                    <div className="p-12 text-center">
                      <Layers className="h-10 w-10 text-mute mx-auto mb-3" />
                      <p className="text-ink font-semibold">No job sources configured yet.</p>
                      <p className="text-xs text-mute mt-1">Click "Seed Verified Tech Co." above to initialize Stripe, Figma, Netflix, Linear, and more.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="gz-table w-full text-sm">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>ATS Provider</th>
                            <th>Board ID</th>
                            <th>Status</th>
                            <th>Active / Expired</th>
                            <th>Last Sync</th>
                            <th>Health / Errors</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobSourcesData.sources.map((src) => {
                            const isSyncing = syncingSourceId === src.id;
                            return (
                              <tr key={src.id} className="hover:bg-paper/50 transition-colors">
                                <td>
                                  <div className="font-semibold text-ink">{src.company_name}</div>
                                  <div className="text-[11px] text-mute font-mono">{src.company_slug}</div>
                                </td>
                                <td>
                                  <span className="gz-chip text-xs font-mono uppercase font-semibold">
                                    {src.name}
                                  </span>
                                </td>
                                <td>
                                  <span className="font-mono text-xs text-ink-soft">{src.board_identifier}</span>
                                  {src.careers_url && (
                                    <a
                                      href={src.careers_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-1.5 text-accent hover:underline inline-flex items-center"
                                      title="Open careers page"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </td>
                                <td>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                      src.enabled ? "bg-mint/15 text-mint" : "bg-paper-2 text-mute"
                                    }`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${src.enabled ? "bg-mint" : "bg-mute"}`} />
                                    {src.enabled ? "Enabled" : "Disabled"}
                                  </span>
                                </td>
                                <td>
                                  <span className="font-semibold text-mint">{src.active_jobs}</span>
                                  <span className="text-mute text-xs"> active</span>
                                  <span className="text-mute text-xs"> · {src.expired_jobs} expired</span>
                                </td>
                                <td>
                                  <div className="text-xs text-ink-soft">
                                    {src.last_sync_at
                                      ? new Date(src.last_sync_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                                      : "Never"}
                                  </div>
                                </td>
                                <td>
                                  {src.error_count > 0 ? (
                                    <div className="text-xs text-coral font-medium flex items-center gap-1" title={src.last_error || "Sync error"}>
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate max-w-[150px]">{src.last_error || `${src.error_count} error(s)`}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-mint font-medium flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                      <span>Healthy</span>
                                    </div>
                                  )}
                                </td>
                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      disabled={isSyncing || syncingAll}
                                      onClick={async () => {
                                        setSyncingSourceId(src.id);
                                        setJobSourceNotice("");
                                        try {
                                          const res = await adminSyncJobSource({ data: { id: src.id } });
                                          if (res.ok && res.syncResult) {
                                            setJobSourceNotice(
                                              `Synced ${src.company_name}: ${res.syncResult.totalFetched} fetched (${res.syncResult.newCount} new, ${res.syncResult.updatedCount} updated, ${res.syncResult.closedCount} expired) in ${res.syncResult.durationMs}ms`,
                                            );
                                          } else {
                                            setJobSourceNotice(`Sync error for ${src.company_name}: ${res.error || "Unknown error"}`);
                                          }
                                          await loadData(true);
                                        } catch (e) {
                                          setJobSourceNotice(e instanceof Error ? e.message : "Sync failed");
                                        } finally {
                                          setSyncingSourceId(null);
                                        }
                                      }}
                                      className="gz-btn text-xs !min-h-7 !px-2.5 bg-paper-2 hover:bg-paper border border-line flex items-center gap-1"
                                    >
                                      <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-accent" : "text-ink-soft"}`} />
                                      <span>{isSyncing ? "Syncing…" : "Sync"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await adminToggleJobSource({ data: { id: src.id, enabled: !src.enabled } });
                                          await loadData(true);
                                        } catch (e) {
                                          setError(e instanceof Error ? e.message : "Failed to toggle status");
                                        }
                                      }}
                                      className={`gz-btn text-xs !min-h-7 !px-2.5 rounded-lg font-medium ${
                                        src.enabled
                                          ? "text-mute hover:text-coral hover:bg-coral/10"
                                          : "text-mint hover:bg-mint/10"
                                      }`}
                                    >
                                      {src.enabled ? "Disable" : "Enable"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 2: AUTOMATIC COMPANY DISCOVERY & ATS PIPELINE
            ════════════════════════════════════════════════════════════════ */}
            {discoverySubTab === "discovery" && (
              <div className="space-y-6 animate-gz-fade-in">
                {/* Provider Configuration Status Banners */}
                <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-accent" />
                      <span>Company Discovery Providers Configuration</span>
                    </h3>
                    <span className="text-xs text-mute font-mono">Environment-driven credentials</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    {(discoveryStatusData?.providerStatuses || []).map((p) => (
                      <div
                        key={p.name}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          p.configured
                            ? "border-mint/30 bg-mint/5"
                            : "border-line bg-paper/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-semibold">
                            <span className="capitalize">{p.name.replace("-", " ")}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                p.configured ? "bg-mint/20 text-mint" : "bg-paper-2 text-mute"
                              }`}
                            >
                              {p.configured ? "Configured" : "Unconfigured"}
                            </span>
                          </div>
                          <p className="text-[11px] text-mute mt-1.5 leading-relaxed">{p.description}</p>
                        </div>
                        {!p.configured && p.missingKeys && (
                          <div className="mt-2 text-[10px] text-coral font-mono">
                            Needs: {p.missingKeys.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discovery Trigger Form Panel */}
                <div className="rounded-2xl border border-line bg-gradient-to-br from-white via-white to-paper p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">
                        Start Automated Discovery Run
                      </h3>
                      <p className="text-xs text-mute mt-0.5">
                        Discovers candidate companies, validates official websites (SSRF protected), scans for careers pages, detects ATS platforms, validates boards, and registers sources.
                      </p>
                    </div>
                    {discoveryStatusData?.isRunning && (
                      <div className="px-3 py-1 rounded-full bg-mint/15 text-mint text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-mint" />
                        <span>Pipeline Active</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-soft mb-1.5">Search Query / Term</label>
                      <input
                        type="text"
                        value={discoveryQuery}
                        onChange={(e) => setDiscoveryQuery(e.target.value)}
                        placeholder="e.g. Fintech, SaaS, AI Labs"
                        className="gz-input text-xs w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-soft mb-1.5">Target Location / City</label>
                      <input
                        type="text"
                        value={discoveryLocation}
                        onChange={(e) => setDiscoveryLocation(e.target.value)}
                        placeholder="Bengaluru, Hyderabad, Pune"
                        className="gz-input text-xs w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-soft mb-1.5">Industry Vertical</label>
                      <input
                        type="text"
                        value={discoveryIndustry}
                        onChange={(e) => setDiscoveryIndustry(e.target.value)}
                        placeholder="Technology, Fintech, Health"
                        className="gz-input text-xs w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-soft mb-1.5">Discovery Provider</label>
                      <select
                        value={discoveryProvider}
                        onChange={(e) => setDiscoveryProvider(e.target.value)}
                        className="gz-input text-xs w-full"
                      >
                        <option value="business-directory">Business Directory API</option>
                        <option value="google-places">Google Places API</option>
                        <option value="test-directory">Test Seed Directory (Deterministic)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line/60">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-mute font-medium">Batch Limit:</span>
                        <select
                          value={discoveryMaxCompanies}
                          onChange={(e) => setDiscoveryMaxCompanies(Number(e.target.value))}
                          className="gz-input text-xs !py-1 !px-2.5"
                        >
                          <option value={5}>5 Companies</option>
                          <option value={10}>10 Companies</option>
                          <option value={15}>15 Companies</option>
                          <option value={25}>25 Companies</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-mute hover:text-ink">
                        <input
                          type="checkbox"
                          checked={discoveryAllowTestFallback}
                          onChange={(e) => setDiscoveryAllowTestFallback(e.target.checked)}
                          className="rounded border-line"
                        />
                        <span>Allow test fallback if external API unconfigured</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={isStartingDiscovery || discoveryStatusData?.isRunning}
                      onClick={async () => {
                        setIsStartingDiscovery(true);
                        setJobSourceNotice("");
                        try {
                          const res = await adminStartCompanyDiscovery({
                            data: {
                              query: discoveryQuery || undefined,
                              location: discoveryLocation || undefined,
                              industry: discoveryIndustry || undefined,
                              provider: discoveryProvider,
                              maxCompanies: discoveryMaxCompanies,
                              allowTestFallback: discoveryAllowTestFallback,
                            },
                          });

                          if (res.ok && res.summary) {
                            const s = res.summary;
                            setJobSourceNotice(
                              `Discovery run completed: ${s.companiesFound} companies found, ${s.websitesVerified} websites verified, ${s.careerPagesFound} careers pages discovered, ${s.atsDetected} ATS detected, ${s.sourcesRegistered} registered (${(s.durationMs / 1000).toFixed(1)}s).`,
                            );
                          } else {
                            setJobSourceNotice(`Discovery notice: ${res.error || "Run finished"}`);
                          }
                          await loadData(true);
                        } catch (e) {
                          setJobSourceNotice(e instanceof Error ? e.message : "Discovery failed to start");
                        } finally {
                          setIsStartingDiscovery(false);
                        }
                      }}
                      className="gz-btn gz-btn-primary text-xs !min-h-9 !px-5 flex items-center gap-2 font-semibold shadow-xs"
                    >
                      <Play className={`h-3.5 w-3.5 ${isStartingDiscovery ? "animate-spin" : ""}`} />
                      <span>{isStartingDiscovery ? "Running Pipeline…" : "Execute Discovery Run"}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Discovered Companies Table */}
                <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden space-y-0">
                  <div className="p-4 border-b border-line bg-paper/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {[
                        { id: "all", label: "All Companies" },
                        { id: "discovered", label: "Discovered" },
                        { id: "website_pending", label: "Website Verified" },
                        { id: "career_page_pending", label: "Careers Found" },
                        { id: "ats_detected", label: "ATS Detected" },
                        { id: "source_registered", label: "Registered" },
                        { id: "needs_review", label: "Needs Review" },
                        { id: "discovery_failed", label: "Failed" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setDiscoveryFilterStatus(f.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            discoveryFilterStatus === f.id
                              ? "bg-ink text-paper font-semibold"
                              : "text-mute hover:text-ink hover:bg-paper"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-mute font-mono">
                      {discoveredCompaniesData?.companies.length ?? 0} discovered entities
                    </span>
                  </div>

                  {(!discoveredCompaniesData || discoveredCompaniesData.companies.length === 0) ? (
                    <div className="p-12 text-center">
                      <Compass className="h-10 w-10 text-mute mx-auto mb-3" />
                      <p className="text-ink font-semibold">No companies discovered yet.</p>
                      <p className="text-xs text-mute mt-1">Run discovery above or trigger the scheduled background pipeline.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="gz-table w-full text-sm">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Website</th>
                            <th>Careers Page</th>
                            <th>Detected ATS</th>
                            <th>Status</th>
                            <th>Confidence</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {discoveredCompaniesData.companies
                            .filter((c) =>
                              discoveryFilterStatus === "all" ? true : c.discoveryStatus === discoveryFilterStatus,
                            )
                            .map((comp) => {
                              const isRetrying = retryingCompanyId === comp.id;
                              return (
                                <tr key={comp.id} className="hover:bg-paper/50 transition-colors">
                                  <td>
                                    <div className="font-semibold text-ink">{comp.companyName}</div>
                                    <div className="text-[11px] text-mute font-mono">
                                      {comp.city || "India"} · {comp.industry}
                                    </div>
                                  </td>
                                  <td>
                                    {comp.website ? (
                                      <a
                                        href={comp.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-mono"
                                      >
                                        <Globe className="h-3 w-3" />
                                        <span className="truncate max-w-[140px]">
                                          {comp.website.replace(/^https?:\/\//i, "")}
                                        </span>
                                      </a>
                                    ) : (
                                      <span className="text-xs text-mute">—</span>
                                    )}
                                  </td>
                                  <td>
                                    {comp.careersUrl ? (
                                      <a
                                        href={comp.careersUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-mono"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        <span className="truncate max-w-[140px]">
                                          {comp.careersUrl.replace(/^https?:\/\//i, "")}
                                        </span>
                                      </a>
                                    ) : (
                                      <span className="text-xs text-mute">Not found</span>
                                    )}
                                  </td>
                                  <td>
                                    {comp.atsType ? (
                                      <div>
                                        <span className="gz-chip text-xs font-mono font-bold uppercase">
                                          {comp.atsType}
                                        </span>
                                        <div className="text-[11px] text-ink-soft font-mono mt-0.5">
                                          {comp.atsIdentifier}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-mute font-mono">—</span>
                                    )}
                                  </td>
                                  <td>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                        comp.discoveryStatus === "source_registered"
                                          ? "bg-mint/15 text-mint"
                                          : comp.discoveryStatus === "ats_detected"
                                          ? "bg-accent/15 text-accent"
                                          : comp.discoveryStatus === "needs_review"
                                          ? "bg-amber-100 text-amber-700"
                                          : comp.discoveryStatus === "discovery_failed"
                                          ? "bg-coral/15 text-coral"
                                          : "bg-paper-2 text-mute"
                                      }`}
                                    >
                                      {comp.discoveryStatus.replace("_", " ")}
                                    </span>
                                    {comp.reviewNotes && (
                                      <div className="text-[10px] text-mute truncate max-w-[130px]" title={comp.reviewNotes}>
                                        {comp.reviewNotes}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div className="text-xs font-mono font-semibold text-ink">
                                      {Math.round(comp.confidence * 100)}%
                                    </div>
                                  </td>
                                  <td className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        disabled={isRetrying}
                                        onClick={async () => {
                                          setRetryingCompanyId(comp.id);
                                          setJobSourceNotice("");
                                          try {
                                            const res = await adminRetryCompanyDiscovery({
                                              data: { companyId: comp.id },
                                            });
                                            if (res.ok) {
                                              setJobSourceNotice(`Retried discovery for ${comp.companyName}: ${res.registration?.reason}`);
                                            } else {
                                              setJobSourceNotice(`Retry error for ${comp.companyName}: ${res.error}`);
                                            }
                                            await loadData(true);
                                          } catch (e) {
                                            setJobSourceNotice(e instanceof Error ? e.message : "Retry failed");
                                          } finally {
                                            setRetryingCompanyId(null);
                                          }
                                        }}
                                        className="gz-btn text-xs !min-h-7 !px-2.5 bg-paper-2 hover:bg-paper border border-line flex items-center gap-1"
                                      >
                                        <RotateCcw className={`h-3 w-3 ${isRetrying ? "animate-spin text-accent" : "text-ink-soft"}`} />
                                        <span>{isRetrying ? "Retrying…" : "Retry"}</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Candidate ATS Source Reviews Section (Approvals/Rejections) */}
                {candidateSourcesData && candidateSourcesData.candidateSources.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden space-y-0">
                    <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Discovered Candidate Sources ({candidateSourcesData.candidateSources.length})</h3>
                      <span className="text-xs text-mute font-mono">Validation and admin approvals</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="gz-table w-full text-sm">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Detected ATS</th>
                            <th>Board Identifier</th>
                            <th>Confidence</th>
                            <th>Status</th>
                            <th>Validation Result</th>
                            <th className="text-right">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidateSourcesData.candidateSources.map((cs) => {
                            const isBusy = reviewingCandidateId === cs.id;
                            return (
                              <tr key={cs.id} className="hover:bg-paper/50 transition-colors">
                                <td className="font-semibold text-ink">{cs.companyName}</td>
                                <td>
                                  <span className="gz-chip text-xs font-mono uppercase font-bold">{cs.atsType}</span>
                                </td>
                                <td className="font-mono text-xs">{cs.boardIdentifier}</td>
                                <td>
                                  <span className="font-mono text-xs font-bold">{Math.round(cs.confidence * 100)}%</span>
                                </td>
                                <td>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      cs.validationStatus === "valid" || cs.validationStatus === "approved"
                                        ? "bg-mint/15 text-mint"
                                        : cs.validationStatus === "rejected"
                                        ? "bg-coral/15 text-coral"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {cs.validationStatus}
                                  </span>
                                </td>
                                <td className="text-xs text-mute">
                                  {cs.validationError || "Schema & public endpoints verified"}
                                </td>
                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {cs.validationStatus !== "approved" && (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={async () => {
                                          setReviewingCandidateId(cs.id);
                                          try {
                                            await adminReviewCompanySource({
                                              data: { candidateSourceId: cs.id, decision: "approve" },
                                            });
                                            setJobSourceNotice(`Approved ${cs.companyName} (${cs.atsType}:${cs.boardIdentifier})`);
                                            await loadData(true);
                                          } catch (e) {
                                            setJobSourceNotice(e instanceof Error ? e.message : "Failed to approve");
                                          } finally {
                                            setReviewingCandidateId(null);
                                          }
                                        }}
                                        className="gz-btn text-xs !min-h-7 !px-2.5 bg-mint/10 text-mint hover:bg-mint/20 border border-mint/30"
                                      >
                                        Approve
                                      </button>
                                    )}

                                    {cs.validationStatus !== "rejected" && (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={async () => {
                                          setReviewingCandidateId(cs.id);
                                          try {
                                            await adminReviewCompanySource({
                                              data: { candidateSourceId: cs.id, decision: "reject" },
                                            });
                                            setJobSourceNotice(`Rejected ${cs.companyName}`);
                                            await loadData(true);
                                          } catch (e) {
                                            setJobSourceNotice(e instanceof Error ? e.message : "Failed to reject");
                                          } finally {
                                            setReviewingCandidateId(null);
                                          }
                                        }}
                                        className="gz-btn text-xs !min-h-7 !px-2.5 bg-coral/10 text-coral hover:bg-coral/20 border border-coral/30"
                                      >
                                        Reject
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SUB-TAB 3: DISCOVERY RUN HISTORY & OBSERVABILITY
            ════════════════════════════════════════════════════════════════ */}
            {discoverySubTab === "runs" && (
              <div className="space-y-6 animate-gz-fade-in">
                <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
                  <div className="px-5 py-3 border-b border-line bg-paper/60 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Persisted Discovery Run Telemetry</h3>
                    <span className="text-xs text-mute font-mono">Observable execution history</span>
                  </div>

                  {(!discoveryStatusData || discoveryStatusData.recentRuns.length === 0) ? (
                    <div className="p-12 text-center">
                      <Activity className="h-10 w-10 text-mute mx-auto mb-3" />
                      <p className="text-ink font-semibold">No discovery runs recorded yet.</p>
                      <p className="text-xs text-mute mt-1">Runs triggered via Admin or Cron will log execution metrics here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="gz-table w-full text-sm">
                        <thead>
                          <tr>
                            <th>Run ID / Provider</th>
                            <th>Query / Scope</th>
                            <th>Status</th>
                            <th>Processed / Verified</th>
                            <th>ATS Detected</th>
                            <th>Registered</th>
                            <th>Failures / Review</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {discoveryStatusData.recentRuns.map((r) => (
                            <tr key={r.id} className="hover:bg-paper/50 transition-colors">
                              <td>
                                <div className="font-mono text-xs font-semibold text-ink">{r.id}</div>
                                <div className="text-[11px] text-mute capitalize">{r.provider}</div>
                              </td>
                              <td>
                                <div className="text-xs text-ink-soft">
                                  {r.query || r.location || r.industry || "General Discovery"}
                                </div>
                                <div className="text-[11px] text-mute">{r.location || "India"}</div>
                              </td>
                              <td>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    r.status === "completed"
                                      ? "bg-mint/15 text-mint"
                                      : r.status === "running"
                                      ? "bg-accent/15 text-accent animate-pulse"
                                      : "bg-coral/15 text-coral"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td>
                                <span className="font-semibold text-ink">{r.companiesProcessed}</span>
                                <span className="text-mute text-xs"> / {r.websitesVerified} verified</span>
                              </td>
                              <td>
                                <span className="font-semibold text-accent">{r.atsDetected}</span>
                                <span className="text-mute text-xs"> detected</span>
                              </td>
                              <td>
                                <span className="font-semibold text-mint">{r.sourcesRegistered}</span>
                                <span className="text-mute text-xs"> sources</span>
                              </td>
                              <td>
                                <span className="text-xs text-coral font-medium">{r.failedCount} failed</span>
                                <span className="text-mute text-xs"> · {r.needsReviewCount} review</span>
                              </td>
                              <td className="text-xs text-mute font-mono">
                                {new Date(r.startedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            AUDIT LOG
        ════════════════════════════════════════════════════════════════ */}
        {activeSection === "audit" && (
          <div key="audit" className="animate-gz-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Platform Activity Log</h2>
              <span className="text-xs font-mono text-mute">{audit.length} recent entries</span>
            </div>

            {audit.length === 0 ? (
              <div className="rounded-2xl border border-line bg-paper-2 p-12 text-center animate-gz-scale-in">
                <Activity className="h-10 w-10 text-mute mx-auto mb-3" />
                <p className="text-mute">No audit log entries yet. Actions will appear here as users interact with the platform.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="gz-table w-full text-sm">
                    <thead>
                      <tr>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Entity ID</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.map((a) => (
                        <tr key={a.id} className="hover:bg-paper/50 transition-colors">
                          <td className="font-medium">{a.display_name ?? <span className="text-mute text-xs font-mono">{a.actor_id?.slice(0, 10) ?? "system"}</span>}</td>
                          <td>
                            <span className="font-mono text-xs bg-paper-2 px-2 py-0.5 rounded text-ink-soft">{a.action}</span>
                          </td>
                          <td className="capitalize text-ink-soft">{a.entity}</td>
                          <td className="font-mono text-[11px] text-mute">{a.entity_id ?? "—"}</td>
                          <td className="text-mute text-xs font-mono tabular-nums">
                            {new Date(a.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
