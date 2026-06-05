"use client";

// app/admin/referrals/page.jsx
//
// Admin: full referral network view.
// Stats row · Top-referrers leaderboard · Paginated edge table with filters.
// Styled to the admin brand system (matches Registrations / Notifications).

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  GitBranch, Loader2, AlertCircle, Users, CheckCircle2,
  Clock, XCircle, Award, Link2, ChevronLeft, ChevronRight,
  Filter, Download,
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
  PENDING_APPROVAL: { label: "Pending",  bg: C.amberSoft, fg: C.amber, Icon: Clock },
  APPROVED:         { label: "Approved", bg: C.infoSoft,  fg: C.info,  Icon: CheckCircle2 },
  ACTIVATED:        { label: "Active",   bg: C.posSoft,   fg: C.pos,   Icon: Award },
  DECLINED:         { label: "Declined", bg: C.alertSoft, fg: C.alert, Icon: XCircle },
};

const STATUS_FILTERS = [
  { value: "",                 label: "All"      },
  { value: "PENDING_APPROVAL", label: "Pending"  },
  { value: "APPROVED",         label: "Approved" },
  { value: "ACTIVATED",        label: "Active"   },
  { value: "DECLINED",         label: "Declined" },
];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0] ?? "?").toUpperCase();
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

const PAGE_SIZE = 25;

