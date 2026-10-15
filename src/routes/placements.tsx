import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { listJobs, listDrives, publicStats } from "@/lib/data/catalog";
import { rupees, formatDate } from "@/lib/ids";

import { BookOpen, Rocket, BarChart3, Award, UserCheck, Target } from "lucide-react";

export const Route = createFileRoute("/placements")({
  component: Placements,
  head: () => ({
    meta: [
      { title: "Placements — GenZ360" },
      { name: "description", content: "From skill to offer — the full placement journey. Resume, assessment, project, profile, interview, hired." },
    ],
  }),
});

const STEPS = [
  {
    step: "01",
    title: "Build your Skill",
    desc: "Start with a structured learning track. Each module builds real production depth.",
    href: "/skills",
    icon: BookOpen,
    accent: "text-accent border-accent/20 bg-accent/5",
    iconColor: "text-accent",
  },
  {
    step: "02",
    title: "Ship live projects",
    desc: "Join a team sprint on a real employer brief. Your GitHub contribution stays on your profile forever.",
    href: "/projects",
    icon: Rocket,
    accent: "text-coral border-coral/20 bg-coral/5",
    iconColor: "text-coral",
  },
  {
    step: "03",
    title: "Pass the Assessment",
    desc: "18-question timed test per skill. A percentile score that employers actually trust.",
    href: "/app/assessments",
    icon: BarChart3,
    accent: "text-mint border-mint/20 bg-mint/5",
    iconColor: "text-mint",
  },
  {
    step: "04",
    title: "Get Certified",
    desc: "SHA-256 verifiable digital credential. Paste the certificate ID and employers can verify in seconds.",
    href: "/certificates",
    icon: Award,
    accent: "text-accent border-accent/20 bg-accent/5",
    iconColor: "text-accent",
  },
  {
    step: "05",
    title: "Build your Profile",
    desc: "Skills, projects, assessments, certificates, sports — one URL employers see before the call.",
    href: "/app/profile",
    icon: UserCheck,
    accent: "text-coral border-coral/20 bg-coral/5",
    iconColor: "text-coral",
  },
  {
    step: "06",
    title: "Get Hired",
    desc: "Employers shortlist and schedule interviews through GenZ360. You get a notification. Status moves.",
    href: "/jobs",
    icon: Target,
    accent: "text-mint border-mint/20 bg-mint/5",
    iconColor: "text-mint",
  },
];

const SUCCESS_STORIES = [
  { name: "Priya S.", role: "Frontend Engineer at Razorpay", ctc: "12 LPA", path: "React track → 2 sprints → 91% score → hired in 9 days" },
  { name: "Arjun M.", role: "AI Engineer at Sarvam AI", ctc: "15 LPA", path: "AI track → Sprint team lead → 89% score → fast-tracked" },
  { name: "Kavya R.", role: "QA Engineer at Zepto", ctc: "8 LPA", path: "Testing track → 1 sprint → 76% score → campus offer" },
];

