"use client";

// app/admin/subscriptions/page.jsx
// Subscription queue — list, filter by status, click through to detail.
// Styled to the admin brand system (matches Registrations / Notifications).

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { animate } from "framer-motion";
import {
  Loader2, AlertCircle, ShieldAlert, Search, Wallet, Inbox,
  Layers, ShieldCheck, ChevronLeft, ChevronRight, ArrowUpRight, X,
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
  info: "#2A4A7F", infoSoft: "#EAF0FA",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE = [0.16, 1, 0.3, 1];

const STATUS_META = {
  SUBMITTED:           { l: "Submitted",           bg: C.hair2,     fg: C.ink3 },
  UNDER_REVIEW:        { l: "Under review",        bg: C.amberSoft, fg: C.amber },
  VERIFIED:            { l: "Verified",            bg: C.infoSoft,  fg: C.info },
  FUNDED:              { l: "Funded",              bg: C.infoSoft,  fg: C.info },
  PARTIALLY_ALLOCATED: { l: "Partially allocated", bg: C.goldWash,  fg: C.goldDeep },
  FULLY_ALLOCATED:     { l: "Fully allocated",     bg: C.posSoft,   fg: C.pos },
  REJECTED:            { l: "Rejected",            bg: C.alertSoft, fg: C.alert },
  CANCELLED:           { l: "Cancelled",           bg: C.hair2,     fg: C.slate },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "FUNDED", label: "Funded" },
  { value: "PARTIALLY_ALLOCATED", label: "Partially allocated" },
  { value: "FULLY_ALLOCATED", label: "Fully allocated" },
  { value: "REJECTED", label: "Rejected" },
];

function money(v, currency) {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return sym + parseFloat(v || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 });
}
function CountUp({ value = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, value, { duration: 0.8, ease: EASE, onUpdate: setN }); return () => c.stop(); }, [value]);
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

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, pageSize });
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/subscriptions?${params}`, { credentials: "same-origin" });
        const data = await res.json();
        if (!cancelled && data.success) { setSubs(data.subscriptions || []); setTotal(data.total || 0); }
      } catch (err) { if (!cancelled) setError(err.message); }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [status, search, page]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscriptions?stats=1", { credentials: "same-origin" }).then((r) => r.json());
      if (res.success) setStats(res.stats);
    } catch {}
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  function handleSearch(e) { e.preventDefault(); setSearch(searchInput); setPage(1); }

  const totalPages = Math.ceil(total / pageSize);
  const needsAction = stats?.needsAction ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Subscriptions</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Review investor commitments, verify funding and track allocations.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: needsAction > 0 ? C.gold : C.pos }} />
          <span className="text-[12px] font-semibold" style={{ color: C.ink2, ...NUM }}>{needsAction} need action</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!stats} icon={Wallet} label="Active" value={stats?.totalActive ?? 0} />
        <StatCard loading={!stats} icon={Inbox} label="Needs Action" value={needsAction} accent={needsAction > 0} />
        <StatCard loading={!stats} icon={Layers} label="Fully Allocated" value={stats?.fullyAllocated ?? 0} />
        <StatCard loading={!stats} icon={ShieldCheck} label="AML Flags" value={stats?.oversizedPending ?? 0} accent={(stats?.oversizedPending ?? 0) > 0} />
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search investor or opportunity…"
              className="pl-9 pr-3 h-10 text-[13px] outline-none rounded-xl"
              style={{ border: `1px solid ${C.hair}`, color: C.ink, backgroundColor: C.paper, fontFamily: "inherit", width: 250 }} />
          </div>
          <button type="submit" className="h-10 px-4 rounded-xl text-[12.5px] font-semibold"
            style={{ backgroundColor: C.navy, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="inline-flex items-center gap-1 h-10 px-2.5 text-[12px] font-semibold"
              style={{ color: C.ink3, background: "transparent", border: "none", cursor: "pointer" }}><X size={13} /> Clear</button>
          )}
        </form>
      </div>

      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const on = status === f.value;
          return (
            <button key={f.value} type="button" onClick={() => { setStatus(f.value); setPage(1); }}
              className="px-3.5 h-9 rounded-full text-[12px] font-semibold transition-colors"
              style={{ backgroundColor: on ? C.navy : C.paper, color: on ? "#fff" : C.ink2, border: `1px solid ${on ? C.navy : C.hair}`, cursor: "pointer" }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 size={20} className="animate-spin" style={{ color: C.gold }} /></div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 m-4 rounded-xl" style={{ backgroundColor: C.alertSoft }}>
            <AlertCircle size={15} style={{ color: C.alert }} /><p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
          </div>
        ) : subs.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <span className="w-12 h-12 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><Wallet size={22} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
            <p className="text-[14px] font-bold" style={{ color: C.ink }}>No subscriptions found</p>
            <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: C.canvas, borderBottom: `1px solid ${C.hair2}` }}>
                  {[["Investor", ""], ["Opportunity", ""], ["Units", "text-right"], ["Amount", "text-right"], ["Submitted", ""], ["Status", ""], ["", "text-right"]].map(([h, cls], i) => (
                    <th key={i} className={`px-4 py-3 text-[10px] font-bold tracking-[0.1em] uppercase ${cls}`} style={{ color: C.ink3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const meta = STATUS_META[s.status] || { l: s.status, bg: C.hair2, fg: C.ink3 };
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.paper }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FBFBFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.paper)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-bold" style={{ color: C.ink }}>{s.investor?.fullName || s.investor?.email || "—"}</p>
                          {s.oversizedFlag && <ShieldAlert size={12} style={{ color: C.alert, flexShrink: 0 }} aria-label="AML flag" />}
                        </div>
                        <p className="text-[11px]" style={{ color: C.ink3 }}>{s.investor?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{s.opportunity?.title || "—"}</p>
                        <p className="text-[11px]" style={{ color: C.ink3 }}>{s.opportunity?.spv?.spvName || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-semibold" style={{ color: C.ink, ...NUM }}>{s.unitsRequested}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold" style={{ color: C.ink, ...NUM }}>{money(s.totalAmount, s.currency)}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.ink3 }}>
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold tracking-[0.04em] uppercase" style={{ backgroundColor: meta.bg, color: meta.fg }}>{meta.l}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/subscriptions/${s.id}`} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: C.goldDeep, textDecoration: "none" }}>
                          Review <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.hair2}` }}>
            <span className="text-[11.5px]" style={{ color: C.ink3 }}>Page {page} of {totalPages} · {total} total</span>
            <div className="flex items-center gap-1.5">
              <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
              <PagerBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PagerBtn({ disabled, onClick, children }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: C.paper, border: `1px solid ${C.hair}`, color: C.ink2, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