export default function AdminReferralsPage() {
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [sRes, tRes, lRes] = await Promise.all([
        fetch("/api/admin/referrals?stats=1", { credentials: "same-origin" }),
        fetch("/api/admin/referrals?top=1", { credentials: "same-origin" }),
        fetch(`/api/admin/referrals?page=${page}&pageSize=${PAGE_SIZE}${status ? `&status=${status}` : ""}`, { credentials: "same-origin" }),
      ]);
      const [sD, tD, lD] = await Promise.all([sRes.json(), tRes.json(), lRes.json()]);
      if (sD.success) setStats(sD.stats);
      if (tD.success) setTop(tD.top || []);
      if (lD.success) { setReferrals(lD.referrals || []); setTotal(lD.total || 0); setTotalPages(lD.totalPages || 1); }
      else setErr(lD.message || "Failed to load");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  function downloadCsv() {
    const rows = [["Referrer", "Referrer Email", "Referee", "Referee Email", "Code", "Status", "Date"]];
    referrals.forEach((r) => rows.push([
      r.referrer?.fullName || "—", r.referrer?.email || "—",
      r.referee?.fullName || "—", r.referee?.email || "—",
      r.code || "—", r.status, fmtDate(r.registeredAt),
    ]));
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "referrals.csv";
    a.click();
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: C.goldWash }}><GitBranch size={16} style={{ color: C.goldDeep }} /></span>
            <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Referral Network</h1>
          </div>
          <p className="text-[13px]" style={{ color: C.ink3 }}>Track who introduced whom, monitor referral status, and see your top ambassadors.</p>
        </div>
      </div>

      <AnimatePresence>
        {err && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl" style={{ backgroundColor: C.alertSoft }}>
            <AlertCircle size={15} style={{ color: C.alert }} /><p className="text-[12.5px] font-semibold" style={{ color: C.alert }}>{err}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!stats} icon={Users} label="Total Referrals" value={stats?.totalReferrals ?? 0} />
        <StatCard loading={!stats} icon={Clock} label="Pending Approval" value={stats?.pending ?? 0} accent={(stats?.pending ?? 0) > 0} />
        <StatCard loading={!stats} icon={Award} label="Active Investors" value={stats?.activated ?? 0} />
        <StatCard loading={!stats} icon={Link2} label="Active Codes" value={stats?.activeCodes ?? 0} />
      </div>

      {/* Two-column: Top referrers | Referral table */}
      <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-5">
        {/* Leaderboard */}
        <div className="rounded-2xl p-5 self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={15} style={{ color: C.goldDeep }} />
            <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>Top Referrers</p>
          </div>
          {top.length === 0 ? (
            <p className="text-[12.5px] py-6 text-center" style={{ color: C.ink3 }}>No referrals recorded yet.</p>
          ) : (
            <div className="space-y-1">
              {top.map((u, i) => (
                <Link key={u.id} href={`/admin/investors/${u.id}`} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                  style={{ textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.canvas)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <div className="w-5 text-center flex-shrink-0">
                    {i < 3 ? <span className="text-[14px]">{["🥇", "🥈", "🥉"][i]}</span> : <span className="text-[11px] font-bold" style={{ color: C.ink3 }}>{i + 1}</span>}
                  </div>
                  <div className="w-8 h-8 grid place-items-center flex-shrink-0 text-[11px] font-bold rounded-full" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>{initials(u.fullName)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold truncate" style={{ color: C.ink }}>{u.fullName}</p>
                    <p className="text-[11px] truncate" style={{ color: C.ink3 }}>{u.email}</p>
                  </div>
                  <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: C.goldWash, color: C.goldDeep, ...NUM }}>{u.referralCount}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Edges table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter size={13} style={{ color: C.ink3 }} />
              {STATUS_FILTERS.map((f) => {
                const on = status === f.value;
                return (
                  <button key={f.value} type="button" onClick={() => { setStatus(f.value); setPage(1); }}
                    className="px-3 h-8 rounded-full text-[11.5px] font-semibold transition-colors"
                    style={{ backgroundColor: on ? C.navy : C.paper, color: on ? "#fff" : C.ink2, border: `1px solid ${on ? C.navy : C.hair}`, cursor: "pointer" }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px]" style={{ color: C.ink3 }}>{total} {total === 1 ? "referral" : "referrals"}</span>
              <button type="button" onClick={downloadCsv} title="Download CSV" className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, cursor: "pointer", color: C.ink2 }}>
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="hidden sm:grid px-5 py-2.5" style={{ gridTemplateColumns: "1fr 1fr 110px 120px 110px", backgroundColor: C.paper, borderBottom: `1px solid ${C.hair2}` }}>
            {["Referrer", "Referee", "Code", "Date", "Status"].map((h) => (
              <span key={h} className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: C.ink3 }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin" style={{ color: C.gold }} /></div>
          ) : referrals.length === 0 ? (
            <div className="py-16 text-center">
              <span className="w-12 h-12 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><GitBranch size={22} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
              <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>No referrals found</p>
              <p className="text-[12px] mt-1" style={{ color: C.ink3 }}>{status ? "Try clearing the filter." : "Referrals appear here once investors share their links."}</p>
            </div>
          ) : (
            <>
              {referrals.map((r, i) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.PENDING_APPROVAL;
                return (
                  <div key={r.id} className="flex sm:grid items-start sm:items-center gap-3 px-5 py-3.5 flex-wrap"
                    style={{ gridTemplateColumns: "1fr 1fr 110px 120px 110px", borderBottom: i < referrals.length - 1 ? `1px solid ${C.hair2}` : "none" }}>
                    {/* Referrer */}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase sm:hidden mb-0.5" style={{ color: C.ink3 }}>Referrer</p>
                      {r.referrer ? (
                        <Link href={`/admin/investors/${r.referrer.id}`} className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
                          <div className="w-7 h-7 grid place-items-center flex-shrink-0 text-[10px] font-bold rounded-full" style={{ backgroundColor: C.slateSoft, color: C.navy }}>{initials(r.referrer.fullName)}</div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold truncate group-hover:underline" style={{ color: C.ink }}>{r.referrer.fullName}</p>
                            <p className="text-[11px] truncate" style={{ color: C.ink3 }}>{r.referrer.email}</p>
                          </div>
                        </Link>
                      ) : <span className="text-[12px]" style={{ color: C.ink3 }}>—</span>}
                    </div>
                    {/* Referee */}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase sm:hidden mb-0.5" style={{ color: C.ink3 }}>Referee</p>
                      {r.referee ? (
                        <Link href={`/admin/investors/${r.referee.id}`} className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
                          <div className="w-7 h-7 grid place-items-center flex-shrink-0 text-[10px] font-bold rounded-full" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>{initials(r.referee.fullName)}</div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold truncate group-hover:underline" style={{ color: C.ink }}>{r.referee.fullName}</p>
                            <p className="text-[11px] truncate" style={{ color: C.ink3 }}>{r.referee.email}</p>
                          </div>
                        </Link>
                      ) : <span className="text-[12px]" style={{ color: C.ink3 }}>—</span>}
                    </div>
                    {/* Code */}
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase sm:hidden mb-0.5" style={{ color: C.ink3 }}>Code</p>
                      {r.code ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-mono font-bold rounded" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>
                          <Link2 size={9} /> {r.code}
                        </span>
                      ) : <span style={{ color: C.ink3 }}>—</span>}
                    </div>
                    {/* Date */}
                    <div>
                      <p className="text-[12px]" style={{ color: C.ink2 }}>{fmtDate(r.registeredAt)}</p>
                      {r.activatedAt && <p className="text-[10.5px]" style={{ color: C.ink3 }}>Active {fmtDate(r.activatedAt)}</p>}
                    </div>
                    {/* Status */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold rounded-full" style={{ backgroundColor: meta.bg, color: meta.fg }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.fg }} />{meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.hair2}` }}>
                  <span className="text-[11.5px]" style={{ color: C.ink3 }}>Page {page} of {totalPages} · {total} total</span>
                  <div className="flex items-center gap-1.5">
                    <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
                    <PagerBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
