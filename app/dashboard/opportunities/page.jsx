"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, ImageIcon, ChevronLeft, ChevronRight, ChevronDown,
  Sparkles, Heart, Eye, FileText, Mail, Download, Layers,
  Building2, TrendingUp, Landmark, Wallet,
} from "lucide-react";
import { CountUp } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:        "#F0F1F5",
  surface:   "#FFFFFF",
  dark:      "#0B1422",
  gold:      "#C9A44A",
  goldDark:  "#9A7A2E",
  goldLight: "#F7F0E2",
  goldDim:   "rgba(201,164,74,0.10)",
  ink:       "#0B1422",
  secondary: "#4B5768",
  muted:     "#8896A8",
  border:    "rgba(11,20,34,0.08)",
  borderMid: "rgba(11,20,34,0.13)",
  track:     "rgba(11,20,34,0.08)",
  success:   "#0A6E4F",
  successBg: "rgba(10,110,79,0.10)",
  danger:    "#B4321F",
  dangerBg:  "rgba(180,50,31,0.10)",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE = [0.16, 1, 0.3, 1];
const SYM = { GBP: "£", USD: "$", EUR: "€" };

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest first" },
  { value: "yield",   label: "Highest yield" },
  { value: "closing", label: "Closing soon" },
  { value: "oldest",  label: "Oldest first" },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
