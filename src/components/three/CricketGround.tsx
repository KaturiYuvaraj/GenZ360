'use client';

import { useState } from "react";
import { Lightbulb, Compass, ShieldCheck, Sparkles, Layers, Trophy } from "lucide-react";

export function CricketGround() {
  const [pitchSurface, setPitchSurface] = useState<"turf" | "red_soil" | "matting">("turf");
  const [floodlightsOn, setFloodlightsOn] = useState(true);
  const [activeZone, setActiveZone] = useState<string>("center");

  const surfaceColors = {
    turf: {
      pitch: "#d7c29a",
      pitchBorder: "#c4ae83",
      field: "#1f6b42",
      fieldAccent: "#267a4d",
      crease: "#F3F0E8",
    },
    red_soil: {
      pitch: "#bf5f38",
      pitchBorder: "#aa4f2b",
      field: "#2b6b47",
      fieldAccent: "#327a52",
      crease: "#F3F0E8",
    },
    matting: {
      pitch: "#3a738a",
      pitchBorder: "#2f6074",
      field: "#1f6b42",
      fieldAccent: "#267a4d",
      crease: "#F3F0E8",
    },
  };

  const currentColors = surfaceColors[pitchSurface];

  return (
    <div
      className={`relative h-[440px] w-full overflow-hidden rounded-[22px] border border-line transition-colors duration-500 shadow-sm select-none ${
        floodlightsOn
          ? "bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617]"
          : "bg-gradient-to-b from-[#FAF8F5] via-[#F4F0E8] to-[#E5DFD1]"
      }`}
    >
      {/* Top Overlay Badge & Controls */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1 text-xs text-white backdrop-blur-md shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
            Interactive Box Turf Simulator
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Surface Selector */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/20 p-0.5 backdrop-blur-md text-xs text-white">
            <button
              type="button"
              onClick={() => setPitchSurface("turf")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                pitchSurface === "turf" ? "bg-white text-ink font-bold shadow-xs" : "hover:text-white/80"
              }`}
            >
              Box Turf
            </button>
            <button
              type="button"
              onClick={() => setPitchSurface("red_soil")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                pitchSurface === "red_soil" ? "bg-white text-ink font-bold shadow-xs" : "hover:text-white/80"
              }`}
            >
              Red Soil
            </button>
            <button
              type="button"
              onClick={() => setPitchSurface("matting")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                pitchSurface === "matting" ? "bg-white text-ink font-bold shadow-xs" : "hover:text-white/80"
              }`}
            >
              Astroturf
            </button>
          </div>

          {/* Floodlights Toggle */}
          <button
            type="button"
            onClick={() => setFloodlightsOn(!floodlightsOn)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
              floodlightsOn
                ? "bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                : "bg-white/80 border-line text-ink hover:bg-white"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>{floodlightsOn ? "Lights: ON" : "Lights: DAY"}</span>
          </button>
        </div>
      </div>

      {/* Floodlight Beam Effects when ON */}
      {floodlightsOn && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -left-12 w-96 h-96 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute -top-12 -right-12 w-96 h-96 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
      )}

      {/* 2.5D Isometric Pitch SVG Visualizer */}
      <div className="relative h-full w-full flex items-center justify-center pt-8">
        <svg
          viewBox="0 0 900 480"
          className="w-full h-full max-h-[360px] drop-shadow-2xl transition-all duration-500"
          style={{
            transform: "perspective(800px) rotateX(24deg) scale(0.95)",
          }}
        >
          <defs>
            {/* Arena Turf Gradient */}
            <linearGradient id="turf-outfield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentColors.fieldAccent} />
              <stop offset="100%" stopColor={currentColors.field} />
            </linearGradient>

            {/* Pitch Gradient */}
            <linearGradient id="pitch-strip" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentColors.pitch} />
              <stop offset="100%" stopColor={currentColors.pitchBorder} />
            </linearGradient>

            {/* Net pattern */}
            <pattern id="arena-net" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 0 16 L 16 0 M 0 0 L 16 16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Enclosed Cage Boundary & Outfield */}
          <rect
            x="60"
            y="40"
            width="780"
            height="400"
            rx="50"
            fill="url(#turf-outfield)"
            stroke={floodlightsOn ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"}
            strokeWidth="4"
          />

          {/* Netting Overlay */}
          <rect x="60" y="40" width="780" height="400" rx="50" fill="url(#arena-net)" />

          {/* Boundary Line */}
          <rect
            x="90"
            y="65"
            width="720"
            height="350"
            rx="40"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            strokeDasharray="12 6"
          />

          {/* Bowling & Batting Crease Markings */}
          {/* Pitch Strip in Center */}
          <rect
            x="380"
            y="95"
            width="140"
            height="290"
            rx="6"
            fill="url(#pitch-strip)"
            stroke={currentColors.pitchBorder}
            strokeWidth="2"
            className="cursor-pointer hover:opacity-95"
            onClick={() => setActiveZone("pitch")}
          />

          {/* Pitch Creases */}
          {/* Top Bowler's Crease */}
          <line x1="390" y1="130" x2="510" y2="130" stroke={currentColors.crease} strokeWidth="3" />
          <line x1="425" y1="130" x2="425" y2="110" stroke={currentColors.crease} strokeWidth="2" />
          <line x1="475" y1="130" x2="475" y2="110" stroke={currentColors.crease} strokeWidth="2" />
          {/* Top Stumps */}
          <circle cx="440" cy="115" r="3" fill="#FFFFFF" />
          <circle cx="450" cy="115" r="3" fill="#FFFFFF" />
          <circle cx="460" cy="115" r="3" fill="#FFFFFF" />
          <line x1="438" y1="115" x2="462" y2="115" stroke="#FFFFFF" strokeWidth="2" />

          {/* Bottom Batter's Crease */}
          <line x1="390" y1="350" x2="510" y2="350" stroke={currentColors.crease} strokeWidth="3" />
          <line x1="425" y1="350" x2="425" y2="370" stroke={currentColors.crease} strokeWidth="2" />
          <line x1="475" y1="350" x2="475" y2="370" stroke={currentColors.crease} strokeWidth="2" />
          {/* Bottom Stumps */}
          <circle cx="440" cy="365" r="3" fill="#FFFFFF" />
          <circle cx="450" cy="365" r="3" fill="#FFFFFF" />
          <circle cx="460" cy="365" r="3" fill="#FFFFFF" />
          <line x1="438" y1="365" x2="462" y2="365" stroke="#FFFFFF" strokeWidth="2" />

          {/* 6-a-side Player Positioning Markers */}
          {/* Bowler */}
          <g className="cursor-pointer" onClick={() => setActiveZone("bowler")}>
            <circle cx="450" cy="80" r="10" fill="#1857FF" stroke="#FFFFFF" strokeWidth="2" />
            <text x="450" y="84" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">B</text>
          </g>

          {/* Striker */}
          <g className="cursor-pointer" onClick={() => setActiveZone("striker")}>
            <circle cx="450" cy="390" r="10" fill="#E85A3C" stroke="#FFFFFF" strokeWidth="2" />
            <text x="450" y="394" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">S</text>
          </g>

          {/* Wicketkeeper */}
          <g className="cursor-pointer" onClick={() => setActiveZone("keeper")}>
            <circle cx="450" cy="425" r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="450" y="428" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">WK</text>
          </g>

          {/* Fielders */}
          <circle cx="240" cy="200" r="7" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="660" cy="200" r="7" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="220" cy="330" r="7" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="680" cy="330" r="7" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Floodlight Towers at 4 corners */}
          {/* Top Left Tower */}
          <g>
            <circle cx="70" cy="50" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="70" cy="50" r="8" fill={floodlightsOn ? "#FDE68A" : "#64748B"} />
          </g>
          {/* Top Right Tower */}
          <g>
            <circle cx="830" cy="50" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="830" cy="50" r="8" fill={floodlightsOn ? "#FDE68A" : "#64748B"} />
          </g>
          {/* Bottom Left Tower */}
          <g>
            <circle cx="70" cy="430" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="70" cy="430" r="8" fill={floodlightsOn ? "#FDE68A" : "#64748B"} />
          </g>
          {/* Bottom Right Tower */}
          <g>
            <circle cx="830" cy="430" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="830" cy="430" r="8" fill={floodlightsOn ? "#FDE68A" : "#64748B"} />
          </g>
        </svg>
      </div>

      {/* Bottom Turf Information Pill */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-3 text-xs pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 px-3 py-1.5 text-white backdrop-blur-md shadow-xs">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-medium">Arena Dimensions: 120ft × 65ft · 6-to-8 a-side · Netted Roof</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/15 px-3 py-1.5 text-white/90 backdrop-blur-md shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Fitted with Bowling Machine & LED High-Bay Lamps</span>
        </div>
      </div>
    </div>
  );
}
