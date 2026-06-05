"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, ArrowUpRight, CheckCircle2,
  AlertCircle, Clock, FileText, ImageIcon, MapPin,
  ReceiptText, Building2, Activity, ChevronRight, Layers, Minus,
  Sparkles, ShieldCheck,
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:          "#F0F1F5",
  surface:     "#FFFFFF",
  dark:        "#060E1C",
  gold:        "#C9A44A",
  goldDeep:    "#9A7A2E",
  goldLight:   "#F7F0E2",
  goldDim:     "rgba(201,164,74,0.10)",
  ink:         "#060E1C",
  secondary:   "#4B5768",
  muted:       "#8896A8",
  faint:       "#AEB7C4",
  border:      "rgba(6,14,28,0.07)",
  borderMid:   "rgba(6,14,28,0.11)",
  track:       "#EDEFF3",
  success:     "#0A6E4F",
  successDim:  "rgba(10,110,79,0.09)",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.08)",
  warning:     "#92400E",
  warningDim:  "rgba(146,64,14,0.08)",
  info:        "#1E40AF",
  infoDim:     "rgba(30,64,175,0.08)",
};
const SYM   = { GBP: "£", USD: "$", EUR: "€" };
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const NUM   = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE  = [0.16, 1, 0.3, 1];

/* ─── Helpers ────────────────────────────────────────────────────── */
function greetingForHour(h) {
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function fmtMoney(n, sym = "£") {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${sym}${(v / 1_000).toFixed(1)}K`;
  return `${sym}${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtFull(n, sym = "£") {
  return `${sym}${(Number(n) || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

/* KYC label — robust against boolean / "true" / status-string values. */
function kycApproved(s) { return s === true || s === "true" || s === "approved"; }
function kycLabel(s) {
  if (kycApproved(s)) return "Approved";
  if (s == null || s === false || s === "false") return "Not started";
  return ({ not_started: "Not started", pending_review: "Under review", rejected: "Rejected" }[s]) || String(s).replace(/_/g, " ");
}

/* Build a cumulative capital curve over a real time window (range-driven). */
function buildSeries(subs, range) {
  const DAY = 864e5;
  const now = Date.now();
  const valid = subs
    .filter((s) => s.submittedAt)
    .map((s) => ({ t: +new Date(s.submittedAt), amt: parseFloat(s.totalAmount || 0) }))
    .sort((a, b) => a.t - b.t);

  let start;
  if (range === "ALL") start = valid.length ? valid[0].t - DAY : now - 180 * DAY;
  else {
    const months = range === "1M" ? 1 : range === "3M" ? 3 : 6;
    const d = new Date(); d.setMonth(d.getMonth() - months);
    start = d.getTime();
  }
  const span = Math.max(now - start, DAY);
  const N = 7;
  const cumAt = (ms) => valid.reduce((a, s) => (s.t <= ms ? a + s.amt : a), 0);
  const useDay = span <= 75 * DAY;

  const pts = Array.from({ length: N }, (_, i) => {
    const ms = start + (span * i) / (N - 1);
    return {
      ms,
      value: cumAt(ms),
      label: new Date(ms).toLocaleDateString("en-GB", useDay ? { day: "numeric", month: "short" } : { month: "short" }),
    };
  });
  const startVal = pts[0].value;
  const endVal = pts[pts.length - 1].value;
  return { pts, delta: endVal - startVal, startVal, endVal };
}

/* Catmull-Rom → smooth cubic bezier path through points (x[],y[]). */
function smoothPath(xs, ys, W, H) {
  if (xs.length < 2) return { line: "", fill: "" };
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)], y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i], y1 = ys[i];
    const x2 = xs[i + 1], y2 = ys[i + 1];
    const x3 = xs[Math.min(xs.length - 1, i + 2)], y3 = ys[Math.min(ys.length - 1, i + 2)];
    const cp1x = (x1 + (x2 - x0) / 6).toFixed(1), cp1y = (y1 + (y2 - y0) / 6).toFixed(1);
    const cp2x = (x2 - (x3 - x1) / 6).toFixed(1), cp2y = (y2 - (y3 - y1) / 6).toFixed(1);
    d += ` C${cp1x},${cp1y},${cp2x},${cp2y},${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return { line: d, fill: `${d} L${W},${H} L0,${H} Z` };
}

/* Eases 0 → value. */
function CountUp({ value = 0, format, className, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1, ease: EASE, onUpdate: setN });
    return () => c.stop();
  }, [value]);
  return <span className={className} style={style}>{format ? format(n) : Math.round(n).toLocaleString()}</span>;
}

/* ─── Interactive portfolio chart ──────────────────────────────────
   Animated draw-in, gradient area, hairline baseline + hover crosshair. */
function PortfolioChart({ series, sym }) {
  const W = 560, H = 92;
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const pts = series.pts;
  const maxVal = Math.max(...pts.map((p) => p.value), 1);

  const xs = pts.map((_, i) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W));
  const ys = pts.map((p) => H - 12 - (p.value / maxVal) * (H - 28));
  const { line, fill } = smoothPath(xs, ys, W, H);

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
          <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.26" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0.00" />
          </linearGradient>
        </defs>
        {/* hairline grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="rgba(6,14,28,0.05)" strokeWidth="1" />
        ))}
        <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="rgba(6,14,28,0.08)" strokeWidth="1" />
        {fill && (
          <motion.path d={fill} fill="url(#pGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }} />
        )}
        {line && (
          <motion.path d={line} fill="none" stroke={C.gold} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />
        )}
      </svg>

      {/* Endpoint pulse */}
      {pts.length > 0 && hover == null && (
        <span className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${(xs[xs.length - 1] / W) * 100}%`, top: `${(ys[ys.length - 1] / H) * 100}%` }}>
          <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.gold, boxShadow: `0 0 0 4px ${C.goldDim}` }} />
        </span>
      )}

      {/* Hover crosshair + tooltip (HTML overlay → crisp under non-uniform scaling) */}
      {hover != null && (
        <>
          <span className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: `${hx}%`, backgroundColor: "rgba(6,14,28,0.14)" }} />
          <span className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${hx}%`, top: `${hy}%` }}>
            <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: "#fff", border: `2.5px solid ${C.gold}` }} />
          </span>
          <div className="absolute -translate-x-1/2 pointer-events-none z-10 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              left: `${Math.min(Math.max(hx, 14), 86)}%`, top: `max(${hy}% - 52px, 0px)`,
              backgroundColor: C.dark, boxShadow: "0 8px 20px rgba(6,14,28,0.22)",
            }}>
            <div className="text-[12.5px] font-bold leading-none" style={{ color: "#fff", ...NUM }}>{fmtFull(pts[hover].value, sym)}</div>
            <div className="text-[10px] mt-1 leading-none" style={{ color: "rgba(255,255,255,0.55)" }}>{pts[hover].label}</div>
          </div>
        </>
      )}
    </div>
  );
}

