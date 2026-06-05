"use client";

// Shared dashboard visualization primitives — count-up numbers, an interactive
// animated area chart (draw-in + hover crosshair/tooltip), and an animated donut.
// Used across the investor dashboard pages for a consistent, premium feel.

import { useEffect, useId, useRef, useState } from "react";
import { motion, animate } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];
export const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };

/* Eases 0 → value whenever value changes. */
export function CountUp({ value = 0, format, className, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1, ease: EASE, onUpdate: setN });
    return () => c.stop();
  }, [value]);
  return <span className={className} style={style}>{format ? format(n) : Math.round(n).toLocaleString()}</span>;
}

/* Catmull-Rom → smooth cubic-bezier path through (xs, ys). */
function smoothPath(xs, ys, W, H) {
  if (xs.length < 2) return { line: "", fill: "" };
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)], y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i], y1 = ys[i];
    const x2 = xs[i + 1], y2 = ys[i + 1];
    const x3 = xs[Math.min(xs.length - 1, i + 2)], y3 = ys[Math.min(ys.length - 1, i + 2)];
    const c1x = (x1 + (x2 - x0) / 6).toFixed(1), c1y = (y1 + (y2 - y0) / 6).toFixed(1);
    const c2x = (x2 - (x3 - x1) / 6).toFixed(1), c2y = (y2 - (y3 - y1) / 6).toFixed(1);
    d += ` C${c1x},${c1y},${c2x},${c2y},${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return { line: d, fill: `${d} L${W},${H} L0,${H} Z` };
}

/* Interactive area chart with animated draw-in + hover crosshair & tooltip.
   points: [{ label, value }]. */
export function AreaChart({
  points = [], height = 150, color = "#C9A44A", tooltipBg = "#060E1C",
  formatValue, grid = true, dark = false,
}) {
  const W = 580, H = height;
  const id = useId().replace(/:/g, "");
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  if (points.length < 2) {
    return <div style={{ height }} className="grid place-items-center text-[12px]" >
      <span style={{ color: dark ? "rgba(255,255,255,0.4)" : "#8896A8" }}>Not enough data yet</span>
    </div>;
  }

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map((p) => H - 12 - (p.value / maxVal) * (H - 26));
  const { line, fill } = smoothPath(xs, ys, W, H);
  const fmt = formatValue || ((v) => Math.round(v).toLocaleString("en-GB"));
  const gridColor = dark ? "rgba(255,255,255,0.07)" : "rgba(6,14,28,0.05)";

  function onMove(e) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let idx = 0, best = Infinity;
    xs.forEach((px, i) => { const dd = Math.abs(px - x); if (dd < best) { best = dd; idx = i; } });
    setHover(idx);
  }

  const hx = hover != null ? (xs[hover] / W) * 100 : 0;
  const hy = hover != null ? (ys[hover] / H) * 100 : 0;

  return (
    <div ref={wrapRef} className="relative select-none" style={{ height: H }}
      onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={dark ? "0.30" : "0.24"} />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>
        {grid && [0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke={gridColor} strokeWidth="1" />
        ))}
        <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(6,14,28,0.08)"} strokeWidth="1" />
        {fill && <motion.path d={fill} fill={`url(#g${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }} />}
        {line && <motion.path d={line} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />}
      </svg>

      {hover == null && (
        <span className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${(xs[xs.length - 1] / W) * 100}%`, top: `${(ys[ys.length - 1] / H) * 100}%` }}>
          <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}22` }} />
        </span>
      )}

      {hover != null && (
        <>
          <span className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: `${hx}%`, backgroundColor: dark ? "rgba(255,255,255,0.18)" : "rgba(6,14,28,0.14)" }} />
          <span className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${hx}%`, top: `${hy}%` }}>
            <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: "#fff", border: `2.5px solid ${color}` }} />
          </span>
          <div className="absolute -translate-x-1/2 pointer-events-none z-10 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
            style={{ left: `${Math.min(Math.max(hx, 14), 86)}%`, top: `max(${hy}% - 52px, 0px)`, backgroundColor: tooltipBg, boxShadow: "0 8px 20px rgba(6,14,28,0.22)" }}>
            <div className="text-[12.5px] font-bold leading-none" style={{ color: "#fff", ...NUM }}>{fmt(points[hover].value)}</div>
            <div className="text-[10px] mt-1 leading-none" style={{ color: "rgba(255,255,255,0.55)" }}>{points[hover].label}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* Animated donut. segments: [{ label, value, color }]. */
export function Donut({ segments = [], size = 150, stroke = 15, trackColor = "rgba(6,14,28,0.06)", children }) {
  const r = (size - stroke) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const dash = Math.max(0, (seg.value / total) * circ);
          const o = offset; offset += dash;
          if (seg.value <= 0) return null;
          return (
            <motion.circle key={i} cx={c} cy={c} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeLinecap="butt"
              strokeDashoffset={`${-o.toFixed(2)}`}
              initial={{ strokeDasharray: `0 ${circ.toFixed(2)}` }}
              animate={{ strokeDasharray: `${dash.toFixed(2)} ${(circ - dash).toFixed(2)}` }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.12 }} />
          );
        })}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
