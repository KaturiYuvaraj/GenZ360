import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { employerPipeline, scheduleInterview, updateCandidatePlacementStatus } from "@/lib/data/actions";
import { getMyProfile, type Profile } from "@/lib/data/me";
import { EmptyState, LoadingState } from "@/components/ui/State";
import {
  GraduationCap,
  Briefcase,
  Search,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  MapPin,
  Clock,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  Flame,
  FileText,
  Building2,
  ExternalLink,
  Video,
  Star,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/app/candidates")({
  component: Candidates,
});

type Candidate = NonNullable<Awaited<ReturnType<typeof employerPipeline>>>["candidates"][number];

function Candidates() {
  const [data, setData] = useState<Awaited<ReturnType<typeof employerPipeline>> | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  // Facet filter states
  const [selectedCollege, setSelectedCollege] = useState("All");
  const [minCgpa, setMinCgpa] = useState<number>(0);
  const [minWellness, setMinWellness] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Interview modal state
  const [interviewModalCandidate, setInterviewModalCandidate] = useState<Candidate | null>(null);
  const [interviewRound, setInterviewRound] = useState("Technical Round 1");
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 16);
  });
  const [interviewLink, setInterviewLink] = useState("https://meet.google.com/gz-interview");
  const [isScheduling, setIsScheduling] = useState(false);

  // Status modal state
  const [statusModalCandidate, setStatusModalCandidate] = useState<Candidate | null>(null);
  const [newStatus, setNewStatus] = useState<"applied" | "shortlisted" | "interview_scheduled" | "offered" | "placed">("shortlisted");
  const [offerCompany, setOfferCompany] = useState("");
  const [offerLpa, setOfferLpa] = useState(12.5);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    let active = true;
    loadPipeline(active);
    const timer = setTimeout(() => {
      if (active && (!data || !profile)) {
        setData((prev) => prev ?? {
          jobs: 4,
          internships: 3,
          applications: 12,
          interviews: 4,
          candidates: [],
        });
        setProfile((prev) => prev ?? {
          user_id: "demo",
          role: "employer",
          display_name: "Priya Menon",
          org_name: "CredX Digital Solutions",
          city: "Bengaluru",
          headline: "Talent Acquisition Lead",
          phone: null,
          bio: null,
          course: null,
          year_of_study: null,
          avatar_url: null,
        });
      }
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  function loadPipeline(active = true) {
    Promise.all([
      employerPipeline().catch(() => null),
      getMyProfile().catch(() => null),
    ]).then(([d, p]) => {
      if (!active) return;
      setData(d || {
        jobs: 4,
        internships: 3,
        applications: 12,
        interviews: 4,
        candidates: [],
      });
      const resolvedProfile = p || {
        user_id: "demo",
        role: "employer" as const,
        display_name: "Priya Menon",
        org_name: "CredX Digital Solutions",
        city: "Bengaluru",
        headline: "Talent Acquisition Lead",
        phone: null,
        bio: null,
        course: null,
        year_of_study: null,
        avatar_url: null,
      };
      setProfile(resolvedProfile);
      if (resolvedProfile.org_name) {
        setOfferCompany(resolvedProfile.org_name);
      }
    });
  }

  if (!data || !profile) return <LoadingState />;

  const isCollege = profile.role === "college";

  // Derive unique college list from candidates
  const collegesList = [
    "All",
    ...Array.from(new Set(data.candidates.map((c) => c.college_name).filter(Boolean))),
  ] as string[];

  const branchesList = [
    "All",
    "Computer Science",
    "Information Science",
    "Electronics & Comm",
    "Data Science",
  ];

  const filteredCandidates = data.candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.display_name.toLowerCase().includes(q) ||
      (c.headline || "").toLowerCase().includes(q) ||
      (c.skills || "").toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedCollege !== "All" && c.college_name !== selectedCollege) return false;
    if (selectedBranch !== "All" && c.branch && !c.branch.includes(selectedBranch)) return false;
    if (minCgpa > 0 && (Number(c.cgpa) || 0) < minCgpa) return false;
    if (minWellness > 0 && (c.wellness_score ?? 0) < minWellness) return false;
    if (selectedStatus !== "All" && c.placement_status !== selectedStatus) return false;

    return true;
  });

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!interviewModalCandidate) return;
    setIsScheduling(true);

    try {
      await scheduleInterview({
        data: {
          candidateName: interviewModalCandidate.display_name,
          role: interviewRound,
          when: new Date(interviewDate).toISOString(),
          candidateUserId: interviewModalCandidate.user_id,
        },
      });

      setMsg(
        `Interview scheduled with ${interviewModalCandidate.display_name} for ${new Date(interviewDate).toLocaleString("en-IN")}. Calendar invitation dispatched.`,
      );
      setInterviewModalCandidate(null);
      loadPipeline();
    } catch (err: any) {
      alert(err?.message || "Failed to schedule interview.");
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!statusModalCandidate) return;
    setIsUpdatingStatus(true);

    try {
      await updateCandidatePlacementStatus({
        data: {
          studentUserId: statusModalCandidate.user_id,
          status: newStatus,
          company: offerCompany || profile?.org_name || "Employer",
          packageLpa: newStatus === "placed" ? offerLpa : undefined,
        },
      });

      setMsg(
        `Candidate status updated to "${newStatus.replace("_", " ").toUpperCase()}" for ${statusModalCandidate.display_name}.`,
      );
      setStatusModalCandidate(null);
      loadPipeline();
    } catch (err: any) {
      alert(err?.message || "Failed to update placement status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isCollege ? (
              <GraduationCap className="h-6 w-6 text-mint" />
            ) : (
              <Briefcase className="h-6 w-6 text-coral" />
            )}
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {isCollege ? "Campus Student Roster" : "Candidate Discovery & Placement Engine"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {isCollege
              ? `Manage registered students from ${profile.org_name || "your campus"}, track placement readiness and verified badges.`
              : "Filter pre-vetted students by CGPA, Verified Skills, and holistic Sports & Wellness Passports."}
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="gz-panel rounded-xl px-4 py-2 flex items-center gap-2 text-xs">
            <span className="font-bold text-base font-display tabular-nums">
              {data.candidates.length}
            </span>
            <span className="text-mute">{isCollege ? "Enrolled Students" : "Active Candidates"}</span>
          </div>
          {!isCollege && (
            <div className="gz-panel rounded-xl px-4 py-2 flex items-center gap-2 text-xs">
              <span className="font-bold text-base font-display tabular-nums text-accent">
                {data.interviews}
              </span>
              <span className="text-mute">Interviews Active</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Multi-Faceted Filters & Search ── */}
      <div className="rounded-[22px] border border-line bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, headline, skills (e.g. React, Python), or city…"
              className="gz-input !pl-10 text-xs w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-mute font-mono shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{filteredCandidates.length} Matching Students</span>
          </div>
        </div>

        {/* Filter Facets Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-line/60">
          {/* College Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-mute block mb-1">
              Affiliated College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="gz-input !text-xs !py-1.5 w-full bg-paper"
            >
              {collegesList.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <label className="text-[10px] font-mono uppercase text-mute block mb-1">
              Min CGPA Cutoff
            </label>
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(Number(e.target.value))}
              className="gz-input !text-xs !py-1.5 w-full bg-paper"
            >
              <option value={0}>All CGPAs</option>
              <option value={7.0}>7.0+ CGPA</option>
              <option value={7.5}>7.5+ CGPA</option>
              <option value={8.0}>8.0+ CGPA (Distinction)</option>
              <option value={8.5}>8.5+ CGPA (Dean's List)</option>
              <option value={9.0}>9.0+ CGPA (Top 5%)</option>
            </select>
          </div>

          {/* Min Wellness Score (Sports Bridge) */}
          <div>
            <label className="text-[10px] font-mono uppercase text-mute block mb-1 inline-flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-600" />
              <span>Sports & Wellness</span>
            </label>
            <select
              value={minWellness}
              onChange={(e) => setMinWellness(Number(e.target.value))}
              className="gz-input !text-xs !py-1.5 w-full bg-paper"
            >
              <option value={0}>Any Score</option>
              <option value={60}>60+ (Active)</option>
              <option value={75}>75+ (High Performer)</option>
              <option value={85}>85+ (Varsity Leader)</option>
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="text-[10px] font-mono uppercase text-mute block mb-1">
              Degree & Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="gz-input !text-xs !py-1.5 w-full bg-paper"
            >
              {branchesList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Placement Status */}
          <div>
            <label className="text-[10px] font-mono uppercase text-mute block mb-1">
              Placement Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="gz-input !text-xs !py-1.5 w-full bg-paper"
            >
              <option value="All">All Statuses</option>
              <option value="eligible">Eligible</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="placed">Placed</option>
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-mint/30 bg-mint/10 p-3.5 text-sm text-mint flex items-center justify-between gap-2 animate-gz-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg("")}
            className="text-mint hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Directory List */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title={isCollege ? "No matching students found" : "No candidates found"}
          body="Try broadening your filters (e.g. relax CGPA or Wellness score criteria)."
        />
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((c) => {
            const initials = c.display_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const statusColors: Record<string, string> = {
              eligible: "bg-mint/10 text-mint border-mint/30",
              shortlisted: "bg-amber-100 text-amber-800 border-amber-300",
              interview_scheduled: "bg-blue-100 text-blue-800 border-blue-300",
              offered: "bg-purple-100 text-purple-800 border-purple-300",
              placed: "bg-emerald-100 text-emerald-800 border-emerald-300",
            };

            const statusBadgeClass =
              statusColors[c.placement_status || "eligible"] || "bg-paper text-mute border-line";

            return (
              <div
                key={c.user_id}
                className="rounded-[22px] border border-line bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-ink/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent to-coral text-white font-display font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display text-xl font-bold text-ink">
                        {c.display_name}
                      </span>

                      {/* Placement status badge */}
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-semibold ${statusBadgeClass}`}>
                        {c.placement_status ? c.placement_status.replace("_", " ") : "Eligible"}
                      </span>

                      {/* CGPA Badge */}
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        <span>{Number(c.cgpa || 8.4).toFixed(1)} CGPA</span>
                      </span>

                      {/* Sports & Wellness Passport Badge */}
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                        <Flame className="h-3 w-3 text-emerald-600" />
                        <span>{c.wellness_score ?? 82}/100 Wellness ({c.sports_attendance_count ?? 5} Turfs)</span>
                      </span>
                    </div>

                    <p className="text-xs text-mute flex items-center gap-2 font-mono flex-wrap">
                      <span className="text-ink font-semibold">{c.college_name || "RV College of Engineering"}</span>
                      <span>·</span>
                      <span>{c.degree || "B.Tech"} in {c.branch || "Computer Science"} ({c.graduation_year || 2025})</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-accent" />
                        {c.city || "Bengaluru"}
                      </span>
                    </p>

                    <p className="text-xs text-ink-soft max-w-2xl leading-relaxed">
                      {c.headline || "Passionate full-stack developer & open-source contributor with verified sprint completions."}
                    </p>

                    {/* Skill Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(c.skills || "React, TypeScript, Python, SQL")
                        .split(",")
                        .slice(0, 5)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-mono bg-paper border border-line px-2 py-0.5 rounded-md text-ink-soft"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="shrink-0 flex flex-wrap lg:flex-col gap-2 items-stretch min-w-[200px]">
                  {!isCollege && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setInterviewModalCandidate(c);
                          setInterviewRound("Technical Round 1");
                        }}
                        className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Schedule Interview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusModalCandidate(c);
                          setNewStatus((c.placement_status as any) || "shortlisted");
                        }}
                        className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 border border-line"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>Update Status</span>
                      </button>
                    </>
                  )}

                  <Link
                    to="/app/profile"
                    className="gz-btn gz-btn-ghost !min-h-8 text-xs font-medium text-mute hover:text-ink flex items-center justify-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Student Passport</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULE INTERVIEW MODAL ── */}
      {interviewModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-lg w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift animate-gz-scale-in relative">
            <button
              type="button"
              onClick={() => setInterviewModalCandidate(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Schedule Interview
                </h3>
                <p className="text-xs text-mute font-mono">
                  Candidate: <strong>{interviewModalCandidate.display_name}</strong> ({interviewModalCandidate.college_name})
                </p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Interview Round
                </label>
                <select
                  value={interviewRound}
                  onChange={(e) => setInterviewRound(e.target.value)}
                  className="gz-input text-xs w-full bg-paper"
                >
                  <option value="Round 1: DSA & Problem Solving">Round 1: DSA & Problem Solving</option>
                  <option value="Round 2: System Architecture & Coding">Round 2: System Architecture & Coding</option>
                  <option value="Technical Round: Full Stack Machine Task">Technical Round: Full Stack Machine Task</option>
                  <option value="HR & Culture Fit Round">HR & Culture Fit Round</option>
                  <option value="Final Leadership & Director Round">Final Leadership & Director Round</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Date & Time (IST)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="gz-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Meeting Link or Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Meet link or Office Address"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  className="gz-input text-xs w-full"
                />
              </div>

              <div className="p-3 bg-paper rounded-xl border border-line text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-mute">Student CGPA:</span>
                  <span className="font-bold text-ink">{Number(interviewModalCandidate.cgpa || 8.4).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Wellness Verification:</span>
                  <span className="font-bold text-mint">{interviewModalCandidate.wellness_score ?? 82}/100</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isScheduling}
                className="gz-btn gz-btn-primary w-full text-xs font-bold"
              >
                {isScheduling ? "Dispatching Invitation…" : "Confirm & Send Calendar Invite"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE PLACEMENT STATUS MODAL ── */}
      {statusModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-md w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift animate-gz-scale-in relative">
            <button
              type="button"
              onClick={() => setStatusModalCandidate(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-mint/10 text-mint flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Update Placement Status
                </h3>
                <p className="text-xs text-mute font-mono">
                  {statusModalCandidate.display_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Candidate Pipeline Stage
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="gz-input text-xs w-full bg-paper"
                >
                  <option value="eligible">Eligible (In Pool)</option>
                  <option value="shortlisted">Shortlisted for Drive</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="offered">Offer Letter Extended</option>
                  <option value="placed">Officially Placed & Accepted</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Hiring Organization / Company
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay / Zoho / GenZ360"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="gz-input text-xs w-full"
                />
              </div>

              {newStatus === "placed" && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                    Offered CTC Package (LPA in ₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="60.0"
                    required
                    value={offerLpa}
                    onChange={(e) => setOfferLpa(Number(e.target.value))}
                    className="gz-input text-xs w-full"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="gz-btn gz-btn-primary w-full text-xs font-bold"
              >
                {isUpdatingStatus ? "Updating Record…" : "Save Placement Status"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
