"use client";

// app/admin/sales/_AdminSaleQueue.jsx  (queue board)  +  AdminSaleDetail (detail)
// The queue is a Sales Pipeline board grouped by status; the detail panel below
// is unchanged and consumed by app/admin/sales/[id]/page.jsx.

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Inbox, ArrowRight, ArrowLeft, Clock, CheckCircle2, Banknote,
  AlertCircle, User, Search, TrendingDown, ShieldCheck, XCircle, Send,
  LayoutGrid, Columns3,
} from "lucide-react";

// ── Legacy constants (used by AdminSaleDetail — kept intact) ──────────────────
const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const BORDER = "#E4E4E7";
const SIDEBAR_GRAY = "#F4F4F5";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";
const WARNING = "#B8860B";
const WARNING_BG = "#FBF5E1";

const STATUS_META = {
  REQUESTED:    { label: "Requested",   bg: SIDEBAR_GRAY, fg: TEXT_SECONDARY },
  UNDER_REVIEW: { label: "Under review", bg: WARNING_BG,  fg: WARNING },
  APPROVED:     { label: "Approved",    bg: "#E8EEF7",    fg: "#3A5874" },
  SETTLED:      { label: "Settled",     bg: SUCCESS_BG,   fg: SUCCESS },
  DECLINED:     { label: "Declined",    bg: DANGER_BG,    fg: DANGER },
  CANCELLED:    { label: "Cancelled",   bg: SIDEBAR_GRAY, fg: TEXT_MUTED },
};

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

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
const CUR = { GBP: "£", USD: "$", EUR: "€" };

const COLUMNS = [
  { key: "REQUESTED",    label: "Requested",    dot: C.slate, bucket: ["REQUESTED"] },
  { key: "UNDER_REVIEW", label: "Under Review", dot: C.amber, bucket: ["UNDER_REVIEW"] },
  { key: "APPROVED",     label: "Approved",     dot: C.navy,  bucket: ["APPROVED"] },
  { key: "SETTLED",      label: "Settled",      dot: C.pos,   bucket: ["SETTLED"] },
  { key: "CLOSED",       label: "Closed",       dot: C.ink3,  bucket: ["DECLINED", "CANCELLED"] },
];

function compact(n) {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return Math.round(v).toLocaleString();
}
function relTime(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
function avatarTint(seed) {
  const tints = [
    { bg: "#E7F1EC", fg: "#1C7A5E" }, { bg: "#EAF0FA", fg: "#2A4A7F" },
    { bg: "#F4ECD8", fg: "#8F6E26" }, { bg: "#F0ECF6", fg: "#6A4C8C" },
    { bg: "#EAF3F3", fg: "#1F6E73" }, { bg: "#FBEDE8", fg: "#9A5A2E" },
  ];
  let h = 0; for (const ch of String(seed || "?")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tints[h % tints.length];
}
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
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.REQUESTED;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ backgroundColor: m.bg, color: m.fg }}>{m.label}</span>;
}

