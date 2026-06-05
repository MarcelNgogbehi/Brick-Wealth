"use client";

// app/admin/investors/page.jsx
//
// Investor Management CRM — searchable, filterable, paginated.
// Per-investor capital figures (committed / invested / unfunded) are REAL,
// aggregated server-side in listInvestors(). No fabricated numbers.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, animate, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  AlertCircle, Users, CheckCircle2, Clock, XCircle, Flag, Link2,
  UserPlus, ShieldCheck, X, ArrowRight, Landmark,
} from "lucide-react";

// ── Brand system (matches the admin dashboard) ────────────────────────────────
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

// Single source of truth for the table grid — header and rows share it,
// so columns can never drift out of alignment.
const COLS = "24px minmax(0,2.3fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr) 0.8fr";

const KYC_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "pending_review", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "last_seen", label: "Last seen" },
];
const AVATAR_TINTS = [
  { bg: "#E7F1EC", fg: "#1C7A5E" }, { bg: "#EAF0FA", fg: "#2A4A7F" },
  { bg: "#F4ECD8", fg: "#8F6E26" }, { bg: "#F0ECF6", fg: "#6A4C8C" },
  { bg: "#EAF3F3", fg: "#1F6E73" }, { bg: "#FBEDE8", fg: "#9A5A2E" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function money(n) {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e9) return "£" + (v / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return "£" + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return "£" + (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
  return "£" + Math.round(v).toLocaleString();
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
function avatarTint(seed) {
  let h = 0; for (const ch of String(seed || "?")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}
function CountUp({ value = 0, format }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, value, { duration: 0.8, ease: EASE, onUpdate: setN }); return () => c.stop(); }, [value]);
  return <span style={NUM}>{format ? format(n) : Math.round(n).toLocaleString()}</span>;
}
function pageWindow(current, totalPages) {
  const out = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) out.push(i); return out; }
  out.push(1);
  if (current > 3) out.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) out.push(i);
  if (current < totalPages - 2) out.push("…");
  out.push(totalPages);
  return out;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function KycPill({ status }) {
  const cfg = {
    not_started:    { label: "Not started", c: C.ink3,  bg: C.hair2 },
    pending_review: { label: "Pending KYC", c: C.amber, bg: C.amberSoft, Icon: Clock },
    approved:       { label: "Accredited",  c: C.pos,   bg: C.posSoft, Icon: CheckCircle2 },
    rejected:       { label: "Rejected",    c: C.alert, bg: C.alertSoft, Icon: XCircle },
  }[status] || { label: status || "—", c: C.ink3, bg: C.hair2 };
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color: cfg.c, backgroundColor: cfg.bg }}>
      {Icon && <Icon size={11} />}{cfg.label}
    </span>
  );
}
function Money({ value, tone }) {
  if (!value) return <span style={{ color: C.slate }}>—</span>;
  return <span className="font-bold" style={{ color: tone || C.ink, ...NUM }}>{money(value)}</span>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ loading, icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl transition-shadow hover:shadow-[0_8px_22px_rgba(11,18,32,0.06)]"
      style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      <span className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: accent ? C.goldWash : C.hair2 }}>
        <Icon size={18} strokeWidth={2} style={{ color: accent ? C.goldDeep : C.ink2 }} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: C.ink3 }}>{label}</div>
        {loading
          ? <div className="h-6 w-16 mt-1 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
          : <div className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: C.ink, ...NUM }}><CountUp value={value} /></div>}
      </div>
    </div>
  );
}

