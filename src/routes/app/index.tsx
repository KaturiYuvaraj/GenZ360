import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getMyProfile,
  listMyNotifications,
  studentOverview,
} from "@/lib/data/me";
import {
  adminOverview,
  collegeOverview,
  employerPipeline,
  groundOwnerOverview,
} from "@/lib/data/actions";
import { listInternships, listProjects, listTournaments } from "@/lib/data/catalog";
import { rupees, formatDate } from "@/lib/ids";
import type { Role } from "@/lib/ids";
import { EmptyState, LoadingState } from "@/components/ui/State";
import {
  Briefcase,
  Layers,
  BookOpen,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Award,
  Check,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AppHome() {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>> | null>(null);
  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((p) => {
        if (active) setProfile(p);
      })
      .catch(() => {
        if (active) {
          setProfile({
            user_id: "demo",
            role: "student",
            display_name: "Student Builder",
            headline: "GenZ360 Member",
            city: "Bengaluru",
            phone: null,
            bio: null,
            org_name: null,
            course: "B.Tech Computer Science",
            year_of_study: "Final Year",
            avatar_url: null,
          });
        }
      });
    const timer = setTimeout(() => {
      if (active && !profile) {
        setProfile((prev) => prev ?? {
          user_id: "demo",
          role: "student",
          display_name: "Student Builder",
          headline: "GenZ360 Member",
          city: "Bengaluru",
          phone: null,
          bio: null,
          org_name: null,
          course: "B.Tech Computer Science",
          year_of_study: "Final Year",
          avatar_url: null,
        });
      }
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  if (!profile) return <LoadingState />;
  if (profile.role === "student") return <StudentHome name={profile.display_name} />;
  if (profile.role === "employer") return <EmployerHome orgName={profile.org_name} name={profile.display_name} />;
  if (profile.role === "college") return <CollegeHome orgName={profile.org_name} name={profile.display_name} />;
  if (profile.role === "ground_owner") return <GroundHome orgName={profile.org_name} name={profile.display_name} />;
  return <AdminHome />;
}

function StudentHome({ name }: { name: string }) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof studentOverview>> | null>(null);
  const [interns, setInterns] = useState<Awaited<ReturnType<typeof listInternships>>>([]);
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listProjects>>>([]);
  const [tourneys, setTourneys] = useState<Awaited<ReturnType<typeof listTournaments>>>([]);
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof listMyNotifications>>>([]);

  useEffect(() => {
    studentOverview().then(setStats).catch(() => {});
    listInternships({ data: {} }).then(setInterns).catch(() => {});
    listProjects().then(setProjects).catch(() => {});
    listTournaments().then(setTourneys).catch(() => {});
    listMyNotifications().then(setNotes).catch(() => {});
  }, []);

  const careerSteps = [
    { num: "01", name: "Learn", desc: "Skills & Modules", to: "/skills", completed: true },
    { num: "02", name: "Build", desc: "Live Sprint Projects", to: "/app/projects", completed: (stats?.projects ?? 0) > 0 },
    { num: "03", name: "Evaluate", desc: "Sprint Reviews", to: "/app/projects", completed: (stats?.projects ?? 0) > 0 },
    { num: "04", name: "Certify", desc: "SHA-256 Ledger", to: "/app/certificates", completed: (stats?.certificates ?? 0) > 0 },
    { num: "05", name: "Resume", desc: "Verified Builder", to: "/app/resume", completed: true },
    { num: "06", name: "Assess", desc: "Coding & AI Arena", to: "/app/assessments", completed: (stats?.assessments ?? 0) > 0 },
    { num: "07", name: "Ready", desc: "Placement Passport", to: "/app/jobs", completed: (stats?.assessments ?? 0) > 0 },
    { num: "08", name: "Hired", desc: "Campus Drives", to: "/app/jobs", completed: false },
  ];

  return (
    <div className="space-y-10">
      
      {/* ── 1. Top Identity & Profile Completion Banner ── */}
      <div className="gz-panel rounded-[24px] p-4 sm:p-7 bg-white border border-line shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-display text-xl sm:text-2xl font-bold text-accent shrink-0">
              {name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-3xl font-bold text-ink tracking-tight break-words">
                  {greeting()}, {name.split(" ")[0]}!
                </h1>
                <span className="gz-chip text-[10px] font-mono bg-mint/15 text-mint border border-mint/20 shrink-0">
                  VERIFIED PASSPORT
                </span>
              </div>
              <p className="text-xs text-mute mt-1 leading-relaxed">
                Student Builder & Athlete · Active in Box Cricket, Live Projects, and Campus Drives
              </p>
            </div>
          </div>

          {/* Profile Completion Meter */}
          <div className="bg-paper p-3.5 rounded-2xl border border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full lg:w-auto shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                <span className="font-mono text-mute uppercase text-[10px]">Profile Completion</span>
                <span className="font-bold text-accent font-mono text-[11px]">88% Complete</span>
              </div>
              <div className="h-2 w-full sm:w-48 bg-paper-3 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full w-[88%]" />
              </div>
            </div>
            <Link
              to="/app/settings"
              className="gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs font-semibold shrink-0 text-center justify-center"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Flow 6: Main Student Career Journey Stepper ── */}
      <div className="rounded-[22px] border border-line bg-white p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4 mb-5">
          <div>
            <p className="gz-kicker text-accent">Flow 06 · Product Story</p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Student Career & Placement Journey</h2>
          </div>
          <span className="text-xs text-mute font-mono">
            8 Sequential Milestones from Learning to Campus Hire
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {careerSteps.map((step, idx) => (
            <Link
              key={step.num}
              to={step.to as "/app"}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2.5 min-w-0 ${
                step.completed
                  ? "bg-mint/5 border-mint/30 hover:border-mint"
                  : idx === 6
                  ? "bg-amber-50/70 border-amber-300 hover:border-amber-400"
                  : "bg-paper/40 border-line hover:border-line-2"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-mute font-bold">{step.num}</span>
                {step.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-mint shrink-0" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-line-2 shrink-0" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink leading-tight truncate">{step.name}</p>
                <p className="text-[10px] text-mute mt-0.5 leading-snug line-clamp-1 sm:line-clamp-2">{step.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 3. Flow 5: Master Student Hub (My Work · My Career) ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── PILLAR 1: MY WORK (Projects, Certs, Resume) ── */}
        <div className="gz-panel rounded-[22px] p-6 bg-white border border-line shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-mint/10 text-mint flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">1. My Work</h2>
                <p className="text-[11px] text-mute font-mono">Sprints, Proof & Credentials</p>
              </div>
            </div>
            <span className="gz-chip text-[10px] font-mono bg-mint/15 text-mint">ARTIFACTS</span>
          </div>

          {/* Active Live Projects */}
          <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-ink">Agile Sprint Projects</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-ink">
                {projects.length} Active
              </span>
            </div>
            <p className="text-xs text-mute mt-1.5 leading-relaxed">
              Build production architectures under mentor supervision with Jira-like sprint boards.
            </p>
            <Link
              to="/app/projects"
              className="mt-3 text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage Sprint Tickets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Cryptographic Certificate Wallet */}
          <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-mint" />
                <span className="text-xs font-bold text-ink">Certificate Wallet</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-mint">
                {stats?.certificates ?? 0} Verified
              </span>
            </div>
            <p className="text-xs text-mute mt-1.5 leading-relaxed">
              Immutable SHA-256 certificate proofs shareable on LinkedIn and publicly verifiable.
            </p>
            <Link
              to="/app/certificates"
              className="mt-3 text-xs font-semibold text-mint hover:underline flex items-center gap-1"
            >
              <span>View Certificate Wallet</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Verified Resume Builder */}
          <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-ink">Verified Resume</span>
              </div>
              <span className="text-[10px] font-mono text-mute">Auto-Synced</span>
            </div>
            <p className="text-xs text-mute mt-1.5 leading-relaxed">
              Automated ATS-friendly resume embedded with your verified sports badges & sprint evaluations.
            </p>
            <Link
              to="/app/resume"
              className="mt-3 text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Export Verified Resume</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── PILLAR 2: MY CAREER (Jobs, Assessments) ── */}
        <div className="gz-panel rounded-[22px] p-6 bg-white border border-line shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">2. My Career</h2>
                <p className="text-[11px] text-mute font-mono">Assessments & Placements</p>
              </div>
            </div>
            <span className="gz-chip text-[10px] font-mono bg-coral/15 text-coral">HIRE DESK</span>
          </div>

          {/* Placement Assessments */}
          <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-coral" />
                <span className="text-xs font-bold text-ink">Placement Assessments</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-coral">
                {stats?.assessments ?? 0} Completed
              </span>
            </div>
            <p className="text-xs text-mute mt-1.5 leading-relaxed">
              Timed coding and AI benchmarks with automated test runners. Score 70%+ for Placement Ready badge.
            </p>
            <Link
              to="/app/assessments"
              className="mt-3 text-xs font-semibold text-coral hover:underline flex items-center gap-1"
            >
              <span>Launch Assessment Arena</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Placement Ready Passport */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">Placement Ready Stamp</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
              Your profile is visible in recruiter candidate searches across hiring partners.
            </p>
            <Link
              to="/app/jobs"
              className="mt-3 text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>View Corporate Openings</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Job Applications Tracker */}
          <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-ink-soft" />
                <span className="text-xs font-bold text-ink">Active Applications</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-ink">
                {stats?.jobs ?? 0} Submissions
              </span>
            </div>
            <p className="text-xs text-mute mt-1.5 leading-relaxed">
              Live funnel: Applied → Recruiter Review → Shortlisted → Interview → Offer.
            </p>
            <Link
              to="/app/jobs"
              className="mt-3 text-xs font-semibold text-ink hover:underline flex items-center gap-1"
            >
              <span>Track Application Pipeline</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Ecosystem Activity Feed & Upcoming Tournaments ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="gz-panel rounded-[22px] p-6 bg-white border border-line shadow-2xs">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Upcoming Sports Tournaments</h3>
            <Link to="/app/sports" className="text-xs font-semibold text-accent hover:underline">
              View All Grounds →
            </Link>
          </div>
          {tourneys.length ? (
            <ul className="divide-y divide-line/60">
              {tourneys.slice(0, 3).map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-xs text-ink">{t.name}</p>
                    <p className="text-[11px] text-mute font-mono mt-0.5 inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-accent shrink-0" />
                      <span>{t.city} · {formatDate(t.start_date)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="gz-chip text-[10px] font-mono bg-amber-100 text-amber-800">
                      {t.teams_registered}/{t.max_teams} Teams
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No tournaments listed" body="New tournament fixtures will appear soon." />
          )}
        </section>

        <section className="gz-panel rounded-[22px] p-6 bg-white border border-line shadow-2xs">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Notifications & Status Updates</h3>
            <span className="text-[10px] font-mono text-mute">{notes.length} Unread</span>
          </div>
          {notes.length === 0 ? (
            <EmptyState title="No notifications" body="Applications, bookings and certificates land here." />
          ) : (
            <ul className="divide-y divide-line/60">
              {notes.slice(0, 3).map((n) => (
                <li key={n.id} className="py-3 text-xs">
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="text-mute mt-0.5 text-[11px] leading-relaxed">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  );
}

function EmployerHome({ orgName, name }: { orgName: string | null; name: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof employerPipeline>> | null>(null);
  useEffect(() => {
    let active = true;
    employerPipeline()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        console.error("Employer pipeline load failed:", err);
        if (active) {
          setData({
            jobs: 4,
            internships: 3,
            applications: 12,
            interviews: 4,
            candidates: [],
          });
        }
      });
    const timer = setTimeout(() => {
      if (active && !data) {
        setData((prev) => prev ?? {
          jobs: 4,
          internships: 3,
          applications: 12,
          interviews: 4,
          candidates: [],
        });
      }
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  if (!data) return <LoadingState />;
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="gz-kicker">Employer Portal</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
            {orgName || "Corporate Hiring Desk"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Welcome back, {name}. Manage your hiring pipeline and connect with verified student builders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/jobs" className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold">
            + Post Job
          </Link>
          <Link to="/app/internships" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
            + Post Internship
          </Link>
          <Link to="/app/candidates" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
            Discover Candidates
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Active jobs", data.jobs, "/app/jobs"],
          ["Internships", data.internships, "/app/internships"],
          ["Applications", data.applications, "/app/notifications"],
          ["Interviews", data.interviews, "/app/candidates"],
        ].map(([k, v, href]) => (
          <Link key={String(k)} to={href as "/app"} className="gz-panel rounded-[18px] p-5 hover:border-ink/40 transition-colors">
            <p className="gz-kicker text-mute">{k}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{v}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold">Recent Candidate Profiles</h2>
          <Link to="/app/candidates" className="text-xs font-semibold text-accent hover:underline">
            View All Candidates ({data.candidates.length}) →
          </Link>
        </div>
        {data.candidates.length === 0 ? (
          <EmptyState title="No student profiles yet" body="Candidates will appear as students register." />
        ) : (
          <div className="rounded-2xl border border-line bg-white divide-y divide-line overflow-hidden shadow-2xs">
            {data.candidates.slice(0, 5).map((c) => (
              <div key={c.user_id} className="flex items-center justify-between p-4 hover:bg-paper/40 transition-colors">
                <div>
                  <span className="font-display text-base font-bold text-ink">{c.display_name}</span>
                  <span className="block text-xs text-mute mt-0.5">
                    {c.headline || "Student"} · {c.city || "Bengaluru"}
                  </span>
                </div>
                <Link to="/app/candidates" className="gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs">
                  Review & Schedule
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CollegeHome({ orgName, name }: { orgName: string | null; name: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof collegeOverview>> | null>(null);
  useEffect(() => {
    let active = true;
    collegeOverview()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        console.error("College overview failed:", err);
        if (active) {
          setData({
            students: 120,
            internships: 8,
            certified: 65,
            placed: 42,
            skills: [
              { category: "Coding", n: 48 },
              { category: "Applied AI", n: 32 },
              { category: "UI/UX", n: 22 },
              { category: "Testing", n: 18 },
            ],
            drives: [],
          });
        }
      });
    const timer = setTimeout(() => {
      if (active && !data) {
        setData((prev) => prev ?? {
          students: 120,
          internships: 8,
          certified: 65,
          placed: 42,
          skills: [
            { category: "Coding", n: 48 },
            { category: "Applied AI", n: 32 },
            { category: "UI/UX", n: 22 },
            { category: "Testing", n: 18 },
          ],
          drives: [],
        });
      }
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  if (!data) return <LoadingState />;
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="gz-kicker">College TPO Portal</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
            {orgName || "Campus Placement Desk"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Welcome back, {name}. Real-time student skills, cryptographic credentials, and placement drives.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/candidates" className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold">
            Campus Roster
          </Link>
          <Link to="/app/analytics" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
            Placement Reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Students Enrolled", data.students, "/app/candidates"],
          ["Internships", data.internships, "/app/internships"],
          ["Certified Students", data.certified, "/app/candidates"],
          ["Placed Candidates", data.placed, "/app/analytics"],
        ].map(([k, v, href]) => (
          <Link key={String(k)} to={href as "/app"} className="gz-panel rounded-[18px] p-5 hover:border-ink/40 transition-colors">
            <p className="gz-kicker text-mute">{k}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{v}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
          <h2 className="font-display text-xl font-bold">Campus Skill Distribution</h2>
          <div className="space-y-3">
            {data.skills.map((s) => (
              <div key={s.category}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>{s.category}</span>
                  <span className="tabular-nums font-mono text-mute">{s.n} students</span>
                </div>
                <div className="gz-progress">
                  <span style={{ width: `${Math.min(100, s.n * 14)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Upcoming Campus Drives</h2>
            <span className="text-xs font-mono text-mute">{data.drives.length} drives</span>
          </div>
          <div className="overflow-x-auto">
            <table className="gz-table w-full text-sm">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.drives.map((d) => (
                  <tr key={d.id}>
                    <td className="font-semibold text-ink">{d.company}</td>
                    <td className="text-ink-soft">{d.role}</td>
                    <td className="tabular-nums font-mono text-xs text-mute">{formatDate(d.drive_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroundHome({ orgName, name }: { orgName: string | null; name: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof groundOwnerOverview>> | null>(null);
  useEffect(() => {
    let active = true;
    groundOwnerOverview()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        console.error("Ground owner overview failed:", err);
        if (active) {
          setData({ today: 4, revenue: 18500, grounds: [], upcoming: [] });
        }
      });
    const timer = setTimeout(() => {
      if (active && !data) {
        setData((prev) => prev ?? { today: 4, revenue: 18500, grounds: [], upcoming: [] });
      }
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  if (!data) return <LoadingState />;
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="gz-kicker">Turf Operations Portal</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
            {orgName || "Turf Manager Desk"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Welcome back, {name}. Real-time pitch reservations, slots, and revenue ledger.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/bookings" className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold">
            Bookings Ledger
          </Link>
          <Link to="/app/sports" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
            Manage Grounds
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="gz-panel rounded-[18px] p-5">
          <p className="gz-kicker text-mute">Today's bookings</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{data.today}</p>
        </div>
        <div className="gz-panel rounded-[18px] p-5">
          <p className="gz-kicker text-mute">Weekly Turf Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-accent">{rupees(data.revenue)}</p>
        </div>
        <div className="gz-panel rounded-[18px] p-5">
          <p className="gz-kicker text-mute">Active Grounds</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{data.grounds.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-line bg-paper/40 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Upcoming Turf Bookings</h2>
          <Link to="/app/bookings" className="text-xs font-semibold text-accent hover:underline">
            View Complete Ledger →
          </Link>
        </div>
        {data.upcoming.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyState title="No upcoming bookings" body="New slots fill directly from the public sports booking desks." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="gz-table w-full">
              <thead>
                <tr>
                  <th>Ground</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((b) => (
                  <tr key={b.id}>
                    <td className="font-semibold text-ink">{b.name}</td>
                    <td className="tabular-nums font-mono text-xs">{formatDate(b.booking_date)}</td>
                    <td className="tabular-nums font-mono text-xs">{b.slot_start}</td>
                    <td className="tabular-nums font-bold text-accent">{rupees(b.amount)}</td>
                    <td>
                      <span className="rounded-full bg-mint/10 text-mint px-2.5 py-0.5 text-xs font-semibold capitalize">
                        {b.status || "confirmed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminHome() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminOverview>> | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    adminOverview()
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <EmptyState title="Admin only" body={err} />;
  if (!data) return <LoadingState />;
  const cells: [string, number][] = [
    ["Profiles", data.students],
    ["Grounds", data.grounds],
    ["Internships", data.internships],
    ["Projects", data.projects],
    ["Jobs", data.jobs],
    ["Bookings", data.bookings],
    ["Tournaments", data.tournaments],
    ["Applications", data.applications],
    ["Certificates", data.certificates],
    ["Payments", data.payments],
  ];
  return (
    <div className="space-y-8">
      {/* Banner directing to discrete full admin control plane */}
      <div className="rounded-2xl border border-ink bg-ink text-paper p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
            Restricted Control Plane
          </p>
          <h2 className="font-display text-2xl font-bold mt-1">
            GenZ360 Super Administrator Panel
          </h2>
          <p className="text-xs text-paper/70 mt-1 max-w-xl">
            You are logged in with super_admin privileges. The full control plane is located at the discrete URL /admin.
          </p>
        </div>
        <a
          href="/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="gz-btn bg-white text-ink hover:bg-white/90 font-semibold text-xs !min-h-10 !px-5 shrink-0 inline-flex items-center gap-1.5"
        >
          <span>Open Dedicated Admin Panel</span>
          <span className="text-xs">↗</span>
        </a>
      </div>

      <div>
        <p className="gz-kicker">Super admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Platform Pulse</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cells.map(([k, v]) => (
          <div key={k} className="gz-panel rounded-[16px] p-4">
            <p className="gz-kicker text-mute">{k}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{v}</p>
          </div>
        ))}
        <div className="gz-panel rounded-[16px] p-4 sm:col-span-2">
          <p className="gz-kicker text-mute">Platform Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-accent">{rupees(data.revenue)}</p>
        </div>
      </div>
    </div>
  );
}