function pctFunded(o) {
  const target = Number(o.spv?.targetRaiseAmount || 0);
  const allocated = (o.spv?.unitsAllocated ?? 0) * Number(o.spv?.unitPrice || 0);
  return target > 0 ? Math.min(100, (allocated / target) * 100) : 0;
}
function assetLabel(o) {
  const t = o.spv?.property?.propertyType;
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase().replace(/_/g, " ");
}
function tagFor(o) {
  const y = parseFloat(o.targetYieldPct || 0);
  if (y >= 16) return "Iconic Asset";
  if (y >= 12) return "Growth Plus";
  if (y >= 8)  return "Stable Yield";
  return "Core Asset";
}
function shortMoney(v, sym) {
  const n = Number(v) || 0, a = Math.abs(n);
  if (a >= 1e6) return `${sym}${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (a >= 1e3) return `${sym}${Math.round(n / 1e3)}K`;
  return `${sym}${Math.round(n).toLocaleString()}`;
}
function minEntry(v, sym) {
  const n = Number(v) || 0;
  return n >= 1000 ? `${sym}${Math.round(n / 1000)}k` : `${sym}${n.toLocaleString()}`;
}

const PAGE_SIZE = 9;

/* ═══════════════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════════════════ */
export default function OpportunitiesBrowsePage() {
  const { query: search } = useDashboardSearch();   // scoped from the topbar
  const [assetClass, setAssetClass] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard/opportunities?pageSize=50&sortBy=newest`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      const d = await res.json();
      setAll(d.opportunities || []);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, assetClass, sortBy]);

  const assetClasses = useMemo(() => {
    const set = new Map();
    for (const o of all) { const l = assetLabel(o); if (l) set.set(l, true); }
    return [...set.keys()].sort();
  }, [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = all.filter((o) => {
      if (assetClass && assetLabel(o) !== assetClass) return false;
      if (!q) return true;
      const hay = `${o.title || ""} ${o.summary || ""} ${o.spv?.property?.city || ""} ${o.spv?.property?.country || ""}`.toLowerCase();
      return hay.includes(q);
    });
    list = [...list];
    if (sortBy === "yield") list.sort((a, b) => parseFloat(b.targetYieldPct || 0) - parseFloat(a.targetYieldPct || 0));
    else if (sortBy === "closing") list.sort((a, b) => pctFunded(b) - pctFunded(a));
    else if (sortBy === "oldest") list.reverse();
    return list;
  }, [all, search, assetClass, sortBy]);

  const sym = SYM[all[0]?.spv?.currency] || "£";
  const kpis = useMemo(() => {
    const live = all.length;
    const yields = all.map((o) => parseFloat(o.targetYieldPct || 0)).filter((y) => y > 0);
    const avgYield = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;
    const totalTarget = all.reduce((a, o) => a + Number(o.spv?.targetRaiseAmount || 0), 0);
    const totalRaised = all.reduce((a, o) => a + (o.spv?.unitsAllocated ?? 0) * Number(o.spv?.unitPrice || 0), 0);
    return { live, avgYield, totalTarget, totalRaised };
  }, [all]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const featured = page === 1 ? pageItems[0] : null;
  const gridItems = page === 1 ? pageItems.slice(1) : pageItems;

  function toggleSave(id) {
    setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="space-y-7">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight tracking-[-0.025em]" style={{ color: C.ink }}>
            Investment Catalog
          </h1>
          <p className="text-[13.5px] mt-1.5 max-w-lg" style={{ color: C.secondary }}>
            Curated institutional-grade assets for diversified growth.
          </p>
        </div>

        {/* Controls — search lives in the topbar; these scope the results */}
        <div className="flex flex-wrap items-center gap-2">
          <SelectPill icon={Layers} value={assetClass} onChange={setAssetClass}
            options={[{ value: "", label: "Asset Class" }, ...assetClasses.map((a) => ({ value: a, label: a }))]} />
          <SelectPill value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} dark />
        </div>
      </motion.div>

      {/* ── KPI band ───────────────────────────────────────────────── */}
      {!loading && all.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building2,  label: "Live Opportunities", tone: C.goldDark, value: <CountUp value={kpis.live} /> },
            { icon: TrendingUp, label: "Avg. Target IRR",    tone: C.success,  value: <CountUp value={kpis.avgYield} format={(v) => `${v.toFixed(1)}%`} /> },
            { icon: Landmark,   label: "Capital Raising",                      value: <CountUp value={kpis.totalTarget} format={(v) => shortMoney(v, sym)} /> },
            { icon: Wallet,     label: "Committed",                            value: <CountUp value={kpis.totalRaised} format={(v) => shortMoney(v, sym)} /> },
          ].map((t, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}>
              <StatTile icon={t.icon} label={t.label} value={t.value} tone={t.tone} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && total > 0 && (
        <p className="text-[12px] font-medium -mt-2" style={{ color: C.muted }}>
          {total} opportunit{total === 1 ? "y" : "ies"}{assetClass ? ` · ${assetClass}` : ""}
        </p>
      )}

      {error && (
        <div className="p-4 text-[13px] rounded-xl" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.danger}26`, color: C.danger }}>{error}</div>
      )}

      {loading && <SkeletonLayout />}
      {!loading && total === 0 && !error && <EmptyState hasFilter={!!(search || assetClass)} />}

      {/* ── Featured ───────────────────────────────────────────────── */}
      {!loading && featured && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.05 }}>
          <FeaturedCard opp={featured} saved={saved.has(featured.id)} onSave={() => toggleSave(featured.id)} />
        </motion.div>
      )}

      {/* ── Grid ───────────────────────────────────────────────────── */}
      {!loading && gridItems.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridItems.map((o) => (
            <motion.div key={o.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}>
              <CatalogCard opp={o} saved={saved.has(o.id)} onSave={() => toggleSave(o.id)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-medium" style={{ color: C.muted }}>Page <span style={NUM}>{page}</span> of <span style={NUM}>{totalPages}</span></p>
          <div className="flex items-center gap-2">
            <PaginationBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={14} /></PaginationBtn>
            <PaginationBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={14} /></PaginationBtn>
          </div>
        </div>
      )}

      {/* ── CTA banner (kept) ──────────────────────────────────────── */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
          className="rounded-2xl overflow-hidden relative" style={{ backgroundColor: C.dark }}>
          <div className="px-8 sm:px-12 py-10 sm:py-14 relative z-10 max-w-2xl">
            <h2 className="text-[30px] sm:text-[38px] font-bold leading-[1.05] tracking-[-0.02em] mb-3.5" style={{ color: "#fff" }}>
              Ready to diversify your portfolio?
            </h2>
            <p className="text-[13.5px] leading-relaxed mb-7 max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
              Our advisors are available for private consultations to discuss your investment strategy and specific fund requirements.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:invest@brickandwealth.com" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: "#fff", color: C.dark, textDecoration: "none" }}>
                <Mail size={14} strokeWidth={2.2} /> Schedule a Call
              </a>
              <Link href="/dashboard/documents" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.22)", color: "#fff", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Download size={14} strokeWidth={2.2} /> Download Portfolio Guide
              </Link>
            </div>
          </div>
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
            <div className="w-44 h-44 rounded-[28px] grid place-items-center" style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}>
              <div className="w-28 h-28 rounded-[20px] grid place-items-center" style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}>
                <Sparkles size={40} strokeWidth={1} style={{ color: "rgba(255,255,255,0.14)" }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── KPI tile ──────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(11,20,34,0.04)" }}>
      <span className="w-10 h-10 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: tone ? `${tone}14` : C.bg }}>
        <Icon size={17} strokeWidth={2} style={{ color: tone || C.secondary }} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.13em] uppercase" style={{ color: C.muted }}>{label}</p>
        <p className="text-[20px] font-bold leading-tight mt-0.5" style={{ color: C.ink, ...NUM }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Select pill ───────────────────────────────────────────────── */
function SelectPill({ icon: Icon, value, onChange, options, dark }) {
  return (
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? "rgba(255,255,255,0.7)" : C.muted }} />}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`h-10 ${Icon ? "pl-9" : "pl-4"} pr-9 text-[12.5px] font-semibold outline-none cursor-pointer appearance-none rounded-[10px]`}
        style={{ backgroundColor: dark ? C.dark : C.surface, border: `1px solid ${dark ? C.dark : C.border}`, color: dark ? "#fff" : C.ink, fontFamily: "inherit" }}>
        {options.map((o) => <option key={o.value} value={o.value} style={{ color: C.ink }}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dark ? "rgba(255,255,255,0.7)" : C.muted }} />
    </div>
  );
}

/* ─── Save button ───────────────────────────────────────────────── */
function SaveBtn({ saved, onSave, size = 48 }) {
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); onSave(); }} aria-label={saved ? "Saved" : "Save"}
      className="grid place-items-center rounded-xl flex-shrink-0 transition-colors"
      style={{ width: size, height: size, border: `1px solid ${saved ? C.gold : C.borderMid}`, backgroundColor: saved ? C.goldDim : C.surface, cursor: "pointer" }}>
      <Heart size={17} strokeWidth={2} style={{ color: saved ? C.goldDark : C.muted, fill: saved ? C.gold : "transparent" }} />
    </button>
  );
}

/* ─── Featured (horizontal) card ────────────────────────────────── */
function FeaturedCard({ opp: o, saved, onSave }) {
  const property = o.spv?.property;
  const heroUrl = o.heroImageUrl || property?.images?.[0]?.fileUrl;
  const sym = SYM[o.spv?.currency] || "£";
  const pct = pctFunded(o);
  const target = Number(o.spv?.targetRaiseAmount || 0);
  const allocated = (o.spv?.unitsAllocated ?? 0) * Number(o.spv?.unitPrice || 0);
  const asset = assetLabel(o);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 14px rgba(11,20,34,0.06)" }}>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ minHeight: 280, backgroundColor: C.goldLight }}>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={o.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ color: C.gold }}><ImageIcon size={44} strokeWidth={1} /></div>
        )}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase rounded-lg" style={{ backgroundColor: C.dark, color: "#fff" }}>Featured Asset</span>
          <span className="px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase rounded-lg" style={{ backgroundColor: C.success, color: "#fff" }}>{tagFor(o)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8 flex flex-col">
        <h2 className="text-[24px] sm:text-[28px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>{o.title}</h2>
        {(property?.city || asset) && (
          <p className="flex items-center gap-1.5 text-[12px] mt-1.5" style={{ color: C.muted }}>
            <MapPin size={12} />{[property?.city, property?.country].filter(Boolean).join(", ")}{asset ? ` · ${asset}` : ""}
          </p>
        )}
        {o.summary && <p className="text-[13px] leading-relaxed mt-3 line-clamp-3" style={{ color: C.secondary }}>{o.summary}</p>}

        <div className="grid grid-cols-2 gap-4 my-5 py-5" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: C.muted }}>Target IRR</p>
            <p className="text-[24px] font-bold leading-none" style={{ color: C.success, ...NUM }}>{o.targetYieldPct ? `${o.targetYieldPct}%` : "—"}</p>
          </div>
          <div>
            <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: C.muted }}>Min. Entry</p>
            <p className="text-[24px] font-bold leading-none" style={{ color: C.ink, ...NUM }}>{minEntry(o.spv?.unitPrice, sym)}</p>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between text-[11.5px] mb-1.5">
            <span className="font-bold tracking-[0.04em] uppercase" style={{ color: C.muted }}>Funding Progress</span>
            <span className="font-bold" style={{ color: C.ink, ...NUM }}>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.track }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: EASE, delay: 0.3 }}
              className="h-full rounded-full" style={{ backgroundColor: C.ink }} />
          </div>
          {target > 0 && (
            <p className="text-[11.5px] mt-2" style={{ color: C.muted, ...NUM }}>
              {shortMoney(allocated, sym)} of {shortMoney(target, sym)} Raised
            </p>
          )}
          <div className="flex items-center gap-3 mt-5">
            <Link href={`/dashboard/opportunities/${o.id}`} className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[13.5px] font-bold"
              style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
              <FileText size={15} strokeWidth={2} /> Review Brief
            </Link>
            <SaveBtn saved={saved} onSave={onSave} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Catalog grid card ─────────────────────────────────────────── */
function CatalogCard({ opp: o, saved, onSave }) {
  const property = o.spv?.property;
  const heroUrl = o.heroImageUrl || property?.images?.[0]?.fileUrl;
  const sym = SYM[o.spv?.currency] || "£";
  const pct = pctFunded(o);
  const asset = assetLabel(o);
  const closing = pct >= 90;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full group"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(11,20,34,0.05)", transition: "box-shadow .25s, border-color .25s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(11,20,34,0.10)"; e.currentTarget.style.borderColor = `${C.gold}40`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(11,20,34,0.05)"; e.currentTarget.style.borderColor = C.border; }}>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 168, backgroundColor: C.goldLight, flexShrink: 0 }}>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={o.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ color: C.gold }}><ImageIcon size={30} strokeWidth={1} /></div>
        )}
        <span className="absolute top-3 right-3 px-2.5 py-1 text-[9.5px] font-bold tracking-[0.1em] uppercase rounded-md backdrop-blur-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", color: C.ink }}>{tagFor(o)}</span>
        <button type="button" onClick={(e) => { e.preventDefault(); onSave(); }} aria-label="Save"
          className="absolute top-3 left-3 w-8 h-8 grid place-items-center rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer" }}>
          <Heart size={14} strokeWidth={2} style={{ color: saved ? C.goldDark : C.muted, fill: saved ? C.gold : "transparent" }} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-[16px] font-bold leading-snug" style={{ color: C.ink }}>{o.title}</h3>
        {o.summary
          ? <p className="text-[12px] leading-relaxed mt-1.5 line-clamp-2" style={{ color: C.secondary }}>{o.summary}</p>
          : (asset || property?.city) && <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>{[asset, property?.city].filter(Boolean).join(" · ")}</p>}

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="p-3 rounded-xl" style={{ border: `1px solid ${C.border}`, backgroundColor: C.bg }}>
            <p className="text-[9px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: C.muted }}>Target IRR</p>
            <p className="text-[15px] font-bold leading-none" style={{ color: C.success, ...NUM }}>{o.targetYieldPct ? `${o.targetYieldPct}%` : "—"}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ border: `1px solid ${C.border}`, backgroundColor: C.bg }}>
            <p className="text-[9px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: C.muted }}>Entry</p>
            <p className="text-[15px] font-bold leading-none" style={{ color: C.ink, ...NUM }}>{minEntry(o.spv?.unitPrice, sym)}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10.5px] mb-1.5">
            <span className="font-bold tracking-[0.04em] uppercase" style={{ color: C.muted }}>Allocation</span>
            <span className="font-bold" style={{ color: closing ? C.danger : C.ink, ...NUM }}>{pct.toFixed(0)}% Filled</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.track }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: EASE, delay: 0.25 }}
              className="h-full rounded-full" style={{ backgroundColor: closing ? C.danger : C.success }} />
          </div>
          {closing && <p className="text-[9.5px] font-bold tracking-[0.1em] uppercase mt-1.5" style={{ color: C.danger }}>Closing soon</p>}
        </div>

        <Link href={`/dashboard/opportunities/${o.id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[12.5px] font-bold transition-colors"
          style={{ border: `1.5px solid ${C.borderMid}`, color: C.ink, textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dark; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.dark; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.ink; e.currentTarget.style.borderColor = C.borderMid; }}>
          <Eye size={14} strokeWidth={2} /> Review Brief
        </Link>
      </div>
    </div>
  );
}

