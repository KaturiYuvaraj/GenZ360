import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Trophy,
  User,
  ExternalLink,
  Eye,
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertCircle,
  Code2,
} from "lucide-react";
import { getMyResume, saveMyResume, syncProfileToResume } from "@/lib/data/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export type ResumeTemplate = "modern" | "editorial" | "compact";

export interface ResumeData {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  education: string;
  skills: string;
  projects: string;
  internships: string;
  certifications: string;
  achievements: string;
  sports: string;
  extras: string;
  template: string;
}

const PRESET_FULLSTACK: ResumeData = {
  full_name: "Ananya Krishnan",
  headline: "Product Engineer · Full-Stack & Distributed Systems",
  email: "ananya.k@rvce.edu.in",
  phone: "+91 98450 12345",
  city: "Bengaluru, India",
  education: "B.E. Computer Science, RV College of Engineering — 2023–2027 (CGPA: 8.9/10)\nRelevant Coursework: Distributed Systems, Database Internals, Algorithms & Data Structures",
  skills: "TypeScript, React 19, Node.js, Next.js, PostgreSQL, GraphQL, Python, Docker, Redis, Tailwind v4",
  projects: "AI Recruitment Desk (GenZ360 Live Agile Sprint) | Squad Lead\n• Architected real-time candidate ranking pipeline handling 1,200+ daily resumes with sub-250ms latency\n• Engineered collaborative sprint kanban board with optimistic UI updates and zero layout shifts\n• Led 5-member student squad through 4 agile sprints, delivering 100% of backlog tickets on schedule\n\nDistributed Edge Cache & Rate Limiter | Systems Project\n• Built token-bucket rate limiter in Go with Redis backend processing 45,000 req/sec under simulated DDoS\n• Open-sourced on GitHub with 340+ stars and integrated across 3 campus technical portals",
  internships: "Software Engineering Intern | Zeta Suite (Summer 2026)\n• Rebuilt core payments reconciliation interface with React 19 and TanStack Query, cutting page load by 42%\n• Wrote end-to-end Playwright test suites covering 85+ mission-critical checkout flows",
  certifications: "GenZ360 Certified React Product Engineer · SHA-256 Ledger Verified (ID: GZ360-9F2C18)\nAWS Certified Cloud Practitioner · Amazon Web Services",
  achievements: "Top 1% Percentile (94%) in GenZ360 React & Architecture Timed Assessment Arena\n1st Place Winner — HackKarnataka 2025 (Automated emergency triage platform)",
  sports: "Captain · RVCE Box Cricket Squad (Champions, Bengaluru Night Box League 2025)\nOrganized intra-college 16-team tournament with 200+ active student participants",
  extras: "github.com/ananya-k · linkedin.com/in/ananyakrishnan · ananya.dev",
  template: "modern",
};

const PRESET_AI: ResumeData = {
  full_name: "Arjun Mehta",
  headline: "AI Engineer & Systems Builder · LLMs, RAG & Vector Search",
  email: "arjun.mehta@pes.edu",
  phone: "+91 99123 45678",
  city: "Bengaluru, India",
  education: "B.Tech Information Science, PES University — 2023–2027 (CGPA: 9.1/10)\nDepartment Academic Honors · Dean's Merit List 2024 & 2025",
  skills: "Python, PyTorch, LangChain, Hugging Face, TypeScript, PostgreSQL (pgvector), FastEmbed, Docker, CUDA",
  projects: "Sarvam AI Voice Copilot (GenZ360 Production Sprint) | Core Builder\n• Built multi-lingual RAG indexing 50,000+ public documents with hybrid dense/sparse embeddings\n• Reduced inference latency by 35% through dynamic token batching and vLLM 4-bit quantization\n• Achieved 92% answer precision audited against standardized employer evaluation benchmarks\n\nCodeRefactor-LLM | Deep Learning Project\n• Fine-tuned Llama-3-8B on 120,000 production git diffs to automate legacy JS-to-TS refactoring\n• Shipped CLI tool adopted by 2,000+ student developers across 14 university campuses",
  internships: "Machine Learning Intern | Sarvam AI Research Labs (Jan 2026 – Present)\n• Evaluated Indic-language speech models on regional dialect benchmarks, improving WER by 4.2%\n• Deployed Triton inference server on AWS GPU instances with auto-scaling",
  certifications: "GenZ360 Certified Applied AI Engineer · SHA-256 Ledger Verified (ID: GZ360-7B4D21)\nDeep Learning Specialization · DeepLearning.AI",
  achievements: "96th Percentile — GenZ360 AI & Vector Search Assessment Arena\nFinalist — Smart India Hackathon (SIH 2025 AI Track)",
  sports: "Vice-Captain & All-Rounder — PES Panthers College League\nWeekend Open Box Cricket League MVP (Runners-Up 2025)",
  extras: "github.com/arjun-ai · linkedin.com/in/arjunmehta · huggingface.co/arjunm",
  template: "editorial",
};

