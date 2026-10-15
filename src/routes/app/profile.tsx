import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getMyProfile,
  upsertProfile,
  getStudentDetails,
  saveStudentDetails,
  syncProfileToResume,
  type StudentProfileFull,
} from "@/lib/data/me";
import { listColleges } from "@/lib/data/catalog";
import { LoadingState } from "@/components/ui/State";
import { ROLE_LABEL, type Role } from "@/lib/ids";
import {
  GraduationCap,
  Trophy,
  Activity,
  Sparkles,
  CheckCircle2,
  Building2,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  Award,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Briefcase,
  User,
} from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: AppProfile,
});

type Tab = "academic" | "sports" | "skills" | "links" | "basic";

function AppProfile() {
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("academic");

  // Basic Profile State
  const [profile, setProfile] = useState<{
    role: Role;
    display_name: string;
    headline: string;
    city: string;
    phone: string;
    org_name: string;
    bio: string;
  } | null>(null);

  // Student Specific State
  const [student, setStudent] = useState<StudentProfileFull | null>(null);

  // Colleges list
  const [colleges, setColleges] = useState<
    Array<{
      id: string;
      name: string;
      code: string | null;
      city: string;
      accreditation: string;
      partnership_tier: string;
    }>
  >([]);

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((p) => {
        if (!active) return;
        setProfile({
          role: p?.role ?? "student",
          display_name: p?.display_name ?? "Member Profile",
          headline: p?.headline ?? "",
          city: p?.city ?? "",
          phone: p?.phone ?? "",
          org_name: p?.org_name ?? "",
          bio: p?.bio ?? "",
        });
      })
      .catch(() => {
        if (active) {
          setProfile({
            role: "student",
            display_name: "Member Profile",
            headline: "",
            city: "Bengaluru",
            phone: "",
            org_name: "",
            bio: "",
          });
        }
      });

    const timer = setTimeout(() => {
      if (active && !profile) {
        setProfile((prev) => prev ?? {
          role: "student",
          display_name: "Member Profile",
          headline: "",
          city: "Bengaluru",
          phone: "",
          org_name: "",
          bio: "",
        });
      }
    }, 1500);

    getStudentDetails().then((s) => {
      if (active) setStudent(s);
    }).catch(() => {});

    listColleges().then((cols) => {
      if (active) setColleges(cols);
    }).catch(() => {});

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!profile) return <LoadingState />;

  const isStudent = profile.role === "student";

  // Calculate Placement Tier Eligibility
  const cgpa = student?.cgpa ?? 8.0;
  const backlogs = student?.activeBacklogs ?? 0;
  const isTier1Eligible = cgpa >= 7.5 && backlogs === 0;
  const isTier2Eligible = cgpa >= 6.5 && backlogs <= 1;

  async function handleSaveBasic(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setMsg("");
    try {
      await upsertProfile({ data: profile });
      setMsg("Basic profile details saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !profile) return;
    setBusy(true);
    setMsg("");
    try {
      // 1. Save student lifecycle row
      await saveStudentDetails({
        data: {
          collegeId: student.collegeId,
          rollNumber: student.rollNumber,
          degree: student.degree,
          branch: student.branch,
          batchYear: student.batchYear,
          cgpa: student.cgpa,
          activeBacklogs: student.activeBacklogs,
          wellnessScore: student.wellnessScore,
          sportsAttendanceCount: student.sportsAttendanceCount,
          primarySport: student.primarySport,
          resumeUrl: student.resumeUrl ?? undefined,
          linkedinUrl: student.linkedinUrl ?? undefined,
          githubUrl: student.githubUrl ?? undefined,
          portfolioUrl: student.portfolioUrl ?? undefined,
          placementStatus: student.placementStatus,
        },
      });

      // 2. Also update basic profile display name & headline
      await upsertProfile({ data: profile });

      setMsg("Student lifecycle profile updated successfully.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to update student profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncToResume() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await syncProfileToResume();
      setSyncMsg("Profile, verified college & skills synced to Resume Studio!");
    } catch (err) {
      setSyncMsg("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── 1. Top Identity & Passport Header ── */}
      <div className="gz-panel rounded-[24px] p-4 sm:p-8 bg-white border border-line shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-mint/20 border border-accent/30 flex items-center justify-center font-display text-2xl font-bold text-ink shrink-0">
              {profile.display_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-3xl font-bold text-ink tracking-tight break-words">
                  {profile.display_name}
                </h1>
                <span className="gz-chip text-[11px] font-mono bg-accent/10 text-accent border border-accent/20 shrink-0">
                  {ROLE_LABEL[profile.role]}
                </span>
                {isStudent && student?.collegeName && (
                  <span className="gz-chip text-[11px] font-mono bg-mint/15 text-mint border border-mint/20 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{student.collegeName}</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                {profile.headline || (isStudent ? "Student Builder & Explorer · GenZ360" : "Organization Admin")}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar for Students */}
          {isStudent && student && (
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3 w-full lg:w-auto">
              <div className="rounded-xl border border-line bg-paper/60 px-2.5 sm:px-4 py-2 sm:py-2.5 text-center flex-1">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase text-mute truncate">Wellness</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-mint shrink-0" />
                  <span className="font-display text-sm sm:text-lg font-bold text-ink">{student.wellnessScore}/100</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper/60 px-2.5 sm:px-4 py-2 sm:py-2.5 text-center flex-1">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase text-mute truncate">Sports</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Trophy className="h-3.5 w-3.5 text-coral shrink-0" />
                  <span className="font-display text-sm sm:text-lg font-bold text-ink">{student.sportsAttendanceCount}</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper/60 px-2.5 sm:px-4 py-2 sm:py-2.5 text-center flex-1">
                <p className="text-[9px] sm:text-[10px] font-mono uppercase text-mute truncate">Points</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="font-display text-sm sm:text-lg font-bold text-ink">{student.pointsBalance}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync to Resume Action Bar for Students */}
        {isStudent && (
          <div className="mt-5 pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2 text-xs text-mute">
              <CheckCircle2 className="h-4 w-4 text-mint shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Your academic, sports, and verified skill badges can automatically populate your Placement Resume.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleSyncToResume}
                disabled={syncing}
                className="gz-btn gz-btn-outline !min-h-10 sm:!min-h-9 !py-2 sm:!py-1.5 !px-4 sm:!px-3.5 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-paper w-full sm:w-auto cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing..." : "Sync with Resume Studio"}</span>
              </button>
              <Link
                to="/app/resume"
                className="gz-btn gz-btn-primary !min-h-10 sm:!min-h-9 !py-2 sm:!py-1.5 !px-4 sm:!px-3.5 text-xs font-semibold flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>Open Resume</span>
              </Link>
            </div>
          </div>
        )}
        {syncMsg && (
          <div className="mt-3 text-xs font-medium text-mint flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            <span>{syncMsg}</span>
          </div>
        )}
      </div>

      {/* ── 2. Student Lifecycle Management or Standard Form ── */}
      {isStudent && student ? (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-line overflow-x-auto pb-1 text-xs sm:text-sm font-medium scroll-smooth">
            <button
              type="button"
              onClick={() => setActiveTab("academic")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-colors border-b-2 font-display shrink-0 whitespace-nowrap ${
                activeTab === "academic"
                  ? "border-accent text-accent font-bold bg-accent/5"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Academic & College</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sports")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-colors border-b-2 font-display shrink-0 whitespace-nowrap ${
                activeTab === "sports"
                  ? "border-accent text-accent font-bold bg-accent/5"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Sports & Wellness</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-colors border-b-2 font-display shrink-0 whitespace-nowrap ${
                activeTab === "skills"
                  ? "border-accent text-accent font-bold bg-accent/5"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Verified Skills</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("links")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-colors border-b-2 font-display shrink-0 whitespace-nowrap ${
                activeTab === "links"
                  ? "border-accent text-accent font-bold bg-accent/5"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              <span>Portfolios</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-colors border-b-2 font-display shrink-0 whitespace-nowrap ${
                activeTab === "basic"
                  ? "border-accent text-accent font-bold bg-accent/5"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Basic Identity</span>
            </button>
          </div>

          <form onSubmit={handleSaveStudent} className="space-y-6">
            {/* TAB 1: ACADEMIC & COLLEGE */}
            {activeTab === "academic" && (
              <div className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">College & Placement Eligibility</h2>
                  <p className="text-xs text-mute mt-1">
                    Connect with your affiliated college to qualify for on-campus drives, MOU placement pools, and official grade verification.
                  </p>
                </div>

                {/* Eligibility Alert Banner */}
                <div
                  className={`rounded-2xl p-4 border flex items-start gap-3 ${
                    isTier1Eligible
                      ? "bg-mint/10 border-mint/30 text-ink"
                      : isTier2Eligible
                      ? "bg-paper border-line text-ink"
                      : "bg-coral/10 border-coral/30 text-ink"
                  }`}
                >
                  <Award
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      isTier1Eligible ? "text-mint" : isTier2Eligible ? "text-accent" : "text-coral"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold font-display">
                      {isTier1Eligible
                        ? "Tier-1 Placement Pool Certified"
                        : isTier2Eligible
                        ? "Standard Placement Pool Active"
                        : "Academic Review Needed"}
                    </p>
                    <p className="text-xs text-mute mt-0.5">
                      {isTier1Eligible
                        ? "Your CGPA (≥ 7.5) and 0 active backlogs qualify you for high-package CTC campus recruitment drives."
                        : isTier2Eligible
                        ? "You are eligible for standard internships and graduate engineer campus drives."
                        : "Clear pending backlogs to unlock tier-1 company application quotas."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Partner College / University</label>
                    <select
                      className="gz-input"
                      value={student.collegeId ?? ""}
                      onChange={(e) => {
                        const col = colleges.find((c) => c.id === e.target.value);
                        setStudent({
                          ...student,
                          collegeId: e.target.value || null,
                          collegeName: col?.name ?? null,
                          collegeCity: col?.city ?? null,
                          collegeAccreditation: col?.accreditation ?? null,
                          partnershipTier: col?.partnership_tier ?? null,
                        });
                      }}
                    >
                      <option value="">Select your institution...</option>
                      {colleges.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.city}) — {col.accreditation}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">University Roll Number / PRN</label>
                    <input
                      className="gz-input"
                      placeholder="e.g. 22CS084"
                      value={student.rollNumber}
                      onChange={(e) => setStudent({ ...student, rollNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Degree Program</label>
                    <input
                      className="gz-input"
                      placeholder="e.g. B.Tech / B.E."
                      value={student.degree}
                      onChange={(e) => setStudent({ ...student, degree: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Branch / Department</label>
                    <input
                      className="gz-input"
                      placeholder="e.g. Computer Science & Engineering"
                      value={student.branch}
                      onChange={(e) => setStudent({ ...student, branch: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Graduation Batch Year</label>
                    <select
                      className="gz-input"
                      value={student.batchYear}
                      onChange={(e) => setStudent({ ...student, batchYear: parseInt(e.target.value, 10) })}
                    >
                      <option value={2024}>2024 (Alumni)</option>
                      <option value={2025}>2025 (Final Year)</option>
                      <option value={2026}>2026 (Pre-final Year)</option>
                      <option value={2027}>2027 (Sophomore)</option>
                      <option value={2028}>2028 (Freshman)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Cumulative GPA (out of 10.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="gz-input"
                      value={student.cgpa}
                      onChange={(e) => setStudent({ ...student, cgpa: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Active Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      className="gz-input"
                      value={student.activeBacklogs}
                      onChange={(e) => setStudent({ ...student, activeBacklogs: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Placement Status</label>
                    <select
                      className="gz-input"
                      value={student.placementStatus}
                      onChange={(e) =>
                        setStudent({
                          ...student,
                          placementStatus: e.target.value as StudentProfileFull["placementStatus"],
                        })
                      }
                    >
                      <option value="seeking">Seeking Internships & Placements</option>
                      <option value="shortlisted">Shortlisted for Interviews</option>
                      <option value="placed">Placed / Offer Accepted</option>
                      <option value="higher_studies">Higher Studies (GRE/GATE)</option>
                      <option value="opted_out">Opted Out</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SPORTS & WELLNESS PASSPORT */}
            {activeTab === "sports" && (
              <div className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Sports & Physical Wellness Passport</h2>
                  <p className="text-xs text-mute mt-1">
                    GenZ360 connects athletic consistency and ground team play with high recruiter trust. Box cricket attendance directly impacts your wellness score.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Primary Sport / Discipline</label>
                    <select
                      className="gz-input"
                      value={student.primarySport}
                      onChange={(e) => setStudent({ ...student, primarySport: e.target.value })}
                    >
                      <option value="Box Cricket">Box Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Athletics & Running">Athletics & Running</option>
                      <option value="Table Tennis">Table Tennis</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Turf & Ground Sessions Count</label>
                    <input
                      type="number"
                      min="0"
                      className="gz-input"
                      value={student.sportsAttendanceCount}
                      onChange={(e) =>
                        setStudent({
                          ...student,
                          sportsAttendanceCount: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Wellness Index Score (0–100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="gz-input"
                      value={student.wellnessScore}
                      onChange={(e) =>
                        setStudent({
                          ...student,
                          wellnessScore: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-line/70 bg-paper p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold font-display text-ink">Ready for a match?</p>
                      <p className="text-[11px] text-mute">Book a floodlit turf session in Koramangala or Powai</p>
                    </div>
                    <Link to="/app/sports" className="gz-btn gz-btn-primary !min-h-8 !py-1 text-xs">
                      Book Ground
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SKILLS & RATINGS */}
            {activeTab === "skills" && (
              <div className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">Verified Skill Matrix</h2>
                    <p className="text-xs text-mute mt-1">
                      Scores verified by GenZ360 hands-on sprint evaluations and timed arena assessments.
                    </p>
                  </div>
                  <Link to="/skills" className="gz-btn gz-btn-outline !min-h-8 text-xs w-full sm:w-auto shrink-0 justify-center">
                    Browse All Skills
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {student.skillsMatrix.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-line p-4 bg-paper/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-ink">{item.name}</span>
                          {item.verified && <ShieldCheck className="h-3.5 w-3.5 text-mint" />}
                        </div>
                        <p className="text-[11px] font-mono text-mute mt-0.5">Verified Assessment Score</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-lg font-bold text-accent">{item.score}%</span>
                        <div className="w-16 bg-line h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-accent h-full rounded-full" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent shrink-0" />
                    <span>Want to certify a new skill or boost your ranking? Take a timed challenge.</span>
                  </div>
                  <Link to="/app/assessments" className="gz-btn gz-btn-primary !min-h-8 text-xs shrink-0 w-full sm:w-auto justify-center">
                    Take Assessment
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 4: PORTFOLIO & PROFESSIONAL LINKS */}
            {activeTab === "links" && (
              <div className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Portfolios & Social Proof</h2>
                  <p className="text-xs text-mute mt-1">
                    Visible to verified employers during candidate filtering and direct campus interviews.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">LinkedIn Profile URL</label>
                    <input
                      className="gz-input"
                      placeholder="https://linkedin.com/in/username"
                      value={student.linkedinUrl ?? ""}
                      onChange={(e) => setStudent({ ...student, linkedinUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">GitHub Profile URL</label>
                    <input
                      className="gz-input"
                      placeholder="https://github.com/username"
                      value={student.githubUrl ?? ""}
                      onChange={(e) => setStudent({ ...student, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-mono uppercase text-mute">Portfolio / Personal Website</label>
                    <input
                      className="gz-input"
                      placeholder="https://myportfolio.dev"
                      value={student.portfolioUrl ?? ""}
                      onChange={(e) => setStudent({ ...student, portfolioUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BASIC IDENTITY & BIO */}
            {activeTab === "basic" && (
              <div className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Basic Identity</h2>
                  <p className="text-xs text-mute mt-1">Your public presentation across GenZ360.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Full Name</label>
                    <input
                      className="gz-input"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Professional Headline</label>
                    <input
                      className="gz-input"
                      placeholder="e.g. Aspiring Full Stack Engineer · RVCE 2026"
                      value={profile.headline}
                      onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-mute">City</label>
                      <input
                        className="gz-input"
                        placeholder="e.g. Bengaluru"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-mute">Phone Number</label>
                      <input
                        className="gz-input"
                        placeholder="e.g. +91 98450 12345"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-mute">Bio</label>
                    <textarea
                      rows={3}
                      className="gz-input"
                      placeholder="Share your goals, passion projects, and sports interests..."
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <button type="submit" disabled={busy} className="gz-btn gz-btn-primary min-w-32 w-full sm:w-auto justify-center">
                {busy ? "Saving Changes..." : "Save Student Profile"}
              </button>
              {msg && <p className="text-sm font-medium text-mint">{msg}</p>}
            </div>
          </form>
        </div>
      ) : (
        /* Standard Non-Student Profile Form */
        <form onSubmit={handleSaveBasic} className="gz-panel rounded-[22px] p-6 sm:p-7 bg-white border border-line shadow-xs space-y-4 max-w-xl">
          <h2 className="font-display text-xl font-bold">Organization & Identity Settings</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-mute">Display Name</label>
            <input
              className="gz-input"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-mute">Headline</label>
            <input
              className="gz-input"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-mute">City</label>
            <input
              className="gz-input"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-mute">Organization Name</label>
            <input
              className="gz-input"
              value={profile.org_name}
              onChange={(e) => setProfile({ ...profile, org_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-mute">Bio</label>
            <textarea
              className="gz-input"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>
          <button type="submit" disabled={busy} className="gz-btn gz-btn-primary w-full sm:w-auto justify-center">
            {busy ? "Saving..." : "Save Settings"}
          </button>
          {msg && <p className="text-sm font-medium text-mint">{msg}</p>}
        </form>
      )}
    </div>
  );
}