/* ─── Pagination ────────────────────────────────────────────────── */
function PaginationBtn({ children, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="h-9 w-9 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, cursor: disabled ? "not-allowed" : "pointer", color: C.ink }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = `${C.gold}80`; e.currentTarget.style.backgroundColor = C.goldLight; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.backgroundColor = C.surface; }}>
      {children}
    </button>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────── */
function SkeletonLayout() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="animate-pulse" style={{ minHeight: 280, backgroundColor: "rgba(11,20,34,0.05)" }} />
        <div className="p-8 space-y-4">
          <div className="h-7 w-2/3 rounded-lg animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.06)" }} />
          <div className="h-4 w-1/2 rounded animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.04)" }} />
          <div className="h-16 w-full rounded-lg animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.04)" }} />
          <div className="h-2 w-full rounded-full animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.05)" }} />
          <div className="h-12 w-full rounded-xl animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.06)" }} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="animate-pulse" style={{ height: 168, backgroundColor: "rgba(11,20,34,0.05)" }} />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.06)" }} />
              <div className="h-3 w-full rounded animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.04)" }} />
              <div className="h-12 w-full rounded-lg animate-pulse" style={{ backgroundColor: "rgba(11,20,34,0.04)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty ─────────────────────────────────────────────────────── */
function EmptyState({ hasFilter }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
      className="py-20 px-6 text-center rounded-2xl" style={{ backgroundColor: C.surface, border: `1px dashed ${C.borderMid}` }}>
      <div className="w-14 h-14 grid place-items-center mx-auto mb-5 rounded-2xl" style={{ backgroundColor: C.goldDim }}>
        <Sparkles size={22} strokeWidth={1.5} style={{ color: C.gold }} />
      </div>
      <p className="text-[20px] font-bold mb-1.5" style={{ color: C.ink }}>{hasFilter ? "No matches found" : "No opportunities right now"}</p>
      <p className="text-[13px] max-w-md mx-auto leading-relaxed" style={{ color: C.secondary }}>
        {hasFilter ? "Try adjusting your search or asset-class filter." : "We're curating exclusive investment opportunities. Check back soon."}
      </p>
    </motion.div>
  );
}
