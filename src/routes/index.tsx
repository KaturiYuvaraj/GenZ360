import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Layers,
  Flame,
  ShieldCheck,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Page } from "@/components/layout/Page";
import { TalentCanvas } from "@/components/three/TalentCanvas";
import { ECOSYSTEM, rupees } from "@/lib/ids";
import { listGrounds, listInternships, listProjects, publicStats } from "@/lib/data/catalog";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "GenZ360 — India's Youth Talent & Career Ecosystem" },
      {
        name: "description",
        content:
          "Play, learn, build, get certified, get hired. One ecosystem for India's students, colleges and employers.",
      },
    ],
  }),
});

const COMPOUNDING_STAGES = [
  {
    step: "01",
    title: "Learn",
    subtitle: "Mental Models",
    desc: "Interactive modules rooted in real production codebases & architecture.",
    tag: "120+ Modules",
    color: "#1857FF",
    icon: BookOpen,
    href: "/skills",
    action: "Curriculum",
  },
  {
    step: "02",
    title: "Build",
    subtitle: "Live Sprints",
    desc: "Ship features inside collaborative team sprint workspaces with live tickets.",
    tag: "Agile Sprints",
    color: "#E85A3C",
    icon: Layers,
    href: "/projects",
    action: "Workspaces",
  },
  {
    step: "03",
    title: "Practice",
    subtitle: "Timed Arena",
    desc: "Benchmark mastery with 30-min timed challenges & automated test runners.",
    tag: "70% Cutoff",
    color: "#818CF8",
    icon: Flame,
    href: "/skills",
    action: "Challenges",
  },
  {
    step: "04",
    title: "Certify",
    subtitle: "SHA-256 Ledger",
    desc: "Cryptographically verifiable credentials proven with unique hashes.",
    tag: "Instant Verify",
    color: "#10B981",
    icon: ShieldCheck,
    href: "/certificates",
    action: "Verify Proof",
  },
  {
    step: "05",
    title: "Hired",
    subtitle: "Direct Pipeline",
    desc: "Fast-track interview pipelines and direct referrals to 40+ partners.",
    tag: "Direct Referrals",
    color: "#F59E0B",
    icon: Briefcase,
    href: "/jobs",
    action: "Open Roles",
  },
];

