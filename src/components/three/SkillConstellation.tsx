'use client';

import { useEffect, useRef, useState } from 'react';
import { Laptop, Code2, Target, Award, Trophy, Sparkles } from 'lucide-react';

export interface StageNode {
  step: string;
  title: string;
  subtitle: string;
  pos: [number, number, number];
  color: string;
}

export const STAGE_NODES: StageNode[] = [
  { step: '01', title: 'LEARN', subtitle: 'Curriculum & Mental Models', pos: [-4.0, 0.4, 0], color: '#1857FF' },
  { step: '02', title: 'BUILD', subtitle: 'Production Sprint Tasks', pos: [-2.0, -0.5, 0.4], color: '#E85A3C' },
  { step: '03', title: 'PRACTICE', subtitle: 'Timed Assessments', pos: [0, 0.7, 0], color: '#818CF8' },
  { step: '04', title: 'CERTIFY', subtitle: 'Verifiable SHA-256 Ledger', pos: [2.0, -0.4, 0.4], color: '#10B981' },
  { step: '05', title: 'GET HIRED', subtitle: 'Fast-Track Interviews', pos: [4.0, 0.5, 0], color: '#F59E0B' },
];

const NODE_ICONS: Record<string, typeof Laptop> = {
  '01': Laptop,
  '02': Code2,
  '03': Target,
  '04': Award,
  '05': Trophy,
};

