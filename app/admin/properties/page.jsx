"use client";

// app/admin/properties/page.jsx
//
// Property Portfolio — premium card grid with live filters.

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Plus, Building2, MapPin, AlertCircle, ChevronLeft, ChevronRight,
  Image as ImageIcon, Link2, BedDouble, Bath, CheckCircle2, Layers,
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
const EASE = [0.16, 1, 0.3, 1];

const STATUS_FILTER = [
  { value: "", label: "All statuses" }, { value: "draft", label: "Draft" },
  { value: "active", label: "Active" }, { value: "sold", label: "Sold" },
];
const TYPE_FILTER = [
  { value: "", label: "All types" }, { value: "house", label: "House" }, { value: "flat", label: "Flat" },
  { value: "hmo", label: "HMO" }, { value: "commercial", label: "Commercial" }, { value: "mixed_use", label: "Mixed Use" }, { value: "land", label: "Land" },
];
const STATUS_STYLE = {
  draft:  { label: "Draft",  c: C.ink3, bg: "rgba(255,255,255,0.92)" },
  active: { label: "Active", c: C.pos,  bg: "rgba(231,241,236,0.95)" },
  sold:   { label: "Sold",   c: C.ink3, bg: "rgba(255,255,255,0.92)" },
};

function CountUp({ value = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => { let r; const t0 = performance.now(); const tick = (t) => { const p = Math.min((t - t0) / 800, 1); setN(value * (1 - Math.pow(1 - p, 3))); if (p < 1) r = requestAnimationFrame(tick); }; r = requestAnimationFrame(tick); return () => cancelAnimationFrame(r); }, [value]);
  return <span style={NUM}>{Math.round(n).toLocaleString()}</span>;
}
function StatCard({ loading, icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      <span className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: accent ? C.goldWash : C.hair2 }}>
        <Icon size={18} strokeWidth={2} style={{ color: accent ? C.goldDeep : C.ink2 }} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: C.ink3 }}>{label}</div>
        {loading ? <div className="h-6 w-12 mt-1 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
          : <div className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: C.ink, ...NUM }}><CountUp value={value} /></div>}
      </div>
    </div>
  );
}

function PropertyCard({ property: p }) {
  const [h, setH] = useState(false);
  const hero = p.images?.[0];
  const st = STATUS_STYLE[p.status] || STATUS_STYLE.draft;
  return (
    <Link href={`/admin/properties/${p.id}`} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="block rounded-2xl overflow-hidden transition-all"
      style={{ backgroundColor: C.paper, border: `1px solid ${h ? C.gold + "55" : C.hair}`, boxShadow: h ? "0 12px 26px rgba(11,18,32,0.10)" : "0 1px 2px rgba(11,18,32,0.03)", textDecoration: "none" }}>
      <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: C.hair2 }}>
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.fileUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500" style={{ transform: h ? "scale(1.04)" : "scale(1)" }} />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})` }}><ImageIcon size={28} style={{ color: "rgba(255,255,255,0.5)" }} /></div>
        )}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm" style={{ backgroundColor: st.bg, color: st.c }}>{st.label}</span>
        {p.spv && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 inline-flex items-center gap-1 rounded-md text-[10px] font-bold" style={{ background: "rgba(7,12,24,0.82)", color: C.gold }}><Link2 size={9} /> SPV</span>}
      </div>
      <div className="p-4">
        <h3 className="text-[14px] font-bold leading-snug truncate" style={{ color: C.ink }}>{p.title}</h3>
        <div className="flex items-center gap-1.5 mt-1 text-[12px] truncate" style={{ color: C.ink3 }}>
          <MapPin size={12} style={{ flexShrink: 0 }} /><span className="truncate">{p.city}, {p.country}</span>
        </div>
        <div className="flex items-center gap-2.5 mt-3 pt-3 text-[11px] font-semibold" style={{ borderTop: `1px solid ${C.hair2}`, color: C.ink2 }}>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase" style={{ backgroundColor: C.hair2, color: C.ink2 }}>{p.propertyType?.replace(/_/g, " ")}</span>
          {p.bedrooms != null && <span className="inline-flex items-center gap-1" style={{ color: C.ink3, ...NUM }}><BedDouble size={12} />{p.bedrooms}</span>}
          {p.bathrooms != null && <span className="inline-flex items-center gap-1" style={{ color: C.ink3, ...NUM }}><Bath size={12} />{p.bathrooms}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [searchDebounced, status, propertyType]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (status) params.set("status", status);
      if (propertyType) params.set("propertyType", propertyType);
      params.set("page", String(page)); params.set("pageSize", "24");
      const res = await fetch(`/api/admin/properties?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [searchDebounced, status, propertyType, page]);
  useEffect(() => { load(); }, [load]);

  const properties = result?.properties || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 0;
  const stats = useMemo(() => ({
    active: properties.filter((p) => p.status === "active").length,
    withSpv: properties.filter((p) => p.spv).length,
    types: new Set(properties.map((p) => p.propertyType).filter(Boolean)).size,
  }), [properties]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Property Portfolio</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>{loading ? "Loading…" : `${total.toLocaleString()} ${total === 1 ? "asset" : "assets"} under management`}</p>
        </div>
        <Link href="/admin/properties/new" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}><Plus size={15} /> New Property</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={Building2} label="Total Assets" value={total} accent />
        <StatCard loading={loading} icon={CheckCircle2} label="Active" value={stats.active} />
        <StatCard loading={loading} icon={Link2} label="Linked to SPV" value={stats.withSpv} />
        <StatCard loading={loading} icon={Layers} label="Asset Classes" value={stats.types} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, address, city or postcode…"
            className="w-full h-11 pl-10 pr-3 text-[13.5px] rounded-xl outline-none focus:border-[#B8923C] transition-colors" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 px-3.5 text-[13px] rounded-xl outline-none cursor-pointer font-medium" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }}>
          {STATUS_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-11 px-3.5 text-[13px] rounded-xl outline-none cursor-pointer font-medium" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }}>
          {TYPE_FILTER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {error && <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}><AlertCircle size={16} style={{ color: C.alert }} /><p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p></div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ backgroundColor: C.hair2 }} />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-14 h-14 mx-auto mb-3 grid place-items-center rounded-2xl" style={{ background: C.hair2 }}><Building2 size={26} style={{ color: C.ink3 }} strokeWidth={1.5} /></span>
          <p className="text-[15px] font-bold" style={{ color: C.ink }}>No properties found</p>
          <p className="text-[12.5px] mt-1 mb-4" style={{ color: C.ink3 }}>Add your first property to start building the portfolio.</p>
          <Link href="/admin/properties/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12.5px] font-semibold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}><Plus size={14} /> New Property</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: Math.min(i * 0.02, 0.3) }}>
              <PropertyCard property={p} />
            </motion.div>
          ))}
        </div>
      )}

      {!loading && properties.length > 0 && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
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
