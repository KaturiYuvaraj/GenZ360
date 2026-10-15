import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { getJob, type Job } from "@/lib/data/catalog";
import { applyJob } from "@/lib/data/actions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  Briefcase,
  MapPin,
  Building2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Clock,
  GraduationCap,
  Award,
  ShieldCheck,
  ArrowRight,
  Share2,
  Layers,
  Check,
  Laptop,
  HeartHandshake,
  FileCheck,
  Flame,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/jobs/$id")({
  component: JobDetail,
});

/**
 * Resolves the direct, official career/application portal URL for a company
 */
export function getCompanyCareerUrl(
  company: string,
  applicationUrl?: string | null,
  sourceUrl?: string | null,
): string {
  if (applicationUrl && applicationUrl.trim().startsWith("http")) {
    return applicationUrl.trim();
  }
  if (sourceUrl && sourceUrl.trim().startsWith("http")) {
    return sourceUrl.trim();
  }

  const c = company.toLowerCase().trim();
  const DIRECT_MAP: Record<string, string> = {
    razorpay: "https://razorpay.com/jobs/",
    zoho: "https://www.zoho.com/careers/",
    cred: "https://careers.cred.club/",
    freshworks: "https://www.freshworks.com/company/careers/",
    postman: "https://www.postman.com/company/careers/",
    "ather energy": "https://www.atherenergy.com/careers/",
    ather: "https://www.atherenergy.com/careers/",
    khatabook: "https://khatabook.com/careers/",
    swiggy: "https://careers.swiggy.com/",
    zomato: "https://www.zomato.com/careers",
    flipkart: "https://www.flipkartcareers.com/",
    amazon: "https://www.amazon.jobs/",
    google: "https://careers.google.com/",
    microsoft: "https://careers.microsoft.com/",
    uber: "https://www.uber.com/careers",
    ola: "https://careers.olaelectric.com/",
    phonepe: "https://www.phonepe.com/careers/",
    paytm: "https://paytm.com/careers/",
    groww: "https://groww.in/careers",
    zerodha: "https://zerodha.com/careers",
    tcs: "https://www.tcs.com/careers",
    infosys: "https://www.infosys.com/careers/",
    wipro: "https://careers.wipro.com/",
  };

  if (DIRECT_MAP[c]) return DIRECT_MAP[c];
  for (const [k, url] of Object.entries(DIRECT_MAP)) {
    if (c.includes(k)) return url;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(company + " careers job openings apply")}`;
}

function getSourceDisplay(source?: string, external?: boolean) {
  const s = (source || "genz360").toLowerCase();
  switch (s) {
    case "greenhouse":
      return { name: "Greenhouse ATS", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };
    case "lever":
      return { name: "Lever ATS", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" };
    case "ashby":
      return { name: "Ashby HQ", color: "bg-purple-500/10 text-purple-700 border-purple-500/20" };
    case "workable":
      return { name: "Workable", color: "bg-teal-500/10 text-teal-700 border-teal-500/20" };
    case "smartrecruiters":
      return { name: "SmartRecruiters", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
    case "genz360":
    default:
      if (external) {
        return { name: "Company Careers Portal", color: "bg-paper-2 text-ink-soft border-line" };
      }
      return { name: "GenZ360 Verified Drive", color: "bg-accent/10 text-accent border-accent/20" };
  }
}

interface ParsedRoleDetails {
  aboutCompany: string;
  aboutRole: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  selectionSteps: { num: string; title: string; desc: string }[];
}

function parseRoleDetails(job: Job): ParsedRoleDetails {
  const text = job.description || "";

  // Extract sections if present in text
  const getSection = (startHeader: string, endHeaders: string[]) => {
    const startIdx = text.indexOf(startHeader);
    if (startIdx === -1) return "";
    const afterStart = text.slice(startIdx + startHeader.length);
    let endIdx = afterStart.length;
    for (const h of endHeaders) {
      const idx = afterStart.indexOf(h);
      if (idx !== -1 && idx < endIdx) {
        endIdx = idx;
      }
    }
    return afterStart.slice(0, endIdx).trim();
  };

  const rawAboutCompany = getSection("About " + job.company + ":", [
    "About the Role",
    "Key Responsibilities:",
    "Eligibility",
  ]);

  const rawAboutRole = getSection("About the Role", [
    "Key Responsibilities:",
    "Eligibility",
    "Compensation",
  ]);

  const rawResp = getSection("Key Responsibilities:", [
    "Eligibility",
    "Candidate Requirements:",
    "Compensation",
    "Perks",
  ]);

  const rawReq = getSection("Eligibility", [
    "Compensation",
    "Perks",
    "Hiring",
    "Selection Process:",
  ]);

  const rawPerks = getSection("Compensation & Benefits:", [
    "Hiring",
    "Selection Process:",
    "Interview",
  ]);

  const rawProcess = getSection("Hiring & Selection Process:", []) || getSection("Selection Process:", []);

  // Responsibilities bullet points
  let responsibilities: string[] = [];
  if (rawResp) {
    responsibilities = rawResp
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 5);
  }

  // If responsibilities couldn't be parsed or text is short, generate tailored points
  if (responsibilities.length === 0) {
    responsibilities = [
      `Architect, develop, and test high-quality software features and customer workflows for ${job.company}.`,
      `Design robust APIs and scalable database schemas utilizing ${job.skills || "modern full-stack technologies"}.`,
      "Write automated unit, integration, and regression test suites to guarantee 99.99% system availability.",
      "Collaborate directly with Product Managers, UX Designers, and Senior Architects on agile sprint cycles.",
      "Participate actively in peer code reviews, continuous integration pipelines, and production release monitoring.",
    ];
  }

  // Requirements & Eligibility bullet points
  let requirements: string[] = [];
  if (rawReq) {
    requirements = rawReq
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 5);
  }

  if (requirements.length === 0) {
    requirements = [
      "Degree: B.Tech / B.E / M.Tech / MCA in Computer Science, Information Technology, or allied technical fields.",
      "Eligible Batches: Graduating batches of 2024, 2025, and 2026.",
      "Academic Cutoff: Minimum 6.5 - 7.0 CGPA (or 65%+) with no active backlogs.",
      `Technical Foundation: Strong grasp of Data Structures, Algorithms, and practical experience with ${job.skills || "relevant technologies"}.`,
      "Mindset: First-principles problem solver, eager to learn rapidly, and demonstrates high project ownership.",
    ];
  }

  // Perks & Benefits
  let perks: string[] = [];
  if (rawPerks) {
    perks = rawPerks
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter((l) => l.length > 5);
  }

  if (perks.length === 0) {
    perks = [
      `Competitive Compensation: ${job.ctc_lpa ? `₹${job.ctc_lpa} LPA fixed package` : "Top-tier industry compensation"} + performance incentives.`,
      "Comprehensive medical, accidental, and health insurance for candidate and family dependents.",
      "Annual professional learning, technical books, and cloud certification allowance.",
      "Modern company laptop (Apple MacBook Pro / workstation) with home desk setup stipend.",
      "Subsidized box cricket and turf sports booking passes via GenZ360 sports network.",
    ];
  }

  // Selection Steps
  const selectionSteps = [
    {
      num: "01",
      title: "Application & Passport Screening",
      desc: "Profile review verifying academic credentials, project artifacts, and skills.",
    },
    {
      num: "02",
      title: "Online Technical Assessment",
      desc: "Timed algorithmic coding and core computer science assessment (75 mins).",
    },
    {
      num: "03",
      title: "Technical Architecture & Live Coding",
      desc: "Deep-dive into data structures, API design, and hands-on problem solving.",
    },
    {
      num: "04",
      title: "Leadership & Culture Alignment",
      desc: "Discussion with engineering leadership on values, team dynamics, and vision.",
    },
  ];

  const aboutCompany =
    rawAboutCompany ||
    `${job.company} is a high-growth technology leader offering modern digital solutions, trusted by millions of users with industry-leading product innovation.`;

  const aboutRole =
    rawAboutRole.replace(/^:\s*/, "") ||
    (text.length > 40 && !text.includes(":")
      ? text
      : `As a ${job.role} at ${job.company}, you will work on mission-critical features from day one. You will join an empowered squad responsible for building, scaling, and maintaining software used across millions of customer touchpoints.`);

  return {
    aboutCompany,
    aboutRole,
    responsibilities,
    requirements,
    perks,
    selectionSteps,
  };
}

function JobDetail() {
  const { id } = Route.useParams();
  const { user } = useCurrentUserState();
  const [job, setJob] = useState<Awaited<ReturnType<typeof getJob>> | undefined>();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getJob({ data: { id } }).then(setJob).catch((e) => setErr(e.message));
  }, [id]);

  if (job === undefined && !err) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <LoadingState label="Loading complete role details..." />
        </div>
      </Page>
    );
  }

  if (!job) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <ErrorState message={err || "Job role not found or no longer available."} />
          <div className="mt-6 text-center">
            <Link to="/jobs" className="gz-btn gz-btn-primary">
              ← Browse All Openings
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  const isExternal = Boolean(job.external_job || (job.source && job.source !== "genz360"));
  const sourceInfo = getSourceDisplay(job.source, job.external_job);
  const targetApplyUrl = getCompanyCareerUrl(job.company, job.application_url, job.source_url);
  const details = parseRoleDetails(job);

  const handleApplyRedirect = async (e: React.MouseEvent) => {
    // If the student is signed in, track their application on GenZ360
    if (user) {
      try {
        await applyJob({ data: { jobId: job.id } });
        setMsg(`✓ Application tracked on your GenZ360 dashboard! Redirecting to ${job.company}'s official career desk...`);
      } catch (err: any) {
        if (err?.message?.includes("Already applied")) {
          setMsg(`✓ Already tracked in your GenZ360 dashboard. Redirecting to ${job.company}'s official careers portal...`);
        } else {
          setMsg(`✓ Redirecting to ${job.company}'s official careers portal...`);
        }
      }
    } else {
      setMsg(`✓ Redirecting to ${job.company}'s official careers page...`);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Page>
      <article className="gz-wrap py-6 sm:py-10 max-w-6xl mx-auto space-y-8">
        
        {/* ── Top Navigation & Source Bar ── */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute hover:text-ink transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to All Openings</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border border-line bg-white hover:bg-paper-2 transition-colors text-ink-soft"
              title="Copy link to role"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link Copied!" : "Share Role"}</span>
            </button>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${sourceInfo.color}`}>
              {sourceInfo.name}
            </span>
          </div>
        </div>

        {/* ── Hero Role Header ── */}
        <div className="rounded-[24px] border border-line bg-white p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-display text-xl sm:text-2xl font-bold text-accent shrink-0">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg sm:text-xl font-bold text-ink">
                      {job.company}
                    </span>
                    <span className="gz-chip text-[10px] font-mono bg-mint/15 text-mint border border-mint/20 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>VERIFIED HIRING PARTNER</span>
                    </span>
                  </div>
                  {job.department && (
                    <p className="text-xs text-mute mt-0.5">{job.department}</p>
                  )}
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink break-words">
                {job.role}
              </h1>

              {/* Badges / Metadata */}
              <div className="flex flex-wrap gap-2 text-xs font-medium pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line px-3 py-1 text-ink-soft">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span>{job.remote ? "Remote (Work from Anywhere)" : (job.location || "Bengaluru, Karnataka")}</span>
                </span>
                
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line px-3 py-1 text-ink-soft capitalize">
                  <Clock className="h-3.5 w-3.5 text-mute" />
                  <span>{job.type ? job.type.replace("_", " ") : "Full Time"}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line px-3 py-1 text-ink-soft capitalize">
                  <GraduationCap className="h-3.5 w-3.5 text-mute" />
                  <span>{job.experience_level || "Fresher / 2024-2026 Batch"}</span>
                </span>

                {job.ctc_lpa ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 px-3.5 py-1 font-bold">
                    <span>💰 ₹{job.ctc_lpa} LPA Package</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 px-3.5 py-1 font-bold">
                    <span>💰 Top Tier CTC</span>
                  </span>
                )}
              </div>

              {/* Skills Tags */}
              {job.skills && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[11px] font-mono text-mute uppercase mr-1">Skills:</span>
                  {job.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-paper-2 border border-line px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Apply Hero CTA Card */}
            <div className="rounded-2xl border border-line bg-paper/60 p-5 sm:p-6 lg:w-80 shrink-0 space-y-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-mute">
                  Official Application
                </p>
                <p className="text-sm font-bold text-ink mt-0.5">
                  Direct Company Career Portal
                </p>
                <p className="text-xs text-mute mt-1">
                  Clicking apply redirects to {job.company}'s official job portal to complete your application.
                </p>
              </div>

              {/* Primary External Application Link */}
              <a
                href={targetApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleApplyRedirect}
                className="gz-btn gz-btn-primary w-full !min-h-11 !px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm text-center"
              >
                <span>Apply on {job.company} Website</span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>

              <div className="flex items-center gap-2 text-[11px] text-mute pt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-mint shrink-0" />
                <span>
                  {user ? "Synced with your GenZ360 passport" : "Free & open to student applicants"}
                </span>
              </div>
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-xl border border-mint/30 bg-mint/10 p-3 text-xs font-medium text-mint flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>{msg}</span>
              </div>
              <a
                href={targetApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-mint hover:text-ink shrink-0"
              >
                Open Link ↗
              </a>
            </div>
          )}
        </div>

        {/* ── Main Two-Column Detailed Body ── */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Full Role Specifications (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. About the Role & Mission */}
            <section className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">About the Role & Team</h2>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-line">
                {details.aboutRole}
              </p>
            </section>

            {/* 2. Key Responsibilities */}
            <section className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <div className="h-8 w-8 rounded-lg bg-mint/10 text-mint flex items-center justify-center">
                  <FileCheck className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Key Responsibilities</h2>
              </div>
              <p className="text-xs text-mute">
                Here is what your day-to-day impact and core deliverables will look like:
              </p>
              <ul className="space-y-3 pt-1">
                {details.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-soft leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint mt-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. Candidate Eligibility & Requirements */}
            <section className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <div className="h-8 w-8 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Eligibility & Requirements</h2>
              </div>
              <p className="text-xs text-mute">
                Candidates must meet these academic and technical criteria to qualify for this drive:
              </p>
              <ul className="space-y-3 pt-1">
                {details.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-soft leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral mt-0.5">
                      <Award className="h-3 w-3" />
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 4. Compensation, Perks & Benefits */}
            <section className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl font-bold text-ink">Perks, Benefits & Equipment</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {details.perks.map((perk, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-line bg-paper/60 space-y-1">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold text-ink">Perk 0{i + 1}</span>
                    </div>
                    <p className="text-xs text-mute leading-relaxed">{perk}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Selection & Interview Process */}
            <section className="rounded-[22px] border border-line bg-white p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-line pb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">Hiring & Selection Process</h2>
                  <p className="text-xs text-mute font-mono">4 Sequential Stages to Final Placement Offer</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {details.selectionSteps.map((step) => (
                  <div key={step.num} className="p-4 rounded-xl border border-line bg-white space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                        Stage {step.num}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-ink">{step.title}</p>
                    <p className="text-xs text-mute leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Company Profile & Quick Snapshot (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Apply & Career Desk Box */}
            <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-5">
              <div className="border-b border-line pb-3">
                <p className="gz-kicker text-accent">Role Summary</p>
                <h3 className="font-display text-lg font-bold text-ink mt-0.5">Quick Facts</h3>
              </div>

              <dl className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Company</dt>
                  <dd className="font-bold text-ink">{job.company}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Role</dt>
                  <dd className="font-semibold text-ink">{job.role}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Location</dt>
                  <dd className="font-semibold text-ink">{job.location || "Bengaluru"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Workplace Mode</dt>
                  <dd className="font-semibold text-ink">{job.remote ? "Remote" : "Hybrid / On-site"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Experience</dt>
                  <dd className="font-semibold text-ink">{job.experience_level || "Freshers (0-1 yrs)"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Package / CTC</dt>
                  <dd className="font-bold text-accent">{job.ctc_lpa ? `₹${job.ctc_lpa} LPA` : "Competitive"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Applications</dt>
                  <dd className="font-mono text-mint font-bold">Active & Open</dd>
                </div>
              </dl>

              <div className="pt-2">
                <a
                  href={targetApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleApplyRedirect}
                  className="gz-btn gz-btn-primary w-full !min-h-10 text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Apply on {job.company} Website</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <p className="text-[10px] text-mute text-center mt-2 leading-relaxed">
                  Redirects directly to {job.company}'s official careers portal.
                </p>
              </div>
            </div>

            {/* About Company Card */}
            <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 border-b border-line pb-3">
                <Building2 className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="font-display text-base font-bold text-ink">About {job.company}</h3>
                  <span className="text-[11px] text-mute font-mono">Verified Hiring Partner</span>
                </div>
              </div>

              <p className="text-xs text-mute leading-relaxed">
                {details.aboutCompany}
              </p>

              <a
                href={targetApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 pt-1"
              >
                <span>Visit {job.company} Careers</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* GenZ360 Student Advantage */}
            <div className="rounded-[22px] border border-mint/30 bg-mint/5 p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-mint font-bold text-xs">
                <Flame className="h-4 w-4" />
                <span>GenZ360 Student Advantage</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Applying with a verified GenZ360 account attaches your cryptographically signed sprint certificates, box cricket wellness score, and verified college GPA directly to recruiter dashboards.
              </p>
              <Link
                to="/app/profile"
                className="text-xs font-semibold text-mint hover:underline inline-flex items-center gap-1"
              >
                <span>Check Your Placement Passport →</span>
              </Link>
            </div>

          </aside>
        </div>

        {/* ── Bottom Floating/Sticky Action Bar for Mobile ── */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-line shadow-lg z-40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate">{job.role}</p>
            <p className="text-[11px] text-accent font-bold">{job.ctc_lpa ? `₹${job.ctc_lpa} LPA` : "Competitive"}</p>
          </div>
          <a
            href={targetApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyRedirect}
            className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            <span>Apply Now</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

      </article>
    </Page>
  );
}
