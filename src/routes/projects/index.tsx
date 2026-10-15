import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { listProjects } from "@/lib/data/catalog";

export const Route = createFileRoute("/projects/")({
  component: Projects,
  head: () => ({
    meta: [
      { title: "Live Projects — GenZ360" },
      { name: "description", content: "Join real-world agile sprint projects with employer briefs. Build, ship, and get certified. India's student sprint platform." },
    ],
  }),
});

const CATEGORY_STYLES: Record<string, string> = {
  Coding: "bg-accent/10 text-accent",
  AI: "bg-mint/10 text-mint",
  "UI/UX": "bg-coral/10 text-coral",
  Testing: "bg-amber-100 text-amber-700",
  Cloud: "bg-purple-100 text-purple-700",
};

function Projects() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProjects>> | null>(null);
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    listProjects().then(setRows).catch(() => setRows([]));
  }, []);

  const cats = ["All", ...Array.from(new Set((rows ?? []).map((p) => p.category)))];
  const filtered = catFilter === "All" ? (rows ?? []) : (rows ?? []).filter((p) => p.category === catFilter);

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">Live Sprints</p>
          <h1 className="gz-hero-title mt-3">
            Don't just build a resume.
            <br />Build something real.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-soft">
            Every sprint is a real employer brief. Ship production code with a student
            team, get reviewed, and add a verified GitHub contribution to your profile.
          </p>
        </motion.div>

        {/* Stats */}
        {rows && (
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-[18px] border border-line bg-paper p-5 shadow-xs sm:grid-cols-4">
            {[
              { label: "Active sprints", value: rows.length },
              { label: "Total seats open", value: rows.reduce((a, p) => a + (p.seats_open ?? 0), 0) },
              { label: "Companies", value: new Set(rows.map((p) => p.company)).size },
              { label: "Avg team size", value: Math.round(rows.reduce((a, p) => a + p.team_size, 0) / rows.length) + " members" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-semibold tabular-nums">{s.value}</p>
                <p className="gz-kicker mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Filter chips */}
      <section className="gz-wrap-wide sticky top-[62px] z-20 bg-paper/90 backdrop-blur-sm pb-4 pt-2 border-b border-line">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={`gz-chip ${catFilter === c ? "bg-ink text-paper" : ""}`}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="gz-wrap-wide pb-20 pt-6">
        {!rows ? <LoadingState label="Loading sprint workspaces…" /> : null}
        {rows && filtered.length === 0 ? (
          <EmptyState title="No projects in this category" body="New sprints usually land on Monday." />
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.38 }}
            >
              <Link
                to="/projects/$id"
                params={{ id: p.id }}
                className="group gz-panel flex flex-col gap-4 rounded-[24px] p-6 shadow-xs hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="gz-kicker text-coral">{p.company}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_STYLES[p.category] ?? "bg-paper-2 text-ink-soft"}`}
                      >
                        {p.category}
                      </span>
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.03em] group-hover:text-accent transition-colors">
                      {p.title}
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-line bg-paper-2 font-display text-base font-bold text-ink group-hover:bg-accent/10 transition-colors">
                    {p.company.charAt(0)}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-ink-soft">{p.summary}</p>

                {/* Metadata grid */}
                <dl className="grid grid-cols-4 gap-3 rounded-[14px] border border-line bg-paper p-3 text-xs">
                  <div>
                    <dt className="text-mute">Team</dt>
                    <dd className="mt-0.5 font-medium">{p.team_size} members</dd>
                  </div>
                  <div>
                    <dt className="text-mute">Sprint</dt>
                    <dd className="mt-0.5 font-mono tabular-nums">
                      {String(p.sprint_current).padStart(2, "0")}/{String(p.sprint_total).padStart(2, "0")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-mute">Tasks</dt>
                    <dd className="mt-0.5 font-mono tabular-nums">{p.tasks_done}/{p.tasks_total}</dd>
                  </div>
                  <div>
                    <dt className="text-mute">Mentor</dt>
                    <dd className="mt-0.5 truncate">{p.mentor}</dd>
                  </div>
                </dl>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-mute mb-1.5">
                    <span className="font-medium text-ink">{p.skills}</span>
                    <span className="tabular-nums font-mono">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  {p.seats_open > 0 ? (
                    <span className="rounded-full bg-mint/10 px-2.5 py-1 font-bold text-mint">
                      {p.seats_open} seats open
                    </span>
                  ) : (
                    <span className="rounded-full bg-paper-3 px-2.5 py-1 font-bold text-mute">Full</span>
                  )}
                  <span className="flex items-center gap-1 font-semibold text-accent group-hover:gap-2 transition-all">
                    View sprint <span>→</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* How sprints work */}
        {filtered.length > 0 && (
          <div className="mt-12 rounded-[20px] border border-line bg-paper-2/60 p-6">
            <h3 className="font-display text-xl font-semibold">How sprints work</h3>
            <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
              {[
                { step: "01", title: "Join a team", desc: "Apply to a sprint with your skill certificate. Get matched to a 3-5 student squad." },
                { step: "02", title: "Ship in 2 weeks", desc: "Work on a real employer brief with daily stand-ups, a mentor and GitHub reviews." },
                { step: "03", title: "Get certified", desc: "Completion adds the project to your GenZ360 profile. Certificate links to the merged PR." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span className="font-mono text-xs text-mute shrink-0 mt-0.5">{s.step}</span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-xs text-ink-soft leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Page>
  );
}
