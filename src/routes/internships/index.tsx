import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { listInternships } from "@/lib/data/catalog";
import { rupees, formatDate } from "@/lib/ids";
import { Globe, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/internships/")({
  component: Internships,
  head: () => ({
    meta: [
      { title: "Internships — GenZ360" },
      { name: "description", content: "Paid internships for India's students — filtered by skill, verified by assessment. Don't just learn, work." },
    ],
  }),
});

const CATS = ["All", "Coding", "AI", "UI/UX", "Testing", "Digital Marketing", "Cloud"];

const CATEGORY_GRADIENT: Record<string, string> = {
  Coding: "from-accent/10 to-accent/5 border-accent/20",
  AI: "from-mint/10 to-mint/5 border-mint/20",
  "UI/UX": "from-coral/10 to-coral/5 border-coral/20",
  Testing: "from-amber-100/80 to-amber-50 border-amber-200",
  Cloud: "from-purple-100/80 to-purple-50 border-purple-200",
  "Digital Marketing": "from-pink-100/80 to-pink-50 border-pink-200",
};

const CATEGORY_TEXT: Record<string, string> = {
  Coding: "text-accent",
  AI: "text-mint",
  "UI/UX": "text-coral",
  Testing: "text-amber-700",
  Cloud: "text-purple-700",
  "Digital Marketing": "text-pink-600",
};

function Internships() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [remote, setRemote] = useState(false);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listInternships>> | null>(null);

  useEffect(() => {
    listInternships({ data: { q, category, remote: remote || undefined } })
      .then(setRows)
      .catch(() => setRows([]));
  }, [q, category, remote]);

  const avgStipend = rows && rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.stipend, 0) / rows.length)
    : null;

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">Internships</p>
          <h1 className="gz-hero-title mt-3">Don't just learn. Work.</h1>
          <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-ink-soft">
            Real companies, real stipends, real experience. Every internship is
            matched to a skill track — your certificate is your application.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 rounded-[18px] border border-line bg-paper p-5 shadow-xs sm:grid-cols-4">
          {[
            { label: "Open roles", value: rows?.length ?? "—" },
            { label: "Avg stipend/mo", value: avgStipend ? rupees(avgStipend) : "—" },
            { label: "Remote roles", value: rows ? rows.filter((r) => r.remote).length : "—" },
            { label: "Verified employers", value: rows ? new Set(rows.map((r) => r.company)).size : "—" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="gz-kicker mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="gz-wrap-wide sticky top-[62px] z-20 bg-paper/90 backdrop-blur-sm pb-4 pt-2 border-b border-line">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                className={`gz-chip ${category === c ? "bg-ink text-paper" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              className={`gz-chip inline-flex items-center gap-1.5 ${remote ? "bg-ink text-paper" : ""}`}
              onClick={() => setRemote((v) => !v)}
            >
              <Globe className="h-3 w-3" />
              <span>Remote</span>
            </button>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Role, company, skill…"
            className="w-56 rounded-full border border-line bg-paper px-4 py-2 text-xs text-ink placeholder:text-mute focus:border-accent focus:outline-none"
          />
        </div>
      </section>

      {/* Listings */}
      <section className="gz-wrap-wide pb-20 pt-6">
        {!rows ? <LoadingState label="Loading internships…" /> : null}
        {rows && rows.length === 0 ? (
          <EmptyState title="No internships found" body="Widen the filters or check back next week." />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {rows?.map((r, i) => {
            const catGrad = CATEGORY_GRADIENT[r.category] ?? "from-paper-2 to-paper border-line";
            const catText = CATEGORY_TEXT[r.category] ?? "text-ink-soft";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <Link
                  to="/internships/$id"
                  params={{ id: r.id }}
                  className={`group flex flex-col gap-4 rounded-[22px] border bg-gradient-to-br p-5 shadow-xs transition-all hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 ${catGrad}`}
                >
                  {/* Top: company + category badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white font-display text-base font-bold text-ink">
                        {r.company.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors leading-tight">
                          {r.role}
                        </p>
                        <p className="text-sm text-ink-soft">{r.company}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold font-mono ${catText} bg-white/60 border border-white/80`}>
                      {r.category}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {r.skills?.split(",").map((sk) => sk.trim()).filter(Boolean).map((sk) => (
                      <span key={sk} className="rounded-full bg-white/70 border border-line/60 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                        {sk}
                      </span>
                    ))}
                    {r.remote && (
                      <span className="rounded-full bg-mint/10 border border-mint/20 px-2 py-0.5 text-[10px] font-bold text-mint">
                        Remote
                      </span>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="grid grid-cols-3 gap-3 rounded-[12px] bg-white/60 p-3 text-xs">
                    <div>
                      <p className="gz-kicker text-[9px]">Stipend</p>
                      <p className="mt-0.5 font-display text-base font-semibold tabular-nums text-mint">
                        {rupees(r.stipend)}/mo
                      </p>
                    </div>
                    <div>
                      <p className="gz-kicker text-[9px]">Duration</p>
                      <p className="mt-0.5 font-medium">{r.duration}</p>
                    </div>
                    <div>
                      <p className="gz-kicker text-[9px]">Deadline</p>
                      <p className="mt-0.5 font-medium tabular-nums">{formatDate(r.deadline)}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mute">{r.remote ? "Remote" : r.location}</span>
                    <span className="flex items-center gap-1 font-semibold text-accent group-hover:gap-2 transition-all">
                      Apply now <span>→</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Hint for proof-based applications */}
        {rows && rows.length > 0 && (
          <div className="mt-12 rounded-[18px] border border-line bg-paper-2/60 p-5">
            <p className="font-display text-lg font-semibold inline-flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              <span>Apply with your GenZ360 proof</span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Your assessment score + skill certificate is auto-attached when you apply. No cover letter needed.{" "}
              <Link to="/skills" className="text-accent underline underline-offset-2">
                Get certified →
              </Link>
            </p>
          </div>
        )}
      </section>
    </Page>
  );
}