function Placements() {
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof listJobs>>>([]);
  const [drives, setDrives] = useState<Awaited<ReturnType<typeof listDrives>>>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof publicStats>> | null>(null);

  useEffect(() => {
    listJobs({ data: {} }).then(setJobs).catch(() => {});
    listDrives().then(setDrives).catch(() => {});
    publicStats().then(setStats).catch(() => {});
  }, []);

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide grid gap-12 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">Placements</p>
          <h1 className="gz-hero-title mt-3">
            From first skill
            <br />
            to first offer.
          </h1>
          <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
            The last mile isn't a job board taped onto a college website. It's the
            same ecosystem you already played and built in — now getting you hired.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/skills" className="gz-btn gz-btn-primary">
              Start your journey
            </Link>
            <Link to="/jobs" className="gz-btn gz-btn-ghost">
              Browse open roles
            </Link>
          </div>
        </motion.div>

        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="gz-panel rounded-[26px] p-6 shadow-[var(--shadow-lift)] space-y-4"
        >
          <p className="gz-kicker">Ecosystem by numbers</p>
          {[
            { label: "Open jobs", value: stats?.jobs ?? jobs.length },
            { label: "Internship openings", value: stats?.internships ?? "8+" },
            { label: "Live projects", value: stats?.projects ?? "6+" },
            { label: "Certificates issued", value: stats?.certificates ?? "3+" },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline justify-between border-b border-line pb-3 last:border-0 last:pb-0">
              <p className="text-sm text-ink-soft">{s.label}</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 6-step journey */}
      <section className="border-t border-line bg-paper-2/30 py-14">
        <div className="gz-wrap-wide">
          <p className="gz-kicker">The journey</p>
          <h2 className="mt-2 font-display text-3xl">Six steps from zero to hired.</h2>
          <p className="mt-2 text-sm text-ink-soft max-w-[55ch]">
            Every step is connected — your progress in one section automatically strengthens your profile for the next.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    to={s.href}
                    className={`group flex flex-col gap-3 rounded-[20px] border p-5 shadow-xs transition-all hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 ${s.accent}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-white/90 shadow-2xs border border-line/60">
                        <StepIcon className={`h-6 w-6 ${s.iconColor}`} />
                      </div>
                      <span className="font-mono text-xs text-mute">{s.step}</span>
                    </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{s.desc}</p>
                  </div>
                  <span className="mt-auto text-xs font-semibold transition-colors group-hover:text-ink">
                    Go to {s.title} →
                  </span>
                </Link>
              </motion.div>
            );
          })}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="gz-wrap-wide py-14">
        <p className="gz-kicker">Stories</p>
        <h2 className="mt-2 font-display text-3xl">Students who made the jump.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SUCCESS_STORIES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-[20px] border border-line bg-paper p-5 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-paper">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-semibold">{s.name}</p>
                  <p className="text-xs text-ink-soft">{s.role}</p>
                </div>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-mint">{s.ctc}</p>
              <p className="mt-2 text-xs text-mute leading-relaxed">{s.path}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Campus drives */}
      {drives.length > 0 && (
        <section className="border-t border-line bg-paper-2/30 py-14">
          <div className="gz-wrap-wide">
            <div className="flex items-end justify-between">
              <div>
                <p className="gz-kicker">Campus</p>
                <h2 className="mt-2 font-display text-3xl">Upcoming drives.</h2>
              </div>
              <Link to="/colleges" className="text-sm underline text-ink-soft hover:text-ink">
                For colleges →
              </Link>
            </div>
            <div className="mt-8 overflow-x-auto">
              <table className="gz-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.college_name}</td>
                      <td>{d.company}</td>
                      <td>{d.role}</td>
                      <td className="tabular-nums">{formatDate(d.drive_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Open roles */}
      <section className="gz-wrap-wide pb-20 pt-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="gz-kicker">Open roles</p>
            <h2 className="mt-2 font-display text-3xl">Ready to apply?</h2>
          </div>
          <Link to="/jobs" className="text-sm underline text-ink-soft hover:text-ink">
            Full job board →
          </Link>
        </div>
        <div className="mt-8 space-y-2">
          {jobs.slice(0, 5).map((j) => (
            <Link
              key={j.id}
              to="/jobs/$id"
              params={{ id: j.id }}
              className="group flex items-center justify-between rounded-[16px] border border-line bg-paper px-5 py-4 shadow-xs hover:shadow-[var(--shadow-lift)] hover:border-accent/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper-2 font-display font-bold text-ink">
                  {j.company.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-base font-semibold group-hover:text-accent transition-colors">{j.role}</p>
                  <p className="text-xs text-ink-soft">{j.company} · {j.remote ? "Remote" : j.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {j.ctc_lpa && (
                  <p className="font-display text-base font-semibold text-accent tabular-nums hidden sm:block">{j.ctc_lpa} LPA</p>
                )}
                <span className="text-mute group-hover:text-ink transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Page>
  );
}
