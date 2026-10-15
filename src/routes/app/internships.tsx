import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyInternshipApps, getMyProfile } from "@/lib/data/me";
import { postInternship } from "@/lib/data/actions";
import { EmptyState, LoadingState, StatusPill } from "@/components/ui/State";
import { formatDate, rupees } from "@/lib/ids";
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Search,
  ExternalLink,
  Code2,
} from "lucide-react";

export const Route = createFileRoute("/app/internships")({
  component: AppInternships,
});

function AppInternships() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyInternshipApps>> | null>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>> | null>(null);
  const [form, setForm] = useState({
    role: "",
    category: "Coding",
    skills: "React,Node.js",
    duration: "3 months",
    location: "Bengaluru",
    remote: false,
    stipend: 20000,
    deadline: new Date().toISOString().slice(0, 10),
    description: "A real brief. You will ship behind a flag.",
  });
  const [msg, setMsg] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    listMyInternshipApps().then(setRows).catch(() => setRows([]));
    getMyProfile().then(setProfile).catch(() => null);
  }, []);

  const isEmployerOrAdmin = profile?.role === "employer" || profile?.role === "super_admin";
  const totalApplied = rows?.length ?? 0;
  const inReview = rows?.filter((r) => r.status === "applied" || r.status === "reviewing").length ?? 0;
  const shortlisted = rows?.filter((r) => r.status === "shortlisted" || r.status === "interview").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="gz-chip text-[11px] font-mono bg-coral/10 text-coral font-semibold">
              CAREER PIPELINE · STUDENT DESK
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Internship Applications
            </h1>
            <p className="mt-1 text-sm text-mute max-w-2xl">
              Track your stipended internship applications, review stages, and offer letters from partner startups.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/internships" className="gz-btn gz-btn-primary flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Browse 40+ Internships</span>
            </Link>
          </div>
        </div>

        {/* Quick Counters */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line/60 pt-5">
          <div className="rounded-xl bg-paper/60 p-3.5 border border-line/50">
            <span className="text-[11px] font-mono text-mute uppercase">Total Applied</span>
            <p className="text-2xl font-bold font-display text-ink mt-0.5">{totalApplied}</p>
          </div>
          <div className="rounded-xl bg-paper/60 p-3.5 border border-line/50">
            <span className="text-[11px] font-mono text-mute uppercase">Under Review</span>
            <p className="text-2xl font-bold font-display text-coral mt-0.5">{inReview}</p>
          </div>
          <div className="rounded-xl bg-paper/60 p-3.5 border border-line/50">
            <span className="text-[11px] font-mono text-mute uppercase">Shortlisted</span>
            <p className="text-2xl font-bold font-display text-mint mt-0.5">{shortlisted}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Applications List (7 cols) */}
        <section className="lg:col-span-7 rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">My Applications</h2>
                <p className="text-xs text-mute font-mono">Live submission status</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-mute">
              {rows ? `${rows.length} ${rows.length === 1 ? "application" : "applications"}` : "Loading..."}
            </span>
          </div>

          {rows === null ? <LoadingState /> : null}

          {rows && rows.length === 0 ? (
            <div className="py-8 text-center">
              <EmptyState
                title="No active internship applications"
                body="You haven't applied to any internships yet. Explore 40+ stipended openings with verified corporate mentors."
              />
              <Link to="/internships" className="gz-btn gz-btn-primary mt-5 inline-flex items-center gap-2">
                <span>Browse Stipended Internships</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {rows && rows.length > 0 ? (
            <ul className="divide-y divide-line/60">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-paper/30 px-2 rounded-xl transition-colors">
                  <div>
                    <Link
                      to="/internships/$id"
                      params={{ id: r.internship_id }}
                      className="font-display font-bold text-base text-ink hover:text-coral transition-colors flex items-center gap-1.5"
                    >
                      <span>{r.role}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-mute" />
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-mute mt-1">
                      <span className="font-medium text-ink-soft">{r.company}</span>
                      <span>·</span>
                      <span className="font-mono">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusPill status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Right Column: Student Internship Acceleration & Tips (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          {isEmployerOrAdmin ? (
            <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent" />
                  <h2 className="font-display text-lg font-bold">Employer Internship Desk</h2>
                </div>
                <span className="gz-chip text-[10px] font-mono bg-accent/10 text-accent">RECRUITER</span>
              </div>
              <p className="text-xs text-mute mb-4">
                You are logged in as an employer or admin. Post an internship listing for students.
              </p>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsPosting(true);
                  try {
                    const r = await postInternship({ data: form });
                    setMsg(`Internship posted successfully! ID: ${r.id}`);
                    setForm({ ...form, role: "" });
                  } catch (err) {
                    setMsg(err instanceof Error ? err.message : "Failed to post internship");
                  } finally {
                    setIsPosting(false);
                  }
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Role Title</label>
                  <input
                    className="gz-input mt-1"
                    placeholder="e.g. Frontend Engineering Intern"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Skills Required</label>
                  <input
                    className="gz-input mt-1"
                    placeholder="e.g. React, Node.js"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Monthly Stipend (₹)</label>
                  <input
                    className="gz-input mt-1"
                    type="number"
                    value={form.stipend}
                    onChange={(e) => setForm({ ...form, stipend: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Description & Deliverables</label>
                  <textarea
                    className="gz-input mt-1 min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <button className="gz-btn gz-btn-primary w-full" disabled={isPosting}>
                  {isPosting ? "Posting..." : "Create Internship Listing"}
                </button>
              </form>
              {msg ? <p className="mt-3 text-xs font-semibold text-accent">{msg}</p> : null}
            </div>
          ) : (
            <>
              {/* Student Internship Acceleration Hub */}
              <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-coral" />
                    <h2 className="font-display text-lg font-bold text-ink">Internship Advantage</h2>
                  </div>
                  <span className="gz-chip text-[10px] font-mono bg-coral/10 text-coral">
                    DIRECT RECRUITMENT
                  </span>
                </div>
                <p className="text-xs text-mute leading-relaxed">
                  GenZ360 connects student builders directly with verified tech startups, fintech squads, and AI labs.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-ink">Verified Live Sprints Count</span>
                    </div>
                    <p className="text-[11px] text-mute mt-1">
                      Projects you ship on GenZ360 are automatically attached to your application and proven to recruiters.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper/60 border border-line/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-mint" />
                      <span className="text-xs font-bold text-ink">Guaranteed Monthly Stipends</span>
                    </div>
                    <p className="text-[11px] text-mute mt-1">
                      All verified corporate partner listings provide guaranteed monthly stipends between ₹15,000 and ₹30,000.
                    </p>
                  </div>
                </div>

                <Link
                  to="/internships"
                  className="gz-btn gz-btn-primary w-full !min-h-10 text-xs font-semibold inline-flex items-center justify-center gap-2 mt-2"
                >
                  <span>Explore Open Internships</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Notice for Recruiters */}
              <div className="p-4 rounded-xl bg-paper/40 border border-line text-xs text-mute">
                <span className="font-semibold text-ink block mb-0.5">Are you an employer looking to hire interns?</span>
                Post internship openings and review student sprint portfolios on the{" "}
                <Link to="/portal" search={{ role: "employer" }} className="text-accent font-semibold hover:underline">
                  Employer Portal →
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

