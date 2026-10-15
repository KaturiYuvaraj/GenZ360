import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyJobApps, getMyProfile } from "@/lib/data/me";
import {
  postJob,
  listEmployerJobApplicants,
  updateJobApplicationStatus,
} from "@/lib/data/actions";
import { EmptyState, LoadingState, StatusPill } from "@/components/ui/State";
import { formatDate } from "@/lib/ids";
import {
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Target,
  Building2,
  Search,
  ExternalLink,
  Users,
  Flame,
  ChevronDown,
  Calendar,
  X,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/app/jobs")({
  component: AppJobs,
});

type Applicant = Awaited<ReturnType<typeof listEmployerJobApplicants>>[number];

function AppJobs() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyJobApps>> | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>> | null>(null);
  const [activeTab, setActiveTab] = useState<"student" | "recruiter">("student");
  const [msg, setMsg] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  const [form, setForm] = useState({
    role: "",
    category: "Coding",
    skills: "React, TypeScript, SQL",
    location: "Bengaluru",
    remote: false,
    ctc_lpa: 12.0,
    description: "Full-time software engineering role building core cloud & AI applications.",
  });

  useEffect(() => {
    listMyJobApps().then(setRows).catch(() => setRows([]));
    getMyProfile().then((p) => {
      setProfile(p);
      if (p?.role === "employer" || p?.role === "super_admin") {
        setActiveTab("recruiter");
        listEmployerJobApplicants().then(setApplicants).catch(() => setApplicants([]));
      }
    }).catch(() => null);
  }, []);

  const isEmployerOrAdmin = profile?.role === "employer" || profile?.role === "super_admin";

  const totalApplied = rows?.length ?? 0;
  const inReview = rows?.filter((r) => r.status === "applied" || r.status === "reviewing").length ?? 0;
  const shortlisted = rows?.filter((r) => r.status === "shortlisted" || r.status === "interview").length ?? 0;

  async function handleStatusChange(
    applicationId: string,
    status: "applied" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected",
  ) {
    setUpdatingAppId(applicationId);
    try {
      await updateJobApplicationStatus({ data: { applicationId, status } });
      setApplicants((prev) =>
        prev
          ? prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
          : null,
      );
      setMsg(`Application status updated to "${status.toUpperCase()}". Student notified.`);
    } catch (err: any) {
      alert(err?.message || "Failed to update status.");
    } finally {
      setUpdatingAppId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-[22px] border border-line bg-white p-4 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="gz-chip text-[11px] font-mono bg-accent/10 text-accent font-semibold">
                CAREER PIPELINE · {activeTab === "recruiter" ? "RECRUITER DESK" : "STUDENT DESK"}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-ink tracking-tight">
              {activeTab === "recruiter" ? "Recruiter & Placement Drive Hub" : "Job Applications & Placement Drives"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-mute max-w-2xl">
              {activeTab === "recruiter"
                ? "Review applicant pipelines with verified CGPA and Wellness credentials, post openings, and update interview stages."
                : "Track your active corporate job applications, recruiter review status, and campus placement interviews."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            {isEmployerOrAdmin && (
              <div className="flex items-center bg-paper border border-line p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("recruiter");
                    if (!applicants) {
                      listEmployerJobApplicants().then(setApplicants).catch(() => setApplicants([]));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "recruiter"
                      ? "bg-ink text-white shadow-xs"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  Recruiter View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("student")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "student"
                      ? "bg-ink text-white shadow-xs"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  Student View
                </button>
              </div>
            )}
            <Link to="/jobs" className="gz-btn gz-btn-primary flex items-center justify-center gap-2 text-xs flex-1 sm:flex-initial">
              <Search className="h-4 w-4" />
              <span>Browse Open Roles</span>
            </Link>
          </div>
        </div>

        {/* Quick Funnel Counters */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 border-t border-line/60 pt-4 sm:pt-5">
          <div className="rounded-xl bg-paper/60 p-2.5 sm:p-3.5 border border-line/50">
            <span className="text-[9px] sm:text-[11px] font-mono text-mute uppercase truncate block">
              {activeTab === "recruiter" ? "Candidates" : "Applied"}
            </span>
            <p className="text-xl sm:text-2xl font-bold font-display text-ink mt-0.5">
              {activeTab === "recruiter" ? (applicants?.length ?? 0) : totalApplied}
            </p>
          </div>
          <div className="rounded-xl bg-paper/60 p-2.5 sm:p-3.5 border border-line/50">
            <span className="text-[9px] sm:text-[11px] font-mono text-mute uppercase truncate block">Under Review</span>
            <p className="text-xl sm:text-2xl font-bold font-display text-accent mt-0.5">
              {activeTab === "recruiter"
                ? (applicants?.filter((a) => a.status === "applied" || a.status === "reviewing").length ?? 0)
                : inReview}
            </p>
          </div>
          <div className="rounded-xl bg-paper/60 p-2.5 sm:p-3.5 border border-line/50">
            <span className="text-[9px] sm:text-[11px] font-mono text-mute uppercase truncate block">Shortlisted</span>
            <p className="text-xl sm:text-2xl font-bold font-display text-mint mt-0.5">
              {activeTab === "recruiter"
                ? (applicants?.filter((a) => a.status === "shortlisted" || a.status === "interview").length ?? 0)
                : shortlisted}
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-mint/30 bg-mint/10 p-3.5 text-sm text-mint flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{msg}</span>
          </div>
          <button type="button" onClick={() => setMsg("")} className="text-mint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── RECRUITER APPLICANT LEDGER ── */}
      {activeTab === "recruiter" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Applicants Table (8 cols) */}
          <section className="lg:col-span-8 rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Applicant Review Ledger</h2>
                  <p className="text-xs text-mute font-mono">Real-time candidate submissions with verified credentials</p>
                </div>
              </div>
              <Link
                to="/app/candidates"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <span>Candidate Discovery Pool →</span>
              </Link>
            </div>

            {applicants === null ? <LoadingState /> : null}

            {applicants && applicants.length === 0 ? (
              <EmptyState
                title="No applications received yet"
                body="Post new vacancies on the right to start receiving applications from top college students."
              />
            ) : null}

            {applicants && applicants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="gz-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Candidate & College</th>
                      <th>Role Applied</th>
                      <th>CGPA</th>
                      <th>Wellness</th>
                      <th>Current Stage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((a) => (
                      <tr key={a.id} className="hover:bg-paper/30">
                        <td>
                          <p className="font-semibold text-ink">{a.student_name}</p>
                          <p className="text-[11px] text-mute font-mono">{a.college_name}</p>
                        </td>
                        <td>
                          <p className="font-medium">{a.role}</p>
                          <p className="text-[10px] text-mute font-mono">{formatDate(a.applied_at)}</p>
                        </td>
                        <td className="tabular-nums font-mono font-bold text-ink">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            <span>{Number(a.cgpa || 8.4).toFixed(1)}</span>
                          </span>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Flame className="h-3 w-3 text-emerald-600" />
                            {a.wellness_score ?? 82}
                          </span>
                        </td>
                        <td>
                          <select
                            value={a.status}
                            disabled={updatingAppId === a.id}
                            onChange={(e) => handleStatusChange(a.id, e.target.value as any)}
                            className="bg-paper border border-line rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                          >
                            <option value="applied">Applied</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td>
                          <Link
                            to="/app/candidates"
                            className="gz-btn gz-btn-primary !min-h-7 !px-2.5 text-[11px] font-semibold"
                          >
                            Schedule →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          {/* Post New Opening Form (4 cols) */}
          <section className="lg:col-span-4 rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Building2 className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-bold text-ink">Post New Vacancy</h2>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsPosting(true);
                try {
                  const r = await postJob({
                    data: {
                      role: form.role,
                      category: form.category,
                      skills: form.skills,
                      location: form.location,
                      remote: form.remote,
                      ctc_lpa: Number(form.ctc_lpa),
                      description: form.description,
                    },
                  });
                  setMsg(`Job role "${form.role}" published live on the student placement feed!`);
                  setForm({ ...form, role: "" });
                } catch (err: any) {
                  alert(err?.message || "Failed to post job");
                } finally {
                  setIsPosting(false);
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-ink-soft">Role Title *</label>
                <input
                  className="gz-input mt-1 text-xs"
                  placeholder="e.g. Graduate Software Engineer"
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Category</label>
                  <select
                    className="gz-input mt-1 text-xs bg-paper"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Coding">Coding</option>
                    <option value="AI">AI & ML</option>
                    <option value="UI/UX">UI/UX Design</option>
                    <option value="Cloud">Cloud & DevOps</option>
                    <option value="Testing">QA & Testing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">CTC (LPA ₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="3.0"
                    className="gz-input mt-1 text-xs"
                    value={form.ctc_lpa}
                    onChange={(e) => setForm({ ...form, ctc_lpa: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-soft">Required Skills</label>
                <input
                  className="gz-input mt-1 text-xs"
                  placeholder="e.g. React, TypeScript, SQL"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-soft">Location</label>
                <input
                  className="gz-input mt-1 text-xs"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-soft">Job Description</label>
                <textarea
                  className="gz-input mt-1 min-h-[80px] text-xs"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isPosting}
                className="gz-btn gz-btn-primary w-full text-xs font-bold"
              >
                {isPosting ? "Publishing Role…" : "Post to Placement Feed"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── STUDENT VIEW ── */}
      {activeTab === "student" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: My Applications List (7 cols) */}
          <section className="lg:col-span-7 rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">My Submitted Applications</h2>
                  <p className="text-xs text-mute font-mono">Live recruiter status updates</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-mute">
                {rows ? `${rows.length} ${rows.length === 1 ? "role" : "roles"}` : "Loading..."}
              </span>
            </div>

            {rows === null ? <LoadingState /> : null}

            {rows && rows.length === 0 ? (
              <div className="py-8 text-center">
                <EmptyState
                  title="No active applications"
                  body="You haven't submitted any job applications yet. Browse verified openings to get started."
                />
                <Link to="/jobs" className="gz-btn gz-btn-primary mt-5 inline-flex items-center gap-2">
                  <span>Explore Placement Drives & Jobs</span>
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
                        to="/jobs/$id"
                        params={{ id: r.job_id }}
                        className="font-display font-bold text-base text-ink hover:text-accent transition-colors flex items-center gap-1.5"
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

          {/* Right Column: Student Placement Readiness (5 cols) */}
          <section className="lg:col-span-5 space-y-6">
            <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-display text-lg font-bold text-ink">Placement Readiness</h2>
                </div>
                <span className="gz-chip text-[10px] font-mono bg-mint/15 text-mint">
                  PROFILE PASSPORT
                </span>
              </div>
              <p className="text-xs text-mute leading-relaxed">
                Recruiters filter candidates by verified CGPA, project credentials, and sports/wellness activity:
              </p>

              <div className="space-y-3 pt-1">
                <Link
                  to="/app/profile"
                  className="flex items-center justify-between p-3 rounded-xl bg-paper/60 border border-line/60 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Flame className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-ink">Academic & Sports Passport</p>
                      <p className="text-[11px] text-mute">View wellness score & placement status</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-mute" />
                </Link>

                <Link
                  to="/app/resume"
                  className="flex items-center justify-between p-3 rounded-xl bg-paper/60 border border-line/60 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-ink">ATS-Verified Resume</p>
                      <p className="text-[11px] text-mute">Synced with your verified project sprints</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-mute" />
                </Link>

                <Link
                  to="/app/certificates"
                  className="flex items-center justify-between p-3 rounded-xl bg-paper/60 border border-line/60 hover:border-mint/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-mint shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-ink">SHA-256 Verified Certificates</p>
                      <p className="text-[11px] text-mute">Proof of live sprints & hackathons</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-mute" />
                </Link>
              </div>
            </div>

            {/* Notice for Recruiters */}
            <div className="p-4 rounded-xl bg-paper/40 border border-line text-xs text-mute">
              <span className="font-semibold text-ink block mb-0.5">Are you an employer or recruiter?</span>
              Post openings and review verified candidates through the{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("recruiter");
                  if (!applicants) {
                    listEmployerJobApplicants().then(setApplicants).catch(() => setApplicants([]));
                  }
                }}
                className="text-accent font-semibold hover:underline"
              >
                Recruiter Desk View →
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
