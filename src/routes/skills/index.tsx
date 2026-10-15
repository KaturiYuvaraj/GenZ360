import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { Page } from "@/components/layout/Page";
import { LoadingState } from "@/components/ui/State";
import { listSkills } from "@/lib/data/catalog";
import { STAGE_NODES } from "@/components/three/SkillConstellation";
import { CURRICULUM_CATALOG } from "@/lib/data/curriculumData";
import { Check } from "lucide-react";

const SkillConstellation = lazy(() =>
  import("@/components/three/SkillConstellation").then((m) => ({ default: m.SkillConstellation })),
);

export const Route = createFileRoute("/skills/")({
  component: SkillsHub,
  head: () => ({
    meta: [
      { title: "Skills & Learning Tracks — GenZ360" },
      {
        name: "description",
        content:
          "Build skills that compound: coding, AI, UI/UX, testing, cloud, and digital marketing. Connect directly to agile sprint projects, internships, and verified credentials.",
      },
    ],
  }),
});

const CATS = ["All", "Coding", "AI", "UI/UX", "Testing", "Digital Marketing", "Cloud"];

function SkillsHub() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listSkills>> | null>(null);
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string>("01");
  const [enrolledSkillIds, setEnrolledSkillIds] = useState<string[]>([]);

  useEffect(() => {
    listSkills()
      .then((res) => {
        setRows(res);
        if (res.length > 0 && !activeSkillId) {
          setActiveSkillId(res[0].id);
        }
      })
      .catch(() => setRows([]));

    try {
      const saved = JSON.parse(localStorage.getItem("gz360_enrolled_skills") || "[]");
      setEnrolledSkillIds(saved);
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const filtered = (rows ?? []).filter((s) => {
    if (cat !== "All" && s.category !== cat) return false;
    if (query) {
      const q = query.toLowerCase();
      return `${s.name} ${s.category} ${s.summary}`.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedSkill = filtered.find((s) => s.id === activeSkillId) ?? filtered[0] ?? rows?.[0];
  const selectedCurriculum = selectedSkill ? CURRICULUM_CATALOG[selectedSkill.id] : null;

  return (
    <Page>
      {/* 1. Hero & 3D Interactive Stage Constellation */}
      <section className="gz-wrap-wide pt-8 pb-6">
        <div className="max-w-2xl">
          <p className="gz-kicker">Learning Tracks</p>
          <h1 className="gz-hero-title mt-2">Build skills that compound.</h1>
          <p className="mt-3 text-base text-ink-soft leading-relaxed">
            Every technical foundation engineered for production. Each skill directly bridges into live agile sprints,
            digital cryptographic certifications, and fast-track employer interviews.
          </p>
        </div>

        {/* 3D Interactive Compounding Trajectory Canvas */}
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-[340px] w-full rounded-2xl bg-paper/50 animate-pulse border border-line flex items-center justify-center text-xs text-mute font-mono">
                Loading 3D Workspace…
              </div>
            }
          >
            <SkillConstellation activeStep={activeStep} onSelectStep={setActiveStep} />
          </Suspense>
        </div>

        {/* 5-Step Trajectory Summary Cards */}
        <ol className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-5 rounded-[18px] overflow-hidden border border-line shadow-xs">
          {STAGE_NODES.map((node) => (
            <li
              key={node.step}
              onClick={() => setActiveStep(node.step)}
              className={`p-4 cursor-pointer transition-colors ${
                activeStep === node.step ? "bg-paper-2" : "bg-paper hover:bg-paper-2/50"
              }`}
            >
              <span className="font-mono text-[11px] text-mute">{node.step}</span>
              <p className="mt-2 font-display text-base font-semibold">{node.title}</p>
              <p className="mt-1 text-[11px] text-ink-soft line-clamp-1">{node.subtitle}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 2. Filter Bar & Search */}
      <section className="gz-wrap-wide pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                className={`gz-chip ${cat === c ? "bg-ink text-paper" : ""}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skill (e.g. React, AI, SQL)..."
              className="w-full rounded-full border border-line bg-paper px-4 py-2 text-xs text-ink placeholder:text-mute focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {!rows ? (
          <div className="mt-8">
            <LoadingState label="Loading skill tracks..." />
          </div>
        ) : null}

        {/* 3. Main Split View: Left List + Right Comprehensive Syllabus Preview */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: Skill Cards List */}
          <ul className="divide-y divide-line border-y border-line">
            {filtered.map((s) => {
              const isSelected = selectedSkill?.id === s.id;
              const hasEnrolled = enrolledSkillIds.includes(s.id);

              return (
                <li key={s.id}>
                  <div
                    onClick={() => setActiveSkillId(s.id)}
                    className={`group flex w-full items-center justify-between gap-4 py-4 px-3 rounded-[14px] cursor-pointer transition-all ${
                      isSelected ? "bg-accent/10 border-l-4 border-accent" : "hover:bg-paper-2/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors">
                          {s.name}
                        </span>
                        {hasEnrolled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
                            <Check className="h-3 w-3" />
                            <span>Enrolled</span>
                          </span>
                        )}
                        <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-mono text-mute">
                          {s.level}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft line-clamp-1">{s.summary}</p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono text-xs font-semibold text-accent">
                        {s.demand}% Demand
                      </span>
                      <Link
                        to="/skills/$id"
                        params={{ id: s.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 text-[11px] font-medium text-mute hover:text-ink transition-colors underline underline-offset-2"
                      >
                        Syllabus →
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Right: Quick Curriculum Preview & Action Drawer */}
          {selectedSkill ? (
            <div className="gz-panel rounded-[22px] p-6 lg:sticky lg:top-24 space-y-6 h-fit">
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="gz-kicker text-accent">{selectedSkill.category}</span>
                    <span className="text-mute">·</span>
                    <span className="gz-kicker">{selectedSkill.level} Track</span>
                  </div>
                  <h2 className="mt-2 font-display text-3xl sm:text-4xl">{selectedSkill.name}</h2>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{selectedSkill.summary}</p>
                </div>
                {enrolledSkillIds.includes(selectedSkill.id) && (
                  <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">
                    Active
                  </span>
                )}
              </div>

              {/* Curriculum Modules Outline */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">Course Syllabus Overview</h3>
                  <span className="font-mono text-xs text-mute">
                    {selectedCurriculum?.modules.length ?? 4} Modules
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {(selectedCurriculum?.modules ?? [
                    { id: "1", module_number: 1, title: "Foundations & Mental Models", duration_hours: 4 },
                    { id: "2", module_number: 2, title: "State Management & Real-Time Flow", duration_hours: 5 },
                    { id: "3", module_number: 3, title: "Design Systems & Production Patterns", duration_hours: 4 },
                    { id: "4", module_number: 4, title: "Live Sprint Capstone & Certification", duration_hours: 6 },
                  ]).map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-[12px] border border-line bg-white/70 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper-2 font-mono text-[10px] font-bold">
                          0{m.module_number}
                        </span>
                        <span className="font-medium text-ink">{m.title}</span>
                      </div>
                      <span className="font-mono text-mute">{m.duration_hours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Step Pipeline Mapping */}
              <ol className="space-y-2 border-t border-line pt-4 text-xs text-ink-soft">
                <li><strong className="text-ink">01 Learn:</strong> Curriculum mapped to real internship briefs.</li>
                <li><strong className="text-ink">02 Build:</strong> Direct entry into team sprints with GitHub reviews.</li>
                <li><strong className="text-ink">03 Practice:</strong> 18-question timed technical assessment.</li>
                <li><strong className="text-ink">04 Certify:</strong> Cryptographically verifiable SHA-256 digital badge.</li>
                <li><strong className="text-ink">05 Get hired:</strong> Direct fast-track recruiter interview loops.</li>
              </ol>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/skills/$id"
                  params={{ id: selectedSkill.id }}
                  className="gz-btn gz-btn-primary flex-1"
                >
                  Explore Full Syllabus & Modules →
                </Link>
                <Link to="/app/assessments" className="gz-btn gz-btn-ghost">
                  Take Assessment
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </Page>
  );
}
