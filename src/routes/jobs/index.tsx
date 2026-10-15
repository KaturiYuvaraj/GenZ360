import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { listJobs } from "@/lib/data/catalog";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/jobs/")({
  component: Jobs,
  head: () => ({
    meta: [
      { title: "Jobs — GenZ360" },
      { name: "description", content: "Find roles that match your verified skills, projects and assessments. India's talent-first job marketplace for Gen Z." },
    ],
  }),
});

const SKILLS_FILTER = ["All", "Coding", "AI", "UI/UX", "Testing", "Cloud"];
const LOCATION_FILTER = ["All", "Remote", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"];

const BADGE_COLORS: Record<string, string> = {
  Coding: "bg-accent/10 text-accent",
  AI: "bg-mint/10 text-mint",
  "UI/UX": "bg-coral/10 text-coral",
  Testing: "bg-amber-100 text-amber-700",
  Cloud: "bg-purple-100 text-purple-700",
  Marketing: "bg-pink-100 text-pink-700",
};

const SOURCES_FILTER = [
  { label: "All Sources", value: "All" },
  { label: "GenZ360", value: "genz360" },
  { label: "Greenhouse", value: "greenhouse" },
  { label: "Lever", value: "lever" },
  { label: "Ashby", value: "ashby" },
  { label: "Workable", value: "workable" },
  { label: "SmartRecruiters", value: "smartrecruiters" },
];

function getSourceBadge(source?: string, external?: boolean) {
  const s = (source || "genz360").toLowerCase();
  switch (s) {
    case "greenhouse":
      return <span className="rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">Greenhouse</span>;
    case "lever":
      return <span className="rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">Lever</span>;
    case "ashby":
      return <span className="rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold">Ashby</span>;
    case "workable":
      return <span className="rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold">Workable</span>;
    case "smartrecruiters":
      return <span className="rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">SmartRecruiters</span>;
    case "genz360":
    default:
      if (external) {
        return <span className="rounded-full bg-paper-2 text-ink-soft border border-line px-2 py-0.5 text-[10px] font-bold">Careers</span>;
      }
      return <span className="rounded-full bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 text-[10px] font-bold">GenZ360</span>;
  }
}

function Jobs() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listJobs>> | null>(null);

  useEffect(() => {
    listJobs({
      data: {
        q,
        category,
        source: sourceFilter !== "All" ? sourceFilter : undefined,
      },
    })
      .then(setRows)
      .catch(() => setRows([]));
  }, [q, category, sourceFilter]);

  const filtered = (rows ?? []).filter((j) => {
    if (locationFilter === "Remote" && !j.remote) return false;
    if (locationFilter !== "All" && locationFilter !== "Remote" && j.remote) return false;
    if (locationFilter !== "All" && locationFilter !== "Remote" && !j.location?.includes(locationFilter)) return false;
    return true;
  });

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">Careers & ATS Aggregator</p>
          <h1 className="gz-hero-title mt-3">Roles with a paper trail.</h1>
          <p className="mt-4 max-w-[50ch] text-base leading-relaxed text-ink-soft">
            Discover verified native postings and direct career openings aggregated across top ATS platforms (Greenhouse, Lever, Ashby, Workable & SmartRecruiters).
          </p>
        </motion.div>

        {/* Stats bar */}
        <div className="mt-8 grid grid-cols-2 gap-4 rounded-[18px] border border-line bg-paper p-5 sm:grid-cols-5 shadow-xs">
          {[
            { label: "Active roles", value: rows?.length ?? "—" },
            { label: "Companies", value: rows ? new Set(rows.map((j) => j.company)).size : "—" },
            { label: "Remote", value: rows ? rows.filter((j) => j.remote).length : "—" },
            { label: "Avg CTC", value: rows ? `${(rows.reduce((a, j) => a + (j.ctc_lpa || 0), 0) / (rows.filter(j => j.ctc_lpa).length || 1)).toFixed(1)} LPA` : "—" },
            { label: "ATS Sources", value: "6 Connected" },
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
            {SKILLS_FILTER.map((c) => (
              <button
                key={c}
                type="button"
                className={`gz-chip ${category === c ? "bg-ink text-paper" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-full border border-line bg-paper px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:outline-none"
            >
              {SOURCES_FILTER.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-full border border-line bg-paper px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:outline-none"
            >
              {LOCATION_FILTER.map((l) => (
                <option key={l} value={l}>{l === "All" ? "Any Location" : l}</option>
              ))}
            </select>

            {/* Search Input */}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search roles, companies, skills..."
              className="w-48 rounded-full border border-line bg-paper px-4 py-2 text-xs text-ink placeholder:text-mute focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="gz-wrap-wide pb-20 pt-6">
        {!rows ? <LoadingState label="Loading job board…" /> : null}
        {rows && filtered.length === 0 ? (
          <EmptyState title="No matching roles" body="Try adjusting your source, skill, or location filters." />
        ) : null}

        <div className="space-y-3">
          {filtered.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
            >
              <Link
                to="/jobs/$id"
                params={{ id: j.id }}
                className="group flex flex-col gap-4 rounded-[20px] border border-line bg-paper p-5 shadow-xs transition-all hover:shadow-[var(--shadow-lift)] hover:border-accent/30 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Role info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Company avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-line bg-paper-2 font-display text-lg font-bold text-ink group-hover:bg-accent/10 transition-colors">
                    {j.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors">
                        {j.role}
                      </p>
                      {getSourceBadge(j.source, j.external_job)}
                      {j.remote && (
                        <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-bold text-mint">
                          Remote
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-ink-soft">
                      {j.company}
                      {j.department ? ` · ${j.department}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {j.skills?.split(",").map((sk) => sk.trim()).filter(Boolean).map((sk) => (
                        <span
                          key={sk}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_COLORS[sk] ?? "bg-paper-2 text-ink-soft"}`}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: CTC + Location + CTA */}
                <div className="flex items-center gap-4 shrink-0 pl-15 sm:pl-0">
                  <div className="text-right">
                    {j.ctc_lpa ? (
                      <p className="font-display text-lg font-semibold text-accent">{j.ctc_lpa} LPA</p>
                    ) : (
                      <p className="font-display text-lg font-semibold text-ink-soft">Negotiable</p>
                    )}
                    <p className="text-xs text-mute">{j.remote ? "Remote" : (j.location ?? "On-site")}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                    →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* GenZ360 proof badge */}
        {filtered.length > 0 && (
          <div className="mt-10 rounded-[18px] border border-line bg-paper-2/60 p-5 text-sm text-ink-soft">
            <p className="font-display font-semibold text-ink inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>GenZ360 Verified Applications</span>
            </p>
            <p className="mt-1">
              Applications include your skill certificate ID, assessment score, and live project link. 
              Employers see proof — not just a PDF.{" "}
              <Link to="/skills" className="text-accent underline underline-offset-2">
                Build your profile →
              </Link>
            </p>
          </div>
        )}
      </section>
    </Page>
  );
}