// ── Filter rail ───────────────────────────────────────────────────────────────
function FilterRail({ kycStatus, setKycStatus, flagged, setFlagged, sortBy, setSortBy, onReset, aum, occupancy, statsLoading }) {
  const hasFilters = !!(kycStatus || flagged || sortBy !== "newest");
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-2 text-[13.5px] font-bold" style={{ color: C.ink }}>
            <SlidersHorizontal size={15} style={{ color: C.gold }} /> Filters
          </span>
          {hasFilters && (
            <button type="button" onClick={onReset} className="text-[12px] font-semibold" style={{ color: C.gold, background: "none", border: "none", cursor: "pointer" }}>Reset</button>
          )}
        </div>

        <div className="mb-5">
          <div className="text-[10.5px] font-bold tracking-[0.1em] uppercase mb-2.5" style={{ color: C.ink3 }}>KYC Status</div>
          <div className="space-y-1">
            {KYC_OPTIONS.map((o) => {
              const active = kycStatus === o.value;
              return (
                <button key={o.value} type="button" onClick={() => setKycStatus(o.value)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-left transition-colors"
                  style={{ backgroundColor: active ? C.goldWash : "transparent", color: active ? C.goldDeep : C.ink2, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <span className="w-4 h-4 rounded-full grid place-items-center flex-shrink-0"
                    style={{ border: `1.5px solid ${active ? C.gold : C.slate}`, backgroundColor: active ? C.gold : "transparent" }}>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[10.5px] font-bold tracking-[0.1em] uppercase mb-2.5" style={{ color: C.ink3 }}>Sort by</div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 pl-3 pr-9 text-[13px] rounded-lg outline-none cursor-pointer appearance-none font-medium"
              style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: C.ink3 }} />
          </div>
        </div>

        <div>
          <div className="text-[10.5px] font-bold tracking-[0.1em] uppercase mb-2.5" style={{ color: C.ink3 }}>Compliance</div>
          <button type="button" onClick={() => setFlagged((v) => !v)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-left transition-colors"
            style={{ backgroundColor: flagged ? C.alertSoft : "transparent", color: flagged ? C.alert : C.ink2, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <span className="w-4 h-4 rounded grid place-items-center flex-shrink-0"
              style={{ border: `1.5px solid ${flagged ? C.alert : C.slate}`, backgroundColor: flagged ? C.alert : "transparent" }}>
              {flagged && <CheckCircle2 size={11} className="text-white" />}
            </span>
            <Flag size={13} style={{ color: flagged ? C.alert : C.slate }} /> Flagged for review
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: `linear-gradient(150deg, ${C.obsidian} 0%, #0c1830 100%)` }}>
        <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${C.gold}, transparent 80%)` }} />
        <div className="flex items-center gap-2 mb-3">
          <Landmark size={14} style={{ color: C.gold }} />
          <span className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Capital Under Mgmt</span>
        </div>
        {statsLoading
          ? <div className="h-9 w-32 rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
          : <div className="text-[30px] font-bold leading-none tracking-[-0.02em]" style={{ color: "#fff", ...NUM }}>{money(aum)}</div>}
        <p className="text-[12px] mt-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>{occupancy}% portfolio occupancy</p>
      </div>
    </div>
  );
}

// ── Investor row (single shared grid + stretched link) ────────────────────────
function InvestorRow({ inv, selected, onToggle }) {
  const [h, setH] = useState(false);
  const tint = inv.avatarUrl ? null : avatarTint(inv.fullName || inv.username);
  const fundedPct = inv.committed > 0 ? Math.min(Math.round((inv.invested / inv.committed) * 100), 100) : 0;
  const rowBg = selected ? "#FBF8EF" : h ? "#FBFBFA" : "transparent";

  return (
    <div className="relative flex flex-col gap-2 md:grid md:gap-3 md:items-center px-4 sm:px-5 py-3.5 transition-colors"
      style={{ gridTemplateColumns: COLS, borderBottom: `1px solid ${C.hair2}`, backgroundColor: rowBg }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {selected && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: C.gold }} />}

      {/* checkbox (desktop) — above the stretched link */}
      <button type="button" aria-label={selected ? "Deselect" : "Select"} onClick={() => onToggle(inv.id)}
        className="hidden md:grid place-items-center relative z-10 w-[18px] h-[18px] rounded focus-visible:outline-none focus-visible:ring-2"
        style={{ border: `1.5px solid ${selected ? C.navy : C.slate}`, backgroundColor: selected ? C.navy : "transparent", cursor: "pointer" }}>
        {selected && <CheckCircle2 size={12} className="text-white" />}
      </button>

      {/* investor entity — carries the stretched link (after:inset-0) */}
      <Link href={`/admin/investors/${inv.id}`} aria-label={`Open ${inv.fullName}`}
        className="flex items-center gap-3 min-w-0 rounded-lg after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2"
        style={{ textDecoration: "none" }}>
        {inv.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={inv.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ backgroundColor: C.navy }} />
        ) : (
          <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold"
            style={{ backgroundColor: tint.bg, color: tint.fg }}>
            {getInitials(inv.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[13px] font-bold truncate flex items-center gap-1.5" style={{ color: C.ink }}>
            {inv.fullName}
            {inv.flaggedForReview && <Flag size={11} style={{ color: C.alert }} />}
            {inv.referredById && <Link2 size={10} style={{ color: C.gold }} />}
          </div>
          <div className="text-[11.5px] truncate" style={{ color: C.ink3 }}>
            @{inv.username}{inv.country ? ` · ${inv.country}` : ""}
          </div>
        </div>
      </Link>

      {/* status */}
      <div className="hidden md:flex items-center gap-2">
        <KycPill status={inv.kycStatus} />
        <span className="w-1.5 h-1.5 rounded-full" title={inv.accountActivated ? "Activated" : "Not activated"}
          style={{ backgroundColor: inv.accountActivated ? C.pos : C.slate }} />
      </div>

      {/* committed */}
      <div className="hidden md:block text-right text-[13px]"><Money value={inv.committed} /></div>
      {/* invested */}
      <div className="hidden md:block text-right text-[13px]"><Money value={inv.invested} tone={C.pos} /></div>

      {/* unfunded + funding micro-bar */}
      <div className="hidden md:block text-right">
        <div className="text-[13px]"><Money value={inv.unfunded} tone={C.amber} /></div>
        {inv.committed > 0 && (
          <div className="mt-1.5 h-[3px] rounded-full overflow-hidden ml-auto" style={{ backgroundColor: C.hair2, maxWidth: 72 }}
            title={`${fundedPct}% funded`}>
            <div className="h-full rounded-full" style={{ width: `${fundedPct}%`, backgroundColor: C.pos }} />
          </div>
        )}
      </div>

      {/* joined + arrow */}
      <div className="hidden md:flex items-center justify-end gap-1.5 text-[11.5px]" style={{ color: C.ink3 }}>
        <span style={NUM}>{formatDate(inv.createdAt)}</span>
        <ArrowRight size={13} style={{ color: h ? C.gold : C.slate, transition: "color .15s" }} />
      </div>

      {/* mobile money strip */}
      <div className="md:hidden flex items-center gap-3 flex-wrap">
        <KycPill status={inv.kycStatus} />
        <span className="text-[12px]"><Money value={inv.invested} tone={C.pos} /> <span className="font-normal" style={{ color: C.ink3 }}>invested</span></span>
        {inv.committed > 0 && <span className="text-[12px]" style={{ color: C.ink3, ...NUM }}>· {money(inv.committed)} committed</span>}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid items-center gap-3 px-4 sm:px-5 py-3.5" style={{ gridTemplateColumns: COLS, borderBottom: `1px solid ${C.hair2}` }}>
      <span />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: C.hair2 }} />
        <div className="space-y-1.5"><div className="h-3 w-28 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-20 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div>
      </div>
      <div className="h-5 w-24 rounded-full animate-pulse" style={{ backgroundColor: C.hair2 }} />
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-3 w-12 ml-auto rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />)}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InvestorsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchDebounced, setSearchDebounced] = useState(search);
  const [kycStatus, setKycStatus] = useState(searchParams.get("kycStatus") || "");
  const [flagged, setFlagged] = useState(searchParams.get("flagged") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [selected, setSelected] = useState(() => new Set());
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [searchDebounced, kycStatus, flagged, sortBy]);

  useEffect(() => {
    let dead = false;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!dead && d) { setStats(d.stats || null); setInsights(d.insights || null); } })
      .catch(() => {})
      .finally(() => { if (!dead) setStatsLoading(false); });
    return () => { dead = true; };
  }, []);

  const loadInvestors = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (kycStatus) params.set("kycStatus", kycStatus);
      if (flagged) params.set("flagged", "true");
      if (sortBy) params.set("sortBy", sortBy);
      params.set("page", String(page));
      params.set("pageSize", "20");
      const res = await fetch(`/api/admin/investors?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load investors");
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [searchDebounced, kycStatus, flagged, sortBy, page]);

  useEffect(() => { loadInvestors(); }, [loadInvestors]);

  const investors = result?.investors || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 0;

  const totalInvestors = stats?.totalInvestors ?? 0;
  const activated = stats?.activatedInvestors ?? 0;
  const pendingKyc = stats?.pendingKyc ?? 0;
  const newSignups7d = stats?.newSignups7d ?? 0;
  const aum = insights?.aum ?? 0;
  const occupancy = insights?.occupancyPct ?? 0;

  function toggle(id) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function reset() { setSearch(""); setKycStatus(""); setFlagged(false); setSortBy("newest"); }

  // Active-filter chips
  const chips = [];
  if (searchDebounced) chips.push({ key: "search", label: `“${searchDebounced}”`, clear: () => setSearch("") });
  if (kycStatus) chips.push({ key: "kyc", label: KYC_OPTIONS.find((o) => o.value === kycStatus)?.label, clear: () => setKycStatus("") });
  if (flagged) chips.push({ key: "flag", label: "Flagged", clear: () => setFlagged(false) });
  if (sortBy !== "newest") chips.push({ key: "sort", label: SORT_OPTIONS.find((o) => o.value === sortBy)?.label, clear: () => setSortBy("newest") });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Investor Management</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Centralised command for investor relations, capital &amp; compliance.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.pos }} />
          <span className="text-[12px] font-semibold" style={{ color: C.ink2, ...NUM }}>{activated.toLocaleString()} Active</span>
          <span style={{ color: C.hair }}>|</span>
          <span className="text-[12px] font-semibold" style={{ color: pendingKyc > 0 ? C.amber : C.ink3, ...NUM }}>{pendingKyc} Pending KYC</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={statsLoading} icon={Users} label="Total Investors" value={totalInvestors} />
        <StatCard loading={statsLoading} icon={CheckCircle2} label="Activated" value={activated} accent />
        <StatCard loading={statsLoading} icon={ShieldCheck} label="Pending KYC" value={pendingKyc} />
        <StatCard loading={statsLoading} icon={UserPlus} label="New This Week" value={newSignups7d} />
      </div>

      {/* Body: rail + table */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <FilterRail kycStatus={kycStatus} setKycStatus={setKycStatus} flagged={flagged} setFlagged={setFlagged}
              sortBy={sortBy} setSortBy={setSortBy} onReset={reset} aum={aum} occupancy={occupancy} statsLoading={statsLoading} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or username…"
                className="w-full h-11 pl-10 pr-9 text-[13.5px] rounded-xl outline-none focus:border-[#B8923C] transition-colors"
                style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }} />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded-full"
                  style={{ backgroundColor: C.hair2, border: "none", cursor: "pointer", color: C.ink3 }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setRailOpen((v) => !v)}
              className="lg:hidden h-11 px-3.5 inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold"
              style={{ backgroundColor: chips.length ? C.goldWash : C.paper, color: chips.length ? C.goldDeep : C.ink2, border: `1px solid ${chips.length ? C.gold + "55" : C.hair}`, cursor: "pointer" }}>
              <SlidersHorizontal size={15} /> Filters{chips.length ? ` · ${chips.length}` : ""}
            </button>
          </div>

          {/* Mobile rail */}
          <AnimatePresence>
            {railOpen && (
              <motion.div className="lg:hidden overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
                <div className="mb-4">
                  <FilterRail kycStatus={kycStatus} setKycStatus={setKycStatus} flagged={flagged} setFlagged={setFlagged}
                    sortBy={sortBy} setSortBy={setSortBy} onReset={reset} aum={aum} occupancy={occupancy} statsLoading={statsLoading} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {chips.map((c) => (
                <button key={c.key} type="button" onClick={c.clear}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-2 h-7 rounded-full text-[11.5px] font-semibold transition-colors"
                  style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink2, cursor: "pointer" }}>
                  {c.label}<X size={11} style={{ color: C.ink3 }} />
                </button>
              ))}
              <button type="button" onClick={reset} className="text-[11.5px] font-semibold px-1.5" style={{ color: C.gold, background: "none", border: "none", cursor: "pointer" }}>Clear all</button>
            </div>
          )}

          {/* Selection bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between px-4 h-11 mb-3 rounded-xl" style={{ backgroundColor: C.navy, color: "#fff" }}>
                <span className="text-[12.5px] font-semibold" style={NUM}>{selected.size} selected</span>
                <button type="button" onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", cursor: "pointer" }}><X size={13} /> Clear</button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}>
              <AlertCircle size={16} style={{ color: C.alert }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: C.alert }}>Couldn’t load investors</p>
                <p className="text-[12px]" style={{ color: C.ink2 }}>{error}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
            <div className="hidden md:grid items-center gap-3 px-4 sm:px-5 py-3" style={{ gridTemplateColumns: COLS, backgroundColor: C.canvas, borderBottom: `1px solid ${C.hair}` }}>
              <span />
              {["Investor Entity", "Status", "Committed", "Invested", "Unfunded", "Joined"].map((hd, i) => (
                <span key={hd} className={`text-[10px] font-bold tracking-[0.1em] uppercase ${i >= 2 ? "text-right" : ""}`} style={{ color: C.ink3 }}>{hd}</span>
              ))}
            </div>

            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : investors.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Users size={30} className="mx-auto mb-3" style={{ color: C.slate }} strokeWidth={1.5} />
                <p className="text-[14px] font-bold mb-1" style={{ color: C.ink }}>{chips.length ? "No matching investors" : "No investors yet"}</p>
                <p className="text-[12.5px]" style={{ color: C.ink3 }}>{chips.length ? "Try adjusting your search or filters." : "Investors appear here once they register."}</p>
                {chips.length > 0 && (
                  <button type="button" onClick={reset} className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-[12.5px] font-semibold" style={{ backgroundColor: C.navy, color: "#fff", border: "none", cursor: "pointer" }}>Clear filters</button>
                )}
              </div>
            ) : (
              investors.map((inv) => <InvestorRow key={inv.id} inv={inv} selected={selected.has(inv.id)} onToggle={toggle} />)
            )}
          </div>

          {/* Pagination */}
          {!loading && investors.length > 0 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="text-[12.5px]" style={{ color: C.ink3 }}>
                Showing <span className="font-semibold" style={{ color: C.ink2 }}>{investors.length}</span> of <span className="font-semibold" style={{ color: C.ink2, ...NUM }}>{total.toLocaleString()}</span> investors
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
                  {pageWindow(page, totalPages).map((p, i) => p === "…"
                    ? <span key={`e${i}`} className="px-1.5 text-[12.5px]" style={{ color: C.slate }}>…</span>
                    : <button key={p} type="button" onClick={() => setPage(p)}
                        className="min-w-[34px] h-[34px] px-1 grid place-items-center rounded-lg text-[12.5px] font-bold transition-colors"
                        style={{ backgroundColor: p === page ? C.navy : C.paper, color: p === page ? "#fff" : C.ink2, border: `1px solid ${p === page ? C.navy : C.hair}`, cursor: "pointer", ...NUM }}>{p}</button>)}
                  <PagerBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PagerBtn({ disabled, onClick, children }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="h-[34px] w-[34px] grid place-items-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink2, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