function Home() {
  const [stats, setStats] = useState({
    grounds: 6,
    internships: 8,
    projects: 6,
    jobs: 7,
    tournaments: 5,
    certificates: 3,
  });
  const [grounds, setGrounds] = useState<Awaited<ReturnType<typeof listGrounds>>>([]);
  const [interns, setInterns] = useState<Awaited<ReturnType<typeof listInternships>>>([]);
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listProjects>>>([]);

  useEffect(() => {
    publicStats().then(setStats).catch(() => {});
    listGrounds({ data: {} }).then(setGrounds).catch(() => {});
    listInternships({ data: {} }).then(setInterns).catch(() => {});
    listProjects().then(setProjects).catch(() => {});
  }, []);

  return (
    <Page>
      <section className="gz-wrap-wide grid min-w-0 items-center gap-8 pb-6 pt-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-10 lg:pt-4">
        <div className="min-w-0 w-full">
          <p className="gz-kicker">GenZ360</p>
          <p className="mt-2 text-sm tracking-[0.16em] text-mute uppercase">
            Youth talent ecosystem
          </p>
          <h1 className="gz-hero-title mt-6">
            Your talent
            <br />
            has more than
            <br />
            one direction.
          </h1>
          <p className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-ink-soft">
            One ecosystem to play, build real-world skills, gain experience, get
            certified and connect with your next opportunity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ecosystem" className="gz-btn gz-btn-primary">
              Explore GenZ360
            </a>
            <Link to="/join" className="gz-btn gz-btn-ghost">
              Join as a student
            </Link>
          </div>
        </div>
        <div className="min-w-0 w-full lg:min-h-[520px]">
          <TalentCanvas stats={stats} />
        </div>
      </section>

      <section id="ecosystem" className="mt-20 border-y border-line bg-white">
        <div className="gz-wrap-wide py-20">
          <p className="gz-kicker">The map</p>
          <h2 className="gz-section-title mt-3 max-w-[12ch]">
            One platform. Six directions. One journey.
          </h2>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {ECOSYSTEM.map((item, i) => (
              <Link
                key={item.id}
                to={item.href}
                className="group grid gap-4 py-7 md:grid-cols-[88px_180px_1fr_auto] md:items-baseline"
              >
                <span className="font-mono text-xs text-mute">0{i + 1}</span>
                <span className="font-display text-2xl tracking-[-0.04em] group-hover:text-accent">
                  {item.label}
                </span>
                <span className="max-w-xl text-ink-soft">{item.copy}</span>
                <span className="gz-kicker group-hover:text-accent">{item.kicker} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="gz-wrap-wide mt-24 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[22px]">
          <img
            src="/images/sports-play.jpg"
            alt="College cricket in golden hour"
            className="h-full min-h-[420px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-paper">
            <p className="gz-kicker !text-paper/70">Sports</p>
            <h2 className="mt-2 font-display text-4xl tracking-[-0.04em]">
              Play beyond the classroom.
            </h2>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <p className="max-w-[36ch] text-lg text-ink-soft">
            Box cricket, college leagues, corporate cups, weekend opens. Grounds
            with real slots — not a forwarded screenshot.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {(grounds.slice(0, 4).length ? grounds.slice(0, 4) : []).map((g) => (
              <li key={g.id} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <span>
                  <span className="block font-medium">{g.name}</span>
                  <span className="text-mute">
                    {g.locality}, {g.city}
                  </span>
                </span>
                <span className="tabular-nums">{rupees(g.price_per_hour)}/hr</span>
              </li>
            ))}
          </ul>
          <Link to="/sports/box-cricket" className="gz-btn gz-btn-primary mt-8 self-start">
            Book a ground
          </Link>
        </div>
      </section>

      <section className="mt-24 bg-ink text-paper">
        <div className="gz-wrap-wide grid gap-10 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <p className="gz-kicker !text-paper/60">Skills · The Compounding Engine</p>
              </div>
              <h2 className="gz-section-title mt-4">
                Build skills that compound.
              </h2>
              <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-paper/70">
                Every skill on GenZ360 is a path, not a playlist: learn → build →
                practice → certify → get hired.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/skills" className="gz-btn gz-btn-accent">
                  Open the skill map
                </Link>
                <Link
                  to="/projects"
                  className="gz-btn border border-paper/20 text-paper hover:bg-paper/10 transition-colors"
                >
                  Browse sprints
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-paper/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-paper/70">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Zero tutorial hell</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>SHA-256 Ledger</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>40+ Hiring partners</span>
              </div>
            </div>
          </div>

          <ol className="grid gap-px bg-paper/15 sm:grid-cols-2 lg:grid-cols-5 rounded-[20px] overflow-hidden border border-paper/15 shadow-xl">
            {COMPOUNDING_STAGES.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.step} className="group relative bg-ink last:sm:col-span-2 last:lg:col-span-1">
                  <Link
                    to={s.href}
                    className="flex h-full flex-col justify-between p-4 sm:p-5 transition-all duration-300 hover:bg-paper/[0.04]"
                  >
                    {/* Top colored accent bar on hover */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: s.color }}
                    />

                    <div>
                      {/* Step Header: number + indicator dot */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-paper/40 group-hover:text-paper/80 transition-colors">
                          {s.step}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-125 shadow-xs"
                          style={{ backgroundColor: s.color }}
                        />
                      </div>

                      {/* Icon Tile */}
                      <div
                        className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-paper/5 border border-paper/10 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: s.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Stage Name & Subtitle */}
                      <p className="mt-4 font-display text-xl font-bold tracking-tight text-paper group-hover:text-white">
                        {s.title}
                      </p>
                      <p
                        className="mt-0.5 text-[10px] font-mono uppercase tracking-wider font-medium"
                        style={{ color: s.color }}
                      >
                        {s.subtitle}
                      </p>

                      {/* Descriptive Summary */}
                      <p className="mt-2.5 text-xs leading-relaxed text-paper/65 group-hover:text-paper/85 transition-colors">
                        {s.desc}
                      </p>
                    </div>

                    {/* Bottom Deliverables & Link */}
                    <div className="mt-5 border-t border-paper/10 pt-3">
                      <span className="inline-block rounded-full bg-paper/10 px-2 py-0.5 text-[10px] font-mono text-paper/80">
                        {s.tag}
                      </span>
                      <div
                        className="mt-3 flex items-center gap-1 text-xs font-medium transition-transform duration-200 group-hover:translate-x-1"
                        style={{ color: s.color }}
                      >
                        <span>{s.action}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="gz-wrap-wide mt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="gz-kicker">Live projects</p>
            <h2 className="gz-section-title mt-3 max-w-[16ch]">
              Don't just build a resume. Build something real.
            </h2>
          </div>
          <Link to="/projects" className="gz-btn gz-btn-ghost">
            All workspaces
          </Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {projects.slice(0, 2).map((p) => (
            <Link
              key={p.id}
              to="/projects/$id"
              params={{ id: p.id }}
              className="gz-panel rounded-[22px] p-6"
            >
              <p className="gz-kicker">{p.company}</p>
              <h3 className="mt-2 font-display text-3xl tracking-[-0.04em]">{p.title}</h3>
              <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-mute">Team</dt>
                  <dd className="tabular-nums">{p.team_size} members</dd>
                </div>
                <div>
                  <dt className="text-mute">Sprint</dt>
                  <dd className="tabular-nums">
                    {String(p.sprint_current).padStart(2, "0")} / {String(p.sprint_total).padStart(2, "0")}
                  </dd>
                </div>
                <div>
                  <dt className="text-mute">Progress</dt>
                  <dd className="tabular-nums">{p.progress}%</dd>
                </div>
              </dl>
              <div className="gz-progress mt-4">
                <span style={{ width: `${p.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gz-wrap-wide mt-24 grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="gz-kicker">Internships</p>
          <h2 className="gz-section-title mt-3">Don't just learn. Work.</h2>
          <p className="mt-4 text-ink-soft">
            Filter by skill, city, stipend. Apply once — then watch the status
            move.
          </p>
          <Link to="/internships" className="gz-btn gz-btn-primary mt-8">
            Internship desk
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="gz-table min-w-[640px]">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Where</th>
                <th>Stipend</th>
              </tr>
            </thead>
            <tbody>
              {interns.slice(0, 5).map((i) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.company}</td>
                  <td>{i.role}</td>
                  <td>{i.remote ? "Remote" : i.location}</td>
                  <td className="tabular-nums">{rupees(i.stipend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-24 border-y border-line">
        <div className="gz-wrap-wide grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="gz-kicker">Certification</p>
            <h2 className="gz-section-title mt-3">Proof of what you can do.</h2>
            <p className="mt-4 max-w-[40ch] text-ink-soft">
              Every certificate has an ID. Anyone — a recruiter, a college, a
              parent — can open /verify and see it.
            </p>
            <Link to="/certificates" className="gz-btn gz-btn-ghost mt-8">
              Certificate studio
            </Link>
          </div>
          <div className="gz-cert rounded-[6px] p-8 md:p-10">
            <p className="gz-kicker">Certificate ID · GZ360-9F2C18</p>
            <p className="mt-8 font-display text-4xl tracking-[-0.04em]">
              Ananya Krishnan
            </p>
            <p className="mt-2 text-ink-soft">Live Project — AI Recruitment Desk</p>
            <div className="mt-10 flex justify-between text-xs text-mute">
              <span>Skill · Applied AI</span>
              <span>Verified</span>
            </div>
          </div>
        </div>
      </section>

      <section className="gz-wrap-wide mt-24 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="gz-kicker">Placement</p>
          <h2 className="gz-section-title mt-3">
            From preparation
            <br />
            to placement.
          </h2>
          <ol className="mt-8 space-y-0">
            {["Resume", "Assessment", "Project", "Profile", "Interview", "Hired"].map(
              (step, i, arr) => (
                <li key={step} className="flex gap-4">
                  <span className="flex w-6 flex-col items-center">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] text-paper">
                      {i + 1}
                    </span>
                    {i < arr.length - 1 ? <span className="h-8 w-px bg-line" /> : null}
                  </span>
                  <span className="pt-0.5 font-display text-xl">{step}</span>
                </li>
              ),
            )}
          </ol>
        </div>
        <div className="relative overflow-hidden rounded-[22px]">
          <img
            src="/images/build-studio.jpg"
            alt="Students collaborating in a bright studio"
            className="h-full min-h-[420px] w-full object-cover"
          />
        </div>
      </section>

      <section className="gz-wrap-wide mt-24 grid gap-px bg-line md:grid-cols-2">
        <Link to="/employers" className="bg-paper p-8 md:p-12">
          <p className="gz-kicker">Employers</p>
          <h2 className="mt-3 font-display text-4xl tracking-[-0.04em]">
            Talent is more than a resume.
          </h2>
          <p className="mt-4 max-w-[40ch] text-ink-soft">
            See skills, live projects, certificates and assessments before you
            shortlist.
          </p>
        </Link>
        <Link to="/colleges" className="bg-white p-8 md:p-12">
          <p className="gz-kicker">Colleges</p>
          <h2 className="mt-3 font-display text-4xl tracking-[-0.04em]">
            Turn your campus into a talent pipeline.
          </h2>
          <p className="mt-4 max-w-[40ch] text-ink-soft">
            Students, internships, certified, placement-ready — as numbers a
            TPO can defend.
          </p>
        </Link>
      </section>
    </Page>
  );
}
