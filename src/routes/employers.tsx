import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { listProjects, listJobs } from "@/lib/data/catalog";

import { Award, BarChart3, Rocket, Trophy } from "lucide-react";

export const Route = createFileRoute("/employers")({
  component: Employers,
  head: () => ({
    meta: [
      { title: "For Employers — GenZ360" },
      { name: "description", content: "Search India's most verified student talent by skill certificates, assessment scores, live sprint projects and sports leadership. Hire faster." },
    ],
  }),
});

const FEATURES = [
  {
    icon: Award,
    title: "Certificate-verified talent",
    desc: "Every candidate has a SHA-256 verifiable skill certificate. Not a claim — a cryptographic proof.",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    icon: BarChart3,
    title: "Assessment score on profile",
    desc: "18-question timed assessments per skill track. See exact percentile — not a self-reported '5/10 in React'.",
    accent: "text-mint",
    bg: "bg-mint/10 border-mint/20",
  },
  {
    icon: Rocket,
    title: "Live sprint portfolio",
    desc: "Every student has shipped real code in team sprints. You can inspect the GitHub PR — not just a portfolio PDF.",
    accent: "text-coral",
    bg: "bg-coral/10 border-coral/20",
  },
  {
    icon: Trophy,
    title: "Sports leadership signal",
    desc: "Team captains, tournament winners — sports data co-maps with technical skill, surfacing well-rounded builders.",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Post a role", desc: "List your JD. Specify required skills, CTC and timeline." },
  { step: "02", title: "Smart candidate match", desc: "GenZ360 surfaces certified candidates who cleared assessments in your required skill." },
  { step: "03", title: "Inspect proof", desc: "View certificate ID, assessment score, sprint project and sports record side-by-side." },
  { step: "04", title: "Shortlist & interview", desc: "One click to schedule. Student is notified. No agency, no fluff." },
  { step: "05", title: "Hire with confidence", desc: "Track offer acceptance, onboarding timeline and college confirmation in one desk." },
];

const MOCK_CANDIDATES = [
  { name: "Ananya Krishnan", role: "Product Engineer", skills: ["React", "AI", "Testing"], score: 91, cert: "GZ360-9F2C18", sports: "Cricket Captain" },
  { name: "Vikram Chauhan", role: "Frontend Developer", skills: ["React", "UI/UX"], score: 87, cert: "GZ360-4B1E09", sports: "—" },
  { name: "Sara Merchant", role: "Backend Platform", skills: ["Node.js", "Cloud"], score: 79, cert: "GZ360-2D7A3F", sports: "Badminton" },
];

function Employers() {
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listProjects>>>([]);
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof listJobs>>>([]);
  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
    listJobs({ data: {} }).then(setJobs).catch(() => {});
  }, []);

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide grid min-w-0 gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          className="min-w-0 w-full"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">For Employers</p>
          <h1 className="gz-hero-title mt-3">
            Hire India's most
            <br />
            verified Gen Z talent.
          </h1>
          <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
            Filter by skill, read the certificate ID, inspect the live project sprint,
            see the assessment score — then shortlist. No resume padding.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/portal" search={{ role: "employer" }} className="gz-btn gz-btn-primary">
              Access Recruiter Portal →
            </Link>
            <Link to="/app/candidates" className="gz-btn gz-btn-ghost">
              Browse candidates
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-10 flex flex-wrap gap-5">
            {[
              { value: jobs.length || "7+", label: "Open roles live" },
              { value: "100%", label: "Certificate verified" },
              { value: "6 days", label: "Avg time to hire" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="font-display text-3xl font-semibold">{s.value}</span>
                <span className="gz-kicker mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Candidate preview card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="gz-panel rounded-[26px] p-6 space-y-0 shadow-[var(--shadow-lift)] min-w-0 w-full"
        >
          <div className="flex items-center justify-between border-b border-line pb-4">
            <p className="gz-kicker">Candidate shortlist</p>
            <span className="rounded-full bg-mint/10 px-3 py-0.5 text-[10px] font-bold text-mint">Live preview</span>
          </div>
          <ul className="divide-y divide-line">
            {MOCK_CANDIDATES.map((c) => (
              <li key={c.name} className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 font-display text-base font-bold text-ink">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base font-semibold">{c.name}</p>
                      <span className="font-mono text-xs font-bold text-mint">{c.score}%</span>
                    </div>
                    <p className="text-xs text-ink-soft">{c.role}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.skills.map((sk) => (
                        <span key={sk} className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">
                          {sk}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-mute">
                      Cert: {c.cert} · {c.sports}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-4">
            <Link to="/join" className="gz-btn gz-btn-primary w-full text-center">
              Access full talent pool →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-paper-2/30 py-14">
        <div className="gz-wrap-wide">
          <div className="max-w-xl">
            <p className="gz-kicker">Why GenZ360</p>
            <h2 className="mt-2 font-display text-3xl">Evidence-first hiring.</h2>
            <p className="mt-2 text-sm text-ink-soft">
              The traditional hiring funnel rewards resume writers. GenZ360 surfaces the builders.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="rounded-[20px] border border-line bg-paper p-5 shadow-xs"
                >
                  <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${f.bg} ${f.accent}`}>
                    <FeatureIcon className="h-5 w-5" />
                  </div>
                  <h3 className={`mt-4 font-display text-xl font-semibold ${f.accent}`}>{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="gz-wrap-wide py-14">
        <p className="gz-kicker">Process</p>
        <h2 className="mt-2 font-display text-3xl">From JD to hired in 5 steps.</h2>
        <div className="mt-10 grid gap-px bg-line md:grid-cols-5 rounded-[18px] overflow-hidden border border-line shadow-xs">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="bg-paper p-5">
              <span className="font-mono text-xs text-mute">{s.step}</span>
              <p className="mt-3 font-display text-base font-semibold">{s.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Sprints (projects) */}
      <section className="border-t border-line bg-paper-2/30 py-14">
        <div className="gz-wrap-wide">
          <div className="flex items-end justify-between">
            <div>
              <p className="gz-kicker">Live sprints</p>
              <h2 className="mt-2 font-display text-3xl">Students shipping real code — now.</h2>
            </div>
            <Link to="/projects" className="text-sm underline text-ink-soft hover:text-ink">
              All projects →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {projects.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="group rounded-[20px] border border-line bg-paper p-5 shadow-xs hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all"
              >
                <p className="gz-kicker text-coral">{p.company}</p>
                <p className="mt-2 font-display text-xl font-semibold group-hover:text-accent transition-colors">{p.title}</p>
                <p className="mt-1 text-xs text-ink-soft line-clamp-2">{p.summary}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-mute mb-1.5">
                    <span>{p.skills}</span>
                    <span className="tabular-nums">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/60">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-mute">{p.team_size} students · Sprint {p.sprint_current}/{p.sprint_total}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gz-wrap-wide py-16 text-center">
        <h2 className="font-display text-4xl">Ready to hire differently?</h2>
        <p className="mt-4 text-base text-ink-soft max-w-md mx-auto">
          Join 50+ companies using GenZ360 to find proof-verified talent across India's colleges.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/admin?portal=employer"
            target="_blank"
            rel="noopener noreferrer"
            className="gz-btn gz-btn-primary inline-flex items-center gap-1.5"
          >
            <span>Open Recruiter Desk</span>
            <span className="text-xs">↗</span>
          </a>
          <Link to="/app/candidates" className="gz-btn gz-btn-ghost">
            Browse talent pool
          </Link>
        </div>
      </section>
    </Page>
  );
}
