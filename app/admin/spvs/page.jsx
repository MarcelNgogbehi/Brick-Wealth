"use client";

// app/admin/spvs/page.jsx
//
// SPV Management — premium table with live raise / allocation figures.

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, Plus, Briefcase, AlertCircle, ChevronLeft, ChevronRight,
  Building2, ArrowRight, Layers, TrendingUp, CheckCircle2,
} from "lucide-react";

const C = {
  obsidian: "#070C18", navy: "#0A1F44", navySoft: "#2A4A7F",
  gold: "#B8923C", goldDeep: "#8F6E26", goldWash: "#F4ECD8",
  ink: "#0B1220", ink2: "#3C4456", ink3: "#7B8497",
  hair: "#ECEBE6", hair2: "#F3F2EE", paper: "#FFFFFF", canvas: "#F5F5F2",
  slate: "#AEB4C0", slateSoft: "#EEF0F3",
  pos: "#1C7A5E", posSoft: "#E7F1EC",
  alert: "#9B2C2C", alertSoft: "#F7EAEA",
  amber: "#9A6B12", amberSoft: "#F6EEDD",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const CUR = { GBP: "£", USD: "$", EUR: "€" };
const COLS = "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1.8fr) minmax(0,1.4fr) minmax(0,1.3fr) 0.9fr 0.7fr";

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];
const STATUS_STYLE = {
  draft:  { label: "Draft",  c: C.ink3, bg: C.hair2 },
  active: { label: "Active", c: C.pos,  bg: C.posSoft },
  closed: { label: "Closed", c: C.ink3, bg: C.hair2 },
};

function money(n, cur = "GBP") {
  const sym = CUR[cur] || "£"; const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e9) return sym + (v / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return sym + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return sym + (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
  return sym + Math.round(v).toLocaleString();
}
function CountUp({ value = 0, format }) {
  const [n, setN] = useState(0);
  useEffect(() => { let r; const t0 = performance.now(); const tick = (t) => { const p = Math.min((t - t0) / 800, 1); setN(value * (1 - Math.pow(1 - p, 3))); if (p < 1) r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, [value]);
  return <span style={NUM}>{format ? format(n) : Math.round(n).toLocaleString()}</span>;
}
function StatCard({ loading, icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      <span className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: accent ? C.goldWash : C.hair2 }}>
        <Icon size={18} strokeWidth={2} style={{ color: accent ? C.goldDeep : C.ink2 }} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: C.ink3 }}>{label}</div>
        {loading ? <div className="h-6 w-14 mt-1 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
          : <div className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: C.ink, ...NUM }}>{typeof value === "number" ? <CountUp value={value} /> : value}</div>}
      </div>
    </div>
  );
}
function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { label: status || "—", c: C.ink3, bg: C.hair2 };
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ color: s.c, backgroundColor: s.bg }}>{s.label}</span>;
}