/* Animated donut */
function DonutChart({ segments, size = 148, stroke = 15 }) {
  const r = (size - stroke) / 2, c = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(6,14,28,0.06)" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = Math.max(0, (seg.pct / 100) * circ);
        const o = offset; offset += dash;
        return (
          <motion.circle key={i} cx={c} cy={c} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeLinecap="butt"
            strokeDashoffset={`${-o.toFixed(2)}`}
            initial={{ strokeDasharray: `0 ${circ.toFixed(2)}` }}
            animate={{ strokeDasharray: `${dash.toFixed(2)} ${(circ - dash).toFixed(2)}` }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.12 }} />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════ */
export default function DashboardHomePage() {
  const [summary,  setSummary]  = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [subs,     setSubs]     = useState([]);
  const [opps,     setOpps]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState("6M");
  const [greet,    setGreet]    = useState("Welcome");

  // Time-of-day greeting is client-only — set after mount to avoid an SSR
  // hydration mismatch (server has no clock for the user's locale).
  useEffect(() => { setGreet(greetingForHour(new Date().getHours())); }, []);

  useEffect(() => {
    async function load() {
      try {
        const [meR, holdR, subR, oppR] = await Promise.all([
          fetch("/api/dashboard/me",                        { credentials: "same-origin" }),
          fetch("/api/dashboard/holdings",                  { credentials: "same-origin" }),
          fetch("/api/dashboard/subscriptions?pageSize=50", { credentials: "same-origin" }),
          fetch("/api/dashboard/opportunities?pageSize=6",  { credentials: "same-origin" }),
        ]);
        if (meR.ok)   setSummary(await meR.json());
        if (holdR.ok) { const d = await holdR.json(); setHoldings(d.holdings || []); }
        if (subR.ok)  { const d = await subR.json(); setSubs(d.subscriptions || []); }
        if (oppR.ok)  { const d = await oppR.json(); setOpps(d.opportunities || []); }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const m = useMemo(() => {
    const total     = subs.reduce((a, s) => a + parseFloat(s.totalAmount || 0), 0);
    const allocated = subs.filter((s) => ["FUNDED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"].includes(s.status))
                          .reduce((a, s) => a + parseFloat(s.totalAmount || 0), 0);
    const pending   = subs.filter((s) => ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(s.status))
                          .reduce((a, s) => a + parseFloat(s.totalAmount || 0), 0);
    const activeSubs = subs.filter((s) => ["FUNDED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"].includes(s.status)).length;

    const byStatus = (statuses) => subs.filter((s) => statuses.includes(s.status)).length;
    const tot = subs.length || 1;
    const donut = [
      { label: "Allocated",    color: C.success, count: byStatus(["PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"]) },
      { label: "Funded",       color: C.gold,    count: byStatus(["FUNDED"]) },
      { label: "Under Review", color: C.info,    count: byStatus(["SUBMITTED", "UNDER_REVIEW", "VERIFIED"]) },
      { label: "Rejected",     color: C.danger,  count: byStatus(["REJECTED", "CANCELLED"]) },
    ].filter((d) => d.count > 0).map((d) => ({ ...d, pct: (d.count / tot) * 100 }));

    const unitsHeld = holdings.reduce((a, h) => a + (h.totalUnits || 0), 0);
    return { total, allocated, pending, activeSubs, donut, totalSubs: subs.length, unitsHeld };
  }, [subs, holdings]);

  const series   = useMemo(() => buildSeries(subs, range), [subs, range]);
  const sym      = SYM[subs.find((s) => s.currency)?.currency || "GBP"] || "£";
  const user     = summary?.user;
  const name     = user?.fullName || "Investor";
  const recent   = [...subs].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)).slice(0, 5);
  const topHolds = holdings.slice(0, 3);
  const featOpps = opps.slice(0, 3);
  const deltaPct = series.startVal > 0 ? (series.delta / series.startVal) * 100 : null;

  return (
    <div className="space-y-5">

      {/* ── Status banner ── */}
      {!loading && summary?.nextStep && <StatusBanner step={summary.nextStep} />}

      {/* ── Greeting ── */}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>{greet}</p>
          <h1 className="text-[22px] sm:text-[28px] lg:text-[34px] leading-[1.1] tracking-[-0.01em] break-words" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>{name}.</h1>
        </div>
        <div className="flex items-center gap-3">
          {!loading && summary?.isActivated && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: C.successDim, color: C.success }}>
              <CheckCircle2 size={11} strokeWidth={2.5} /> Activated
            </span>
          )}
          <Link href="/dashboard/opportunities"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
            New Investment <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>

      {/* ── Hero row ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>

        {/* Portfolio value card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(6,14,28,0.05)" }}>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-1">
              <div>
                <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.muted }}>Total Portfolio Value</p>
                {loading ? (
                  <div className="h-11 w-52 rounded-xl animate-pulse" style={{ backgroundColor: C.bg }} />
                ) : (
                  <div className="flex items-end gap-3 flex-wrap">
                    <p className="text-[34px] sm:text-[44px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.03em", ...NUM }}>
                      <CountUp value={m.total} format={(v) => fmtMoney(v, sym)} />
                    </p>
                    {series.delta !== 0 && (
                      <span className="mb-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{ backgroundColor: series.delta >= 0 ? C.successDim : C.dangerDim, color: series.delta >= 0 ? C.success : C.danger }}>
                        {series.delta >= 0 ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
                        {series.delta >= 0 ? "+" : "−"}{fmtMoney(Math.abs(series.delta), sym)}{deltaPct != null ? ` · ${Math.abs(deltaPct).toFixed(1)}%` : ""}
                      </span>
                    )}
                  </div>
                )}
                {!loading && (
                  <p className="text-[11.5px] mt-2.5" style={{ color: C.muted }}>
                    {series.delta > 0 ? `Capital deployed in the last ${range === "ALL" ? "period" : range}` : `No new capital in the last ${range === "ALL" ? "period" : range}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 p-1 rounded-xl self-start flex-shrink-0" style={{ backgroundColor: C.bg }}>
                {["1M", "3M", "6M", "ALL"].map((r) => (
                  <button key={r} type="button" onClick={() => setRange(r)}
                    className="px-3.5 py-2 text-[11px] font-bold rounded-lg transition-all"
                    style={{ backgroundColor: range === r ? C.ink : "transparent", color: range === r ? "#fff" : C.muted, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="mt-4 mb-1">
              {loading ? (
                <div className="rounded-xl animate-pulse" style={{ backgroundColor: C.bg, height: 92 }} />
              ) : (
                <PortfolioChart series={series} sym={sym} />
              )}
            </div>
            {!loading && (
              <div className="flex justify-between px-0.5 mb-4">
                {series.pts.map((p, i) => <span key={i} className="text-[10.5px]" style={{ color: C.muted }}>{p.label}</span>)}
              </div>
            )}
            {loading && <div className="mb-4" />}

            {/* Sub-stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <SubStat label="Under Review" value={loading ? null : fmtMoney(m.pending, sym)} icon={Clock} tone={C.warning} />
              <SubStat label="Allocated / Funded" value={loading ? null : fmtMoney(m.allocated, sym)} icon={CheckCircle2} tone={C.success} />
              <SubStat label="Units Held" value={loading ? null : m.unitsHeld.toLocaleString()} icon={Layers} tone={C.gold} className="hidden sm:block" />
              <SubStat label="Subscriptions" value={loading ? null : m.totalSubs} icon={ReceiptText} tone={C.info} className="hidden sm:block" />
            </div>
          </div>
        </div>

      </motion.div>

      {/* ── Active investments + Investor profile (balanced 2-up) ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.09 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* Active investments (dark) */}
        <div className="rounded-2xl p-5 flex flex-col relative overflow-hidden" style={{ backgroundColor: C.dark, boxShadow: "0 4px 16px rgba(6,14,28,0.14)" }}>
          <span aria-hidden className="absolute -top-12 -right-10 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.18), transparent 70%)" }} />
          <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase mb-1 relative" style={{ color: "rgba(255,255,255,0.42)" }}>Active Investments</p>
          {loading ? (
            <div className="h-8 w-14 rounded-lg animate-pulse mt-0.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          ) : (
            <p className="text-[32px] font-bold leading-none mt-0.5 relative" style={{ color: "#fff", letterSpacing: "-0.02em", ...NUM }}><CountUp value={m.activeSubs} /></p>
          )}
          <p className="text-[11.5px] mt-1 relative" style={{ color: "rgba(255,255,255,0.42)" }}>
            {loading ? "" : `of ${m.totalSubs} subscription${m.totalSubs !== 1 ? "s" : ""}`}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div>
              <p className="text-[9px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Allocated</p>
              <p className="text-[16px] font-bold leading-none" style={{ color: "#fff", ...NUM }}>{loading ? "—" : fmtMoney(m.allocated, sym)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>In Pipeline</p>
              <p className="text-[16px] font-bold leading-none" style={{ color: C.gold, ...NUM }}>{loading ? "—" : fmtMoney(m.pending, sym)}</p>
            </div>
          </div>
          <div className="mt-auto pt-4 relative">
            <Link href="/dashboard/holdings"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-bold transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: C.gold, color: C.dark, textDecoration: "none" }}>
              View Holdings <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Investor profile (light) */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[14px] font-bold" style={{ color: C.ink }}>Investor Profile</p>
            {user?.investorType && (
              <span className="px-2.5 py-1 text-[9.5px] font-bold tracking-wide uppercase rounded-lg" style={{ backgroundColor: C.successDim, color: C.success }}>
                {user.investorType.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <ProfileStat label="Open opportunities" value={loading ? "—" : (summary?.liveOpportunitiesCount ?? 0)} icon={Activity} color={C.gold} />
            <ProfileStat label="KYC status" value={loading ? "—" : kycLabel(user?.kycStatus)} icon={ShieldCheck} color={kycApproved(user?.kycStatus) ? C.success : C.warning} />
          </div>
          <div className="mt-auto pt-4">
            <Link href="/dashboard/opportunities"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors"
              style={{ border: `1px solid ${C.border}`, color: C.ink, textDecoration: "none", backgroundColor: C.bg }}>
              Browse Opportunities <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Portfolio metrics (detailed KPI grid) ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.09 }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[22px] sm:text-[26px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Portfolio at a Glance</h2>
            <p className="text-[12px] mt-1" style={{ color: C.muted }}>A complete breakdown of your investment position</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard featured loading={loading} label="Capital Allocated" icon={CheckCircle2}
            value={fmtMoney(m.allocated, sym)}
            meter={m.total > 0 ? (m.allocated / m.total) * 100 : 0}
            sub={m.total > 0 ? `${Math.round((m.allocated / m.total) * 100)}% of committed capital` : "No capital deployed yet"} />
          <MetricCard loading={loading} label="In Pipeline" icon={TrendingUp} href="/dashboard/subscriptions"
            value={fmtMoney(m.pending, sym)} sub="Awaiting allocation" />
          <MetricCard loading={loading} label="Units Held" icon={Layers}
            value={<CountUp value={m.unitsHeld} />} sub={`Across ${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`} />
          <MetricCard loading={loading} label="Active Holdings" icon={Building2} href="/dashboard/holdings"
            value={<CountUp value={holdings.length} />} sub="Distinct investment vehicles" />
          <MetricCard loading={loading} label="Active Investments" icon={Activity}
            value={<CountUp value={m.activeSubs} />} sub={`of ${m.totalSubs} subscription${m.totalSubs !== 1 ? "s" : ""}`} />
          <MetricCard loading={loading} label="Open Opportunities" icon={Sparkles} accent href="/dashboard/opportunities"
            value={<CountUp value={summary?.liveOpportunitiesCount ?? 0} />} sub="Available to you now" />
          <MetricCard loading={loading} label="Subscriptions" icon={ReceiptText} href="/dashboard/subscriptions"
            value={<CountUp value={m.totalSubs} />} sub="All-time commitments" />
          <MetricCard loading={loading} label="KYC Status" icon={ShieldCheck}
            value={<span className="capitalize" style={{ fontSize: 20 }}>{kycLabel(user?.kycStatus)}</span>}
            sub={user?.investorType ? `${user.investorType.replace(/_/g, " ")} investor` : "Identity & compliance"} />
        </div>
      </motion.div>

      {/* ── Activity + Allocation ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Recent Activity</h2>
            <Link href="/dashboard/subscriptions" className="flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: C.gold, textDecoration: "none" }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl animate-pulse flex-shrink-0" style={{ backgroundColor: C.bg }} />
                  <div className="flex-1 space-y-2"><div className="h-3 w-3/4 rounded animate-pulse" style={{ backgroundColor: C.bg }} /><div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.bg }} /></div>
                  <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: C.bg }} />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyBlock icon={Activity} text="No activity yet" sub="Your investment transactions will appear here." />
          ) : (
            <div className="space-y-0.5">{recent.map((s) => <ActivityRow key={s.id} sub={s} sym={sym} />)}</div>
          )}
        </div>

        <div className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Portfolio Allocation</h2>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.bg, color: C.muted }}>
              {m.totalSubs} subscription{m.totalSubs !== 1 ? "s" : ""}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center gap-6">
              <div className="w-[148px] h-[148px] rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: C.bg }} />
              <div className="flex-1 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.bg }} /><div className="h-2.5 flex-1 rounded animate-pulse" style={{ backgroundColor: C.bg }} /></div>)}</div>
            </div>
          ) : m.donut.length === 0 ? (
            <EmptyBlock icon={ReceiptText} text="No subscriptions yet" sub="Your portfolio allocation will appear here once you subscribe." />
          ) : (
            <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
              <div className="relative flex-shrink-0">
                <DonutChart segments={m.donut} size={148} stroke={15} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[22px] font-bold leading-none" style={{ color: C.ink, ...NUM }}>{m.totalSubs}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: C.muted }}>total</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 min-w-[160px]">
                {m.donut.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[12.5px]" style={{ color: C.secondary }}>{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{seg.count}</span>
                      <span className="text-[10px] ml-1" style={{ color: C.muted, ...NUM }}>({seg.pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Top Holdings / Opportunities ── */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.17 }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-[22px] sm:text-[26px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>
              {topHolds.length > 0 ? "Top Holdings" : "Featured Opportunities"}
            </h2>
            <p className="text-[12px] mt-1" style={{ color: C.muted }}>
              {topHolds.length > 0 ? "Primary value drivers in your portfolio" : "Open investment opportunities available to you"}
            </p>
          </div>
          <Link href={topHolds.length > 0 ? "/dashboard/holdings" : "/dashboard/opportunities"}
            className="hidden sm:flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.ink, textDecoration: "none" }}>
            View all <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="aspect-[16/10] animate-pulse" style={{ backgroundColor: C.bg }} />
                <div className="p-5 space-y-2"><div className="h-5 w-3/4 rounded animate-pulse" style={{ backgroundColor: C.bg }} /><div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.bg }} /></div>
              </div>
            ))}
          </div>
        ) : topHolds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topHolds.map((h, i) => <HoldingCard key={h.id} holding={h} index={i} sym={sym} />)}
          </div>
        ) : featOpps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featOpps.map((o, i) => <OpportunityCard key={o.id} opp={o} index={i} />)}
          </div>
        ) : (
          <EmptyBlock icon={Building2} text="No investments yet" sub="Browse our open opportunities to make your first investment."
            cta={{ label: "Browse Opportunities", href: "/dashboard/opportunities" }} />
        )}
      </motion.section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Sub-components
