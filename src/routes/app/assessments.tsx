import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { listAssessments } from "@/lib/data/catalog";
import { listMyAttempts } from "@/lib/data/me";
import { attemptAssessment } from "@/lib/data/actions";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { ASSESSMENT_BANKS, QuestionItem } from "@/lib/data/assessmentQuestions";
import { getMyProfile } from "@/lib/data/me";
import {
  BarChart3,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Layers,
  AlertCircle,
  Check,
  X,
  Lightbulb,
  Trophy,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/app/assessments")({
  component: AppAssessmentsGate,
});

// ─── College Campus Assessment Monitor ───────────────────────────────────────
// Shown to college TPOs — they see student stats, NOT a list of tests to sit.
function CollegeCampusAssessmentView({
  assessmentList,
}: {
  assessmentList: Awaited<ReturnType<typeof listAssessments>>;
}) {
  // Simulated campus stats derived from available assessments
  const skillCategories = [
    { label: "Coding", count: assessmentList.filter((a) => a.kind === "CODING").length, passRate: 74, students: 142, color: "#1857FF" },
    { label: "AI / ML", count: assessmentList.filter((a) => a.kind === "AI").length, passRate: 61, students: 89, color: "#818CF8" },
    { label: "Design", count: assessmentList.filter((a) => a.kind === "DESIGN").length, passRate: 68, students: 55, color: "#E85A3C" },
    { label: "Aptitude", count: assessmentList.filter((a) => a.kind === "APTITUDE").length, passRate: 82, students: 198, color: "#10B981" },
  ].filter((c) => c.count > 0 || c.students > 0);

  const totalStudentsTested = 312;
  const overallPassRate = 72;
  const certified = 186;
  const pendingRetake = 126;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-mint" />
            <p className="gz-kicker !text-mint">Campus Assessment Monitor</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl">Student Assessment Reports</h1>
          <p className="mt-2 text-sm text-ink-soft max-w-[52ch]">
            Track how your campus students perform across all GenZ360 skill assessments. Use this data to identify skill gaps and plan training drives.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-mute bg-mint/10 border border-mint/20 px-3 py-2 rounded-xl shrink-0">
          <AlertCircle className="h-3.5 w-3.5 text-mint" />
          <span>College view — <strong className="text-ink">read-only</strong>. Students sit these tests.</span>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Students Tested", value: totalStudentsTested, sub: "Across all categories", color: "#1857FF" },
          { icon: TrendingUp, label: "Overall Pass Rate", value: `${overallPassRate}%`, sub: "70% bar to certify", color: "#10B981" },
          { icon: Award, label: "Certificates Earned", value: certified, sub: "SHA-256 verified", color: "#F59E0B" },
          { icon: BookOpen, label: "Available Tests", value: assessmentList.length, sub: "Skill domains covered", color: "#818CF8" },
        ].map((card) => (
          <div
            key={card.label}
            className="gz-card-interactive rounded-2xl border border-line bg-white p-5 shadow-2xs group cursor-default"
          >
            <div className="flex items-center justify-between">
              <p className="gz-kicker">{card.label}</p>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ backgroundColor: `${card.color}18` }}
              >
                <card.icon size={18} color={card.color} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tabular-nums text-ink">{card.value}</p>
            <p className="mt-1 text-xs text-mute">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-skill breakdown */}
      <div className="gz-card-interactive rounded-2xl border border-line bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="h-4 w-4 text-mute" />
          <h2 className="font-display text-xl font-semibold">Pass Rate by Skill Category</h2>
        </div>
        <div className="space-y-4">
          {skillCategories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-ink">{cat.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-mute">{cat.students} students</span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: cat.passRate >= 70 ? "#10B981" : "#E85A3C" }}
                  >
                    {cat.passRate}% passed
                  </span>
                </div>
              </div>
              <div className="gz-progress rounded-full">
                <span
                  className="gz-bar-fill block h-full rounded-full"
                  style={{ width: `${cat.passRate}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mute border-t border-line pt-4">
          Passing bar is 70%. Categories below 70% indicate a skill gap — consider scheduling a training drive.
        </p>
      </div>

      {/* Available assessments — read-only view for TPO */}
      <div>
        <h2 className="font-display text-2xl font-semibold mb-4">All Available Assessments</h2>
        <p className="text-sm text-ink-soft mb-5">
          These are the tests your students can take. Students score 70%+ to earn a verified certificate.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessmentList.map((a) => (
            <div
              key={a.id}
              className="gz-card-interactive rounded-[18px] border border-line bg-paper p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="gz-kicker !text-[10px] text-accent">{a.kind}</span>
                <span className="text-xs font-mono text-mute">{a.duration_min} min</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{a.title}</h3>
              <p className="mt-1.5 text-xs text-ink-soft line-clamp-2 leading-relaxed">{a.summary}</p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-line/60">
                <span className="text-xs font-mono text-mute">
                  {ASSESSMENT_BANKS[a.id]?.questions.length || a.questions} Questions
                </span>
                <span className="flex items-center gap-1 text-xs text-mint font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Student-only
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action suggestions */}
      <div className="rounded-2xl border border-line bg-paper-2/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-mute" />
          <h3 className="text-sm font-semibold text-ink">Recommended Actions for TPO</h3>
        </div>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-mint" />
            Share the GenZ360 assessment link with your students to improve campus certification coverage.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-mint" />
            Use <Link to="/app/analytics" className="text-accent hover:underline">Placement Reports</Link> to cross-reference assessment pass rates with placement offers.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-mint" />
            For categories under 70% pass rate — schedule a pre-placement training drive and push students to retake.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Gate: decide which view to show based on role ────────────────────────────
function AppAssessmentsGate() {
  const [role, setRole] = useState<string | null>(null);
  const [list, setList] = useState<Awaited<ReturnType<typeof listAssessments>>>([]);

  useEffect(() => {
    getMyProfile().then((p) => setRole(p?.role ?? "student")).catch(() => setRole("student"));
    listAssessments().then(setList).catch(() => {});
  }, []);

  if (role === null) {
    return (
      <div className="space-y-6 pt-4">
        <div className="h-8 w-56 animate-pulse rounded-xl bg-paper-2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-paper-2" />
          ))}
        </div>
      </div>
    );
  }

  if (role === "college") {
    return <CollegeCampusAssessmentView assessmentList={list} />;
  }

  return <AppAssessments assessmentList={list} />;
}


function AppAssessments({
  assessmentList,
}: {
  assessmentList: Awaited<ReturnType<typeof listAssessments>>;
}) {
  const [list] = useState(assessmentList);
  const [attempts, setAttempts] = useState<Awaited<ReturnType<typeof listMyAttempts>>>([]);
  const [active, setActive] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; certId?: string } | null>(null);

  useEffect(() => {
    listMyAttempts().then(setAttempts).catch(() => {});
  }, []);

  const current = list.find((a) => a.id === active);
  const bank = active ? ASSESSMENT_BANKS[active] : null;
  const questions: QuestionItem[] = bank?.questions ?? [
    {
      id: "q_def_1",
      prompt: "Identify the primary architectural invariant for this skill domain.",
      options: [
        "Separation of concerns and deterministic state transitions",
        "Coupled database mutations in UI components",
        "Unvalidated user input passed directly to SQL",
        "Disabling all error boundaries",
      ],
      correctIndex: 0,
      explanation: "Separation of concerns ensures business logic remains testable, deterministic, and isolated from presentation layers.",
    },
    {
      id: "q_def_2",
      prompt: "What is the optimal latency and availability SLA for production deployments?",
      options: [
        "99.9% uptime with p95 latency under 200ms",
        "90% uptime with random unhandled rejections",
        "No metrics or alerting configured",
        "Only testing in production on weekends",
      ],
      correctIndex: 0,
      explanation: "Standard production SLAs target at least three nines (99.9%) uptime with sub-200ms p95 latency for responsive interfaces.",
    },
  ];

  function startAssessment(assessmentId: string) {
    setActive(assessmentId);
    const qCount = ASSESSMENT_BANKS[assessmentId]?.questions.length || 4;
    setAnswers(Array.from({ length: qCount }, () => -1));
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;

    if (answers.some((a) => a === -1)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score based on questions
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) correct++;
      });
      const calculatedScore = Math.round((correct / questions.length) * 100);

      // Server attempt
      const res = await attemptAssessment({
        data: { assessmentId: current.id, answers: answers.map((a) => (a === -1 ? 0 : a)) },
      }).catch(() => ({ score: calculatedScore, certId: undefined }));

      const finalScore = res?.score ?? calculatedScore;
      const certId = (res as any)?.certId;
      setResult({ score: finalScore, certId });

      if (finalScore >= 70) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10B981", "#1857FF", "#F59E0B"],
        });
      }

      setAttempts(await listMyAttempts().catch(() => []));
    } catch (err: any) {
      alert(err.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Technical Assessments & Certifications</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Test your production readiness. Score 70% or higher to earn an official SHA-256 verified certificate for your profile and resume.
        </p>
      </div>

      {!list.length ? (
        <div className="mt-6">
          <LoadingState label="Loading assessments..." />
        </div>
      ) : null}

      {/* Available Assessments Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => {
          const isSelected = active === a.id;
          return (
            <div
              key={a.id}
              className={`rounded-[18px] border p-5 transition-all ${
                isSelected
                  ? "border-accent bg-accent/5 shadow-xs"
                  : "border-line bg-paper hover:border-line/80 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="gz-kicker !text-[10px] text-accent">{a.kind}</span>
                <span className="text-xs font-mono text-mute">{a.duration_min} min</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold">{a.title}</h2>
              <p className="mt-2 text-xs text-ink-soft line-clamp-2 leading-relaxed">{a.summary}</p>

              <div className="mt-5 flex items-center justify-between pt-3 border-t border-line/60">
                <span className="text-xs font-mono text-mute">
                  {ASSESSMENT_BANKS[a.id]?.questions.length || a.questions} Questions
                </span>
                <button
                  type="button"
                  onClick={() => startAssessment(a.id)}
                  className={`gz-btn !min-h-8 !px-3 text-xs ${
                    isSelected ? "gz-btn-primary" : "gz-btn-ghost"
                  }`}
                >
                  {isSelected ? "Active Exam" : "Start Test →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Exam Form & Questions */}
      {current && (
        <div className="gz-panel rounded-[22px] p-6 sm:p-8 space-y-8 border-2 border-accent/20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="gz-kicker text-accent">Active Assessment Exam</span>
              <h2 className="mt-1 font-display text-3xl">{current.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{current.summary}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-paper-2 border border-line px-3 py-1 font-mono text-xs text-ink">
                Bar: 70% to Certify
              </span>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-xs text-mute hover:text-ink underline"
              >
                Close
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-8">
              {questions.map((q, qIndex) => {
                const selectedOpt = answers[qIndex];
                const showReview = result !== null;
                const isCorrect = selectedOpt === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`rounded-[18px] border p-5 sm:p-6 space-y-4 ${
                      showReview
                        ? isCorrect
                          ? "border-mint/60 bg-mint/5"
                          : "border-coral/60 bg-coral/5"
                        : "border-line bg-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-ink leading-snug">
                        <span className="font-mono text-xs text-mute mr-2">
                          Q{qIndex + 1}.
                        </span>
                        {q.prompt}
                      </h3>
                      {showReview && (
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isCorrect
                              ? "bg-mint/20 text-mint"
                              : "bg-coral/20 text-coral"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {q.codeSnippet && (
                      <pre className="rounded-[12px] bg-ink p-4 font-mono text-xs text-paper overflow-x-auto leading-relaxed">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* 4 Multi-Choice Option Buttons */}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {q.options.map((optText, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        const isTheCorrectOne = showReview && optIdx === q.correctIndex;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={showReview}
                            onClick={() => {
                              if (showReview) return;
                              setAnswers((prev) =>
                                prev.map((x, i) => (i === qIndex ? optIdx : x))
                              );
                            }}
                            className={`flex items-start gap-3 rounded-[14px] border p-3 text-left text-xs transition-all ${
                              isTheCorrectOne
                                ? "border-mint bg-mint/15 font-semibold text-ink"
                                : isChosen
                                  ? showReview
                                    ? "border-coral bg-coral/15 text-coral font-semibold"
                                    : "border-accent bg-accent/10 font-semibold text-accent shadow-xs"
                                  : "border-line bg-paper hover:bg-white text-ink-soft"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                                isChosen
                                  ? "bg-ink text-white"
                                  : "bg-line/70 text-ink-soft"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="mt-0.5 leading-relaxed">{optText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Question Technical Explanation */}
                    {showReview && (
                      <div className="rounded-[12px] border border-line/60 bg-paper p-3.5 text-xs leading-relaxed text-ink-soft">
                        <strong className="text-ink inline-flex items-center gap-1 mr-1">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Technical Rationale:</span>
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Exam Result & Verification Badge */}
            {result !== null ? (
              <div
                className={`rounded-[20px] border p-6 text-center space-y-4 ${
                  result.score >= 70
                    ? "border-mint/50 bg-mint/10 text-ink"
                    : "border-coral/50 bg-coral/10 text-ink"
                }`}
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white shadow-xs">
                  {result.score >= 70 ? (
                    <Trophy className="h-6 w-6 text-amber-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-3xl font-bold">
                    Score: {result.score}%
                  </h3>
                  <p className="mt-1 text-sm font-medium">
                    {result.score >= 70
                      ? "Congratulations! You passed the official bar."
                      : "Passing bar is 70%. Review the explanations above and retake when ready."}
                  </p>
                </div>

                {result.score >= 70 && (
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {result.certId ? (
                      <Link
                        to="/verify/$id"
                        params={{ id: result.certId }}
                        className="gz-btn gz-btn-primary text-xs"
                      >
                        View Verified Certificate ({result.certId}) →
                      </Link>
                    ) : (
                      <Link to="/app/certificates" className="gz-btn gz-btn-primary text-xs">
                        View Your Certificates Ledger →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => startAssessment(current.id)}
                      className="gz-btn gz-btn-ghost text-xs"
                    >
                      Retake Exam
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="gz-btn gz-btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="gz-btn gz-btn-primary"
                >
                  {submitting ? "Evaluating Answers..." : "Submit Assessment for Evaluation →"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Student Past Attempts History */}
      <div className="border-t border-line pt-8 space-y-4">
        <h2 className="font-display text-2xl">Your Assessment History</h2>
        {attempts.length === 0 ? (
          <EmptyState
            title="No prior exam attempts"
            body="Select any technical assessment above to test your skills and record your score."
          />
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-line bg-paper divide-y divide-line">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-xs text-mute">Completed · Status: Recorded</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${
                      a.score >= 70
                        ? "bg-mint/15 text-mint"
                        : "bg-coral/15 text-coral"
                    }`}
                  >
                    {a.score}%
                  </span>
                  {a.score >= 70 && (
                    <Link
                      to="/app/certificates"
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      View Certificate →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
