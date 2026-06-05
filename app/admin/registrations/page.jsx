"use client";

// app/admin/registrations/page.jsx
//
// Registration Review — master/detail console for approving new applicants.
// Approve → sends verification email. Decline → sends decline email.
// Pending applicants have only sparse profile data; full KYC / net-worth /
// compliance is collected AFTER approval, so the "pipeline" below shows where
// each applicant truly stands rather than fabricating completed checks.

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  UserPlus, CheckCircle2, XCircle, Loader2, AlertCircle, Clock, Globe,
  Mail, AtSign, Link2, ArrowLeft, ShieldCheck, BadgeCheck, FileText,
  CircleDot, Users, CalendarClock, MapPin, Hash,
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

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
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
function relTime(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fullDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function refCode(reg) {
  const y = reg.createdAt ? new Date(reg.createdAt).getFullYear() : new Date().getFullYear();
  const tail = String(reg.id || "").replace(/[^a-z0-9]/gi, "").slice(-3).toUpperCase() || "000";
  return `INV-${y}-${tail}`;
}
function isToday(d) { return d && new Date(d).toDateString() === new Date().toDateString(); }
function within7d(d) { return d && (Date.now() - new Date(d).getTime()) < 7 * 864e5; }

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

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registrations", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load registrations");
      const data = await res.json();
      const list = data.registrations || [];
      setRegistrations(list);
      setSelectedId((cur) => (cur && list.some((r) => r.id === cur)) ? cur : (list[0]?.id ?? null));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const selected = registrations.find((r) => r.id === selectedId) || null;
  const stats = useMemo(() => ({
    pending: registrations.length,
    referred: registrations.filter((r) => r.referredBy).length,
    today: registrations.filter((r) => isToday(r.createdAt)).length,
    week: registrations.filter((r) => within7d(r.createdAt)).length,
  }), [registrations]);

  // Optimistically remove a resolved applicant and advance selection.
  function resolveLocal(id) {
    setRegistrations((prev) => {
      const next = prev.filter((r) => r.id !== id);
      setSelectedId((cur) => cur === id ? (next[0]?.id ?? null) : cur);
      return next;
    });
    setTimeout(load, 900);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Registration Review</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Approve new applicants and start them on the onboarding pipeline.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stats.pending > 0 ? C.gold : C.pos }} />
          <span className="text-[12px] font-semibold" style={{ color: C.ink2, ...NUM }}>{stats.pending} in queue</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={UserPlus} label="Pending" value={stats.pending} accent={stats.pending > 0} />
        <StatCard loading={loading} icon={CalendarClock} label="Today" value={stats.today} />
        <StatCard loading={loading} icon={Users} label="This Week" value={stats.week} />
        <StatCard loading={loading} icon={Link2} label="Referred" value={stats.referred} />
      </div>

      {error && (
        <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}>
          <AlertCircle size={16} style={{ color: C.alert }} />
          <p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
        </div>
      )}

      {/* All clear */}
      {!loading && !error && registrations.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-14 h-14 mx-auto mb-4 grid place-items-center rounded-full" style={{ backgroundColor: C.posSoft }}><CheckCircle2 size={26} style={{ color: C.pos }} strokeWidth={2.2} /></span>
          <h2 className="text-[17px] font-bold mb-1.5" style={{ color: C.ink }}>All caught up</h2>
          <p className="text-[13px] max-w-md mx-auto" style={{ color: C.ink3 }}>No registrations are waiting for review. New applications appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Pending queue */}
          <div className={`rounded-2xl overflow-hidden ${selected ? "hidden lg:block" : "block"}`} style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
              <span className="text-[13px] font-bold" style={{ color: C.ink }}>Pending Queue</span>
              {!loading && <span className="grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: C.navy, color: "#fff", ...NUM }}>{registrations.length}</span>}
            </div>
            {loading ? (
              <div className="divide-y" style={{ borderColor: C.hair2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: C.hair2 }} />
                    <div className="flex-1 space-y-2"><div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-1/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[64vh] overflow-y-auto">
                {registrations.map((reg) => {
                  const on = reg.id === selectedId;
                  const tint = avatarTint(reg.fullName || reg.username);
                  return (
                    <button key={reg.id} type="button" onClick={() => setSelectedId(reg.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors relative"
                      style={{ borderBottom: `1px solid ${C.hair2}`, background: on ? C.goldWash : "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#FBFBFA"; }}
                      onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                      {on && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: C.gold }} />}
                      <span className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(reg.fullName)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{reg.fullName}</span>
                          {reg.referredBy && <Link2 size={11} style={{ color: C.gold }} />}
                        </div>
                        <div className="text-[11.5px] truncate" style={{ color: C.ink3 }}>{reg.residency} · {reg.country}</div>
                      </div>
                      <span className="text-[10.5px] flex-shrink-0" style={{ color: C.ink3 }}>{relTime(reg.createdAt)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className={`${selected ? "block" : "hidden lg:block"}`}>
            {!selected ? (
              <div className="rounded-2xl h-full grid place-items-center py-20 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
                <div>
                  <span className="w-14 h-14 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><UserPlus size={26} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
                  <p className="text-[14px] font-bold" style={{ color: C.ink }}>Select an applicant</p>
                  <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Choose someone from the queue to review.</p>
                </div>
              </div>
            ) : (
              <RegistrationDetail key={selected.id} reg={selected} onResolved={resolveLocal} onBack={() => setSelectedId(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function RegistrationDetail({ reg, onResolved, onBack }) {
  const [busy, setBusy] = useState(null); // "approve" | "decline"
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState(null);
  const tint = avatarTint(reg.fullName || reg.username);

  async function approve() {
    if (busy) return; setBusy("approve"); setErr(null);
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}/approve`, { method: "POST", headers: { "X-CSRF-Token": getCsrf() }, credentials: "same-origin" });
      if (!res.ok) throw new Error("Approval failed");
      onResolved(reg.id);
    } catch (e) { setErr(e.message); setBusy(null); }
  }
  async function decline() {
    if (!declineOpen) { setDeclineOpen(true); return; }
    if (busy) return; setBusy("decline"); setErr(null);
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}/decline`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ reason: reason.trim() || undefined }) });
      if (!res.ok) throw new Error("Decline failed");
      onResolved(reg.id);
    } catch (e) { setErr(e.message); setBusy(null); }
  }

  // Onboarding pipeline — honest: where the applicant actually stands.
  const pipeline = [
    { label: "Application submitted", desc: `Registered ${relTime(reg.createdAt)}`, state: "done" },
    { label: "Admin approval", desc: "Awaiting your decision", state: "current" },
    { label: "Email verification", desc: "Sent on approval", state: "todo" },
    { label: "Identity & KYC", desc: "Collected during onboarding", state: "todo" },
    { label: "Account activation", desc: "Unlocks the investor dashboard", state: "todo" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      {/* Top bar */}
      <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${C.hair2}` }}>
        <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-4" style={{ color: C.ink2, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to queue
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0 text-[14px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(reg.fullName)}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide" style={{ backgroundColor: C.hair2, color: C.ink3, ...NUM }}><Hash size={9} />{refCode(reg)}</span>
                {reg.referredBy && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}><Link2 size={9} /> Referred</span>}
              </div>
              <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] mt-1" style={{ color: C.ink }}>{reg.fullName}</h2>
              <p className="text-[12.5px] mt-0.5 flex items-center gap-1.5" style={{ color: C.ink3 }}>
                <MapPin size={12} /> Applied {fullDate(reg.createdAt)} · {reg.residency} · {reg.country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={decline} disabled={busy !== null}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold disabled:opacity-50"
              style={{ color: C.alert, backgroundColor: C.paper, border: `1px solid ${C.alert}33`, cursor: busy ? "wait" : "pointer" }}>
              {busy === "decline" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}{declineOpen ? "Confirm decline" : "Decline"}
            </button>
            <button type="button" onClick={approve} disabled={busy !== null}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold disabled:opacity-50"
              style={{ color: "#fff", background: C.pos, border: "none", cursor: busy ? "wait" : "pointer" }}>
              {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Approve registration
            </button>
          </div>
        </div>

        <AnimatePresence>
          {declineOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex gap-2 items-center mt-4">
                <input type="text" placeholder="Reason for declining (optional, emailed to applicant)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} autoFocus
                  className="flex-1 h-10 px-3.5 text-[13px] rounded-xl outline-none" style={{ border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }}
                  onKeyDown={(e) => { if (e.key === "Escape") { setDeclineOpen(false); setReason(""); } }} />
                <button type="button" onClick={() => { setDeclineOpen(false); setReason(""); }} className="h-10 px-3.5 rounded-xl text-[12.5px] font-semibold" style={{ color: C.ink3, background: C.canvas, border: `1px solid ${C.hair}`, cursor: "pointer" }}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {err && <p className="text-[12px] mt-3 font-semibold" style={{ color: C.alert }}>{err}</p>}
      </div>

      {/* Body grid */}
      <div className="grid md:grid-cols-2 gap-px" style={{ backgroundColor: C.hair2 }}>
        {/* Application details */}
        <div className="p-5 sm:p-6" style={{ backgroundColor: C.paper }}>
          <SectionTitle icon={FileText} title="Application Details" />
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mt-4">
            <Field icon={Mail} label="Email" value={reg.email} />
            <Field icon={AtSign} label="Username" value={`@${reg.username}`} />
            <Field icon={Globe} label="Residency" value={reg.residency} />
            <Field icon={MapPin} label="Country" value={reg.country} />
            <Field icon={Clock} label="Registered" value={fullDate(reg.createdAt)} />
            <Field icon={CircleDot} label="Status" value="Pending review" tone={C.amber} />
          </div>
          {reg.referredBy && (
            <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: C.goldWash + "66", border: `1px solid ${C.gold}33` }}>
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5" style={{ color: C.goldDeep }}>Introduced by</div>
              <div className="text-[13.5px] font-bold" style={{ color: C.ink }}>{reg.referredBy.fullName}</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.ink3 }}>
                {reg.referredBy.email}{reg.referredBy.code ? ` · ${reg.referredBy.code}` : ""}
              </div>
            </div>
          )}
          <p className="text-[11.5px] mt-5 leading-relaxed" style={{ color: C.ink3 }}>
            Full profile, financial declaration and KYC documents are collected during onboarding — after this application is approved.
          </p>
        </div>

        {/* Onboarding pipeline */}
        <div className="p-5 sm:p-6" style={{ backgroundColor: C.paper }}>
          <SectionTitle icon={ShieldCheck} title="Onboarding Pipeline" />
          <ol className="mt-4 relative">
            <span aria-hidden className="absolute left-[11px] top-1 bottom-1 w-px" style={{ backgroundColor: C.hair }} />
            {pipeline.map((step) => (
              <li key={step.label} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
                <span className="relative z-10 w-[23px] h-[23px] rounded-full grid place-items-center flex-shrink-0"
                  style={{
                    backgroundColor: step.state === "done" ? C.pos : step.state === "current" ? C.gold : C.paper,
                    border: step.state === "todo" ? `2px solid ${C.hair}` : "none",
                  }}>
                  {step.state === "done" ? <CheckCircle2 size={13} className="text-white" />
                    : step.state === "current" ? <CircleDot size={13} className="text-white" />
                    : <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.slate }} />}
                </span>
                <div className="min-w-0 -mt-0.5">
                  <div className="text-[13px] font-bold flex items-center gap-2" style={{ color: step.state === "todo" ? C.ink3 : C.ink }}>
                    {step.label}
                    {step.state === "current" && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>YOU ARE HERE</span>}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: C.ink3 }}>{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: C.goldWash }}><Icon size={15} style={{ color: C.goldDeep }} /></span>
      <h3 className="text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>{title}</h3>
    </div>
  );
}
function Field({ icon: Icon, label, value, tone }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold tracking-[0.12em] uppercase mb-1 flex items-center gap-1.5" style={{ color: C.ink3 }}>
        {Icon && <Icon size={11} />}{label}
      </div>
      <div className="text-[13.5px] font-semibold break-words" style={{ color: tone || C.ink }}>{value || "—"}</div>
    </div>
  );
}
