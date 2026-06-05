"use client";

// app/dashboard/sales/page.jsx
//
// Investor "Liquidity Desk" — request to sell SPV units back to the company
// and track those sale requests. Sales are manual, discretionary and not
// guaranteed; the copy throughout makes that clear.
//
// Mirrors the design language of /dashboard/subscriptions (tokens, DashViz,
// scoped search, stat cards, status-mix bar, filterable table, pagination).

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, Inbox, ArrowUpRight, Wallet, Building2, Clock,
  CheckCircle2, TrendingDown, Layers, Info, Loader2, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { CountUp, NUM, EASE, fadeUp, stagger } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";
import { useDialog } from "@/components/ConfirmDialog";
import SellSharesButton from "../_components/SellSharesButton";

// ─── Design tokens (shared with the rest of the dashboard) ──────────────────
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
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
  goldDim:     "rgba(201,164,74,0.10)",
  goldLight:   "#F7F0E2",
  navy:        "#0A1F44",
  navyDeep:    "#06142F",
  green:       "#0A6E4F",
  greenDim:    "rgba(10,110,79,0.10)",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.08)",
  warning:     "#92400E",
  amber:       "#F59E0B",
  blue:        "#1E3A8A",
  blueDim:     "rgba(30,58,138,0.08)",
  teal:        "#0E7490",
};
const PAGE_SIZE = 10;
const ACTIVE_STATUSES = ["REQUESTED", "UNDER_REVIEW", "APPROVED"];

const STATUS_META = {
  REQUESTED:    { label: "Requested",    dot: C.amber,  text: C.warning },
  UNDER_REVIEW: { label: "Under Review", dot: "#3B82F6", text: C.blue },
  APPROVED:     { label: "Approved",     dot: C.teal,   text: C.teal },
  SETTLED:      { label: "Settled",      dot: C.green,  text: C.green },
  DECLINED:     { label: "Declined",     dot: C.danger, text: C.danger },
  CANCELLED:    { label: "Cancelled",    dot: C.muted,  text: C.muted },
};

function SaleBadge({ status }) {
  const cfg = {
    REQUESTED:    { label: "REQUESTED",    bg: C.ink,         fg: "#FFFFFF" },
    UNDER_REVIEW: { label: "UNDER REVIEW", bg: "transparent", fg: C.blue,    border: C.blue },
    APPROVED:     { label: "APPROVED",     bg: "transparent", fg: C.teal,    border: C.teal },
    SETTLED:      { label: "SETTLED",      bg: C.green,       fg: "#FFFFFF" },
    DECLINED:     { label: "DECLINED",     bg: "transparent", fg: C.danger,  border: C.danger },
    CANCELLED:    { label: "CANCELLED",    bg: "transparent", fg: C.muted,   border: C.muted },
  }[status] || { label: status, bg: C.muted, fg: "#FFF" };
  return (
    <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold tracking-[0.07em] leading-none whitespace-nowrap rounded"
      style={{ backgroundColor: cfg.bg, color: cfg.fg, border: cfg.border ? `1px solid ${cfg.border}` : "none" }}>
      {cfg.label}
    </span>
  );
}

function fmt(amount, currency = "GBP") {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return `${sym}${parseFloat(amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function sym(currency) { return currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"; }
function fmtDate(dt) { return dt ? new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtTime(dt) { return dt ? new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " GMT" : ""; }

const FILTERS = [
  { key: "ALL", label: "All Requests" },
  { key: "active", label: "Active" },
  { key: "SETTLED", label: "Settled" },
  { key: "DECLINED", label: "Declined" },
  { key: "CANCELLED", label: "Cancelled" },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// ─── Small UI helpers ───────────────────────────────────────────────────────
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
      {loading ? <div className="h-8 w-24 rounded-md animate-pulse" style={{ backgroundColor: C.bg }} /> : children}
    </motion.div>
  );
}

// ─── Sellable-holdings panel ────────────────────────────────────────────────
function HoldingsToSell({ holdings, loading, onSold }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="h-5 w-44 rounded animate-pulse mb-4" style={{ backgroundColor: C.bg }} />
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => <div key={i} className="h-[78px] rounded-xl animate-pulse" style={{ backgroundColor: C.bg }} />)}
        </div>
      </div>
    );
  }
  if (!holdings.length) return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted }}>Your Holdings</p>
          <p className="text-[12.5px] mt-1" style={{ color: C.secondary }}>Offer units back to the company from any position you hold.</p>
        </div>
        <span className="hidden sm:grid w-9 h-9 place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: C.goldDim }}>
          <TrendingDown size={16} style={{ color: C.goldDark }} />
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {holdings.map((h) => {
          const price = parseFloat(h.spv?.unitPrice || 0);
          const value = price * (h.totalUnits || 0);
          const heroSrc = h.spv?.opportunity?.heroImageUrl || h.spv?.property?.images?.[0]?.fileUrl;
          const name = h.spv?.opportunity?.title || h.spv?.spvName || "Holding";
          return (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${C.border}`, backgroundColor: "#FCFCFD" }}>
              <PropertyThumb src={heroSrc} alt={name} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>{name}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: C.muted, ...NUM }}>
                  {(h.totalUnits || 0).toLocaleString()} unit{h.totalUnits === 1 ? "" : "s"} · {fmt(value, h.currency)}
                </p>
              </div>
              <SellSharesButton spvId={h.spvId} onSuccess={onSold} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Sale request row ───────────────────────────────────────────────────────
