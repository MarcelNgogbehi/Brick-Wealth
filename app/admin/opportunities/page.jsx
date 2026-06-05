"use client";

// app/admin/opportunities/page.jsx
//
// Opportunity Management — an Asset Pipeline board (grouped by status) with a
// Grid alternative. All figures are real (raise target, yield, allocation).

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Plus, Sparkles, Loader2, AlertCircle, LayoutGrid, Columns3,
  Image as ImageIcon, MapPin, ShieldCheck, FileText, TrendingUp,
} from "lucide-react";

// ── Brand system ──────────────────────────────────────────────────────────────
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
const CUR = { GBP: "£", USD: "$", EUR: "€" };

const COLUMNS = [
  { key: "draft",  label: "Draft",  dot: C.slate, bucket: ["draft"] },
  { key: "live",   label: "Live",   dot: C.pos,   bucket: ["live"] },
  { key: "funded", label: "Funded", dot: C.gold,  bucket: ["funded"] },
  { key: "closed", label: "Closed", dot: C.ink3,  bucket: ["closed", "archived"] },
];
const STATUS_STYLE = {
  draft:    { label: "Draft",    c: C.ink3,  bg: C.hair2 },
  live:     { label: "Live",     c: C.pos,   bg: C.posSoft },
  funded:   { label: "Funded",   c: C.goldDeep, bg: C.goldWash },
  closed:   { label: "Closed",   c: C.ink3,  bg: C.hair2 },
  archived: { label: "Archived", c: C.ink3,  bg: C.hair2 },
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

function oppMetrics(o) {
  const spv = o.spv;
  const target = spv?.targetRaiseAmount ? Number(spv.targetRaiseAmount) : 0;
  const allocated = (spv?.unitsAllocated ?? 0) * Number(spv?.unitPrice || 0);
  const pct = target > 0 ? Math.min(Math.round((allocated / target) * 100), 100) : 0;
  return { target, allocated, pct, cur: spv?.currency || "GBP" };
}

function OppCard({ o }) {
  const [h, setH] = useState(false);
  const spv = o.spv; const property = spv?.property;
  const heroUrl = o.heroImageUrl || property?.images?.[0]?.fileUrl;
  const st = STATUS_STYLE[o.status] || STATUS_STYLE.draft;
  const { target, pct, cur } = oppMetrics(o);
  const type = property?.propertyType?.replace(/_/g, " ");
  return (
    <Link href={`/admin/opportunities/${o.id}`} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="block rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: C.paper, border: `1px solid ${h ? C.gold + "55" : C.hair}`, boxShadow: h ? "0 8px 20px rgba(11,18,32,0.08)" : "0 1px 2px rgba(11,18,32,0.03)", textDecoration: "none" }}>
      <div className="relative aspect-[16/9]" style={{ backgroundColor: C.hair2 }}>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})` }}><ImageIcon size={26} style={{ color: "rgba(255,255,255,0.5)" }} /></div>
        )}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: st.bg, color: st.c }}>{st.label}</span>
        {o.targetYieldPct != null && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: "rgba(7,12,24,0.82)", color: C.gold, ...NUM }}>{o.targetYieldPct}% yield</span>
        )}
      </div>
      <div className="p-3.5">
        {type && <div className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: C.gold }}>{type}</div>}
        <h3 className="text-[13.5px] font-bold leading-snug line-clamp-2" style={{ color: C.ink }}>{o.title}</h3>
        {property?.city && <p className="text-[11.5px] mt-1 flex items-center gap-1 truncate" style={{ color: C.ink3 }}><MapPin size={11} />{property.city}</p>}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div><div className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: C.ink3 }}>Target raise</div><div className="text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{money(target, cur)}</div></div>
          <div><div className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: C.ink3 }}>Term</div><div className="text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{o.termMonths ? `${o.termMonths}mo` : "—"}</div></div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10.5px] mb-1"><span className="font-semibold" style={{ color: C.ink3 }}>Raised</span><span className="font-bold" style={{ color: C.ink, ...NUM }}>{pct}%</span></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.hair2 }}><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C.gold }} /></div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 text-[10.5px]" style={{ borderTop: `1px solid ${C.hair2}`, color: C.ink3 }}>
          <span className="inline-flex items-center gap-1"><FileText size={11} />{o._count?.documents ?? 0} docs</span>
          {o.requiresKyc && <><span>·</span><span className="inline-flex items-center gap-1 font-semibold" style={{ color: C.amber }}><ShieldCheck size={11} />KYC</span></>}
        </div>
      </div>
    </Link>
  );
}

export default function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [view, setView] = useState("board");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      params.set("page", "1"); params.set("pageSize", "100");
      const res = await fetch(`/api/admin/opportunities?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [searchDebounced]);
  useEffect(() => { load(); }, [load]);

  const opps = result?.opportunities || [];
  const total = result?.total || 0;
  const stats = useMemo(() => {
    const live = opps.filter((o) => o.status === "live").length;
    const funded = opps.filter((o) => o.status === "funded").length;
    const raise = opps.reduce((s, o) => s + (Number(o.spv?.targetRaiseAmount) || 0), 0);
    return { live, funded, raise };
  }, [opps]);
  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    for (const o of opps) {
      const col = COLUMNS.find((c) => c.bucket.includes(o.status)) || COLUMNS[0];
      map[col.key].push(o);
    }
    return map;
  }, [opps]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Opportunity Management</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>{loading ? "Loading…" : `Managing ${total} ${total === 1 ? "deal" : "deals"} across the pipeline`}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex p-0.5 rounded-xl" style={{ backgroundColor: C.hair2, border: `1px solid ${C.hair}` }}>
            {[{ k: "board", Icon: Columns3, label: "Board" }, { k: "grid", Icon: LayoutGrid, label: "Grid" }].map(({ k, Icon, label }) => (
              <button key={k} type="button" onClick={() => setView(k)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition-colors"
                style={{ backgroundColor: view === k ? C.paper : "transparent", color: view === k ? C.ink : C.ink3, boxShadow: view === k ? "0 1px 2px rgba(11,18,32,0.08)" : "none", border: "none", cursor: "pointer" }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <Link href="/admin/opportunities/new" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}>
            <Plus size={15} /> New Opportunity
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={Sparkles} label="Total Deals" value={total} accent />
        <StatCard loading={loading} icon={TrendingUp} label="Live" value={stats.live} />
        <StatCard loading={loading} icon={ShieldCheck} label="Funded" value={stats.funded} />
        <StatCard loading={loading} icon={TrendingUp} label="Pipeline Raise" value={money(stats.raise)} />
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, SPV or property…"
          className="w-full h-11 pl-10 pr-3 text-[13.5px] rounded-xl outline-none focus:border-[#B8923C] transition-colors"
          style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }} />
      </div>

      {error && (
        <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}>
          <AlertCircle size={16} style={{ color: C.alert }} /><p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl h-72 animate-pulse" style={{ backgroundColor: C.hair2 }} />)}
        </div>
      ) : opps.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-14 h-14 mx-auto mb-3 grid place-items-center rounded-2xl" style={{ background: C.hair2 }}><Sparkles size={26} style={{ color: C.ink3 }} strokeWidth={1.5} /></span>
          <p className="text-[15px] font-bold" style={{ color: C.ink }}>No opportunities yet</p>
          <p className="text-[12.5px] mt-1 mb-4" style={{ color: C.ink3 }}>Create one from an existing SPV to publish to investors.</p>
          <Link href="/admin/opportunities/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12.5px] font-semibold" style={{ background: C.navy, color: "#fff", textDecoration: "none" }}><Plus size={14} /> New Opportunity</Link>
        </div>
      ) : view === "board" ? (
        /* ── Pipeline board ── */
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {COLUMNS.map((col) => {
              const list = grouped[col.key];
              return (
                <div key={col.key} className="flex flex-col flex-shrink-0" style={{ width: 300 }}>
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                      <span className="text-[12.5px] font-bold" style={{ color: C.ink }}>{col.label}</span>
                      <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[10.5px] font-bold" style={{ backgroundColor: C.hair2, color: C.ink2, ...NUM }}>{list.length}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl p-2.5 flex-1 space-y-2.5" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair}`, minHeight: 200 }}>
                    {list.length === 0 ? (
                      <div className="grid place-items-center py-10 text-center"><p className="text-[11.5px]" style={{ color: C.slate }}>No deals</p></div>
                    ) : list.map((o, i) => (
                      <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: i * 0.03 }}>
                        <OppCard o={o} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {opps.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: Math.min(i * 0.02, 0.3) }}>
              <OppCard o={o} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
