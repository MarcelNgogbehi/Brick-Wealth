"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Wallet, TrendingUp, MapPin,
  ArrowRight, AlertCircle, ChevronRight, PieChart, Layers, Clock,
} from "lucide-react";
import BuyMoreButton from "./BuyMoreButton";
import SellSharesButton from "./SellSharesButton";
import { CountUp, AreaChart, Donut, NUM, EASE, fadeUp, stagger } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:          "#F0F1F5",
  surface:     "#FFFFFF",
  dark:        "#060E1C",
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
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
  info:        "#1E40AF",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const COMP_PALETTE = ["#16243F", "#C9A44A", "#0A6E4F", "#9A7A2E", "#6A4C8C", "#B45309"];

function currSym(c) { return c === "USD" ? "$" : c === "EUR" ? "€" : "£"; }
function fmtMoney(n, sym = "£") {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${sym}${(v / 1_000).toFixed(1)}K`;
  return `${sym}${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtFull(n, sym = "£") { return `${sym}${(Number(n) || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`; }

/* Monthly cumulative invested over the last N months. */
function buildGrowthPoints(subs, months = 12) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 0);
    return { label: start.toLocaleDateString("en-GB", { month: "short" }), start, end };
  }).reduce((acc, m) => {
    const prev  = acc.length ? acc[acc.length - 1].value : 0;
    const added = subs
      .filter((s) => s.submittedAt && new Date(s.submittedAt) >= m.start && new Date(s.submittedAt) <= m.end)
      .reduce((a, s) => a + parseFloat(s.totalAmount || 0), 0);
    acc.push({ label: m.label, value: prev + added });
    return acc;
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════ */
export default function HoldingsPage() {
  const [holdings, setHoldings] = useState([]);
  const [subs,     setSubs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const [hRes, sRes] = await Promise.all([
          fetch("/api/dashboard/holdings",                  { credentials: "same-origin" }),
          fetch("/api/dashboard/subscriptions?pageSize=50", { credentials: "same-origin" }),
        ]);
        if (hRes.ok) { const d = await hRes.json(); if (!dead) setHoldings(d.holdings || []); }
        if (sRes.ok) { const d = await sRes.json(); if (!dead) setSubs(d.subscriptions || []); }
      } catch (err) { if (!dead) setError(err.message); }
      if (!dead) setLoading(false);
    }
    load();
    return () => { dead = true; };
  }, []);

  const sym = currSym(holdings[0]?.currency || subs[0]?.currency);

  // Topbar search scopes the Active Investments table (portfolio stats stay whole).
  const { query } = useDashboardSearch();
  const holdingName = (h) => h.spv?.opportunity?.title || h.spv?.property?.title || h.spv?.spvName || "Holding";
  const shownHoldings = query.trim()
    ? holdings.filter((h) => holdingName(h).toLowerCase().includes(query.trim().toLowerCase()))
    : holdings;

  const stats = useMemo(() => {
    const totalInvested = holdings.reduce((a, h) => a + parseFloat(h.totalInvested || 0), 0);
    const totalUnits    = holdings.reduce((a, h) => a + (h.totalUnits || 0), 0);
    const avgOwnership  = holdings.length ? holdings.reduce((a, h) => a + parseFloat(h.ownershipPct || 0), 0) / holdings.length : 0;
    return { totalInvested, totalUnits, avgOwnership };
  }, [holdings]);

  const chartPts = useMemo(() => buildGrowthPoints(subs, 12), [subs]);
  const maxChart = useMemo(() => Math.max(...chartPts.map((p) => p.value), 1), [chartPts]);
  const growthAmt = chartPts.length > 1 ? chartPts[chartPts.length - 1].value - chartPts[0].value : 0;
  const growthPct = chartPts.length > 1 && chartPts[0].value > 0 ? ((growthAmt / chartPts[0].value) * 100).toFixed(1) : null;

  /* Composition by invested value (top 5 + others). */
  const comp = useMemo(() => {
    const ranked = [...holdings]
      .map((h) => ({ id: h.id, name: h.spv?.opportunity?.title || h.spv?.property?.title || h.spv?.spvName || "Holding", value: parseFloat(h.totalInvested || 0) }))
      .sort((a, b) => b.value - a.value);
    const top = ranked.slice(0, 5);
    const rest = ranked.slice(5);
    const arr = top.map((c, i) => ({ ...c, color: COMP_PALETTE[i % COMP_PALETTE.length] }));
    if (rest.length) arr.push({ id: "others", name: `${rest.length} other${rest.length !== 1 ? "s" : ""}`, value: rest.reduce((a, c) => a + c.value, 0), color: C.faint });
    const total = arr.reduce((a, c) => a + c.value, 0) || 1;
    return arr.map((c) => ({ ...c, pct: (c.value / total) * 100 }));
  }, [holdings]);

  const yTicks = useMemo(() => {
    if (maxChart <= 0) return [];
    const step = maxChart / 4;
    return [maxChart, step * 3, step * 2, step, 0].map((v) =>
      v >= 1_000_000 ? `${sym}${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${sym}${(v / 1_000).toFixed(0)}K` : `${sym}0`);
  }, [maxChart, sym]);

  return (
    <div className="space-y-7">

      {/* ── Title ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Your Portfolio</p>
        <h1 className="text-[36px] sm:text-[46px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em" }}>My Holdings</h1>
      </motion.div>

      {/* ── Dark hero ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl overflow-hidden relative" style={{ backgroundColor: C.dark, boxShadow: "0 6px 24px rgba(6,14,28,0.18)" }}>
        <span aria-hidden className="absolute -top-16 -right-10 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.16), transparent 70%)" }} />
        <div className="px-7 sm:px-10 py-8 sm:py-10 relative">
          <p className="text-[9.5px] font-bold tracking-[0.24em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>Total Portfolio Value</p>
          {loading ? (
            <div className="h-14 w-60 rounded-xl animate-pulse mb-7" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          ) : (
            <p className="text-[48px] sm:text-[60px] font-bold leading-none mb-7" style={{ color: "#fff", letterSpacing: "-0.03em", ...NUM }}>
              <CountUp value={stats.totalInvested} format={(v) => fmtMoney(v, sym)} />
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <HeroStat label="Total Units" value={loading ? "—" : <CountUp value={stats.totalUnits} />} />
            <HeroStat label="Active Holdings" value={loading ? "—" : <CountUp value={holdings.length} />} />
            <HeroStat label="Avg. Ownership" value={loading ? "—" : <CountUp value={stats.avgOwnership} format={(v) => `${v.toFixed(2)}%`} />} className="hidden sm:block" />
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-[13px] rounded-xl" style={{ backgroundColor: C.dangerDim, border: "1px solid rgba(153,27,27,0.15)" }}>
          <AlertCircle size={14} style={{ color: C.danger }} /><span style={{ color: C.danger }}>{error}</span>
        </div>
      )}

      {/* ── Active investments table ── */}
      {!loading && holdings.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between gap-4 px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Active Investments</h2>
            <span className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg" style={{ backgroundColor: C.bg, color: C.muted }}>{shownHoldings.length} holding{shownHoldings.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="hidden sm:grid px-6 py-3 text-[9.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, gridTemplateColumns: "1fr 160px 110px 220px" }}>
            <span>Property Name</span><span>Invested Value</span><span>Ownership</span><span className="text-right">Action</span>
          </div>
          {shownHoldings.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-center" style={{ color: C.muted }}>
              No holdings match “{query.trim()}”.
            </p>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {shownHoldings.map((h, i) => (
                <motion.div key={h.id} variants={fadeUp}><HoldingRow holding={h} sym={sym} last={i === shownHoldings.length - 1} /></motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {!loading && holdings.length === 0 && !error && <EmptyHoldings />}

      {loading && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div className="w-12 h-12 rounded-xl animate-pulse flex-shrink-0" style={{ backgroundColor: C.bg }} />
              <div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded animate-pulse" style={{ backgroundColor: C.bg }} /><div className="h-3 w-1/3 rounded animate-pulse" style={{ backgroundColor: C.bg }} /></div>
              <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: C.bg }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Portfolio composition (donut + ranked bars) ── */}
      {!loading && holdings.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="mb-6">
            <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Portfolio Composition</h2>
            <p className="text-[12px] mt-1" style={{ color: C.muted }}>How your capital is distributed across holdings</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Donut segments={comp} size={172} stroke={17}>
              <div>
                <p className="text-[22px] font-bold leading-none" style={{ color: C.ink, ...NUM }}><CountUp value={holdings.length} /></p>
                <p className="text-[9px] font-bold tracking-widest uppercase mt-1" style={{ color: C.muted }}>holdings</p>
              </div>
            </Donut>
            <div className="flex-1 w-full space-y-3.5">
              {comp.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate" style={{ color: C.ink }}>{c.name}</span>
                    </span>
                    <span className="text-[12.5px] font-bold flex-shrink-0 ml-3" style={{ color: C.secondary, ...NUM }}>
                      {fmtMoney(c.value, sym)}<span className="ml-1.5 font-semibold" style={{ color: C.muted }}>{c.pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: C.track }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: c.color }}
                      initial={{ width: 0 }} whileInView={{ width: `${c.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.85, ease: EASE, delay: 0.15 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Growth chart + insights ── */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-7">
            <div>
              <h2 className="text-[18px] leading-tight mb-1" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Portfolio Growth</h2>
              <p className="text-[12px]" style={{ color: C.muted }}>Cumulative invested over the last 12 months</p>
            </div>
            {growthAmt > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0" style={{ backgroundColor: C.successDim }}>
                <TrendingUp size={12} strokeWidth={2.5} style={{ color: C.success }} />
                <span className="text-[12px] font-bold" style={{ color: C.success, ...NUM }}>+{fmtMoney(growthAmt, sym)}{growthPct ? ` (${growthPct}%)` : ""}</span>
              </div>
            )}
          </div>
          {loading ? (
            <div className="h-[150px] rounded-xl animate-pulse" style={{ backgroundColor: C.bg }} />
          ) : (
            <div className="flex gap-3">
              <div className="flex flex-col justify-between text-right flex-shrink-0" style={{ height: 150 }}>
                {yTicks.map((t, i) => <span key={i} className="text-[9.5px]" style={{ color: C.muted, ...NUM }}>{t}</span>)}
              </div>
              <div className="flex-1 min-w-0">
                <AreaChart points={chartPts} height={150} color={C.gold} formatValue={(v) => fmtFull(v, sym)} />
                <div className="flex justify-between px-0.5 mt-1.5">
                  {chartPts.filter((_, i) => i % 2 === 0 || i === chartPts.length - 1).map((p, i) => <span key={i} className="text-[9.5px]" style={{ color: C.muted }}>{p.label}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 sm:p-7 flex flex-col relative overflow-hidden" style={{ backgroundColor: C.dark }}>
          <span aria-hidden className="absolute -top-10 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.16), transparent 70%)" }} />
          <h2 className="text-[18px] leading-tight mb-1 relative" style={{ color: "#fff", fontFamily: SERIF, fontWeight: 600 }}>Portfolio Insights</h2>
          <p className="text-[12px] mb-6 relative" style={{ color: "rgba(255,255,255,0.42)" }}>A snapshot of your position.</p>
          <div className="space-y-3 flex-1 relative">
            <InsightRow label="Total invested" value={loading ? "—" : fmtMoney(stats.totalInvested, sym)} icon={Wallet} />
            <InsightRow label="Holdings" value={loading ? "—" : holdings.length.toString()} icon={Building2} />
            <InsightRow label="Total units" value={loading ? "—" : stats.totalUnits.toLocaleString()} icon={Layers} />
            <InsightRow label="Avg. ownership" value={loading ? "—" : `${stats.avgOwnership.toFixed(2)}%`} icon={PieChart} />
          </div>
          <Link href="/dashboard/subscriptions" className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-bold relative transition-transform hover:scale-[1.02]" style={{ backgroundColor: C.gold, color: C.dark, textDecoration: "none" }}>
            View Subscriptions <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>

      <p className="text-[11px] leading-relaxed text-center" style={{ color: C.muted }}>
        Values reflect your original investment (cost basis), not current market valuation. Property investments are illiquid and capital is at risk.
      </p>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function HeroStat({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[9px] font-bold tracking-[0.20em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
      <p className="text-[22px] font-bold leading-none" style={{ color: "#fff", ...NUM }}>{value}</p>
    </div>
  );
}

function HoldingRow({ holding: h, sym, last }) {
  const spv = h.spv, prop = spv?.property;
  const oppId = spv?.opportunity?.id || h.opportunityId;
  const heroUrl = prop?.images?.[0]?.fileUrl || spv?.opportunity?.heroImageUrl;
  const title = spv?.opportunity?.title || prop?.title || spv?.spvName || "Holding";
  const location = prop ? `${prop.city || ""}${prop.country ? `, ${prop.country}` : ""}` : null;
  const invested = parseFloat(h.totalInvested || 0);

  return (
    <div className="sm:grid items-center px-6 py-5 transition-colors" style={{ borderBottom: last ? "none" : `1px solid ${C.border}`, gridTemplateColumns: "1fr 160px 110px 220px" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bg; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
      <div className="flex items-center gap-3 mb-3 sm:mb-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: C.goldLight }}>
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt={title} className="w-full h-full object-cover" />
          ) : <div className="w-full h-full grid place-items-center"><Building2 size={16} style={{ color: C.muted }} /></div>}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold truncate leading-snug" style={{ color: C.ink }}>{title}</p>
          {location && <p className="flex items-center gap-1 text-[11.5px] mt-0.5 truncate" style={{ color: C.muted }}><MapPin size={9} strokeWidth={1.75} />{location}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <div>
          <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{sym}{invested.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</p>
          <p className="text-[11px] mt-0.5" style={{ color: C.success, ...NUM }}>{h.totalUnits?.toLocaleString()} units</p>
          {h.pendingSaleUnits > 0 && (
            <p className="text-[10.5px] mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold" style={{ color: C.warning, backgroundColor: "rgba(146,64,14,0.08)", ...NUM }}>
              <Clock size={9} strokeWidth={2.25} />{h.pendingSaleUnits.toLocaleString()} units pending sale
            </p>
          )}
        </div>
      </div>
      <div className="mb-3 sm:mb-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold" style={{ backgroundColor: C.goldDim, color: C.goldDark, ...NUM }}>
          <TrendingUp size={10} strokeWidth={2.5} />{parseFloat(h.ownershipPct || 0).toFixed(2)}%
        </span>
      </div>
      <div className="flex items-center justify-start sm:justify-end flex-wrap gap-1.5">
        {oppId && (
          <Link href={`/dashboard/opportunities/${oppId}`} className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold whitespace-nowrap rounded-lg border transition-colors"
            style={{ color: C.goldDark, borderColor: `${C.goldDark}44`, textDecoration: "none", backgroundColor: C.goldDim }}>View <ChevronRight size={11} /></Link>
        )}
        {spv?.opportunity?.status === "live" && <BuyMoreButton opportunityId={h.opportunityId} variant="ghost" onSuccess={() => location.reload()} />}
        {h.totalUnits > 0 && <SellSharesButton spvId={h.spvId} onSuccess={() => location.reload()} />}
      </div>
    </div>
  );
}

function InsightRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5">
        <Icon size={13} strokeWidth={1.75} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
        <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      </div>
      <span className="text-[13px] font-bold" style={{ color: "#fff", ...NUM }}>{value}</span>
    </div>
  );
}

function EmptyHoldings() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="py-20 text-center rounded-2xl" style={{ backgroundColor: C.surface, border: `1px dashed ${C.borderMid}` }}>
      <div className="w-16 h-16 grid place-items-center mx-auto mb-5 rounded-2xl" style={{ backgroundColor: C.goldDim }}><Building2 size={26} strokeWidth={1.25} style={{ color: C.gold }} /></div>
      <p className="text-[26px] mb-2" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500 }}>No holdings yet</p>
      <p className="text-[13.5px] max-w-sm mx-auto mb-6 leading-relaxed" style={{ color: C.secondary }}>Once your subscription is allocated and units are issued, your ownership will appear here.</p>
      <Link href="/dashboard/opportunities" className="inline-flex items-center gap-1.5 px-6 py-3 text-[13px] font-semibold rounded-xl" style={{ backgroundColor: C.ink, color: "#FFFFFF", textDecoration: "none" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.goldDark; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.ink; }}>
        Browse opportunities <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}