function SpvRow({ spv }) {
  const [h, setH] = useState(false);
  const pct = spv.totalUnits > 0 ? Math.min(Math.round((spv.unitsAllocated / spv.totalUnits) * 100), 100) : 0;
  return (
    <Link href={`/admin/spvs/${spv.id}`} className="block" style={{ textDecoration: "none" }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div className="flex flex-col gap-2 md:grid md:gap-3 md:items-center px-4 sm:px-5 py-3.5 transition-colors"
        style={{ gridTemplateColumns: COLS, borderBottom: `1px solid ${C.hair2}`, backgroundColor: h ? "#FBFBFA" : "transparent" }}>
        {/* SPV */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})` }}><Briefcase size={15} style={{ color: C.gold }} /></span>
          <div className="min-w-0">
            <div className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{spv.spvName}</div>
            <div className="text-[11px] truncate" style={{ color: C.ink3 }}>{spv.jurisdiction}</div>
          </div>
        </div>
        {/* Company no */}
        <div className="hidden md:block text-[12px] font-semibold truncate" style={{ color: C.ink2, ...NUM }}>{spv.companyNumber || "—"}</div>
        {/* Property */}
        <div className="hidden md:block text-[12.5px] min-w-0 truncate" style={{ color: C.ink2 }}>
          {spv.property ? <span className="truncate">{spv.property.title}<span style={{ color: C.ink3 }}> · {spv.property.city}</span></span> : <em style={{ color: C.slate }}>Unlinked</em>}
        </div>
        {/* Target raise */}
        <div className="hidden md:block text-right text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{money(spv.targetRaiseAmount, spv.currency)}</div>
        {/* Allocation */}
        <div className="hidden md:block">
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.hair2 }}><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C.gold }} /></div>
            <span className="text-[11.5px] font-semibold w-8 text-right" style={{ color: C.ink2, ...NUM }}>{pct}%</span>
          </div>
          <div className="text-[10.5px] text-right mt-0.5" style={{ color: C.ink3, ...NUM }}>{spv.unitsAllocated}/{spv.totalUnits} units</div>
        </div>
        {/* Status */}
        <div className="hidden md:flex items-center"><StatusPill status={spv.status} /></div>
        {/* Created + arrow */}
        <div className="hidden md:flex items-center justify-end gap-1.5 text-[11.5px]" style={{ color: C.ink3 }}>
          <span style={NUM}>{new Date(spv.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          <ArrowRight size={13} style={{ color: h ? C.gold : C.slate, transition: "color .15s" }} />
        </div>
        {/* Mobile strip */}
        <div className="md:hidden flex items-center gap-3 flex-wrap">
          <StatusPill status={spv.status} />
          <span className="text-[12px] font-bold" style={{ color: C.ink, ...NUM }}>{money(spv.targetRaiseAmount, spv.currency)}</span>
          <span className="text-[11.5px]" style={{ color: C.ink3, ...NUM }}>· {pct}% allocated</span>
        </div>
      </div>
    </Link>
  );
}

export default function SpvsPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [searchDebounced, status]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (status) params.set("status", status);
      params.set("page", String(page)); params.set("pageSize", "25");
      const res = await fetch(`/api/admin/spvs?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [searchDebounced, status, page]);
  useEffect(() => { load(); }, [load]);

  const spvs = result?.spvs || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 0;
  const stats = useMemo(() => ({
    active: spvs.filter((s) => s.status === "active").length,
    raise: spvs.reduce((a, s) => a + (Number(s.targetRaiseAmount) || 0), 0),
    avgAlloc: spvs.length ? Math.round(spvs.reduce((a, s) => a + (s.totalUnits > 0 ? (s.unitsAllocated / s.totalUnits) * 100 : 0), 0) / spvs.length) : 0,
  }), [spvs]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>SPV Management</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>{loading ? "Loading…" : `${total.toLocaleString()} ${total === 1 ? "vehicle" : "vehicles"} across the book`}</p>
        </div>
        <Link href="/admin/spvs/new" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}><Plus size={15} /> New SPV</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={Briefcase} label="Total SPVs" value={total} accent />
        <StatCard loading={loading} icon={CheckCircle2} label="Active" value={stats.active} />
        <StatCard loading={loading} icon={TrendingUp} label="Target Raise" value={money(stats.raise)} />
        <StatCard loading={loading} icon={Layers} label="Avg Allocation" value={`${stats.avgAlloc}%`} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by SPV name, company number or property…"
            className="w-full h-11 pl-10 pr-3 text-[13.5px] rounded-xl outline-none focus:border-[#B8923C] transition-colors" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 px-3.5 text-[13px] rounded-xl outline-none cursor-pointer font-medium" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit", minWidth: 160 }}>
          {STATUS_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}><AlertCircle size={16} style={{ color: C.alert }} /><p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p></div>}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
        <div className="hidden md:grid items-center gap-3 px-4 sm:px-5 py-3" style={{ gridTemplateColumns: COLS, backgroundColor: C.canvas, borderBottom: `1px solid ${C.hair}` }}>
          {["SPV", "Company No.", "Property", "Target Raise", "Allocation", "Status", "Created"].map((hd, i) => (
            <span key={hd} className={`text-[10px] font-bold tracking-[0.1em] uppercase ${i === 3 || i === 4 || i === 6 ? "text-right" : ""}`} style={{ color: C.ink3 }}>{hd}</span>
          ))}
        </div>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid items-center gap-3 px-5 py-3.5" style={{ gridTemplateColumns: COLS, borderBottom: `1px solid ${C.hair2}` }}>
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="space-y-1.5"><div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-16 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div></div>
              {[0, 1, 2, 3, 4, 5].map((j) => <div key={j} className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />)}
            </div>
          ))
        ) : spvs.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Briefcase size={30} className="mx-auto mb-3" style={{ color: C.slate }} strokeWidth={1.5} />
            <p className="text-[14px] font-bold" style={{ color: C.ink }}>No SPVs found</p>
            <p className="text-[12.5px] mt-1 mb-4" style={{ color: C.ink3 }}>Create an SPV to link a property with an investment vehicle.</p>
            <Link href="/admin/spvs/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12.5px] font-semibold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}><Plus size={14} /> New SPV</Link>
          </div>
        ) : spvs.map((spv) => <SpvRow key={spv.id} spv={spv} />)}
      </div>

      {!loading && spvs.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[12.5px]" style={{ color: C.ink3 }}>Page <span className="font-semibold" style={{ color: C.ink2, ...NUM }}>{page}</span> of <span style={NUM}>{totalPages}</span></div>
          <div className="flex items-center gap-1.5">
            <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
            <PagerBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
          </div>
        </div>
      )}
    </div>
  );
}
function PagerBtn({ disabled, onClick, children }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="h-[34px] w-[34px] grid place-items-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink2, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>;
}
