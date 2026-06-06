"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Calendar, ChevronLeft, ChevronRight, AlertCircle,
  Inbox, ArrowUpRight, Wallet, Building2, Clock, CheckCircle2,
} from "lucide-react";
import { CountUp, NUM, EASE, fadeUp, stagger } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#F0F1F5",
  ink:         "#060E1C",
  secondary:   "#4B5768",
  muted:       "#8896A8",
  faint:       "#AEB7C4",
  border:      "rgba(6,14,28,0.08)",
  borderMid:   "rgba(6,14,28,0.13)",
  track:       "#EDEFF3",
  surface:     "#FFFFFF",
  dark:        "#060E1C",
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
  goldDim:     "rgba(201,164,74,0.10)",
  goldLight:   "#F7F0E2",
  navy:        "#0A1F44",
  navyDeep:    "#06142F",
  green:       "#0A6E4F",
  greenDim:    "rgba(10,110,79,0.10)",
  greenBright: "#0A6E4F",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.08)",
  warning:     "#92400E",
  amber:       "#F59E0B",
  blue:        "#1E3A8A",
  blueDim:     "rgba(30,58,138,0.08)",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const PAGE_SIZE = 10;

const STATUS_META = {
  SUBMITTED:           { label: "Submitted",  dot: C.muted,       text: C.secondary },
  UNDER_REVIEW:        { label: "Processing", dot: C.amber,       text: C.warning   },
  VERIFIED:            { label: "Verified",   dot: "#3B82F6",     text: C.blue      },
  FUNDED:              { label: "Funded",     dot: "#3B82F6",     text: C.blue      },
  PARTIALLY_ALLOCATED: { label: "Active",     dot: C.greenBright, text: C.green     },
  FULLY_ALLOCATED:     { label: "Settled",    dot: C.greenBright, text: C.green     },
  REJECTED:            { label: "Rejected",   dot: C.danger,      text: C.danger    },
  CANCELLED:           { label: "Cancelled",  dot: C.muted,       text: C.muted     },
};

function TxBadge({ status }) {
  const cfg = {
    SUBMITTED:           { label: "SUBSCRIPTION", bg: C.ink,         fg: "#FFFFFF" },
    UNDER_REVIEW:        { label: "UNDER REVIEW", bg: "transparent", fg: C.warning, border: C.warning },
    VERIFIED:            { label: "VERIFIED",     bg: "transparent", fg: C.blue,    border: C.blue },
    FUNDED:              { label: "FUNDED",       bg: C.navy,        fg: "#FFFFFF" },
    PARTIALLY_ALLOCATED: { label: "ALLOCATED",    bg: C.green,       fg: "#FFFFFF" },
    FULLY_ALLOCATED:     { label: "SETTLED",      bg: C.green,       fg: "#FFFFFF" },
    REJECTED:            { label: "REJECTED",     bg: "transparent", fg: C.danger,  border: C.danger },
    CANCELLED:           { label: "CANCELLED",    bg: "transparent", fg: C.muted,   border: C.muted },
  }[status] || { label: status, bg: C.muted, fg: "#FFF" };
  return (
    <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-[0.07em] leading-none whitespace-nowrap rounded"
      style={{ backgroundColor: cfg.bg, color: cfg.fg, border: cfg.border ? `1px solid ${cfg.border}` : "none" }}>
      {cfg.label}
    </span>
  );
}

