import { motion } from "motion/react";
import { StoryBeat, PacingArchetypeType } from "../types";
import { Zap, Heart, AlertOctagon, Sparkles, BookOpen, Skull } from "lucide-react";

interface PacingChartProps {
  beats: StoryBeat[];
  activeIndex: number;
  onSelectBeat: (index: number) => void;
  archetypeId: PacingArchetypeType;
}

export default function PacingChart({ beats, activeIndex, onSelectBeat, archetypeId }: PacingChartProps) {
  if (!beats || beats.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0a0a0a] glass p-6 text-center text-white/40">
        <div>
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-amber-500/80 stroke-[1.5]" />
          <p className="text-sm font-medium tracking-wide">Generate a pacing outline or load a recipe to build the tension blueprint.</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Ready to orchestrate your chapter curves</p>
        </div>
      </div>
    );
  }

  // Dimension helpers for the SVG viewport
  const paddingX = 40;
  const paddingY = 30;
  const width = 600;
  const height = 160;

  // Calculate coordinates for SVG
  const getCoords = () => {
    if (beats.length === 0) return [];
    const stepX = (width - paddingX * 2) / Math.max(1, beats.length - 1);
    
    return beats.map((beat, i) => {
      // x ranges from paddingX to width - paddingX
      const x = paddingX + i * stepX;
      // y ranges from height - paddingY (tension 0) to paddingY (tension 100)
      const y = height - paddingY - (beat.tensionLevel / 100) * (height - paddingY * 2);
      return { x, y, beat, index: i };
    });
  };

  const coords = getCoords();

  // Create SVG path string for line and ambient gradient filling
  const createPath = () => {
    if (coords.length === 0) return "";
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      // Standard linear interpolation
      d += ` L ${coords[i].x} ${coords[i].y}`;
    }
    return d;
  };

  const createAreaPath = () => {
    if (coords.length === 0) return "";
    let d = `M ${coords[0].x} ${height - paddingY}`;
    coords.forEach((coord) => {
      d += ` L ${coord.x} ${coord.y}`;
    });
    d += ` L ${coords[coords.length - 1].x} ${height - paddingY} Z`;
    return d;
  };

  const pathD = createPath();
  const areaD = createAreaPath();

  // Get corresponding icon based on beat type
  const getBeatIcon = (focusType: string, index: number) => {
    const size = "h-3.5 w-3.5";
    switch (focusType) {
      case "climax":
        return <Zap className={`${size} text-amber-500`} id={`beat-icon-climax-${index}`} />;
      case "clash":
        return <Skull className={`${size} text-rose-500`} id={`beat-icon-clash-${index}`} />;
      case "cozy":
        return <Heart className={`${size} text-pink-500`} id={`beat-icon-cozy-${index}`} />;
      case "revelation":
        return <Sparkles className={`${size} text-cyan-500`} id={`beat-icon-rev-${index}`} />;
      case "setup":
        return <BookOpen className={`${size} text-sky-400`} id={`beat-icon-setup-${index}`} />;
      default:
        return <AlertOctagon className={`${size} text-orange-400`} id={`beat-icon-esc-${index}`} />;
    }
  };

  const getBeatStyle = (focusType: string) => {
    switch (focusType) {
      case "climax":
        return "bg-amber-500/10 text-amber-300 border-amber-500/40";
      case "clash":
        return "bg-rose-500/10 text-rose-300 border-rose-500/40";
      case "cozy":
        return "bg-pink-500/10 text-pink-300 border-pink-500/40";
      case "revelation":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/40";
      case "setup":
        return "bg-sky-500/10 text-sky-300 border-sky-500/40";
      default:
        return "bg-orange-500/10 text-orange-300 border-orange-500/40";
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-2xl glass" id="pacing-chart-card">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Dynamic Tension Curve
          </h3>
          <p className="text-xs text-white/40">
            Interactive chart mapping story momentum from introduction to epic climax. Click chapters below or nodes on the curve.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-semibold text-white/40">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-450"></span>Setup</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400"></span>Escalation</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-400"></span>Cozy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400"></span>Revelation</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Clash</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span>Climax</span>
        </div>
      </div>

      {/* SVG graph container */}
      <div className="relative mb-6 overflow-hidden rounded-xl bg-black/60 border border-white/5 p-2" id="svg-graph-pane">
        {/* Subtle grid indicators */}
        <div className="absolute top-[30px] right-2 left-10 border-t border-dashed border-white/5">
          <span className="absolute -top-2 left-0 text-[8px] font-mono tracking-widest text-[#d97706] uppercase">MAX TENSION (100)</span>
        </div>
        <div className="absolute bottom-[30px] right-2 left-10 border-t border-dashed border-white/5">
          <span className="absolute -top-2 left-0 text-[8px] font-mono tracking-widest text-white/20 uppercase">LOW FRICTION (0)</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-sm select-none" id="tension-svg-canvas">
          <defs>
            <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#22d3ee" />
              <stop offset="75%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Fill Area Chart */}
          <motion.path
            initial={{ opacity: 0, d: `M ${coords[0]?.x || 0} ${height - paddingY}` }}
            animate={{ opacity: 1, d: areaD }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            fill="url(#gradient-area)"
            id="tension-area-fill"
          />

          {/* Baseline */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            id="tension-baseline-line"
          />

          {/* Stroke Line path */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            d={pathD}
            fill="none"
            stroke="url(#gradient-line)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            id="tension-curve-path"
          />

          {/* Vertical indicator for selected item */}
          {coords[activeIndex] && (
            <line
              x1={coords[activeIndex].x}
              y1={paddingY}
              x2={coords[activeIndex].x}
              y2={height - paddingY}
              stroke="#d97706"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
              id="selected-projector-line"
            />
          )}

          {/* Interactive Circle Nodes */}
          {coords.map((coord, i) => {
            const isActive = i === activeIndex;
            const nodeColor = 
              coord.beat.focusType === "climax" ? "#d97706" :
              coord.beat.focusType === "clash" ? "#f43f5e" :
              coord.beat.focusType === "cozy" ? "#ec4899" :
              coord.beat.focusType === "revelation" ? "#22d3ee" :
              coord.beat.focusType === "setup" ? "#38bdf8" : "#fb923c";

            return (
              <g key={i} className="cursor-pointer group" onClick={() => onSelectBeat(i)} id={`g-node-${i}`}>
                {/* Larger invisible touch targets */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="16"
                  fill="transparent"
                />

                {/* Pulsing ring for active node */}
                {isActive && (
                  <motion.circle
                    cx={coord.x}
                    cy={coord.y}
                    r="10"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    animate={{ r: [8, 14, 8], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                )}

                {/* Main node ring */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isActive ? "7" : "5"}
                  fill={isActive ? "#050505" : nodeColor}
                  stroke={isActive ? nodeColor : "#050505"}
                  strokeWidth="2.5"
                  className="transition-all duration-200 group-hover:scale-135"
                  id={`circle-node-core-${i}`}
                />

                {/* Brief Tension tooltip indicator */}
                <text
                  x={coord.x}
                  y={coord.y - 12}
                  textAnchor="middle"
                  className="text-[8px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 fill-white"
                >
                  {coord.beat.tensionLevel}%
                </text>

                {/* Chapter Number label underneath the axis */}
                <text
                  x={coord.x}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  className={`text-[9px] font-mono tracking-widest uppercase transition-colors duration-150 ${
                    isActive ? "fill-amber-500 font-bold" : "fill-white/30"
                  }`}
                >
                  C{coord.beat.chapterNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chapters Linear Track */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" id="chapters-linear-grid">
        {beats.map((beat, i) => {
          const isActive = i === activeIndex;
          const toneStyle = getBeatStyle(beat.focusType);

          return (
            <button
              key={i}
              onClick={() => onSelectBeat(i)}
              className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? "border-amber-600/60 bg-amber-600/5 text-amber-200 shadow-md shadow-amber-600/5"
                  : "border-white/5 bg-white/3 hover:bg-white/8 hover:border-white/10"
              }`}
              id={`chapter-item-btn-${i}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[8px] tracking-wider text-white/30 uppercase">
                  Ch {beat.chapterNumber}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] border font-semibold flex items-center gap-1 uppercase tracking-wider ${toneStyle}`}>
                  {getBeatIcon(beat.focusType, i)}
                  {beat.focusType}
                </span>
              </div>
              <p className="font-semibold text-white/90 truncate w-full" title={beat.title}>
                {beat.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-1.5">
                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-amber-500/80"
                    style={{ width: `${beat.tensionLevel}%` }}
                  ></div>
                </div>
                <span className="font-mono text-[8.5px] text-white/50 font-bold shrink-0">
                  {beat.tensionLevel}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