function SaleCard({ r }) {
  const [h, setH] = useState(false);
  const cs = CUR[r.currency] || "£";
  const tint = avatarTint(r.investor?.fullName || r.investor?.email);
  const settled = r.status === "SETTLED";
  return (
    <a href={`/admin/sales/${r.id}`} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="block rounded-xl p-3.5 transition-all"
      style={{ backgroundColor: C.paper, border: `1px solid ${h ? C.gold + "55" : C.hair}`, boxShadow: h ? "0 8px 20px rgba(11,18,32,0.08)" : "0 1px 2px rgba(11,18,32,0.03)", textDecoration: "none" }}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <StatusPill status={r.status} />
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: C.hair2, color: C.ink2, ...NUM }}>{r.unitsOffered.toLocaleString()} units</span>
      </div>
      <h3 className="text-[13.5px] font-bold leading-snug truncate" style={{ color: C.ink }}>{r.spv?.spvName || "—"}</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-6 h-6 rounded-full grid place-items-center flex-shrink-0 text-[9.5px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(r.investor?.fullName)}</span>
        <span className="text-[11.5px] truncate" style={{ color: C.ink3 }}>{r.investor?.fullName || "Unknown"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.hair2}` }}>
        <div>
          <div className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: C.ink3 }}>{settled ? "Settled" : "Indicative"}</div>
          <div className="text-[13px] font-bold" style={{ color: settled ? C.pos : C.ink, ...NUM }}>{cs}{compact(settled ? r.settledAmount : r.indicativeAmount)}</div>
        </div>
        <div className="text-right">
          <div className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: C.ink3 }}>Raised</div>
          <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.ink3 }}>{relTime(r.createdAt)}</div>
        </div>
      </div>
    </a>
  );
}

// ════════════════════════════════════════════════════════════════════
// QUEUE — Sales Pipeline board
// ════════════════════════════════════════════════════════════════════
export default function AdminSaleQueue() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  useEffect(() => { const t = setTimeout(() => setSearchDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  const loadStats = useCallback(async () => {
    try { const res = await fetch("/api/admin/sales?stats=1", { credentials: "same-origin" }); const d = await res.json(); if (d.success) setStats(d.stats); } catch {}
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ pageSize: "100" });
      if (searchDebounced) qs.set("search", searchDebounced);
      const res = await fetch(`/api/admin/sales?${qs}`, { credentials: "same-origin" });
      const d = await res.json();
      if (d.success) setRequests(d.requests || []);
    } catch {}
    setLoading(false);
  }, [searchDebounced]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    for (const r of requests) {
      const col = COLUMNS.find((c) => c.bucket.includes(r.status)) || COLUMNS[0];
      map[col.key].push(r);
    }
    return map;
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Sales Pipeline</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>{loading ? "Loading…" : `${requests.length} share-sale request${requests.length === 1 ? "" : "s"} across the pipeline`}</p>
        </div>
        <div className="inline-flex p-0.5 rounded-xl" style={{ backgroundColor: C.hair2, border: `1px solid ${C.hair}` }}>
          {[{ k: "board", Icon: Columns3, label: "Board" }, { k: "list", Icon: LayoutGrid, label: "List" }].map(({ k, Icon, label }) => (
            <button key={k} type="button" onClick={() => setView(k)} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition-colors"
              style={{ backgroundColor: view === k ? C.paper : "transparent", color: view === k ? C.ink : C.ink3, boxShadow: view === k ? "0 1px 2px rgba(11,18,32,0.08)" : "none", border: "none", cursor: "pointer" }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!stats} icon={Clock} label="Requested" value={stats?.requested ?? 0} />
        <StatCard loading={!stats} icon={Search} label="Under Review" value={stats?.underReview ?? 0} accent />
        <StatCard loading={!stats} icon={CheckCircle2} label="Ready to Settle" value={stats?.approved ?? 0} />
        <StatCard loading={!stats} icon={Banknote} label="Settled" value={stats?.settled ?? 0} />
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by investor name or email…"
          className="w-full h-11 pl-10 pr-3 text-[13.5px] rounded-xl outline-none focus:border-[#B8923C] transition-colors" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl h-52 animate-pulse" style={{ backgroundColor: C.hair2 }} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ border: `1px solid ${C.hair}`, background: C.paper }}>
          <span className="w-14 h-14 mx-auto mb-3 grid place-items-center rounded-2xl" style={{ background: C.hair2 }}><Inbox size={24} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
          <p className="text-[15px] font-bold" style={{ color: C.ink }}>No sale requests</p>
          <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Investor share-sale requests will appear here.</p>
        </div>
      ) : view === "board" ? (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {COLUMNS.map((col) => {
              const list = grouped[col.key];
              return (
                <div key={col.key} className="flex flex-col flex-shrink-0" style={{ width: 290 }}>
                  <div className="flex items-center gap-2 px-1 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                    <span className="text-[12.5px] font-bold" style={{ color: C.ink }}>{col.label}</span>
                    <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[10.5px] font-bold" style={{ backgroundColor: C.hair2, color: C.ink2, ...NUM }}>{list.length}</span>
                  </div>
                  <div className="rounded-2xl p-2.5 flex-1 space-y-2.5" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair}`, minHeight: 200 }}>
                    {list.length === 0 ? (
                      <div className="grid place-items-center py-10"><p className="text-[11.5px]" style={{ color: C.slate }}>Empty</p></div>
                    ) : list.map((r, i) => (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: i * 0.03 }}>
                        <SaleCard r={r} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── List ── */
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
          <div className="hidden md:grid items-center gap-3 px-5 py-3" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1.6fr) 0.8fr 1fr 1fr 0.6fr", backgroundColor: C.canvas, borderBottom: `1px solid ${C.hair}` }}>
            {["Investor", "SPV", "Units", "Indicative", "Status", ""].map((hd, i) => <span key={i} className={`text-[10px] font-bold tracking-[0.1em] uppercase ${i === 2 || i === 3 ? "text-right" : ""}`} style={{ color: C.ink3 }}>{hd}</span>)}
          </div>
          {requests.map((r) => {
            const cs = CUR[r.currency] || "£"; const tint = avatarTint(r.investor?.fullName);
            return (
              <a key={r.id} href={`/admin/sales/${r.id}`} className="flex flex-col gap-2 md:grid md:gap-3 md:items-center px-4 sm:px-5 py-3.5 transition-colors"
                style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1.6fr) 0.8fr 1fr 1fr 0.6fr", borderBottom: `1px solid ${C.hair2}`, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FBFBFA")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(r.investor?.fullName)}</span>
                  <div className="min-w-0"><div className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{r.investor?.fullName || "Unknown"}</div><div className="text-[11px] truncate" style={{ color: C.ink3 }}>{r.investor?.email}</div></div>
                </div>
                <div className="hidden md:block text-[12.5px] truncate" style={{ color: C.ink2 }}>{r.spv?.spvName || "—"}</div>
                <div className="hidden md:block text-right text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{r.unitsOffered.toLocaleString()}</div>
                <div className="hidden md:block text-right text-[13px] font-semibold" style={{ color: C.ink, ...NUM }}>{cs}{compact(r.indicativeAmount)}</div>
                <div className="hidden md:flex items-center"><StatusPill status={r.status} /></div>
                <div className="hidden md:flex items-center justify-end"><ArrowRight size={14} style={{ color: C.slate }} /></div>
                <div className="md:hidden flex items-center gap-3 flex-wrap"><StatusPill status={r.status} /><span className="text-[12px] font-bold" style={{ color: C.ink, ...NUM }}>{r.unitsOffered.toLocaleString()} units</span><span className="text-[11.5px]" style={{ color: C.ink3, ...NUM }}>· {cs}{compact(r.indicativeAmount)}</span></div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DETAIL  (unchanged)
// ════════════════════════════════════════════════════════════════════
export function AdminSaleDetail({ requestId }) {
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // settle form
  const [buyerType, setBuyerType] = useState("company_buyback");
  const [buyerName, setBuyerName] = useState("");
  const [buyerUserId, setBuyerUserId] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerResults, setBuyerResults] = useState([]);
  const [settledPrice, setSettledPrice] = useState("");
  const [settleNotes, setSettleNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/${requestId}`, { credentials: "same-origin" });
      const d = await res.json();
      if (d.success) setReq(d.saleRequest);
      else setError(d.message);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  function flash(msg, isErr) {
    if (isErr) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  }

  async function review(action, extra = {}) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (d.success) { flash(d.message); setShowDecline(false); load(); }
      else flash(d.message, true);
    } catch (err) { flash(err.message, true); }
    setBusy(false);
  }

  async function searchBuyers() {
    if (!req) return;
    try {
      const qs = new URLSearchParams({ buyers: "1", spvId: req.spvId, excludeUserId: req.userId, search: buyerSearch });
      const res = await fetch(`/api/admin/sales?${qs}`, { credentials: "same-origin" });
      const d = await res.json();
      if (d.success) setBuyerResults(d.buyers || []);
    } catch {}
  }

  async function settle() {
    setBusy(true);
    try {
      const body = { buyerType, notes: settleNotes || undefined };
      if (buyerType === "named_investor") body.buyerUserId = buyerUserId;
      if (buyerType === "external") body.buyerName = buyerName || undefined;
      if (settledPrice) body.settledUnitPrice = parseFloat(settledPrice);

      const res = await fetch(`/api/admin/sales/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) { flash(d.message); load(); }
      else flash(d.message, true);
    } catch (err) { flash(err.message, true); }
    setBusy(false);
  }

  if (loading) return <div className="grid place-items-center py-24"><Loader2 size={20} className="animate-spin" style={{ color: GOLD }} /></div>;
  if (!req) return (
    <div className="grid place-items-center py-24 text-center">
      <div><AlertCircle size={22} className="mx-auto mb-2" style={{ color: DANGER }} />
        <p className="text-[13px] mb-3" style={{ color: DANGER }}>{error || "Not found"}</p>
        <a href="/admin/sales" className="text-[12.5px] font-semibold" style={{ color: GOLD_DARK }}>← Back to queue</a>
      </div>
    </div>
  );

  const meta = STATUS_META[req.status] || STATUS_META.REQUESTED;
  const cs = req.currency === "USD" ? "$" : req.currency === "EUR" ? "€" : "£";
  const canReview = ["REQUESTED", "UNDER_REVIEW"].includes(req.status);
  const canApprove = ["REQUESTED", "UNDER_REVIEW"].includes(req.status);
  const canSettle = ["APPROVED", "UNDER_REVIEW"].includes(req.status);
  const canDecline = !["SETTLED", "CANCELLED", "DECLINED"].includes(req.status);
  const settleReady = buyerType === "named_investor" ? !!buyerUserId : buyerType === "external" ? !!buyerName : true;

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <a href="/admin/sales" className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-4" style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
        <ArrowLeft size={13} /> Queue
      </a>

      {success && <Banner color={SUCCESS} bg={SUCCESS_BG} icon={CheckCircle2} msg={success} />}
      {error && <Banner color={DANGER} bg={DANGER_BG} icon={AlertCircle} msg={error} />}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={18} style={{ color: GOLD_DARK }} />
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: INK }}>{req.spv?.spvName || "Sale request"}</h1>
          </div>
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
            {req.investor?.fullName} wants to sell <strong>{req.unitsOffered.toLocaleString()} units</strong> · indicative {cs}{parseFloat(req.indicativeAmount).toLocaleString("en-GB")}
          </p>
        </div>
        <span className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold tracking-[0.04em] uppercase" style={{ backgroundColor: meta.bg, color: meta.fg, borderRadius: "6px" }}>{meta.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT context */}
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Seller" icon={User}>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Name" value={req.investor?.fullName} />
              <Field label="Email" value={req.investor?.email} />
              <Field label="Current holding" value={req.sellerHolding ? `${req.sellerHolding.totalUnits.toLocaleString()} units` : "—"} />
              <Field label="Ownership" value={req.sellerHolding ? `${req.sellerHolding.ownershipPct?.toFixed(2)}%` : "—"} />
              <Field label="Sellable now" value={`${req.sellableNow.toLocaleString()} units`} />
              <Field label="KYC" value={req.investor?.kycStatus} />
            </div>
            {req.investorNote && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-[10px] tracking-[0.06em] uppercase font-bold mb-1" style={{ color: TEXT_MUTED }}>Investor note</p>
                <p className="text-[12.5px]" style={{ color: TEXT_SECONDARY }}>{req.investorNote}</p>
              </div>
            )}
          </Panel>

          {req.status === "SETTLED" && (
            <Panel title="Settlement" icon={ShieldCheck}>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <Field label="Buyer type" value={(req.buyerType || "").replace(/_/g, " ")} capitalize />
                <Field label="Buyer" value={req.buyerName || "—"} />
                <Field label="Units" value={req.settledUnits?.toLocaleString()} />
                <Field label="Amount" value={`${cs}${parseFloat(req.settledAmount || "0").toLocaleString("en-GB")}`} />
              </div>
            </Panel>
          )}
        </div>

        {/* RIGHT actions */}
        <div className="space-y-4">
          <div className="p-4 sticky top-4" style={{ backgroundColor: "#FFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <p className="text-[10px] tracking-[0.1em] uppercase font-bold mb-3" style={{ color: TEXT_MUTED }}>Workflow</p>

            {canReview && req.status === "REQUESTED" && (
              <button type="button" onClick={() => review("acknowledge")} disabled={busy}
                className="w-full mb-2.5 py-2.5 text-[12px] font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#FFF", color: INK, border: `1px solid ${BORDER}`, borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
                Mark under review
              </button>
            )}

            {canApprove && (
              <button type="button" onClick={() => review("approve")} disabled={busy}
                className="w-full mb-2.5 flex items-center justify-center gap-2 py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                style={{ backgroundColor: NAVY_900, color: "#FFF", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
                <CheckCircle2 size={14} /> Approve
              </button>
            )}

            {/* Settle form */}
            {canSettle && (
              <div className="mb-3 p-3" style={{ border: `1px solid ${GOLD}`, borderRadius: "10px", backgroundColor: GOLD_LIGHT }}>
                <p className="text-[12px] font-bold mb-2.5" style={{ color: GOLD_DARK }}>Record transfer</p>

                <label className="text-[10px] uppercase font-bold block mb-1" style={{ color: GOLD_DARK }}>Buyer</label>
                <select value={buyerType} onChange={(e) => { setBuyerType(e.target.value); setBuyerUserId(""); setBuyerResults([]); }}
                  className="w-full text-[12.5px] mb-2.5 outline-none"
                  style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit" }}>
                  <option value="company_buyback">Company buyback</option>
                  <option value="named_investor">Existing investor</option>
                  <option value="external">External buyer</option>
                </select>

                {buyerType === "named_investor" && (
                  <div className="mb-2.5">
                    <div className="flex gap-1.5 mb-1.5">
                      <input value={buyerSearch} onChange={(e) => setBuyerSearch(e.target.value)} placeholder="Search investors"
                        className="flex-1 text-[12px] outline-none" style={{ padding: "7px 9px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit" }} />
                      <button type="button" onClick={searchBuyers} className="px-3 text-[11px] font-semibold" style={{ backgroundColor: "#FFF", border: `1px solid ${BORDER}`, borderRadius: "7px", cursor: "pointer", color: TEXT_SECONDARY, fontFamily: "inherit" }}>Find</button>
                    </div>
                    {buyerResults.map((b) => (
                      <button key={b.id} type="button" onClick={() => setBuyerUserId(b.id)}
                        className="w-full text-left px-2.5 py-1.5 text-[12px] mb-1"
                        style={{ backgroundColor: buyerUserId === b.id ? NAVY_900 : "#FFF", color: buyerUserId === b.id ? "#FFF" : INK, border: `1px solid ${BORDER}`, borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}>
                        {b.fullName} <span style={{ opacity: 0.6 }}>· {b.email}</span>
                      </button>
                    ))}
                  </div>
                )}

                {buyerType === "external" && (
                  <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name / reference"
                    className="w-full text-[12.5px] mb-2.5 outline-none" style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit" }} />
                )}

                <label className="text-[10px] uppercase font-bold block mb-1" style={{ color: GOLD_DARK }}>Settled price/unit (optional)</label>
                <input type="number" value={settledPrice} onChange={(e) => setSettledPrice(e.target.value)} placeholder={`Default ${cs}${parseFloat(req.indicativeUnitPrice).toLocaleString("en-GB")}`}
                  className="w-full text-[12.5px] mb-2.5 outline-none" style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit" }} />

                <input value={settleNotes} onChange={(e) => setSettleNotes(e.target.value)} placeholder="Notes (optional)"
                  className="w-full text-[12px] mb-2.5 outline-none" style={{ padding: "7px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit" }} />

                <div className="p-2.5 mb-2.5" style={{ backgroundColor: "#FFF", borderRadius: "7px" }}>
                  <p className="text-[10.5px]" style={{ color: TEXT_MUTED, lineHeight: 1.5 }}>
                    On settle: the seller's certificate(s) are voided{buyerType === "named_investor" ? ", a new certificate is issued to the buyer," : ", units return to the SPV pool,"} and both holdings recompute.
                  </p>
                </div>

                <button type="button" onClick={settle} disabled={busy || !settleReady}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-[12.5px] font-bold disabled:opacity-50"
                  style={{ backgroundColor: NAVY_900, color: "#FFF", border: "none", borderRadius: "8px", cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Record transfer
                </button>
              </div>
            )}

            {canDecline && (
              !showDecline ? (
                <button type="button" onClick={() => setShowDecline(true)} disabled={busy}
                  className="w-full py-2.5 text-[12px] font-semibold mt-1"
                  style={{ backgroundColor: "transparent", color: DANGER, border: `1px solid ${DANGER}30`, borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
                  Decline request
                </button>
              ) : (
                <div className="mt-1 p-3" style={{ border: `1px solid ${DANGER}30`, borderRadius: "10px", backgroundColor: DANGER_BG }}>
                  <p className="text-[12px] font-bold mb-2" style={{ color: DANGER }}>Decline — reason required</p>
                  <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} placeholder="Shared with investor"
                    className="w-full text-[12px] outline-none mb-2" style={{ padding: "8px", border: `1px solid ${BORDER}`, borderRadius: "7px", backgroundColor: "#FFF", color: INK, fontFamily: "inherit", resize: "vertical" }} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => review("decline", { declineReason })} disabled={busy || !declineReason.trim()}
                      className="flex-1 py-2 text-[12px] font-semibold disabled:opacity-50" style={{ backgroundColor: DANGER, color: "#FFF", border: "none", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit" }}>Confirm</button>
                    <button type="button" onClick={() => { setShowDecline(false); setDeclineReason(""); }}
                      className="px-3 py-2 text-[12px] font-semibold" style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "7px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              )
            )}

            {["SETTLED", "DECLINED", "CANCELLED"].includes(req.status) && (
              <p className="text-[11.5px] text-center py-2" style={{ color: TEXT_MUTED }}>
                This request is {req.status.toLowerCase()}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Banner({ color, bg, icon: Icon, msg }) {
  return (
    <div className="mb-4 p-3 flex items-center gap-2" style={{ backgroundColor: bg, borderRadius: "8px" }}>
      <Icon size={14} style={{ color }} />
      <p className="text-[13px] font-semibold" style={{ color }}>{msg}</p>
    </div>
  );
}
function Panel({ title, icon: Icon, children }) {
  return (
    <div className="p-4" style={{ backgroundColor: "#FFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
      <div className="flex items-center gap-2 mb-3.5">
        <Icon size={14} style={{ color: GOLD_DARK }} />
        <p className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: TEXT_MUTED }}>{title}</p>
      </div>
      {children}
    </div>
  );
}
function Field({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.06em] uppercase font-bold mb-0.5" style={{ color: TEXT_MUTED }}>{label}</p>
      <p className="text-[12.5px] font-semibold" style={{ color: INK, textTransform: capitalize ? "capitalize" : "none" }}>{value || "—"}</p>
    </div>
  );
}
