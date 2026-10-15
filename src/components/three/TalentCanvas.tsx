import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

const Icons = {
  skills: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  sports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l4.24 4.24" />
      <path d="M14.83 9.17l4.24-4.24" />
      <path d="M14.83 14.83l4.24 4.24" />
      <path d="M9.17 14.83l-4.24 4.24" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  internships: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  projects: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  certs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  place: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const NODES = [
  { id: "skills",      label: "Skills",        href: "/skills",       stat: "6 tracks",  substat: "AI · React · Cloud", desc: "Build skills that compound",  accent: "#1857FF", bg: "rgba(24,87,255,0.07)",   border: "rgba(24,87,255,0.2)",   span: "col-span-2" },
  { id: "sports",      label: "Sports",        href: "/sports",       stat: "6 grounds", substat: "Box Cricket",        desc: "Play beyond the classroom",    accent: "#E85A3C", bg: "rgba(232,90,60,0.07)",   border: "rgba(232,90,60,0.2)",   span: "col-span-1 row-span-2" },
  { id: "internships", label: "Internships",   href: "/internships",  stat: "8 open",    substat: "₹8K–25K/mo",         desc: "Don't just learn. Work.",       accent: "#1F8A5B", bg: "rgba(31,138,91,0.07)",   border: "rgba(31,138,91,0.2)",   span: "col-span-1" },
  { id: "projects",    label: "Live Sprints",  href: "/projects",     stat: "6 open",    substat: "Employer briefs",    desc: "Ship something real",           accent: "#7C3AED", bg: "rgba(124,58,237,0.07)",  border: "rgba(124,58,237,0.2)",  span: "col-span-1" },
  { id: "certs",       label: "Certificates",  href: "/certificates", stat: "SHA-256",   substat: "Verifiable",         desc: "Proof employers trust",         accent: "#C9A227", bg: "rgba(201,162,39,0.07)",  border: "rgba(201,162,39,0.2)",  span: "col-span-1" },
  { id: "place",       label: "Placements",    href: "/placements",   stat: "7 roles",   substat: "6-day avg hiring",   desc: "Skill → cert → hired",         accent: "#14161A", bg: "rgba(20,22,26,0.05)",    border: "rgba(20,22,26,0.15)",   span: "col-span-2" },
] as const;

type NodeId = typeof NODES[number]["id"];

function useCounter(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

interface TalentCanvasProps {
  stats?: {
    grounds?: number;
    internships?: number;
    projects?: number;
    jobs?: number;
    certificates?: number;
  };
}

function StatsRow({ stats }: { stats?: TalentCanvasProps["stats"] }) {
  const g = useCounter(stats?.grounds ?? 6);
  const i = useCounter(stats?.internships ?? 8);
  const j = useCounter(stats?.jobs ?? 7);
  const c = useCounter(stats?.certificates ?? 3);
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-xl border w-full min-w-0" style={{ borderColor: "rgba(20,22,26,0.1)", background: "rgba(255,252,247,0.8)" }}>
      {[{ l: "Grounds", v: g }, { l: "Internships", v: i }, { l: "Open roles", v: j }, { l: "Certificates", v: c }].map((s, i) => (
        <div key={s.l} className="flex flex-col items-center py-2.5 sm:py-3.5 px-1 min-w-0 text-center" style={{ borderRight: i < 3 ? "1px solid rgba(20,22,26,0.1)" : "none" }}>
          <span className="font-display font-bold tabular-nums text-xl sm:text-2xl" style={{ color: "#1857FF" }}>{s.v}</span>
          <span className="truncate w-full block text-[8px] sm:text-[9px] tracking-wider uppercase text-mute">{s.l}</span>
        </div>
      ))}
    </div>
  );
}

export function TalentCanvas({ stats }: TalentCanvasProps = {}) {
  const [hovered, setHovered] = useState<NodeId | null>(null);

  return (
    <div className="w-full min-w-0 max-w-full flex flex-col gap-2">
      <StatsRow stats={stats} />

      {/* ── Desktop bento grid (hidden on mobile) ── */}
      <div className="hidden lg:grid grid-cols-3 auto-rows-[148px] gap-2.5">
        {NODES.map((n) => {
          const isOn = hovered === n.id;
          const Icon = Icons[n.id];
          return (
            <Link
              key={n.id}
              to={n.href}
              className={`${n.span} relative flex flex-col justify-between overflow-hidden rounded-[18px] border p-4 transition-all duration-200`}
              style={{
                background: isOn ? n.bg : "rgba(255,252,247,0.5)",
                borderColor: isOn ? n.border : "rgba(20,22,26,0.09)",
                boxShadow: isOn ? `0 4px 20px -4px ${n.accent}28` : "none",
                transform: isOn ? "translateY(-1px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHovered(n.id as NodeId)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{ background: isOn ? n.bg : "rgba(20,22,26,0.05)", color: isOn ? n.accent : "#6a717c", border: `1.5px solid ${isOn ? n.border : "rgba(20,22,26,0.09)"}`, transition: "all 0.2s" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {(Icons[n.id] as any).props.children}
                  </svg>
                </div>
                <span className="rounded-full px-2.5 py-1 font-mono font-bold" style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", background: isOn ? n.bg : "rgba(20,22,26,0.05)", color: isOn ? n.accent : "#6a717c" }}>
                  {n.stat}
                </span>
              </div>
              <div>
                <p className="font-display font-semibold leading-snug" style={{ fontSize: 15, color: "#14161A" }}>{n.desc}</p>
                <p style={{ fontSize: 11, color: "#6a717c", marginTop: 3 }}>{n.substat}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Mobile horizontal scroll strip (hidden on desktop) ── */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 w-full min-w-0 max-w-full" style={{ scrollbarWidth: "none" }}>
        {NODES.map((n) => {
          const Icon = Icons[n.id];
          return (
            <Link
              key={n.id}
              to={n.href}
              className="flex shrink-0 flex-col gap-2 rounded-[14px] border p-3"
              style={{ width: 130, background: "rgba(255,252,247,0.7)", borderColor: "rgba(20,22,26,0.1)" }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: n.bg, color: n.accent, border: `1px solid ${n.border}` }}>
                {Icon}
              </div>
              <div>
                <p className="font-display font-semibold" style={{ fontSize: 11, color: "#14161A", lineHeight: 1.3 }}>{n.desc}</p>
                <p style={{ fontSize: 9, color: "#6a717c", marginTop: 2 }}>{n.substat}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="hidden lg:block text-center" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9aa0aa" }}>
        One ecosystem · Play · Learn · Build · Get hired
      </p>
    </div>
  );
}