function amountNote(sub) {
  if (sub.status === "FULLY_ALLOCATED" || sub.status === "PARTIALLY_ALLOCATED") {
    // Only ACTIVE allocations are still held — units sold via a share-sale
    // transfer are marked TRANSFERRED and must no longer count here.
    const held = (sub.allocations || [])
      .filter((a) => a.status === "ACTIVE")
      .reduce((s, a) => s + (a.unitsAllocated || 0), 0);
    if (held === 0) return "units sold";
    return `${held} unit${held !== 1 ? "s" : ""} held`;
  }
  if (sub.status === "FUNDED")       return `${sub.unitsRequested} units · funded`;
  if (sub.status === "VERIFIED")     return `${sub.unitsRequested} units · verified`;
  if (sub.status === "UNDER_REVIEW") return "payment under review";
  if (sub.status === "SUBMITTED")    return sub.proofOfPaymentUrl ? "proof uploaded" : "awaiting payment proof";
  if (sub.status === "REJECTED")     return "subscription rejected";
  if (sub.status === "CANCELLED")    return "cancelled";
  return `${sub.unitsRequested} unit${sub.unitsRequested !== 1 ? "s" : ""}`;
}
function fmt(amount, currency = "GBP") {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return `${sym}${parseFloat(amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(dt) { return dt ? new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtTime(dt) { return dt ? new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " GMT" : ""; }

const FILTERS = [
  { key: "ALL", label: "All Transactions" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "FUNDED", label: "Funded" },
  { key: "FULLY_ALLOCATED", label: "Allocated" },
  { key: "REJECTED", label: "Rejected" },
];

function PropertyThumb({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-12 h-12 flex-shrink-0 grid place-items-center rounded-lg" style={{ backgroundColor: C.goldLight }}>
        <Building2 size={17} style={{ color: C.goldDark }} strokeWidth={1.6} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setErr(true)} className="w-12 h-12 flex-shrink-0 object-cover rounded-lg" />;
}

function StatCard({ loading, label, icon: Icon, tone, children }) {
  return (
    <motion.div variants={fadeUp} className="p-5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)" }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted }}>{label}</p>
        <span className="w-8 h-8 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: tone ? `${tone}14` : C.bg }}>
          <Icon size={15} strokeWidth={2} style={{ color: tone || C.secondary }} />
        </span>
      </div>
      {loading ? <div className="h-8 w-28 rounded-md animate-pulse" style={{ backgroundColor: C.bg }} /> : children}
    </motion.div>
  );
}

function SubRow({ sub, isLast, index }) {
  const meta = STATUS_META[sub.status] || { label: sub.status, dot: C.muted, text: C.secondary };
  const date = sub.submittedAt || sub.createdAt;
  const loc = [sub.opportunity?.spv?.property?.city, sub.opportunity?.spv?.property?.country].filter(Boolean).join(", ") || "United Kingdom";
  const closed = sub.status === "REJECTED" || sub.status === "CANCELLED";
  return (
    <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: index * 0.03 }}
      style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }} className="group hover:bg-[#F8F8FB] transition-colors">
      <td className="py-4 pl-6 pr-4 align-middle" style={{ minWidth: 110 }}>
        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{fmtDate(date)}</p>
        <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{fmtTime(date)}</p>
      </td>
      <td className="py-4 px-4 align-middle">
        <div className="flex items-center gap-3">
          <PropertyThumb src={sub.opportunity?.heroImageUrl} alt={sub.opportunity?.title || "Property"} />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold truncate" style={{ color: C.ink, maxWidth: 220 }}>{sub.opportunity?.title || "Investment"}</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>{loc}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 align-middle"><TxBadge status={sub.status} /></td>
      <td className="py-4 px-4 align-middle">
        <p className="text-[14px] font-bold" style={{ color: closed ? C.muted : C.ink, ...NUM }}>{closed ? "—" : fmt(sub.totalAmount, sub.currency)}</p>
        <p className="text-[10.5px] mt-0.5 uppercase tracking-[0.04em]" style={{ color: C.muted }}>{amountNote(sub)}</p>
      </td>
      <td className="py-4 px-4 align-middle">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.dot }} />
          <span className="text-[13px] font-medium" style={{ color: meta.text }}>{meta.label}</span>
        </div>
      </td>
      <td className="py-4 pl-4 pr-6 align-middle">
        <Link href={`/dashboard/subscriptions/${sub.id}`} className="inline-flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.gold }}>
          View <ArrowUpRight size={12} />
        </Link>
      </td>
    </motion.tr>
  );
}

function EmptyState({ filtered }) {
  return (
    <tr><td colSpan={6}>
      <div className="flex flex-col items-center py-16 gap-3">
        <div className="w-14 h-14 grid place-items-center rounded-2xl" style={{ backgroundColor: C.goldDim }}><Inbox size={22} strokeWidth={1.5} style={{ color: C.goldDark }} /></div>
        <p className="text-[15px] font-semibold" style={{ color: C.ink }}>{filtered ? "No matching subscriptions" : "No subscriptions yet"}</p>
        <p className="text-[13px] text-center max-w-xs" style={{ color: C.muted }}>{filtered ? "Try a different filter or clear your search." : "Browse live opportunities and submit your first subscription to get started."}</p>
        {!filtered && (
          <Link href="/dashboard/opportunities" className="mt-2 inline-flex items-center gap-1.5 h-9 px-5 text-[12px] font-bold tracking-[0.06em] uppercase rounded-lg" style={{ backgroundColor: C.gold, color: C.navyDeep }}>
            Browse Opportunities <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
    </td></tr>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
      {[110, 240, 100, 120, 100, 60].map((w, j) => (
        <td key={j} className="py-4 px-4 align-middle"><div className="animate-pulse rounded-md" style={{ width: w, height: 14, backgroundColor: C.bg }} /></td>
      ))}
    </tr>
  ));
}

// ═══════════════════════════════════════════════════════════════════
export default function SubscriptionsPage() {
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("ALL");
  const { query: search } = useDashboardSearch();   // scoped from the topbar

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/subscriptions?page=1&pageSize=200`, { credentials: "same-origin" });
        const data = await res.json();
        if (!cancelled && data.success) setAllSubs(data.subscriptions || []);
      } catch (err) { if (!cancelled) setError(err.message); }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const active = allSubs.filter((s) => ["FUNDED", "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED", "VERIFIED"].includes(s.status));
    const pending = allSubs.filter((s) => ["SUBMITTED", "UNDER_REVIEW"].includes(s.status));
    const counted = allSubs.filter((s) => !["REJECTED", "CANCELLED"].includes(s.status));
    const totalInvested = counted.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    return { active, pending, totalInvested, counted };
  }, [allSubs]);

  const statusMix = useMemo(() => {
    const groups = [
      { key: "active",  label: "Active",   color: C.greenBright, statuses: ["PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"] },
      { key: "funded",  label: "Funded",   color: "#3B82F6",     statuses: ["FUNDED", "VERIFIED"] },
      { key: "pending", label: "Pending",  color: C.amber,       statuses: ["SUBMITTED", "UNDER_REVIEW"] },
      { key: "closed",  label: "Closed",   color: C.faint,       statuses: ["REJECTED", "CANCELLED"] },
    ].map((g) => ({ ...g, count: allSubs.filter((s) => g.statuses.includes(s.status)).length }));
    const total = groups.reduce((a, g) => a + g.count, 0) || 1;
    return { groups: groups.filter((g) => g.count > 0).map((g) => ({ ...g, pct: (g.count / total) * 100 })), total: allSubs.length };
  }, [allSubs]);

  const filtered = useMemo(() => {
    let list = allSubs;
    if (filter !== "ALL") list = list.filter((s) => s.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => (s.opportunity?.title || "").toLowerCase().includes(q) || (s.opportunity?.spv?.property?.city || "").toLowerCase().includes(q));
    }
    return list;
  }, [allSubs, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filter, search]);

  function exportCSV() {
    const rows = [
      ["Date", "Property", "Location", "Status", "Amount", "Currency", "Units", "Certificate"].join(","),
      ...allSubs.map((s) => [
        fmtDate(s.submittedAt || s.createdAt),
        `"${(s.opportunity?.title || "Investment").replace(/"/g, '""')}"`,
        `"${[s.opportunity?.spv?.property?.city, s.opportunity?.spv?.property?.country].filter(Boolean).join(", ")}"`,
        s.status, parseFloat(s.totalAmount || 0).toFixed(2), s.currency, s.unitsRequested, s.allocations?.[0]?.certificateNumber || "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const sym = allSubs[0]?.currency === "USD" ? "$" : allSubs[0]?.currency === "EUR" ? "€" : "£";

  return (
    <div className="space-y-6">

      {/* ── Title ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Activity Ledger</p>
          <h1 className="text-[30px] sm:text-[42px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em" }}>Subscriptions</h1>
          <p className="text-[13.5px] mt-2.5 leading-relaxed" style={{ color: C.secondary, maxWidth: 620 }}>
            A complete chronological ledger of your subscriptions, allocations and payment activity — always up to date.
          </p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 h-10 px-5 text-[12px] font-bold tracking-[0.05em] uppercase rounded-xl flex-shrink-0 transition-transform hover:scale-[1.03]" style={{ backgroundColor: C.ink, color: "#FFFFFF" }}>
          <Download size={13} /> Export Statement
        </button>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard loading={loading} label="Total Lifetime Invested" icon={Wallet} tone={C.goldDark}>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-[28px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.02em", ...NUM }}>
              {sym}<CountUp value={stats.totalInvested} format={(v) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 })} />
            </span>
            {stats.counted.length > 0 && <span className="text-[12px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.greenDim, color: C.green }}>{stats.counted.length} subs</span>}
          </div>
        </StatCard>
        <StatCard loading={loading} label="Active Holdings" icon={Building2} tone={C.green}>
          <div className="flex items-end gap-3">
            <span className="text-[40px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em", ...NUM }}><CountUp value={stats.active.length} /></span>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: C.secondary }}>allocated &amp; funded</p>
          </div>
        </StatCard>
        <StatCard loading={loading} label={stats.pending.length > 0 ? "Pending Review" : "Portfolio Status"} icon={stats.pending.length > 0 ? Clock : CheckCircle2} tone={stats.pending.length > 0 ? C.amber : C.green}>
          {stats.pending.length > 0 ? (
            <div>
              <div className="flex items-baseline gap-2"><span className="text-[28px] font-bold leading-none" style={{ color: C.warning, ...NUM }}><CountUp value={stats.pending.length} /></span><span className="text-[13px] font-medium" style={{ color: C.warning }}>awaiting</span></div>
              <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>Awaiting review / payment confirmation</p>
            </div>
          ) : (
            <div><p className="text-[22px] font-bold leading-tight" style={{ color: C.green }}>All Clear</p><p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>No pending actions required</p></div>
          )}
        </StatCard>
      </motion.div>

      {/* ── Status distribution ── */}
      {!loading && statusMix.total > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="p-5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted }}>Subscription Status Mix</p>
            <p className="text-[11.5px]" style={{ color: C.muted, ...NUM }}>{statusMix.total} total</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5" style={{ backgroundColor: C.track }}>
            {statusMix.groups.map((g, i) => (
              <motion.div key={g.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: g.color }}
                initial={{ width: 0 }} animate={{ width: `${g.pct}%` }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.08 }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3.5">
            {statusMix.groups.map((g) => (
              <span key={g.key} className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.secondary }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                {g.label} <span className="font-bold" style={{ color: C.ink, ...NUM }}>{g.count}</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Table ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.05)" }}>
        <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-2" style={{ minWidth: "max-content" }}>
              {FILTERS.map((f) => {
                const count = f.key === "ALL" ? allSubs.length : allSubs.filter((s) => s.status === f.key).length;
                const active = filter === f.key;
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)} className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold transition-all whitespace-nowrap rounded-lg"
                    style={{ backgroundColor: active ? C.ink : "transparent", color: active ? "#FFFFFF" : C.secondary, border: active ? "none" : `1px solid ${C.borderMid}`, flexShrink: 0 }}>
                    {f.label}
                    {count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 leading-none rounded" style={{ backgroundColor: active ? "rgba(255,255,255,0.18)" : C.goldDim, color: active ? "#FFF" : C.goldDark }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 flex-shrink-0 grid place-items-center rounded-lg" style={{ border: `1px solid ${C.borderMid}`, backgroundColor: C.bg, color: C.secondary }}><Calendar size={13} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAFA" }}>
                {["Date", "Property / Asset", "Transaction Type", "Amount", "Status", "Action"].map((col) => (
                  <th key={col} className={`py-3 text-left text-[10.5px] font-bold tracking-[0.1em] uppercase ${col === "Date" ? "pl-6 pr-4" : col === "Action" ? "pl-4 pr-6" : "px-4"}`} style={{ color: C.muted }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows />
                : error ? <tr><td colSpan={6} className="py-12 text-center"><div className="flex flex-col items-center gap-2"><AlertCircle size={18} style={{ color: C.danger }} /><p className="text-[13px]" style={{ color: C.danger }}>{error}</p></div></td></tr>
                : pageRows.length === 0 ? <EmptyState filtered={filter !== "ALL" || search.trim() !== ""} />
                : <AnimatePresence mode="wait">{pageRows.map((sub, i) => <SubRow key={sub.id} sub={sub} index={i} isLast={i === pageRows.length - 1} />)}</AnimatePresence>}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[12px]" style={{ color: C.muted }}>Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-1.5">
              <PagBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={13} /></PagBtn>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n;
                if (totalPages <= 5) n = i + 1; else if (page <= 3) n = i + 1; else if (page >= totalPages - 2) n = totalPages - 4 + i; else n = page - 2 + i;
                return <PagBtn key={n} active={page === n} onClick={() => setPage(n)}>{n}</PagBtn>;
              })}
              {totalPages > 5 && page < totalPages - 2 && (<><span className="text-[12px]" style={{ color: C.muted }}>…</span><PagBtn onClick={() => setPage(totalPages)}>{totalPages}</PagBtn></>)}
              <PagBtn disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={13} /></PagBtn>
            </div>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-5">
          {["Subscription Policy", "Tax Documentation", "Allocation Schedule"].map((label) => (
            <Link key={label} href="/dashboard/documents" className="text-[12px]" style={{ color: C.muted, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p className="text-[11.5px]" style={{ color: C.muted }}>© {new Date().getFullYear()} Brick &amp; Wealth Holdings Ltd. All investment data is encrypted and secure.</p>
      </div>
    </div>
  );
}

function PagBtn({ children, disabled, active, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="h-8 min-w-8 px-2 text-[12.5px] font-semibold grid place-items-center transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
      style={{ backgroundColor: active ? C.ink : "transparent", color: active ? "#FFFFFF" : C.secondary, border: `1px solid ${active ? C.ink : C.borderMid}`, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