function SaleRow({ sale, isLast, index, onCancel, cancellingId }) {
  const meta = STATUS_META[sale.status] || { label: sale.status, dot: C.muted, text: C.secondary };
  const name = sale.spv?.opportunity?.title || sale.spv?.spvName || "SPV";
  const canCancel = sale.status === "REQUESTED" || sale.status === "UNDER_REVIEW";
  const settled = sale.status === "SETTLED";
  const closed = sale.status === "DECLINED" || sale.status === "CANCELLED";
  const cancelling = cancellingId === sale.id;

  return (
    <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: index * 0.03 }}
      style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}` }} className="group hover:bg-[#F8F8FB] transition-colors align-top">
      <td className="py-4 pl-6 pr-4 align-top" style={{ minWidth: 110 }}>
        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{fmtDate(sale.createdAt)}</p>
        <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{fmtTime(sale.createdAt)}</p>
      </td>

      <td className="py-4 px-4 align-top">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex-shrink-0 grid place-items-center rounded-lg" style={{ backgroundColor: C.goldLight }}>
            <Building2 size={15} style={{ color: C.goldDark }} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold truncate" style={{ color: C.ink, maxWidth: 230 }}>{name}</p>
            {sale.spv?.spvName && sale.spv?.opportunity?.title && (
              <p className="text-[11.5px] mt-0.5 truncate" style={{ color: C.muted, maxWidth: 230 }}>{sale.spv.spvName}</p>
            )}
            {sale.investorNote && (
              <p className="text-[11.5px] mt-1 italic line-clamp-2" style={{ color: C.faint, maxWidth: 250 }}>“{sale.investorNote}”</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-4 align-top">
        <p className="text-[14px] font-bold" style={{ color: C.ink, ...NUM }}>{(sale.unitsOffered || 0).toLocaleString()}</p>
        <p className="text-[10.5px] mt-0.5 uppercase tracking-[0.04em]" style={{ color: C.muted }}>units offered</p>
      </td>

      <td className="py-4 px-4 align-top">
        <p className="text-[14px] font-bold" style={{ color: closed ? C.muted : C.ink, ...NUM }}>
          {settled ? fmt(sale.settledAmount ?? sale.indicativeAmount, sale.currency) : fmt(sale.indicativeAmount, sale.currency)}
        </p>
        <p className="text-[10.5px] mt-0.5 uppercase tracking-[0.04em]" style={{ color: C.muted }}>{settled ? "settled" : "indicative"}</p>
      </td>

      <td className="py-4 px-4 align-top">
        <div className="flex items-center gap-2"><SaleBadge status={sale.status} /></div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.dot }} />
          <span className="text-[12px] font-medium" style={{ color: meta.text }}>{meta.label}</span>
        </div>
      </td>

      <td className="py-4 pl-4 pr-6 align-top text-right">
        {canCancel ? (
          <button type="button" onClick={() => onCancel(sale)} disabled={cancelling}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ color: C.danger, backgroundColor: C.dangerDim, border: `1px solid ${C.danger}22`, cursor: cancelling ? "wait" : "pointer" }}>
            {cancelling ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
          </button>
        ) : (
          <span className="text-[12px]" style={{ color: C.faint }}>—</span>
        )}
      </td>
    </motion.tr>
  );
}

function EmptyState({ filtered, hasHoldings }) {
  return (
    <tr><td colSpan={6}>
      <div className="flex flex-col items-center py-16 gap-3">
        <div className="w-14 h-14 grid place-items-center rounded-2xl" style={{ backgroundColor: C.goldDim }}><Inbox size={22} strokeWidth={1.5} style={{ color: C.goldDark }} /></div>
        <p className="text-[15px] font-semibold" style={{ color: C.ink }}>{filtered ? "No matching requests" : "No sale requests yet"}</p>
        <p className="text-[13px] text-center max-w-sm" style={{ color: C.muted }}>
          {filtered
            ? "Try a different filter or clear your search."
            : hasHoldings
              ? "When you offer units back to the company, your request will appear here for you to track."
              : "You don't hold any units yet. Once you do, you'll be able to request a sale from here."}
        </p>
        {!filtered && !hasHoldings && (
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
      {[110, 240, 90, 120, 110, 70].map((w, j) => (
        <td key={j} className="py-4 px-4 align-middle"><div className="animate-pulse rounded-md" style={{ width: w, height: 14, backgroundColor: C.bg }} /></td>
      ))}
    </tr>
  ));
}

// ═══════════════════════════════════════════════════════════════════════════
export default function SalesPage() {
  const { confirm } = useDialog();
  const { query: search } = useDashboardSearch();

  const [requests, setRequests] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holdingsLoading, setHoldingsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("ALL");
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/sales`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
      else setError(data.message || "Failed to load");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHoldings = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/holdings`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setHoldings(data.holdings || []);
    } catch { /* non-fatal */ }
    finally { setHoldingsLoading(false); }
  }, []);

  useEffect(() => { loadRequests(); loadHoldings(); }, [loadRequests, loadHoldings]);

  function showToast(msg, tone = "success") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleSold() {
    await Promise.all([loadRequests(), loadHoldings()]);
    showToast("Sale request submitted — our team will be in touch.");
  }

  async function handleCancel(sale) {
    const ok = await confirm({
      title: "Cancel this sale request?",
      message: `Your request to sell ${sale.unitsOffered.toLocaleString()} unit${sale.unitsOffered === 1 ? "" : "s"} of ${sale.spv?.spvName || "this SPV"} will be withdrawn. Those units become available to sell again.`,
      confirmLabel: "Withdraw request",
      cancelLabel: "Keep request",
      tone: "danger",
    });
    if (!ok) return;
    setCancellingId(sale.id);
    try {
      const res = await fetch(`/api/dashboard/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([loadRequests(), loadHoldings()]);
        showToast("Sale request cancelled.");
      } else {
        showToast(data.message || "Could not cancel request.", "error");
      }
    } catch (err) {
      showToast(err.message || "Could not cancel request.", "error");
    } finally {
      setCancellingId(null);
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = requests.filter((r) => ACTIVE_STATUSES.includes(r.status));
    const settled = requests.filter((r) => r.status === "SETTLED");
    const unitsActive = active.reduce((s, r) => s + (r.unitsOffered || 0), 0);
    const indicativeActive = active.reduce((s, r) => s + parseFloat(r.indicativeAmount || 0), 0);
    const settledProceeds = settled.reduce((s, r) => s + parseFloat(r.settledAmount || r.indicativeAmount || 0), 0);
    return { active, settled, unitsActive, indicativeActive, settledProceeds };
  }, [requests]);

  const statusMix = useMemo(() => {
    const groups = [
      { key: "active",   label: "Active",    color: C.amber,  statuses: ACTIVE_STATUSES },
      { key: "settled",  label: "Settled",   color: C.green,  statuses: ["SETTLED"] },
      { key: "declined", label: "Declined",  color: C.danger, statuses: ["DECLINED"] },
      { key: "cancelled",label: "Cancelled", color: C.faint,  statuses: ["CANCELLED"] },
    ].map((g) => ({ ...g, count: requests.filter((r) => g.statuses.includes(r.status)).length }));
    const total = groups.reduce((a, g) => a + g.count, 0) || 1;
    return { groups: groups.filter((g) => g.count > 0).map((g) => ({ ...g, pct: (g.count / total) * 100 })), total: requests.length };
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests;
    if (filter === "active") list = list.filter((r) => ACTIVE_STATUSES.includes(r.status));
    else if (filter !== "ALL") list = list.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        (r.spv?.spvName || "").toLowerCase().includes(q) ||
        (r.spv?.opportunity?.title || "").toLowerCase().includes(q));
    }
    return list;
  }, [requests, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filter, search]);

  const currency = requests[0]?.currency || holdings[0]?.currency || "GBP";
  const symbol = sym(currency);

  return (
    <div className="space-y-6">

      {/* ── Title ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Liquidity Desk</p>
          <h1 className="text-[30px] sm:text-[42px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em" }}>Share Sales</h1>
          <p className="text-[13.5px] mt-2.5 leading-relaxed" style={{ color: C.secondary, maxWidth: 640 }}>
            Request to sell units from your holdings back to the company and track each request through to settlement.
            Sales are arranged manually at our discretion and are not guaranteed.
          </p>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={loading} label="Active Requests" icon={Clock} tone={C.amber}>
          <div className="flex items-end gap-3">
            <span className="text-[40px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em", ...NUM }}><CountUp value={stats.active.length} /></span>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: C.secondary }}>in progress</p>
          </div>
        </StatCard>

        <StatCard loading={loading} label="Units Offered" icon={Layers} tone={C.navy}>
          <span className="text-[34px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.02em", ...NUM }}>
            <CountUp value={stats.unitsActive} />
          </span>
          <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>across active requests</p>
        </StatCard>

        <StatCard loading={loading} label="Indicative Value" icon={Wallet} tone={C.goldDark}>
          <span className="text-[28px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.02em", ...NUM }}>
            {symbol}<CountUp value={stats.indicativeActive} format={(v) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 })} />
          </span>
          <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>active offers · indicative only</p>
        </StatCard>

        <StatCard loading={loading} label={stats.settled.length > 0 ? "Settled Proceeds" : "Settlement"} icon={CheckCircle2} tone={C.green}>
          {stats.settled.length > 0 ? (
            <>
              <span className="text-[28px] font-bold leading-none" style={{ color: C.green, letterSpacing: "-0.02em", ...NUM }}>
                {symbol}<CountUp value={stats.settledProceeds} format={(v) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 })} />
              </span>
              <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>{stats.settled.length} settled to date</p>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold leading-tight" style={{ color: C.secondary }}>None yet</p>
              <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>Settled sales will show here</p>
            </>
          )}
        </StatCard>
      </motion.div>

      {/* ── Sell from holdings ── */}
      <HoldingsToSell holdings={holdings} loading={holdingsLoading} onSold={handleSold} />

      {/* ── Status distribution ── */}
      {!loading && statusMix.total > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="p-5 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted }}>Request Status Mix</p>
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
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-2" style={{ minWidth: "max-content" }}>
              {FILTERS.map((f) => {
                const count = f.key === "ALL"
                  ? requests.length
                  : f.key === "active"
                    ? requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length
                    : requests.filter((r) => r.status === f.key).length;
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAFA" }}>
                {["Date", "SPV / Asset", "Units", "Value", "Status", "Action"].map((col) => (
                  <th key={col} className={`py-3 text-[10.5px] font-bold tracking-[0.1em] uppercase ${col === "Date" ? "pl-6 pr-4 text-left" : col === "Action" ? "pl-4 pr-6 text-right" : "px-4 text-left"}`} style={{ color: C.muted }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows />
                : error ? <tr><td colSpan={6} className="py-12 text-center"><div className="flex flex-col items-center gap-2"><AlertCircle size={18} style={{ color: C.danger }} /><p className="text-[13px]" style={{ color: C.danger }}>{error}</p></div></td></tr>
                : pageRows.length === 0 ? <EmptyState filtered={filter !== "ALL" || search.trim() !== ""} hasHoldings={holdings.length > 0} />
                : <AnimatePresence mode="wait">{pageRows.map((sale, i) => <SaleRow key={sale.id} sale={sale} index={i} isLast={i === pageRows.length - 1} onCancel={handleCancel} cancellingId={cancellingId} />)}</AnimatePresence>}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[12px]" style={{ color: C.muted }}>Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-1.5">
              <PagBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={13} /></PagBtn>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n;
                if (totalPages <= 5) n = i + 1; else if (page <= 3) n = i + 1; else if (page >= totalPages - 2) n = totalPages - 4 + i; else n = page - 2 + i;
                return <PagBtn key={n} active={page === n} onClick={() => setPage(n)}>{n}</PagBtn>;
              })}
              <PagBtn disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={13} /></PagBtn>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Compliance note ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: C.goldDim, border: `1px solid ${C.gold}33` }}>
        <Info size={15} style={{ color: C.goldDark, marginTop: 1, flexShrink: 0 }} />
        <p className="text-[12px] leading-relaxed" style={{ color: C.secondary }}>
          There is no public market for these shares. Sale requests are reviewed and arranged manually at the company&apos;s discretion and are <strong style={{ color: C.ink }}>not guaranteed</strong>. Indicative figures use the latest unit price and may differ from the final settled amount. Our team will contact you about timing and price before any settlement.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-5">
          <Link href="/dashboard/holdings" className="text-[12px]" style={{ color: C.muted, textDecoration: "none" }}>My Holdings</Link>
          <Link href="/dashboard/documents" className="text-[12px]" style={{ color: C.muted, textDecoration: "none" }}>Share Transfer Policy</Link>
        </div>
        <p className="text-[11.5px]" style={{ color: C.muted }}>© {new Date().getFullYear()} Bricks &amp; Wealth Holdings Ltd. All investment data is encrypted and secure.</p>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
            style={{ backgroundColor: toast.tone === "error" ? C.danger : C.ink, color: "#FFFFFF", maxWidth: 360 }}>
            {toast.tone === "error" ? <AlertCircle size={15} style={{ color: "#FCA5A5" }} /> : <CheckCircle2 size={15} style={{ color: "#6EE7B7" }} />}
            <span className="text-[12.5px] font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
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