════════════════════════════════════════════════════════════════════ */

/* Detailed KPI card — admin-console inspired (featured = dark navy). */
function MetricCard({ featured, loading, label, value, sub, icon: Icon, meter, accent, href }) {
  const [h, setH] = useState(false);
  const inner = (
    <div className="relative h-full rounded-2xl p-5 overflow-hidden transition-all"
      style={featured
        ? { background: "linear-gradient(150deg, #0A1F44 0%, #060E1C 100%)", boxShadow: h ? "0 12px 28px rgba(6,14,28,0.22)" : "0 4px 14px rgba(6,14,28,0.14)" }
        : { backgroundColor: C.surface, border: `1px solid ${h && href ? "rgba(201,164,74,0.4)" : C.border}`, boxShadow: h ? "0 8px 22px rgba(6,14,28,0.08)" : "0 1px 4px rgba(6,14,28,0.04)", transform: h && href ? "translateY(-2px)" : "none" }}>
      {featured && <span aria-hidden className="absolute -top-8 -right-8 w-28 h-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.22), transparent 70%)" }} />}
      <div className="relative flex items-start justify-between mb-4">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: featured ? "rgba(255,255,255,0.5)" : C.muted }}>{label}</span>
        <span className="w-8 h-8 grid place-items-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: featured ? "rgba(201,164,74,0.15)" : accent ? C.goldLight : C.bg }}>
          <Icon size={15} strokeWidth={2} style={{ color: featured ? C.gold : accent ? C.goldDeep : C.secondary }} />
        </span>
      </div>
      <div className="relative">
        {loading ? (
          <div className="h-7 w-20 rounded-md animate-pulse" style={{ backgroundColor: featured ? "rgba(255,255,255,0.1)" : C.bg }} />
        ) : (
          <p className="text-[28px] font-bold leading-none" style={{ color: featured ? "#fff" : C.ink, letterSpacing: "-0.025em", ...NUM }}>{value}</p>
        )}
        {meter != null && !loading && (
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: featured ? "rgba(255,255,255,0.12)" : C.track }}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: C.gold }}
              initial={{ width: 0 }} whileInView={{ width: `${Math.min(Math.max(meter, 0), 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }} />
          </div>
        )}
        {sub && (
          <p className="text-[11.5px] mt-2.5 flex items-center gap-1" style={{ color: featured ? "rgba(255,255,255,0.5)" : C.muted }}>
            {sub}
            {href && <ArrowUpRight size={11} className="ml-auto flex-shrink-0" style={{ color: h ? (accent ? C.gold : C.secondary) : C.faint }} />}
          </p>
        )}
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <Link href={href} style={{ textDecoration: "none" }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{inner}</Link>
  );
}

function SubStat({ label, value, icon: Icon, tone, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-1.5 flex items-center gap-1.5" style={{ color: C.muted }}>
        {Icon && <Icon size={11} strokeWidth={2.2} style={{ color: tone || C.muted }} />}{label}
      </p>
      {value === null ? (
        <div className="h-6 w-20 rounded-lg animate-pulse" style={{ backgroundColor: C.bg }} />
      ) : (
        <p className="text-[20px] sm:text-[22px] font-bold" style={{ color: C.ink, ...NUM }}>{value}</p>
      )}
    </div>
  );
}

function ProfileStat({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: C.bg }}>
      <div className="flex items-center gap-2.5">
        <Icon size={13} strokeWidth={2} style={{ color, flexShrink: 0 }} />
        <span className="text-[12px]" style={{ color: C.secondary }}>{label}</span>
      </div>
      <span className="text-[12.5px] font-bold capitalize" style={{ color: C.ink }}>{value}</span>
    </div>
  );
}

const STATUS_COLORS = {
  SUBMITTED:           { bg: "rgba(6,14,28,0.07)",   fg: "#4B5768", label: "Submitted" },
  UNDER_REVIEW:        { bg: "rgba(146,64,14,0.09)", fg: "#92400E", label: "Under Review" },
  VERIFIED:            { bg: "rgba(30,64,175,0.08)", fg: "#1E40AF", label: "Verified" },
  FUNDED:              { bg: "rgba(30,64,175,0.08)", fg: "#1E40AF", label: "Funded" },
  PARTIALLY_ALLOCATED: { bg: "rgba(201,164,74,0.10)", fg: "#9A7A2E", label: "Part. Allocated" },
  FULLY_ALLOCATED:     { bg: "rgba(10,110,79,0.09)", fg: "#0A6E4F", label: "Fully Allocated" },
  REJECTED:            { bg: "rgba(153,27,27,0.08)", fg: "#991B1B", label: "Rejected" },
  CANCELLED:           { bg: "rgba(6,14,28,0.05)",   fg: "#8896A8", label: "Cancelled" },
};
const STATUS_ICONS = {
  SUBMITTED:           { icon: FileText,     bg: "rgba(6,14,28,0.07)",    fg: "#4B5768" },
  UNDER_REVIEW:        { icon: Clock,        bg: "rgba(146,64,14,0.09)",  fg: "#92400E" },
  VERIFIED:            { icon: CheckCircle2, bg: "rgba(30,64,175,0.08)",  fg: "#1E40AF" },
  FUNDED:              { icon: Wallet,       bg: "rgba(30,64,175,0.08)",  fg: "#1E40AF" },
  PARTIALLY_ALLOCATED: { icon: Building2,    bg: "rgba(201,164,74,0.10)", fg: "#9A7A2E" },
  FULLY_ALLOCATED:     { icon: Building2,    bg: "rgba(10,110,79,0.09)",  fg: "#0A6E4F" },
  REJECTED:            { icon: AlertCircle,  bg: "rgba(153,27,27,0.08)",  fg: "#991B1B" },
  CANCELLED:           { icon: Minus,        bg: "rgba(6,14,28,0.05)",    fg: "#8896A8" },
};

function ActivityRow({ sub, sym }) {
  const meta  = STATUS_COLORS[sub.status] || STATUS_COLORS.SUBMITTED;
  const iconf = STATUS_ICONS[sub.status]  || STATUS_ICONS.SUBMITTED;
  const Icon  = iconf.icon;
  const date  = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
  const amt   = parseFloat(sub.totalAmount || 0);
  return (
    <Link href={`/dashboard/subscriptions/${sub.id}`} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors" style={{ textDecoration: "none" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      <div className="w-10 h-10 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: iconf.bg }}>
        <Icon size={16} strokeWidth={1.75} style={{ color: iconf.fg }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>{sub.opportunity?.title || "Investment"}</p>
        <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{date}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{sym}{amt.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</p>
        <span className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase rounded" style={{ backgroundColor: meta.bg, color: meta.fg }}>{meta.label}</span>
      </div>
    </Link>
  );
}

function HoldingCard({ holding: h, index, sym }) {
  const spv = h.spv, prop = spv?.property;
  const oppTitle = spv?.opportunity?.title || prop?.title || spv?.spvName || "Investment";
  const heroUrl  = spv?.opportunity?.heroImageUrl || prop?.images?.[0]?.fileUrl;
  const invested = parseFloat(h.totalInvested || 0);
  const roiLabel = h.ownershipPct ? `${parseFloat(h.ownershipPct).toFixed(2)}%` : null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.2 + index * 0.07 }}>
      <Link href="/dashboard/holdings" className="block rounded-2xl overflow-hidden group"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, textDecoration: "none", boxShadow: "0 1px 4px rgba(6,14,28,0.04)", transition: "box-shadow 0.25s,border-color 0.25s,transform 0.25s" }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(6,14,28,0.12)"; e.currentTarget.style.borderColor = "rgba(201,164,74,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(6,14,28,0.04)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
        <div className="aspect-[16/9] relative overflow-hidden" style={{ backgroundColor: C.goldLight }}>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt={oppTitle} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ color: C.gold }}><ImageIcon size={32} strokeWidth={1.25} /></div>
          )}
          {roiLabel && (
            <div className="absolute top-3 right-3 px-2 py-0.5 text-[10.5px] font-bold rounded-md" style={{ backgroundColor: C.gold, color: C.dark }}>{roiLabel} ownership</div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-[16px] font-semibold leading-snug truncate mb-0.5" style={{ color: C.ink, fontFamily: SERIF }}>{oppTitle}</p>
          {prop?.city && (
            <p className="flex items-center gap-1 text-[11.5px] mb-3.5" style={{ color: C.muted }}><MapPin size={10} strokeWidth={1.75} />{prop.city}{prop.country ? `, ${prop.country}` : ""}</p>
          )}
          <div className="grid grid-cols-2 gap-3 pt-3.5" style={{ borderTop: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[9.5px] font-bold tracking-wide uppercase mb-1" style={{ color: C.muted }}>Market Value</p>
              <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{sym}{invested.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold tracking-wide uppercase mb-1" style={{ color: C.muted }}>Units</p>
              <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{(h.totalUnits || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function OpportunityCard({ opp: o, index }) {
  const prop = o.spv?.property;
  const heroUrl = o.heroImageUrl || prop?.images?.[0]?.fileUrl;
  const sym = SYM[o.spv?.currency] || "£";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.2 + index * 0.07 }}>
      <Link href={`/dashboard/opportunities/${o.id}`} className="block rounded-2xl overflow-hidden group"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, textDecoration: "none", boxShadow: "0 1px 4px rgba(6,14,28,0.04)", transition: "box-shadow 0.25s,border-color 0.25s,transform 0.25s" }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(6,14,28,0.12)"; e.currentTarget.style.borderColor = "rgba(201,164,74,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(6,14,28,0.04)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
        <div className="aspect-[16/9] relative overflow-hidden" style={{ backgroundColor: C.goldLight }}>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt={o.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ color: C.gold }}><ImageIcon size={32} strokeWidth={1.25} /></div>
          )}
          {o.targetYieldPct && (
            <div className="absolute top-3 left-3 px-2.5 py-1 text-[10.5px] font-bold rounded-md" style={{ backgroundColor: "rgba(6,14,28,0.80)", color: "#fff", backdropFilter: "blur(4px)" }}>{o.targetYieldPct}% target yield</div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-[16px] leading-snug mb-0.5" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>{o.title}</h3>
          {prop?.city && (
            <p className="flex items-center gap-1 text-[11.5px] mb-3.5" style={{ color: C.muted }}><MapPin size={10} strokeWidth={1.75} />{prop.city}{prop.country ? `, ${prop.country}` : ""}</p>
          )}
          <div className="flex items-center justify-between pt-3.5" style={{ borderTop: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[9.5px] font-bold tracking-wide uppercase mb-1" style={{ color: C.muted }}>From</p>
              <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{sym}{Number(o.spv?.unitPrice || 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] font-bold tracking-wide uppercase mb-1" style={{ color: C.muted }}>Term</p>
              <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{o.termMonths ? `${o.termMonths} mo` : "—"}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyBlock({ icon: Icon, text, sub, cta }) {
  return (
    <div className="py-12 text-center rounded-2xl" style={{ border: `1px dashed ${C.borderMid}`, backgroundColor: C.surface }}>
      <div className="w-12 h-12 grid place-items-center mx-auto mb-4 rounded-2xl" style={{ backgroundColor: C.goldLight }}>
        <Icon size={20} strokeWidth={1.5} style={{ color: C.gold }} />
      </div>
      <p className="text-[17px] mb-1.5" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>{text}</p>
      <p className="text-[12.5px] max-w-xs mx-auto" style={{ color: C.muted }}>{sub}</p>
      {cta && (
        <Link href={cta.href} className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
          {cta.label} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function StatusBanner({ step }) {
  const configs = {
    verify_email:       { icon: AlertCircle,  tone: "warning", title: "Verify your email",      body: "Check your inbox for the verification link." },
    complete_profile:   { icon: FileText,     tone: "warning", title: "Complete your profile",  body: "A few more details to match you with opportunities.", cta: { label: "Continue", url: step.url } },
    start_kyc:          { icon: FileText,     tone: "warning", title: "Submit KYC documents",   body: "Verify your identity to unlock investment subscriptions.", cta: { label: "Submit KYC", url: step.url } },
    kyc_review:         { icon: Clock,        tone: "info",    title: "KYC under review",       body: "We typically review within 1–2 business days." },
    kyc_rejected:       { icon: AlertCircle,  tone: "danger",  title: "KYC requires attention", body: "We need additional information. Please resubmit.", cta: { label: "Resubmit", url: step.url } },
    complete_consents:  { icon: FileText,     tone: "warning", title: "Review our terms",       body: "Accept our terms and risk acknowledgements.", cta: { label: "Review terms", url: step.url } },
  };
  const cfg = configs[step?.step];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const tones = {
    warning: { bg: "rgba(146,64,14,0.07)", accent: "#92400E", text: "#7A5005" },
    info:    { bg: "rgba(30,64,175,0.07)", accent: "#1E40AF", text: "#1E3A8A" },
    danger:  { bg: "rgba(153,27,27,0.07)", accent: "#991B1B", text: "#991B1B" },
  };
  const t = tones[cfg.tone];
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-4 sm:items-center p-4 sm:p-5 rounded-2xl" style={{ backgroundColor: t.bg, border: `1px solid ${t.accent}30` }}>
      <div className="w-9 h-9 grid place-items-center flex-shrink-0 rounded-xl" style={{ backgroundColor: `${t.accent}18` }}>
        <Icon size={17} strokeWidth={1.75} style={{ color: t.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold mb-0.5" style={{ color: t.text }}>{cfg.title}</p>
        <p className="text-[12px] leading-relaxed" style={{ color: t.text, opacity: 0.85 }}>{cfg.body}</p>
      </div>
      {cfg.cta && (
        <Link href={cfg.cta.url} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold rounded-xl flex-shrink-0" style={{ backgroundColor: t.accent, color: "#fff", textDecoration: "none" }}>
          {cfg.cta.label} <ArrowRight size={11} strokeWidth={2.5} />
        </Link>
      )}
    </motion.div>
  );
}