export function SkillConstellation({
  activeStep,
  onSelectStep,
}: {
  activeStep: string;
  onSelectStep: (step: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeIconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [pathD, setPathD] = useState<string>('');

  // Dynamically calculate smooth SVG curve passing through all 5 stage nodes
  const updatePath = () => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < STAGE_NODES.length; i++) {
      const el = nodeIconRefs.current[i];
      if (!el) return;
      const r = el.getBoundingClientRect();
      points.push({
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      });
    }

    if (points.length !== 5) return;

    // Responsive wave amplitude
    const waveHeight = containerRect.width < 640 ? 12 : 22;

    // Connect node 0 -> node 1 -> node 2 -> node 3 -> node 4
    const d = [
      `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`,
      `Q ${((points[0].x + points[1].x) / 2).toFixed(1)} ${(((points[0].y + points[1].y) / 2) - waveHeight).toFixed(1)}, ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`,
      `Q ${((points[1].x + points[2].x) / 2).toFixed(1)} ${(((points[1].y + points[2].y) / 2) + waveHeight).toFixed(1)}, ${points[2].x.toFixed(1)} ${points[2].y.toFixed(1)}`,
      `Q ${((points[2].x + points[3].x) / 2).toFixed(1)} ${(((points[2].y + points[3].y) / 2) - waveHeight).toFixed(1)}, ${points[3].x.toFixed(1)} ${points[3].y.toFixed(1)}`,
      `Q ${((points[3].x + points[4].x) / 2).toFixed(1)} ${(((points[3].y + points[4].y) / 2) + waveHeight).toFixed(1)}, ${points[4].x.toFixed(1)} ${points[4].y.toFixed(1)}`,
    ].join(' ');

    setPathD(d);
  };

  useEffect(() => {
    updatePath();
    const frameId = requestAnimationFrame(() => {
      updatePath();
    });

    const container = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updatePath();
      });
      ro.observe(container);
    }

    const onResize = () => updatePath();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Background animated cosmic starfield (Hi-DPI aware, crisp rendering)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = canvas.offsetWidth || 800;
    let height = canvas.offsetHeight || 340;

    const setupCanvas = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      width = canvas.offsetWidth || 800;
      height = canvas.offsetHeight || 340;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Generate crisp celestial stars
    const stars = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.8,
      alpha: Math.random() * 0.5 + 0.3,
      speed: Math.random() * 0.02 + 0.01,
    }));

    let t = 0;
    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render crisp, sharp twinkling celestial stars
      for (const s of stars) {
        const pulse = Math.sin(t + s.x) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(24, 87, 255, ${s.alpha * pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[340px] w-full overflow-hidden rounded-[22px] border border-line bg-gradient-to-br from-[#FAF8F5] via-[#F4F0E8] to-[#EAE4D6] shadow-[var(--shadow-lift)] select-none"
    >
      {/* Dynamic Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-line bg-white/90 px-3.5 py-1 text-xs backdrop-blur-sm shadow-xs">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span className="gz-kicker !text-[10px] text-ink font-semibold">
          Skill Compounding Constellation
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 text-xs text-mute bg-white/80 border border-line px-3 py-1 rounded-full backdrop-blur-sm">
        <Sparkles className="h-3 w-3 text-accent" />
        <span>Click stage node to inspect curriculum</span>
      </div>

      {/* Razor-Sharp Connecting SVG Dotted Line across all 5 nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-1">
        <defs>
          <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1857FF" stopOpacity="1" />
            <stop offset="25%" stopColor="#E85A3C" stopOpacity="1" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="1" />
            <stop offset="75%" stopColor="#10B981" stopOpacity="1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
          </linearGradient>
        </defs>
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#orbit-grad)"
            strokeWidth="3.5"
            strokeDasharray="0 11"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Interactive Constellation Stage Nodes */}
      <div className="relative z-10 h-full w-full flex items-center justify-between px-6 sm:px-14">
        {STAGE_NODES.map((node, idx) => {
          const isSelected = activeStep === node.step;
          const isHovered = hoveredStep === node.step;
          const Icon = NODE_ICONS[node.step] || Laptop;

          return (
            <button
              key={node.step}
              type="button"
              onClick={() => onSelectStep(node.step)}
              onMouseEnter={() => setHoveredStep(node.step)}
              onMouseLeave={() => setHoveredStep(null)}
              className="group relative flex flex-col items-center focus:outline-hidden transition-all duration-300 cursor-pointer"
            >
              {/* Node Icon Static Wrapper for Accurate Anchor Coordinates */}
              <div
                ref={(el) => {
                  nodeIconRefs.current[idx] = el;
                }}
                className="relative flex items-center justify-center"
              >
                {/* Crisp Active/Hover Selection Ring (no blurry halos or expanding pings) */}
                <div
                  className={`absolute -inset-2 rounded-2xl transition-all duration-200 pointer-events-none ${
                    isSelected
                      ? "opacity-100 border-2"
                      : isHovered
                      ? "opacity-60 border"
                      : "opacity-0"
                  }`}
                  style={{
                    borderColor: isSelected ? node.color : `${node.color}50`,
                    backgroundColor: isSelected ? `${node.color}0D` : "transparent",
                  }}
                />

                {/* Node Circular Sphere Icon */}
                <div
                  className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-xs ${
                    isSelected
                      ? "scale-105 shadow-md -translate-y-1.5"
                      : isHovered
                      ? "scale-102 -translate-y-0.5 shadow-xs"
                      : "scale-100 hover:shadow-xs"
                  }`}
                  style={{
                    backgroundColor: isSelected ? node.color : "#FFFFFF",
                    borderColor: isSelected ? "#FFFFFF" : node.color,
                    boxShadow: isSelected
                      ? `0 8px 16px -4px ${node.color}40`
                      : undefined,
                  }}
                >
                  <Icon
                    className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors duration-200 ${
                      isSelected ? "text-white" : ""
                    }`}
                    style={{ color: isSelected ? "#FFFFFF" : node.color }}
                  />

                  {/* Step Chip Tag */}
                  <span
                    className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs"
                    style={{
                      backgroundColor: isSelected ? "#FFFFFF" : node.color,
                      color: isSelected ? node.color : "#FFFFFF",
                      borderColor: isSelected ? node.color : "#FFFFFF",
                    }}
                  >
                    {node.step}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle Card */}
              <div className="mt-3.5 text-center transition-all duration-200">
                <p
                  className={`font-display text-xs sm:text-sm font-bold tracking-tight uppercase ${
                    isSelected ? "text-ink font-extrabold" : "text-ink-soft group-hover:text-ink"
                  }`}
                >
                  {node.title}
                </p>
                <p className="hidden md:block text-[11px] text-mute max-w-[14ch] leading-tight mt-0.5">
                  {node.subtitle}
                </p>
              </div>

              {/* Active Marker Arrow */}
              {isSelected && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shadow-xs"
                  style={{ backgroundColor: node.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-line/60">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{
            width: `${((parseInt(activeStep, 10) || 1) / 5) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
