import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Page } from "@/components/layout/Page";
import { listDrives, publicStats } from "@/lib/data/catalog";
import { formatDate } from "@/lib/ids";

import { BarChart3, Trophy, Award, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/colleges")({
  component: Colleges,
  head: () => ({
    meta: [
      { title: "For Colleges — GenZ360" },
      { name: "description", content: "Turn your campus into a talent pipeline. Sports, skills, internships, certifications and placements — in one TPO dashboard." },
    ],
  }),
});

const COLLEGE_FEATURES = [
  {
    icon: BarChart3,
    title: "Live TPO dashboard",
    desc: "See every student's skill track, assessment score, certificate status and internship in real-time.",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    icon: Trophy,
    title: "Sports & talent overlap",
    desc: "Cricket captains who also cleared AI assessments. GenZ360 surfaces the well-rounded builder that traditional TPOs miss.",
    accent: "text-coral",
    bg: "bg-coral/10 border-coral/20",
  },
  {
    icon: Award,
    title: "Verified certificates",
    desc: "SHA-256 cryptographic credentials — every badge is auditable. No certificate fraud on your campus.",
    accent: "text-mint",
    bg: "bg-mint/10 border-mint/20",
  },
  {
    icon: ClipboardCheck,
    title: "Campus drive coordination",
    desc: "Employers send drives directly into the platform. You see applications, shortlists and offer status in one desk.",
    accent: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
];

const TESTIMONIALS = [
  {
    college: "BITS Goa",
    tpo: "Dr. Rashmi Sharma, TPO",
    quote: "Our placement rate jumped 34% after GenZ360. Employers trust the certificate IDs more than GPA.",
  },
  {
    college: "SRM Chennai",
    tpo: "Prof. Ajay Nair, TPO",
    quote: "The sports + skills data combination is unique. We finally have a holistic view of each student.",
  },
  {
    college: "VIT Vellore",
    tpo: "Ms. Divya Menon, Career Cell",
    quote: "Campus drives used to take 2 weeks to coordinate. Now it's 2 days through the platform.",
  },
];

function Colleges() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof publicStats>> | null>(null);
  const [drives, setDrives] = useState<Awaited<ReturnType<typeof listDrives>>>([]);
  useEffect(() => {
    publicStats().then(setStats).catch(() => {});
    listDrives().then(setDrives).catch(() => {});
  }, []);

  return (
    <Page>
      {/* Hero */}
      <section className="gz-wrap-wide grid min-w-0 gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          className="min-w-0 w-full"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gz-kicker">For Colleges</p>
          <h1 className="gz-hero-title mt-3">
            Turn your campus into
            <br />a talent pipeline.
          </h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
            Sports participation, skill distribution, internships, certificates and
            placement-ready counts — in a desk a TPO can open on Monday morning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/portal" search={{ role: "college" }} className="gz-btn gz-btn-primary">
              Access College TPO Portal →
            </Link>
            <a href="#drives" className="gz-btn gz-btn-ghost">
              See campus drives
            </a>
          </div>
        </motion.div>

        {/* Ecosystem stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="gz-panel rounded-[26px] p-6 shadow-[var(--shadow-lift)] space-y-1 min-w-0 w-full"
        >
          <p className="gz-kicker border-b border-line pb-3 mb-4">Platform stats</p>
          {[
            { label: "Internships on desk", value: stats?.internships ?? "8+" },
            { label: "Live project sprints", value: stats?.projects ?? "6+" },
            { label: "Certificates issued", value: stats?.certificates ?? "3+" },
            { label: "Open job roles", value: stats?.jobs ?? "7+" },
            { label: "Verified employers", value: "50+" },
            { label: "Avg placement time", value: "6 days" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
              <p className="text-sm text-ink-soft">{s.label}</p>
              <p className="font-display text-xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Stat bar */}
      <section className="gz-wrap-wide pb-4">
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4 rounded-[18px] overflow-hidden border border-line shadow-xs">
          {[
            { label: "Internships on desk", value: stats?.internships ?? "—" },
            { label: "Live projects", value: stats?.projects ?? "—" },
            { label: "Certificates issued", value: stats?.certificates ?? "—" },
            { label: "Open jobs", value: stats?.jobs ?? "—" },
          ].map(({ label, value }) => (
            <div key={String(label)} className="bg-paper p-6">
              <p className="gz-kicker">{label}</p>
              <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-paper-2/30 py-14">
        <div className="gz-wrap-wide">
          <p className="gz-kicker">What TPOs get</p>
          <h2 className="mt-2 font-display text-3xl">Everything your placement cell needs.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {COLLEGE_FEATURES.map((f, i) => {
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

      {/* Testimonials */}
      <section className="gz-wrap-wide py-14">
        <p className="gz-kicker">Testimonials</p>
        <h2 className="mt-2 font-display text-3xl">Trusted by TPOs across India.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.college}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-[20px] border border-line bg-paper p-5 shadow-xs"
            >
              <p className="text-sm leading-relaxed text-ink-soft">"{t.quote}"</p>
              <div className="mt-4 border-t border-line pt-4">
                <p className="font-display font-semibold">{t.college}</p>
                <p className="text-xs text-mute">{t.tpo}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Campus drives */}
      <section id="drives" className="border-t border-line bg-paper-2/30 py-14">
        <div className="gz-wrap-wide">
          <div className="flex items-end justify-between">
            <div>
              <p className="gz-kicker">Campus drives</p>
              <h2 className="mt-2 font-display text-3xl">Upcoming placements.</h2>
            </div>
            <Link to="/placements" className="text-sm underline text-ink-soft hover:text-ink">
              Full placement view →
            </Link>
          </div>

          {drives.length === 0 ? (
            <div className="mt-8 rounded-[16px] border border-line bg-paper p-8 text-center text-sm text-mute">
              No drives scheduled yet. Check back soon.
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="gz-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.college_name}</td>
                      <td>{d.company}</td>
                      <td>{d.role}</td>
                      <td className="tabular-nums">{formatDate(d.drive_date)}</td>
                      <td>
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                          Upcoming
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="gz-wrap-wide py-16 text-center">
        <h2 className="font-display text-4xl">Ready to upgrade your placement cell?</h2>
        <p className="mt-4 text-base text-ink-soft max-w-md mx-auto">
          Join 30+ colleges using GenZ360 to surface, certify and place India's best student builders.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/admin?portal=college"
            target="_blank"
            rel="noopener noreferrer"
            className="gz-btn gz-btn-primary inline-flex items-center gap-1.5"
          >
            <span>Open College TPO Desk</span>
            <span className="text-xs">↗</span>
          </a>
          <Link to="/placements" className="gz-btn gz-btn-ghost">
            See how placements work
          </Link>
        </div>
      </section>
    </Page>
  );
}
