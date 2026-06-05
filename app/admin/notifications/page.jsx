"use client";

// app/admin/notifications/page.jsx
//
// Notification Center — the admin's live inbox of investor messages and
// platform activity. Opening an investor-assistance request reveals a reply
// composer; sending notifies the investor instantly. All figures are real
// (counts derived from the inbox) — no fabricated open / click rates.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Bell, MessageSquare, ShieldCheck, UserPlus, Wallet, Megaphone,
  CheckCheck, Inbox, AlertCircle, Send, Loader2, CheckCircle2,
  ChevronLeft, ChevronRight, Mail, Clock, CornerUpLeft, ArrowLeft, Activity,
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

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "assistance", label: "Investor messages" },
];
const CATEGORY = {
  investor_assistance: { label: "Investor message", Icon: MessageSquare, c: C.goldDeep, bg: C.goldWash },
  kyc_submitted:       { label: "KYC",              Icon: ShieldCheck,   c: C.info,     bg: C.infoSoft },
  registration:        { label: "Registration",     Icon: UserPlus,      c: C.pos,      bg: C.posSoft },
  subscription_update: { label: "Subscription",     Icon: Wallet,        c: C.navy,     bg: C.slateSoft },
  admin_announcement:  { label: "Announcement",     Icon: Megaphone,     c: C.ink2,     bg: C.hair2 },
};

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
function relTime(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fullTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
const isUrgent = (n) => /URGENT/i.test(n.title || "") || n.metadata?.urgency === "urgent";
const cleanTitle = (t) => (t || "Notification").replace(/^\s*🔴?\s*URGENT\s*/i, "").trim();

function CountUp({ value = 0, format }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, value, { duration: 0.8, ease: EASE, onUpdate: setN }); return () => c.stop(); }, [value]);
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

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [summary, setSummary] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?view=list&filter=${filter}&page=${page}`, { credentials: "same-origin" });
      const d = await res.json();
      if (d.success) setData(d);
    } catch {}
    setLoading(false);
  }, [filter, page]);

  const loadSummary = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/admin/notifications?view=list&filter=all&page=1`, { credentials: "same-origin" }).then((r) => r.json()),
        fetch(`/api/admin/notifications?view=list&filter=assistance&page=1`, { credentials: "same-origin" }).then((r) => r.json()),
      ]);
      setSummary({ total: a.total || 0, unread: a.unreadCount || 0, assistance: b.total || 0 });
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => {
    const t = setInterval(() => { load(); loadSummary(); }, 15_000);
    const onFocus = () => { load(); loadSummary(); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load, loadSummary]);

  const items = data?.notifications || [];
  const selected = items.find((n) => n.id === selectedId) || null;
  const total = summary?.total ?? 0;
  const unread = summary?.unread ?? 0;
  const assistance = summary?.assistance ?? 0;
  const readRate = total > 0 ? Math.round(((total - unread) / total) * 100) : 0;
  const totalPages = data?.totalPages ?? 1;

  async function openItem(n) {
    setSelectedId(n.id); setReply(""); setFeedback(null);
    if (!n.readAt) {
      setData((prev) => prev ? { ...prev, notifications: prev.notifications.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x) } : prev);
      setSummary((s) => s ? { ...s, unread: Math.max(0, s.unread - 1) } : s);
      try {
        await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ id: n.id }) });
      } catch {}
    }
  }
  async function markAll() {
    setData((prev) => prev ? { ...prev, notifications: prev.notifications.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })) } : prev);
    setSummary((s) => s ? { ...s, unread: 0 } : s);
    try {
      await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ markAllRead: true }) });
    } catch {}
    load(); loadSummary();
  }
  async function sendReply(e) {
    e?.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true); setFeedback(null);
    try {
      const res = await fetch(`/api/admin/notifications/${selected.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ message: reply.trim() }) });
      const d = await res.json();
      if (res.ok && d.success) { setFeedback({ type: "success", text: d.message || "Reply sent." }); setReply(""); load(); }
      else setFeedback({ type: "error", text: d.message || "Could not send reply." });
    } catch { setFeedback({ type: "error", text: "Network error. Please try again." }); }
    setSending(false);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Notification Center</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Investor messages &amp; platform activity — reply to keep investors moving.</p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={markAll}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12.5px] font-semibold self-start"
            style={{ background: C.navy, color: "#fff", border: "none", cursor: "pointer" }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!summary} icon={Inbox} label="Total" value={total} />
        <StatCard loading={!summary} icon={Bell} label="Unread" value={unread} accent={unread > 0} />
        <StatCard loading={!summary} icon={MessageSquare} label="Investor Messages" value={assistance} />
        <StatCard loading={!summary} icon={Activity} label="Read Rate" value={`${readRate}%`} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const on = filter === f.value;
          return (
            <button key={f.value} type="button" onClick={() => { setFilter(f.value); setPage(1); setSelectedId(null); }}
              className="px-3.5 h-9 rounded-full text-[12.5px] font-semibold transition-colors"
              style={{ background: on ? C.navy : C.paper, color: on ? "#fff" : C.ink2, border: `1px solid ${on ? C.navy : C.hair}`, cursor: "pointer" }}>
              {f.label}{f.value === "unread" && unread > 0 ? ` · ${unread}` : ""}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        {/* List */}
        <div className={`rounded-2xl overflow-hidden ${selected ? "hidden lg:block" : "block"}`}
          style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
            <span className="text-[13px] font-bold" style={{ color: C.ink }}>Notification Log</span>
            <span className="text-[11px]" style={{ color: C.ink3 }}>Live · refreshes automatically</span>
          </div>

          {loading && !data ? (
            <div className="divide-y" style={{ borderColor: C.hair2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-lg animate-pulse" style={{ backgroundColor: C.hair2 }} />
                  <div className="flex-1 space-y-2 py-0.5"><div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <span className="w-12 h-12 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><Inbox size={22} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
              <p className="text-[14px] font-bold" style={{ color: C.ink }}>Nothing here</p>
              <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>{filter === "unread" ? "No unread notifications." : filter === "assistance" ? "No investor messages yet." : "Notifications will appear here."}</p>
            </div>
          ) : (
            <div className="max-h-[64vh] overflow-y-auto">
              {items.map((n) => {
                const cat = CATEGORY[n.category] || { label: "Notification", Icon: Bell, c: C.ink2, bg: C.hair2 };
                const urgent = isUrgent(n);
                const unreadRow = !n.readAt;
                const on = n.id === selectedId;
                const Icon = cat.Icon;
                return (
                  <button key={n.id} type="button" onClick={() => openItem(n)}
                    className="w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors relative"
                    style={{ borderBottom: `1px solid ${C.hair2}`, background: on ? C.goldWash : unreadRow ? "#FCFBF7" : "transparent", cursor: "pointer" }}
                    onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#FBFBFA"; }}
                    onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = unreadRow ? "#FCFBF7" : "transparent"; }}>
                    {on && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: C.gold }} />}
                    <span className="grid place-items-center flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg" style={{ background: urgent ? C.alertSoft : cat.bg }}>
                      {urgent ? <AlertCircle size={17} style={{ color: C.alert }} /> : <Icon size={16} style={{ color: cat.c }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: urgent ? C.alert : cat.c, backgroundColor: urgent ? C.alertSoft : cat.bg }}>
                          {urgent ? "URGENT" : cat.label}
                        </span>
                        <span className="ml-auto text-[10.5px] flex items-center gap-1" style={{ color: C.ink3 }}><Clock size={10} />{relTime(n.createdAt)}</span>
                        {unreadRow && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.gold }} />}
                      </div>
                      <p className="text-[13px] font-bold leading-snug truncate" style={{ color: C.ink }}>{cleanTitle(n.title)}</p>
                      {n.body && <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: C.ink3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body.replace(/\n+/g, " · ")}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${C.hair2}` }}>
              <span className="text-[11.5px]" style={{ color: C.ink3 }}>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <PagerBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
                <PagerBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
              </div>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className={`rounded-2xl ${selected ? "block" : "hidden lg:block"}`}
          style={{ background: C.paper, border: `1px solid ${C.hair}`, minHeight: 380, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
          {!selected ? (
            <div className="h-full grid place-items-center py-20 px-6 text-center">
              <div>
                <span className="w-14 h-14 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><Mail size={26} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
                <p className="text-[14px] font-bold" style={{ color: C.ink }}>Select a notification</p>
                <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Choose a message to read it and reply.</p>
              </div>
            </div>
          ) : (
            <NotificationDetail key={selected.id} n={selected} reply={reply} setReply={setReply} sending={sending} feedback={feedback} onSend={sendReply} onBack={() => setSelectedId(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationDetail({ n, reply, setReply, sending, feedback, onSend, onBack }) {
  const meta = n.metadata || {};
  const urgent = isUrgent(n);
  const cat = CATEGORY[n.category] || { label: "Notification", Icon: Bell, c: C.ink2, bg: C.hair2 };
  const canReply = n.category === "investor_assistance" && !!meta.investorId;
  const Icon = cat.Icon;
  return (
    <div className="p-5 sm:p-6">
      <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-4" style={{ color: C.ink2, background: "none", border: "none", cursor: "pointer" }}>
        <ArrowLeft size={14} /> Back to list
      </button>

      <div className="flex items-start gap-3 mb-4">
        <span className="grid place-items-center flex-shrink-0 w-11 h-11 rounded-xl" style={{ background: urgent ? C.alertSoft : cat.bg }}>
          {urgent ? <AlertCircle size={20} style={{ color: C.alert }} /> : <Icon size={19} style={{ color: cat.c }} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: urgent ? C.alert : cat.c, backgroundColor: urgent ? C.alertSoft : cat.bg }}>{urgent ? "URGENT" : cat.label}</span>
          </div>
          <h2 className="text-[17px] font-bold leading-tight tracking-[-0.01em]" style={{ color: C.ink }}>{cleanTitle(n.title)}</h2>
          <p className="text-[11.5px] mt-1" style={{ color: C.ink3 }}>{fullTime(n.createdAt)}</p>
        </div>
      </div>

      {(meta.investorName || meta.investorEmail || meta.purpose) && (
        <div className="rounded-xl p-4 mb-4 grid gap-2" style={{ background: C.canvas, border: `1px solid ${C.hair2}` }}>
          {meta.investorName && <MetaRow label="From" value={meta.investorName} />}
          {meta.investorEmail && <MetaRow label="Email" value={meta.investorEmail} />}
          {meta.purpose && <MetaRow label="Purpose" value={meta.purpose} />}
        </div>
      )}

      <div className="mb-5">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: C.ink3 }}>Message</p>
        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: C.ink2 }}>{meta.message || n.body || "—"}</p>
      </div>

      {canReply ? (
        <form onSubmit={onSend} className="pt-4" style={{ borderTop: `1px solid ${C.hair2}` }}>
          <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: C.ink3 }}>
            <CornerUpLeft size={12} /> Reply to {meta.investorName || "investor"}
          </label>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply… the investor is notified instantly." rows={4} maxLength={4000}
            className="w-full rounded-xl px-3.5 py-3 text-[13.5px] outline-none resize-y transition-colors" style={{ border: `1px solid ${C.hair}`, color: C.ink, background: "#fff", minHeight: 100 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)} onBlur={(e) => (e.currentTarget.style.borderColor = C.hair)} />
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-[12.5px] font-medium"
                style={{ background: feedback.type === "success" ? C.posSoft : C.alertSoft, color: feedback.type === "success" ? C.pos : C.alert }}>
                {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px]" style={{ color: C.ink3, ...NUM }}>{reply.length}/4000</span>
            <button type="submit" disabled={!reply.trim() || sending}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-bold"
              style={{ background: !reply.trim() || sending ? C.slate : C.navy, color: "#fff", border: "none", cursor: !reply.trim() || sending ? "not-allowed" : "pointer" }}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{sending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </form>
      ) : (
        <div className="pt-4 flex items-center gap-2 text-[12.5px]" style={{ borderTop: `1px solid ${C.hair2}`, color: C.ink3 }}>
          {n.link ? <a href={n.link} className="font-semibold" style={{ color: C.goldDeep, textDecoration: "none" }}>Open related page →</a> : "No reply needed for this notification."}
        </div>
      )}
    </div>
  );
}
function MetaRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 text-[12.5px]">
      <span className="font-bold flex-shrink-0 tracking-wide uppercase text-[10px] mt-0.5" style={{ color: C.ink3, width: 52 }}>{label}</span>
      <span style={{ color: C.ink, wordBreak: "break-word" }}>{value}</span>
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
