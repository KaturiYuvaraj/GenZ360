import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { getSkillDetails } from "@/lib/data/catalog";
import { enrollSkill, toggleLessonCompletion } from "@/lib/data/actions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CURRICULUM_CATALOG } from "@/lib/data/curriculumData";
import { Check, Lightbulb, Sparkles } from "lucide-react";

export const Route = createFileRoute("/skills/$id")({
  component: SkillDetailView,
  head: () => ({
    meta: [
      { title: "Learning Track & Syllabus — GenZ360" },
      { name: "description", content: "Master industry-standard production skills with structured modular syllabi, live agile sprint projects, and verified credentials." },
    ],
  }),
});

function SkillDetailView() {
  const params = Route.useParams() as { id: string };
  const id = params.id;
  const { user } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof getSkillDetails>> | undefined>();
  const [err, setErr] = useState("");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  function loadData() {
    getSkillDetails({ data: { id } })
      .then((res) => {
        setData(res);
        if (res?.modules?.[0]) {
          setOpenModuleId(res.modules[0].id);
          if (res.modules[0].lessons?.[0]) {
            setSelectedLesson(res.modules[0].lessons[0]);
          }
        }
      })
      .catch((e) => setErr(e.message));

    // Load local storage fallback for enrollment & lesson progress
    try {
      const savedEnrolled = JSON.parse(localStorage.getItem("gz360_enrolled_skills") || "[]");
      if (savedEnrolled.includes(id)) {
        setIsEnrolled(true);
      }
      const savedLessons = JSON.parse(localStorage.getItem(`gz360_lessons_${id}`) || "[]");
      setCompletedLessonIds(savedLessons);
    } catch {
      // LocalStorage access fallback
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // Fallback to static CURRICULUM_CATALOG if modules aren't populated yet
  const fallbackCurriculum = CURRICULUM_CATALOG[id];
  const modules: any[] = data?.modules?.length
    ? data.modules
    : fallbackCurriculum?.modules ?? [];

  const allLessons: any[] = modules.flatMap((m) => m.lessons ?? []);
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  async function handleEnroll() {
    if (!user) {
      window.location.href = `/login?redirect=/skills/${id}`;
      return;
    }
    setEnrolling(true);
    try {
      await enrollSkill({ data: { skillId: id } }).catch(() => {});
      setIsEnrolled(true);
      try {
        const saved = JSON.parse(localStorage.getItem("gz360_enrolled_skills") || "[]");
        if (!saved.includes(id)) {
          localStorage.setItem("gz360_enrolled_skills", JSON.stringify([...saved, id]));
        }
      } catch {
        // LocalStorage access fallback
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#1857FF", "#E85A3C", "#10B981", "#F59E0B"],
      });
    } catch (e: any) {
      alert(e.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleToggleLesson(lessonId: string) {
    if (!user) {
      window.location.href = `/login?redirect=/skills/${id}`;
      return;
    }
    const isDone = completedLessonIds.includes(lessonId);
    const updated = isDone
      ? completedLessonIds.filter((l) => l !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(updated);
    try {
      localStorage.setItem(`gz360_lessons_${id}`, JSON.stringify(updated));
    } catch {
      // LocalStorage access fallback
    }

    // Persist to server
    toggleLessonCompletion({
      data: { skillId: id, lessonId, completed: !isDone },
    }).catch(() => {});

    // If completed 100%, trigger celebratory confetti
    if (!isDone && updated.length === totalLessons && totalLessons > 0) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#10B981", "#1857FF", "#FEF08A"],
      });
    }
  }

  if (data === undefined && !err) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <LoadingState label="Loading curriculum & learning track..." />
        </div>
      </Page>
    );
  }

  if (!data?.skill) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <ErrorState message={err || "Skill track not found."} />
          <div className="mt-4">
            <Link to="/skills" className="gz-btn gz-btn-ghost">
              Back to all skills
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  const { skill, projects = [], internships = [], assessments = [] } = data;

  return (
    <Page>
      {/* 1. Track Hero Header */}
      <section className="border-b border-line bg-paper-2/40 py-10">
        <div className="gz-wrap-wide">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/skills" className="gz-kicker hover:text-ink transition-colors">
              Skills Explorer
            </Link>
            <span className="text-mute">/</span>
            <span className="gz-kicker text-ink">{skill.name}</span>
          </div>

          <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
                  {skill.category}
                </span>
                <span className="rounded-full border border-line bg-paper px-3 py-0.5 text-xs font-semibold text-ink-soft">
                  {skill.level} Track
                </span>
                <span className="rounded-full border border-line bg-paper px-3 py-0.5 text-xs font-mono text-mute">
                  {skill.demand}% Industry Demand
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-[-0.04em]">
                {skill.name} Engineering
              </h1>
              <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink-soft">
                {skill.summary}
              </p>
            </div>

            {/* Quick Actions & Enrollment Status */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:self-center">
              {isEnrolled ? (
                <div className="flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-sm font-medium text-mint">
                  <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
                  Enrolled & Active Track
                </div>
              ) : user ? (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="gz-btn gz-btn-primary shadow-sm"
                >
                  {enrolling ? "Enrolling..." : "Enroll in Track"}
                </button>
              ) : (
                <Link
                  to="/login"
                  search={{ redirect: `/skills/${id}` }}
                  className="gz-btn gz-btn-primary shadow-sm"
                >
                  Sign in to Enroll
                </Link>
              )}
              <Link to="/app/assessments" className="gz-btn gz-btn-ghost">
                Take Assessment
              </Link>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="mt-8 rounded-[16px] border border-line bg-paper p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">Track Progress:</span>
                <span className="font-mono text-accent font-bold">{progressPct}%</span>
                <span className="text-mute text-xs">
                  ({completedCount} of {totalLessons} lessons finished)
                </span>
              </div>
              <span className="text-xs text-mute font-mono">
                {progressPct === 100 ? "Ready for Certification!" : "Complete all lessons to unlock Capstone"}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Syllabus Explorer & Lesson Viewer */}
      <section className="gz-wrap-wide py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Multi-Module Accordion */}
          <div>
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <div>
                <p className="gz-kicker">Curriculum</p>
                <h2 className="mt-1 font-display text-2xl">Structured Course Modules</h2>
              </div>
              <span className="text-xs text-mute font-mono">
                {modules.length} Modules · {totalLessons} Lessons
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {modules.map((mod: any) => {
                const isOpen = openModuleId === mod.id;
                const modLessons = (mod.lessons ?? []) as any[];
                const modCompleted = modLessons.filter((l: any) =>
                  completedLessonIds.includes(l.id)
                ).length;

                return (
                  <div
                    key={mod.id}
                    className="overflow-hidden rounded-[18px] border border-line bg-paper transition-all"
                  >
                    {/* Module Accordion Header */}
                    <button
                      type="button"
                      onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                      className="flex w-full items-center justify-between p-5 text-left hover:bg-paper-2/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white font-mono text-xs font-bold text-ink">
                          0{mod.module_number}
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-ink">
                            {mod.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-mute line-clamp-1">{mod.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs font-mono text-mute hidden sm:inline">
                          {modCompleted}/{modLessons.length} done
                        </span>
                        <span className="text-sm text-mute">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* Lesson Items inside Module */}
                    {isOpen && (
                      <div className="border-t border-line bg-white/50 divide-y divide-line/60">
                        {modLessons.map((les: any) => {
                          const isDone = completedLessonIds.includes(les.id);
                          const isSelected = selectedLesson?.id === les.id;

                          return (
                            <div
                              key={les.id}
                              onClick={() => setSelectedLesson(les)}
                              className={`flex items-center justify-between p-4 pl-6 cursor-pointer transition-colors ${
                                isSelected ? "bg-accent/5" : "hover:bg-paper/80"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleLesson(les.id);
                                  }}
                                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent cursor-pointer"
                                />
                                <div>
                                  <p
                                    className={`text-sm font-medium ${
                                      isDone ? "text-mute line-through" : "text-ink"
                                    }`}
                                  >
                                    {mod.module_number}.{les.lesson_number} {les.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono uppercase text-mute">
                                      {les.kind}
                                    </span>
                                    <span className="text-[10px] text-mute">·</span>
                                    <span className="text-[10px] font-mono text-mute">
                                      {les.duration_min} min
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLesson(les);
                                }}
                                className="gz-btn gz-btn-ghost !min-h-7 !px-2.5 text-xs text-accent"
                              >
                                View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Lesson Preview & Exercise Panel */}
          <div>
            <div className="sticky top-20 rounded-[22px] border border-line bg-paper p-6 shadow-[var(--shadow-lift)] space-y-6">
              {selectedLesson ? (
                <>
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div>
                      <span className="gz-kicker">Lesson Details</span>
                      <h3 className="font-display text-2xl font-semibold mt-1">
                        {selectedLesson.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-line/60 px-3 py-1 font-mono text-xs text-ink-soft">
                      {selectedLesson.duration_min} min
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display text-xs uppercase tracking-widest text-mute">
                      Core Key Takeaway
                    </h4>
                    <div className="mt-2 rounded-[14px] border border-accent/20 bg-accent/5 p-4 text-sm leading-relaxed text-ink font-medium flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{selectedLesson.key_takeaway || "Understand production mental models and real-world system architecture."}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-xs uppercase tracking-widest text-mute">
                      Hands-on Code Exercise
                    </h4>
                    <div className="mt-2 rounded-[14px] border border-line bg-white p-4 font-mono text-xs leading-relaxed text-ink-soft">
                      {selectedLesson.exercise_prompt || "Build a working demonstration and submit via PR to pass inspection."}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
                    <button
                      type="button"
                      onClick={() => handleToggleLesson(selectedLesson.id)}
                      className={`gz-btn text-xs ${
                        completedLessonIds.includes(selectedLesson.id)
                          ? "gz-btn-ghost text-mint"
                          : "gz-btn-primary"
                      }`}
                    >
                      {completedLessonIds.includes(selectedLesson.id) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          <span>Marked as Done</span>
                        </span>
                      ) : (
                        "Mark as Completed"
                      )}
                    </button>
                    <Link to="/projects" className="gz-btn gz-btn-ghost text-xs">
                      Practice in Sprint →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-mute">
                  Select any lesson from the syllabus on the left to inspect exercises.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Connected GenZ360 Ecosystem Bridges */}
      <section className="border-t border-line bg-paper-2/30 py-12">
        <div className="gz-wrap-wide space-y-10">
          <div>
            <p className="gz-kicker">Compounding Ecosystem</p>
            <h2 className="mt-1 font-display text-3xl">Connected Opportunities for {skill.name}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Every skill in GenZ360 connects into real production sprints, paid internships, and placement interviews.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bridge 1: Live Projects */}
            <div className="rounded-[20px] border border-line bg-paper p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="gz-kicker text-coral">01 · Live Sprints</span>
                <span className="text-xs font-mono text-mute">{projects.length} Active</span>
              </div>
              <h3 className="font-display text-xl">Hands-on Agile Sprints</h3>
              <p className="text-xs text-ink-soft">
                Join a student squad shipping production code for verified employers.
              </p>
              <ul className="divide-y divide-line/60 text-xs">
                {projects.slice(0, 2).map((p) => (
                  <li key={p.id} className="py-2.5">
                    <Link to="/projects/$id" params={{ id: p.id }} className="hover:text-accent font-medium">
                      {p.title}
                    </Link>
                    <p className="text-mute text-[11px] mt-0.5">{p.company} · {p.progress}% done</p>
                  </li>
                ))}
              </ul>
              <Link to="/projects" className="gz-btn gz-btn-ghost !min-h-8 text-xs w-full">
                View All Sprints →
              </Link>
            </div>

            {/* Bridge 2: Active Internships */}
            <div className="rounded-[20px] border border-line bg-paper p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="gz-kicker text-accent">02 · Internships</span>
                <span className="text-xs font-mono text-mute">{internships.length} Open</span>
              </div>
              <h3 className="font-display text-xl">Hiring Stipends</h3>
              <p className="text-xs text-ink-soft">
                Companies directly recruiting students who cleared this skill curriculum.
              </p>
              <ul className="divide-y divide-line/60 text-xs">
                {internships.slice(0, 2).map((i) => (
                  <li key={i.id} className="py-2.5">
                    <Link to="/internships/$id" params={{ id: i.id }} className="hover:text-accent font-medium">
                      {i.role}
                    </Link>
                    <p className="text-mute text-[11px] mt-0.5">{i.company} · ₹{i.stipend.toLocaleString()}/mo</p>
                  </li>
                ))}
              </ul>
              <Link to="/internships" className="gz-btn gz-btn-ghost !min-h-8 text-xs w-full">
                Explore Internships →
              </Link>
            </div>

            {/* Bridge 3: Verifiable Certification */}
            <div className="rounded-[20px] border border-line bg-paper p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="gz-kicker text-mint">03 · Verified Proof</span>
                <span className="text-xs font-mono text-mute">SHA-256</span>
              </div>
              <h3 className="font-display text-xl">Official Certification</h3>
              <p className="text-xs text-ink-soft">
                Take the timed assessment to earn a tamper-proof digital credential on your profile.
              </p>
              <div className="rounded-[12px] bg-paper-2 p-3 text-xs text-ink-soft space-y-1">
                <p className="font-medium text-ink">Passing Bar: 70% Score</p>
                <p className="text-mute">Instant verification link & downloadable PDF seal for resumes.</p>
              </div>
              <Link to="/app/assessments" className="gz-btn gz-btn-primary !min-h-8 text-xs w-full">
                Take Timed Assessment →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