const EMPTY_RESUME: ResumeData = {
  full_name: "",
  headline: "",
  email: "",
  phone: "",
  city: "",
  education: "",
  skills: "",
  projects: "",
  internships: "",
  certifications: "",
  achievements: "",
  sports: "",
  extras: "",
  template: "modern",
};

const ACCENT_COLORS = [
  { label: "Classic Tech Blue", value: "#1857FF" },
  { label: "Coral Punch", value: "#E85A3C" },
  { label: "Emerald Mint", value: "#10B981" },
  { label: "Deep Ink", value: "#14161A" },
  { label: "Royal Indigo", value: "#6366F1" },
];

export function ResumeStudio({ isPublic = false }: { isPublic?: boolean }) {
  const user = useCurrentUser();
  const [form, setForm] = useState<ResumeData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gz360_resume_draft");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return { ...PRESET_FULLSTACK, full_name: user?.displayName || PRESET_FULLSTACK.full_name };
  });

  const [accentColor, setAccentColor] = useState("#1857FF");
  const [activeTab, setActiveTab] = useState<"basics" | "experience" | "projects" | "skills" | "education" | "certs">("basics");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // Exact A4 Paper Geometry: 210mm x 297mm at standard 96 DPI (794px x 1123px)
  const A4_WIDTH = 794;
  const A4_MIN_HEIGHT = 1123;
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<"fit" | "100%">("fit");
  const [containerWidth, setContainerWidth] = useState<number>(794);
  const [sheetHeight, setSheetHeight] = useState<number>(1123);

  useEffect(() => {
    const updateDimensions = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
      if (sheetRef.current) {
        const h = sheetRef.current.offsetHeight;
        if (h > 0) setSheetHeight(Math.max(A4_MIN_HEIGHT, h));
      }
    };

    updateDimensions();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        updateDimensions();
      });
      if (previewContainerRef.current) ro.observe(previewContainerRef.current);
      if (sheetRef.current) ro.observe(sheetRef.current);
    }

    window.addEventListener("resize", updateDimensions);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [mobileView, form.template]);

  const fitScale = useMemo(() => {
    if (containerWidth <= 0) return 1;
    const available = containerWidth - 16;
    return Math.min(1, Math.max(0.25, available / A4_WIDTH));
  }, [containerWidth]);

  const currentScale = zoomMode === "100%" ? 1 : fitScale;

  // Load from DB if user is logged in
  useEffect(() => {
    if (!user) return;
    getMyResume()
      .then((r) => {
        if (!r) return;
        setForm((prev) => ({
          ...prev,
          full_name: r.full_name || prev.full_name,
          email: r.email ?? prev.email,
          phone: r.phone ?? prev.phone,
          city: r.city ?? prev.city,
          headline: r.headline ?? prev.headline,
          education: r.education || prev.education,
          skills: r.skills || prev.skills,
          internships: r.internships || prev.internships,
          projects: r.projects || prev.projects,
          certifications: r.certifications || prev.certifications,
          achievements: r.achievements || prev.achievements,
          sports: r.sports || prev.sports,
          extras: r.extras || prev.extras,
          template: r.template || prev.template,
        }));
      })
      .catch(() => {});
  }, [user]);

  // Persist to localStorage for drafts
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gz360_resume_draft", JSON.stringify(form));
    }
  }, [form]);

  function set<K extends keyof ResumeData>(k: K, v: ResumeData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      if (user) {
        await saveMyResume({ data: form });
        setMsg("Synced & saved to your GenZ360 account!");
      } else {
        setMsg("Draft saved locally in your browser!");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function syncFromProfile() {
    setBusy(true);
    setMsg("");
    try {
      await syncProfileToResume();
      const updated = await getMyResume();
      if (updated) {
        setForm((prev) => ({
          ...prev,
          full_name: updated.full_name || prev.full_name,
          headline: updated.headline ?? prev.headline,
          education: updated.education || prev.education,
          skills: updated.skills || prev.skills,
          projects: updated.projects || prev.projects,
          certifications: updated.certifications || prev.certifications,
          sports: updated.sports || prev.sports,
          extras: updated.extras || prev.extras,
        }));
      }
      setMsg("Synced live verified data from your Student Profile!");
    } catch {
      setMsg("Sync failed. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function applyPreset(preset: ResumeData) {
    setForm({ ...preset });
    setMsg("Preset template loaded.");
    setTimeout(() => setMsg(""), 3000);
  }

  function handleCopyPlainText() {
    const text = [
      form.full_name.toUpperCase(),
      form.headline,
      [form.email, form.phone, form.city, form.extras].filter(Boolean).join(" | "),
      "",
      "=== EDUCATION ===",
      form.education,
      "",
      "=== TECHNICAL SKILLS ===",
      form.skills,
      "",
      "=== LIVE SPRINT PROJECTS ===",
      form.projects,
      "",
      "=== EXPERIENCE & INTERNSHIPS ===",
      form.internships,
      "",
      "=== VERIFIED CERTIFICATIONS ===",
      form.certifications,
      "",
      "=== KEY ACHIEVEMENTS ===",
      form.achievements,
      "",
      "=== SPORTS & LEADERSHIP ===",
      form.sports,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ATS Score & Audit Calculation
  const atsAudit = useMemo(() => {
    let score = 0;
    const checks: { label: string; passed: boolean; tip: string }[] = [];

    // 1. Contact completeness (20 pts)
    const hasContact = Boolean(form.full_name && form.email && form.phone && form.city);
    score += hasContact ? 20 : 5;
    checks.push({
      label: "Contact Information",
      passed: hasContact,
      tip: "Include full name, email, phone number, and location for recruiter reachability.",
    });

    // 2. Headline & Role clarity (15 pts)
    const hasHeadline = Boolean(form.headline && form.headline.length > 8);
    score += hasHeadline ? 15 : 0;
    checks.push({
      label: "Clear Target Headline",
      passed: hasHeadline,
      tip: "Specify target engineering domain (e.g. 'Product Engineer · React & Node.js').",
    });

    // 3. Technical Skills (15 pts)
    const skillCount = form.skills.split(",").filter((s) => s.trim()).length;
    const hasSkills = skillCount >= 6;
    score += hasSkills ? 15 : skillCount > 2 ? 8 : 0;
    checks.push({
      label: "Core Skills & Tools (6+)",
      passed: hasSkills,
      tip: "List 6+ relevant frameworks, languages, and tools to pass recruiter filters.",
    });

    // 4. Measurable metrics & numbers (15 pts)
    const fullText = `${form.projects} ${form.internships} ${form.achievements}`;
    const metricMatches = (fullText.match(/\d+[%mskLPAMBReqs]+/gi) || []).length;
    const hasMetrics = metricMatches >= 3;
    score += hasMetrics ? 15 : metricMatches > 0 ? 8 : 0;
    checks.push({
      label: "Quantified Metrics (%, ms, req/s)",
      passed: hasMetrics,
      tip: "Use numbers and percentages (e.g., 'sub-250ms', '42% faster', '1,200+ users').",
    });

    // 5. Action Verbs (15 pts)
    const actionVerbs = ["built", "architected", "engineered", "shipped", "optimized", "led", "developed", "rebuilt", "deployed"];
    const actionCount = actionVerbs.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(fullText)).length;
    const hasVerbs = actionCount >= 3;
    score += hasVerbs ? 15 : actionCount > 0 ? 8 : 0;
    checks.push({
      label: "Action Verbs ('Engineered', 'Shipped')",
      passed: hasVerbs,
      tip: "Start bullet points with strong verbs (Engineered, Architected, Shipped).",
    });

    // 6. GenZ360 Verification & Proof (20 pts)
    const hasProof = /GZ360|SHA-256|Verified|Sprint|Hackathon/i.test(fullText + form.certifications);
    score += hasProof ? 20 : 5;
    checks.push({
      label: "Verifiable Proof & Sprints",
      passed: hasProof,
      tip: "Include GenZ360 SHA-256 Certificate IDs and live sprint project briefs.",
    });

    return { score: Math.min(100, score), checks };
  }, [form]);

  const lines = (s: string) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <div className="resume-container">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="no-print mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-line pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-ink text-paper shrink-0">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <p className="gz-kicker !text-ink">Career Tools</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Resume Studio
              </h1>
              <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-[11px] font-mono font-medium text-mint shrink-0 whitespace-nowrap">
                ATS Optimized
              </span>
            </div>
            <p className="mt-1 text-xs text-mute max-w-xl">
              Build evidence-backed resumes with verified sprint projects, SHA-256 certificates, and sports leadership.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleCopyPlainText}
              className="gz-btn gz-btn-outline !min-h-10 sm:!min-h-9 !px-3.5 text-xs flex-1 sm:flex-initial justify-center whitespace-nowrap cursor-pointer"
              title="Copy plain text for applicant portals"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-mint shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
              <span>{copied ? "Copied" : "Copy text"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileView("preview");
                setTimeout(() => window.print(), 100);
              }}
              className="gz-btn gz-btn-primary !min-h-10 sm:!min-h-9 !px-4 text-xs flex-1 sm:flex-initial justify-center whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Template Switcher, Accent Colors & Presets */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-line shadow-2xs space-y-2.5 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          {/* Row 1: Templates (Segmented control on mobile) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-mono text-[11px] text-mute uppercase shrink-0">Template:</span>
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 p-0.5 bg-paper-2/70 rounded-lg flex-1 sm:flex-initial text-xs font-medium">
              {[
                { id: "modern", label: "Modern", fullLabel: "Modern Tech" },
                { id: "editorial", label: "Editorial", fullLabel: "Editorial Minimal" },
                { id: "compact", label: "Compact", fullLabel: "Compact ATS" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`py-1.5 px-2.5 rounded-md text-center transition-all cursor-pointer whitespace-nowrap ${
                    form.template === t.id
                      ? "bg-white text-ink shadow-2xs font-semibold"
                      : "text-mute hover:text-ink"
                  }`}
                  onClick={() => set("template", t.id)}
                >
                  <span className="sm:hidden">{t.label}</span>
                  <span className="hidden sm:inline">{t.fullLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Accent Colors on left, Sync Profile on right */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 pt-2 sm:pt-0 border-t border-line/60 sm:border-t-0 w-full sm:w-auto">
            {/* Accent Color Picker */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[11px] text-mute uppercase shrink-0">Accent:</span>
              <div className="flex items-center gap-1">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setAccentColor(c.value)}
                    className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                      accentColor === c.value ? "scale-125 ring-2 ring-ink ring-offset-1" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Sync Profile */}
            {user && (
              <button
                type="button"
                onClick={syncFromProfile}
                disabled={busy}
                className="rounded-lg px-2.5 py-1 text-xs bg-mint/15 text-mint font-semibold hover:bg-mint/25 transition-colors border border-mint/30 flex items-center gap-1 whitespace-nowrap cursor-pointer shrink-0 sm:order-last"
                title="Populate resume with verified college, GPA, sports & certificate records"
              >
                <RefreshCw className={`h-3 w-3 shrink-0 ${busy ? "animate-spin" : ""}`} />
                <span>Sync Profile</span>
              </button>
            )}
          </div>

          {/* Row 3: Samples on left, Clear on right */}
          <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-line/60 sm:border-t-0 sm:border-l sm:border-line sm:pl-3 w-full sm:w-auto text-xs">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[11px] text-mute uppercase shrink-0">Sample:</span>
              <button
                type="button"
                onClick={() => applyPreset(PRESET_FULLSTACK)}
                className="rounded-md px-2.5 py-1 text-xs bg-paper-2/80 hover:bg-paper-2 text-ink font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Full-Stack
              </button>
              <button
                type="button"
                onClick={() => applyPreset(PRESET_AI)}
                className="rounded-md px-2.5 py-1 text-xs bg-paper-2/80 hover:bg-paper-2 text-ink font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                AI Builder
              </button>
            </div>
            <button
              type="button"
              onClick={() => applyPreset(EMPTY_RESUME)}
              className="rounded-md px-2 py-1 text-xs text-mute hover:text-ink transition-colors whitespace-nowrap cursor-pointer"
              title="Start from blank"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Mobile View Toggle (Editor vs Preview) */}
        <div className="flex lg:hidden rounded-lg bg-paper-2 p-1 text-xs">
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mobileView === "editor" ? "bg-white text-ink shadow-2xs" : "text-mute"
            }`}
            onClick={() => setMobileView("editor")}
          >
            Edit Resume
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mobileView === "preview" ? "bg-white text-ink shadow-2xs" : "text-mute"
            }`}
            onClick={() => setMobileView("preview")}
          >
            Live Preview
          </button>
        </div>
      </div>

      {/* Main Studio Split: Editor on Left, Live Sheet on Right */}
      <div className="resume-studio-grid grid min-w-0 w-full gap-8 lg:grid-cols-[0.88fr_1.12fr] items-start">
        {/* LEFT COLUMN: Editor & ATS Audit (Hidden on mobile if preview selected, hidden on print) */}
        <div className={`no-print space-y-6 min-w-0 w-full max-w-full ${mobileView === "preview" ? "hidden lg:block" : "block"}`}>
          {/* ATS Strength Score Meter */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-xs">
                  {atsAudit.score}%
                </span>
                <div>
                  <h3 className="font-display text-sm font-semibold">Resume ATS Readiness</h3>
                  <p className="text-[11px] text-mute">
                    {atsAudit.score >= 85
                      ? "Excellent! High pass rate for automated employer screeners."
                      : atsAudit.score >= 60
                      ? "Good foundation. Add metrics and live sprint proof to stand out."
                      : "Needs work. Complete your contact details, skills, and projects."}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  atsAudit.score >= 80 ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                }`}
              >
                {atsAudit.score >= 80 ? "Shortlist Ready" : "Building"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-paper-2 overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${atsAudit.score}%`,
                  backgroundColor: atsAudit.score >= 80 ? "#10B981" : atsAudit.score >= 60 ? "#1857FF" : "#E85A3C",
                }}
              />
            </div>

            {/* Micro Checklist */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-[11px]">
              {atsAudit.checks.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5" title={c.tip}>
                  {c.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-mute" />
                  )}
                  <span className={c.passed ? "text-ink font-medium" : "text-mute"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-line gap-1 overflow-x-auto pb-1 text-xs w-full min-w-0 max-w-full" style={{ scrollbarWidth: "none" }}>
            {[
              { id: "basics", label: "Basics", icon: User },
              { id: "projects", label: "Live Sprints", icon: FolderGit2 },
              { id: "skills", label: "Skills", icon: Code2 },
              { id: "experience", label: "Internships", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "certs", label: "Certs & Sports", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white border-t border-x border-line text-ink"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Cards */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs space-y-4">
            {activeTab === "basics" && (
              <div className="space-y-3">
                <p className="gz-kicker">Personal & Contact Details</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-ink-soft">
                    Full Name
                    <input
                      className="gz-input mt-1 w-full"
                      value={form.full_name}
                      placeholder="e.g. Ananya Krishnan"
                      onChange={(e) => set("full_name", e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-soft">
                    Professional Headline
                    <input
                      className="gz-input mt-1 w-full"
                      value={form.headline}
                      placeholder="e.g. Product Engineer · Full-Stack & Systems"
                      onChange={(e) => set("headline", e.target.value)}
                    />
                  </label>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="block text-xs font-medium text-ink-soft">
                    Email
                    <input
                      type="email"
                      className="gz-input mt-1 w-full"
                      value={form.email}
                      placeholder="you@college.edu"
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-soft">
                    Phone
                    <input
                      className="gz-input mt-1 w-full"
                      value={form.phone}
                      placeholder="+91 98450 12345"
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-soft">
                    City, Country
                    <input
                      className="gz-input mt-1 w-full"
                      value={form.city}
                      placeholder="Bengaluru, India"
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-xs font-medium text-ink-soft">
                  Portfolio, GitHub & Social Links (Separated by · or |)
                  <input
                    className="gz-input mt-1 w-full"
                    value={form.extras}
                    placeholder="github.com/username · linkedin.com/in/username · yoursite.dev"
                    onChange={(e) => set("extras", e.target.value)}
                  />
                </label>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker">Live Agile Sprints & Production Workspaces</p>
                  <span className="text-[10px] text-mute font-mono">Format: Title | Role \n • Bullet with metric</span>
                </div>
                <p className="text-xs text-mute">
                  List your GenZ360 live sprint brief and personal projects. Begin bullet points with strong action verbs (Engineered, Architected, Shipped) and include tangible metrics.
                </p>
                <textarea
                  className="gz-input mt-1 w-full font-mono text-xs leading-relaxed min-h-48"
                  value={form.projects}
                  rows={8}
                  placeholder="AI Recruitment Desk (GenZ360 Live Sprint) | Tech Lead&#10;• Architected candidate ranking pipeline with sub-250ms latency&#10;• Led 5-member student squad through 4 agile sprints with 100% backlog delivery"
                  onChange={(e) => set("projects", e.target.value)}
                />
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-3">
                <p className="gz-kicker">Technical Skills & Frameworks</p>
                <p className="text-xs text-mute">
                  Enter skills as comma-separated values. These are indexed by recruiters and ATS filters.
                </p>
                <textarea
                  className="gz-input mt-1 w-full font-mono text-xs min-h-24"
                  value={form.skills}
                  placeholder="TypeScript, React 19, Node.js, Next.js, PostgreSQL, Docker, Redis, Python"
                  onChange={(e) => set("skills", e.target.value)}
                />
                {/* Live tag preview */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {form.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-mono text-ink-soft border border-line"
                      >
                        {s}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="gz-kicker">Internships & Work Experience</p>
                  <span className="text-[10px] text-mute font-mono">Role | Company (Date) \n • Accomplishment</span>
                </div>
                <p className="text-xs text-mute">
                  Add verified internships, campus developer club roles, or freelance contracts.
                </p>
                <textarea
                  className="gz-input mt-1 w-full font-mono text-xs leading-relaxed min-h-40"
                  value={form.internships}
                  rows={6}
                  placeholder="Software Engineering Intern | Zeta Suite (Summer 2026)&#10;• Rebuilt core payments reconciliation interface with React 19, cutting page load by 42%&#10;• Wrote end-to-end test suites covering 85+ checkout flows"
                  onChange={(e) => set("internships", e.target.value)}
                />
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-3">
                <p className="gz-kicker">College, Degree & Academic Background</p>
                <p className="text-xs text-mute">
                  Degree, University, Graduation Year, CGPA and notable coursework.
                </p>
                <textarea
                  className="gz-input mt-1 w-full font-mono text-xs min-h-28"
                  value={form.education}
                  rows={4}
                  placeholder="B.E. Computer Science, RV College of Engineering — 2023–2027 (CGPA: 8.9/10)&#10;Relevant Coursework: Distributed Systems, Database Internals, Algorithms"
                  onChange={(e) => set("education", e.target.value)}
                />
              </div>
            )}

            {activeTab === "certs" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="gz-kicker">Verifiable Certifications & Badges</p>
                    <span className="text-[10px] text-mint font-mono">SHA-256 Ledger</span>
                  </div>
                  <p className="text-xs text-mute mt-1">
                    Paste your GenZ360 Certificate Title and verification ID (e.g. GZ360-9F2C18) so employers can verify instantly on /verify.
                  </p>
                  <textarea
                    className="gz-input mt-1.5 w-full font-mono text-xs min-h-24"
                    value={form.certifications}
                    placeholder="GenZ360 Certified React Product Engineer · SHA-256 Verified (ID: GZ360-9F2C18)&#10;AWS Certified Cloud Practitioner · Amazon Web Services"
                    onChange={(e) => set("certifications", e.target.value)}
                  />
                </div>

                <div>
                  <p className="gz-kicker">Sports & Campus Tournaments (GenZ360 Edge)</p>
                  <p className="text-xs text-mute mt-1">
                    Box Cricket captaincy, weekend leagues, or athletic achievements that prove grit and teamwork.
                  </p>
                  <textarea
                    className="gz-input mt-1.5 w-full font-mono text-xs min-h-20"
                    value={form.sports}
                    placeholder="Captain · RVCE Box Cricket Squad (Champions, Bengaluru Night Box League 2025)&#10;Organized intra-college 16-team tournament with 200+ participants"
                    onChange={(e) => set("sports", e.target.value)}
                  />
                </div>

                <div>
                  <p className="gz-kicker">Competitions & Hackathons</p>
                  <textarea
                    className="gz-input mt-1.5 w-full font-mono text-xs min-h-20"
                    value={form.achievements}
                    placeholder="Top 1% Percentile (94%) in GenZ360 React & Architecture Timed Assessment Arena&#10;1st Place Winner — HackKarnataka 2025"
                    onChange={(e) => set("achievements", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Bottom Save & Feedback Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-line">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="gz-btn gz-btn-primary !min-h-10 sm:!min-h-9 !px-4 text-xs w-full sm:w-auto justify-center cursor-pointer"
                >
                  {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span>{busy ? "Saving…" : user ? "Save to Profile" : "Save Draft"}</span>
                </button>
                {msg && <span className="text-xs text-mint font-medium">{msg}</span>}
              </div>

              {!user && isPublic && (
                <Link to="/login" className="text-xs text-accent hover:underline">
                  Sign in to sync across devices →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Sheet Preview (Visible on Screen & Primed for Print) */}
        <div
          ref={previewContainerRef}
          className={`resume-paper-wrapper min-w-0 w-full max-w-full overflow-x-auto pb-8 ${mobileView === "editor" ? "hidden lg:block" : "block"} print:!block print:overflow-visible print:p-0 print:m-0`}
        >
          {/* Document Preview Status Bar */}
          <div className="no-print mb-2.5 flex items-center justify-between gap-2 text-xs text-mute flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-ink">A4 Document</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper border border-line font-mono">
                210 × 297 mm
              </span>
              <span className="hidden sm:inline text-xs text-mute">· Exact Paper Geometry</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Mode Selector */}
              <div className="flex items-center rounded-lg bg-paper-2 p-0.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setZoomMode("fit")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    zoomMode === "fit" ? "bg-white text-ink font-semibold shadow-2xs" : "text-mute hover:text-ink"
                  }`}
                  title="Fit entire A4 sheet to screen width"
                >
                  Fit ({Math.round(fitScale * 100)}%)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode("100%")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    zoomMode === "100%" ? "bg-white text-ink font-semibold shadow-2xs" : "text-mute hover:text-ink"
                  }`}
                  title="View at 100% actual print size"
                >
                  100%
                </button>
              </div>

              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* SIZER CONTAINER (Matches the exact layout dimensions of the scaled A4 sheet) */}
          <div
            className="resume-scale-sizer mx-auto transition-all duration-150 ease-out"
            style={{
              width: `${Math.round(A4_WIDTH * currentScale)}px`,
              height: `${Math.round(sheetHeight * currentScale)}px`,
              minHeight: `${Math.round(A4_MIN_HEIGHT * currentScale)}px`,
            }}
          >
            {/* INNER SCALED WRAPPER */}
            <div
              className="resume-scale-inner origin-top-left"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_MIN_HEIGHT}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: "0 0",
              }}
            >
              {/* THE RESUME PAPER ITSELF: EXACT A4 SHEET */}
              <div
                id="resume-sheet"
                ref={sheetRef}
                className="resume-sheet relative bg-white text-[#14161A] p-10 shadow-2xl border border-line/60 rounded-xs print:shadow-none print:border-0 print:p-0 print:m-0"
                style={{
                  width: `${A4_WIDTH}px`,
                  minHeight: `${A4_MIN_HEIGHT}px`,
                  boxSizing: "border-box",
                }}
              >
                {/* TEMPLATE 1: MODERN TECH (Dual column with verification stamps) */}
                {form.template === "modern" && (
                  <div className="space-y-6 text-sm">
                    {/* Header banner */}
                    <div className="border-b-2 pb-5" style={{ borderColor: accentColor }}>
                      <div className="flex flex-row items-baseline justify-between gap-4">
                        <div>
                          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#14161A]">
                            {form.full_name || "Your Full Name"}
                          </h1>
                          <p className="mt-1 font-sans text-sm font-semibold tracking-wide" style={{ color: accentColor }}>
                            {form.headline || "Product Engineer · Full-Stack & Distributed Systems"}
                          </p>
                        </div>

                        {/* GenZ360 Verification Badge */}
                        <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-mono text-mute shrink-0">
                          <ShieldCheck className="h-3.5 w-3.5 text-mint" />
                          <span>GenZ360 Verified</span>
                        </div>
                      </div>

                      {/* Contact Row */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                        {form.email && <span>{form.email}</span>}
                        {form.phone && <span>· {form.phone}</span>}
                        {form.city && <span>· {form.city}</span>}
                        {form.extras && <span>· {form.extras}</span>}
                      </div>
                    </div>

                    {/* 2-Column Grid - Fixed Document Geometry */}
                    <div className="grid grid-cols-[210px_1fr] gap-6">
                      {/* Left Sidebar (Skills, Education, Certs, Sports) */}
                      <div className="space-y-5 border-r border-line/60 pr-5">
                    {/* Skills */}
                    {form.skills && (
                      <section>
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mute mb-2">
                          Technical Skills
                        </h2>
                        <div className="flex flex-wrap gap-1">
                          {form.skills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s) => (
                              <span
                                key={s}
                                className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-medium text-ink"
                              >
                                {s}
                              </span>
                            ))}
                        </div>
                      </section>
                    )}

                    {/* Education */}
                    {form.education && (
                      <section>
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mute mb-2">
                          Education
                        </h2>
                        <div className="space-y-2 text-xs">
                          {lines(form.education).map((line, i) => (
                            <p key={i} className={i === 0 ? "font-semibold text-ink" : "text-mute"}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Verifications & Badges */}
                    {form.certifications && (
                      <section>
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mute mb-2 flex items-center gap-1">
                          <Award className="h-3 w-3" style={{ color: accentColor }} />
                          Certifications
                        </h2>
                        <div className="space-y-2 text-xs">
                          {lines(form.certifications).map((c, i) => (
                            <p key={i} className="text-ink-soft leading-snug">
                              {c}
                            </p>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Sports Leadership */}
                    {form.sports && (
                      <section>
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-mute mb-2 flex items-center gap-1">
                          <Trophy className="h-3 w-3" style={{ color: accentColor }} />
                          Sports & Teams
                        </h2>
                        <div className="space-y-1.5 text-xs text-ink-soft leading-snug">
                          {lines(form.sports).map((s, i) => (
                            <p key={i}>{s}</p>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Right Main Column (Projects, Internships, Achievements) */}
                  <div className="space-y-5">
                    {/* Live Sprint Projects */}
                    {form.projects && (
                      <section>
                        <h2
                          className="font-mono text-xs font-bold uppercase tracking-wider pb-1 border-b border-line mb-3"
                          style={{ color: accentColor }}
                        >
                          Production Sprints & Projects
                        </h2>
                        <div className="space-y-3.5">
                          {form.projects.split("\n\n").map((block, idx) => {
                            const [titleLine, ...bulletLines] = block.split("\n");
                            return (
                              <div key={idx}>
                                <p className="font-semibold text-ink text-sm">{titleLine}</p>
                                <ul className="mt-1 space-y-1 text-xs text-ink-soft list-disc list-outside pl-4">
                                  {bulletLines.map((b, bIdx) => (
                                    <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Internships & Experience */}
                    {form.internships && (
                      <section>
                        <h2
                          className="font-mono text-xs font-bold uppercase tracking-wider pb-1 border-b border-line mb-3"
                          style={{ color: accentColor }}
                        >
                          Work Experience & Internships
                        </h2>
                        <div className="space-y-3.5">
                          {form.internships.split("\n\n").map((block, idx) => {
                            const [titleLine, ...bulletLines] = block.split("\n");
                            return (
                              <div key={idx}>
                                <p className="font-semibold text-ink text-sm">{titleLine}</p>
                                <ul className="mt-1 space-y-1 text-xs text-ink-soft list-disc list-outside pl-4">
                                  {bulletLines.map((b, bIdx) => (
                                    <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Competitions & Achievements */}
                    {form.achievements && (
                      <section>
                        <h2
                          className="font-mono text-xs font-bold uppercase tracking-wider pb-1 border-b border-line mb-2"
                          style={{ color: accentColor }}
                        >
                          Honors & Assessments
                        </h2>
                        <ul className="space-y-1 text-xs text-ink-soft list-disc list-outside pl-4">
                          {lines(form.achievements).map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE 2: EDITORIAL CLASSIC (Harvard / Stanford Minimal) */}
            {form.template === "editorial" && (
              <div className="space-y-5 text-sm font-sans">
                {/* Centered Masthead */}
                <div className="text-center border-b border-ink/30 pb-4">
                  <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                    {form.full_name || "Your Name"}
                  </h1>
                  <p className="mt-1 text-sm font-serif italic text-ink-soft">
                    {form.headline}
                  </p>
                  <p className="mt-2 text-xs text-mute font-mono">
                    {[form.email, form.phone, form.city, form.extras].filter(Boolean).join("  ·  ")}
                  </p>
                </div>

                {/* Education */}
                {form.education && (
                  <section>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-2">
                      Education
                    </h2>
                    <div className="space-y-1 text-xs">
                      {lines(form.education).map((line, i) => (
                        <p key={i} className={i === 0 ? "font-semibold" : "text-ink-soft"}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {/* Skills */}
                {form.skills && (
                  <section>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-2">
                      Technical Proficiencies
                    </h2>
                    <p className="text-xs leading-relaxed text-ink-soft">
                      {form.skills}
                    </p>
                  </section>
                )}

                {/* Projects */}
                {form.projects && (
                  <section>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-2">
                      Engineering Projects & Live Sprints
                    </h2>
                    <div className="space-y-3">
                      {form.projects.split("\n\n").map((block, idx) => {
                        const [titleLine, ...bulletLines] = block.split("\n");
                        return (
                          <div key={idx}>
                            <p className="font-semibold text-xs text-ink">{titleLine}</p>
                            <ul className="mt-1 space-y-1 text-xs text-ink-soft list-disc list-outside pl-4">
                              {bulletLines.map((b, bIdx) => (
                                <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Experience */}
                {form.internships && (
                  <section>
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-2">
                      Experience & Internships
                    </h2>
                    <div className="space-y-3">
                      {form.internships.split("\n\n").map((block, idx) => {
                        const [titleLine, ...bulletLines] = block.split("\n");
                        return (
                          <div key={idx}>
                            <p className="font-semibold text-xs text-ink">{titleLine}</p>
                            <ul className="mt-1 space-y-1 text-xs text-ink-soft list-disc list-outside pl-4">
                              {bulletLines.map((b, bIdx) => (
                                <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Certifications & Sports - Fixed Dual Column */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  {form.certifications && (
                    <section>
                      <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-1.5">
                        Verified Credentials
                      </h2>
                      <div className="space-y-1 text-xs text-ink-soft">
                        {lines(form.certifications).map((c, i) => (
                          <p key={i}>{c}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {form.sports && (
                    <section>
                      <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-ink border-b border-ink/20 pb-1 mb-1.5">
                        Sports & Leadership
                      </h2>
                      <div className="space-y-1 text-xs text-ink-soft">
                        {lines(form.sports).map((s, i) => (
                          <p key={i}>{s}</p>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATE 3: COMPACT ATS (Strict Single-Column, Maximum Parser Compatibility) */}
            {form.template === "compact" && (
              <div className="space-y-4 text-xs font-sans leading-relaxed">
                {/* Clean Top Header */}
                <div className="border-b-2 border-ink pb-3">
                  <h1 className="text-2xl font-bold uppercase tracking-wider text-ink">
                    {form.full_name || "Full Name"}
                  </h1>
                  <p className="font-medium text-xs text-ink-soft">{form.headline}</p>
                  <p className="mt-1 text-[11px] text-mute font-mono">
                    {[form.email, form.phone, form.city, form.extras].filter(Boolean).join(" | ")}
                  </p>
                </div>

                {/* Skills */}
                {form.skills && (
                  <section>
                    <h2 className="font-bold text-xs uppercase tracking-wider border-b border-line pb-0.5 mb-1.5">
                      Technical Skills
                    </h2>
                    <p className="text-ink-soft">{form.skills}</p>
                  </section>
                )}

                {/* Projects */}
                {form.projects && (
                  <section>
                    <h2 className="font-bold text-xs uppercase tracking-wider border-b border-line pb-0.5 mb-2">
                      Key Technical Projects & Live Sprints
                    </h2>
                    <div className="space-y-2.5">
                      {form.projects.split("\n\n").map((block, idx) => {
                        const [titleLine, ...bulletLines] = block.split("\n");
                        return (
                          <div key={idx}>
                            <p className="font-semibold text-ink">{titleLine}</p>
                            <ul className="mt-0.5 space-y-0.5 list-disc list-outside pl-4 text-ink-soft">
                              {bulletLines.map((b, bIdx) => (
                                <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Experience */}
                {form.internships && (
                  <section>
                    <h2 className="font-bold text-xs uppercase tracking-wider border-b border-line pb-0.5 mb-2">
                      Work Experience
                    </h2>
                    <div className="space-y-2.5">
                      {form.internships.split("\n\n").map((block, idx) => {
                        const [titleLine, ...bulletLines] = block.split("\n");
                        return (
                          <div key={idx}>
                            <p className="font-semibold text-ink">{titleLine}</p>
                            <ul className="mt-0.5 space-y-0.5 list-disc list-outside pl-4 text-ink-soft">
                              {bulletLines.map((b, bIdx) => (
                                <li key={bIdx}>{b.replace(/^[•\-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Education */}
                {form.education && (
                  <section>
                    <h2 className="font-bold text-xs uppercase tracking-wider border-b border-line pb-0.5 mb-1">
                      Education
                    </h2>
                    <div className="space-y-0.5 text-ink-soft">
                      {lines(form.education).map((l, i) => (
                        <p key={i} className={i === 0 ? "font-medium text-ink" : ""}>
                          {l}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {/* Certifications & Sports */}
                {(form.certifications || form.sports) && (
                  <section>
                    <h2 className="font-bold text-xs uppercase tracking-wider border-b border-line pb-0.5 mb-1">
                      Certifications & Extracurriculars
                    </h2>
                    <ul className="space-y-0.5 list-disc list-outside pl-4 text-ink-soft">
                      {lines(form.certifications).map((c, i) => (
                        <li key={`c-${i}`}><strong>Certification:</strong> {c}</li>
                      ))}
                      {lines(form.sports).map((s, i) => (
                        <li key={`s-${i}`}><strong>Leadership & Sports:</strong> {s}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
