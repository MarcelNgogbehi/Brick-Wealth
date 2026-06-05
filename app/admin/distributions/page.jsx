"use client";

// app/admin/distributions/page.jsx
//
// Distributions — record dividend payments against an SPV. Recording snapshots
// holders pro-rata and notifies them. Record-and-report only.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, Plus, Loader2, AlertCircle, CheckCircle2, Clock, XCircle,
  Inbox, Users, Calendar, X, Play, Trash2, ChevronRight, Wallet, FileText,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

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
const CS = { GBP: "£", USD: "$", EUR: "€" };

const STATUS_META = {
  DRAFT:     { label: "Draft",     bg: C.hair2,    fg: C.ink3,     Icon: Clock },
  RECORDED:  { label: "Recorded",  bg: C.slateSoft, fg: C.navy,    Icon: CheckCircle2 },
  PAID:      { label: "Paid",      bg: C.posSoft,  fg: C.pos,      Icon: Banknote },
  CANCELLED: { label: "Cancelled", bg: C.alertSoft, fg: C.alert,   Icon: XCircle },
};

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
function money(n) {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e9) return "£" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return "£" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return "£" + (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "£" + Math.round(v).toLocaleString();
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

export default function DistributionsPage() {
  const { confirm } = useDialog();
  const [distributions, setDistributions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmRecord, setConfirmRecord] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dRes, sRes] = await Promise.all([
        fetch("/api/admin/distributions", { credentials: "same-origin" }),
        fetch("/api/admin/distributions?stats=1", { credentials: "same-origin" }),
      ]);
      const d = await dRes.json(); const s = await sRes.json();
      if (d.success) setDistributions(d.distributions || []); else setError(d.message || "Failed to load");
      if (s.success) setStats(s.stats);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function flash(msg, kind = "success") { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500); }

  async function recordDist(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/distributions/${id}`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ action: "record" }) });
      const data = await res.json();
      if (data.success) { flash(data.message); setConfirmRecord(null); load(); } else flash(data.message || "Failed", "error");
    } catch (err) { flash(err.message, "error"); }
    setBusyId(null);
  }
  async function cancelDist(id) {
    const ok = await confirm({
      title: "Cancel this distribution?",
      message: "Draft distributions are deleted; recorded ones are marked cancelled.",
      confirmLabel: "Cancel distribution",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/distributions/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({}) });
      const data = await res.json();
      if (data.success) { flash(data.message, "neutral"); load(); } else flash(data.message || "Failed", "error");
    } catch (err) { flash(err.message, "error"); }
    setBusyId(null);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Distributions</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Record dividend payments — each is attributed pro-rata to holders, who are notified.</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold" style={{ background: C.navy, color: "#fff", border: "none", cursor: "pointer" }}>
          <Plus size={15} /> New distribution
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!stats} icon={FileText} label="Drafts" value={stats?.drafts ?? 0} />
        <StatCard loading={!stats} icon={CheckCircle2} label="Recorded" value={stats?.recorded ?? 0} />
        <StatCard loading={!stats} icon={Banknote} label="Paid" value={stats?.paid ?? 0} accent />
        <StatCard loading={!stats} icon={Wallet} label="Total Distributed" value={money(stats?.totalDistributedAllTime || 0)} />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 p-3 mb-4 rounded-xl"
            style={{ backgroundColor: toast.kind === "error" ? C.alertSoft : toast.kind === "success" ? C.posSoft : C.hair2 }}>
            {toast.kind === "error" ? <AlertCircle size={15} style={{ color: C.alert }} /> : <CheckCircle2 size={15} style={{ color: toast.kind === "success" ? C.pos : C.ink2 }} />}
            <p className="text-[12.5px] font-medium" style={{ color: toast.kind === "error" ? C.alert : toast.kind === "success" ? C.pos : C.ink2 }}>{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: C.hair2 }} />)}</div>
      ) : error ? (
        <div className="rounded-2xl py-12 text-center" style={{ border: `1px solid ${C.hair}`, background: C.paper }}>
          <AlertCircle size={22} className="mx-auto mb-2" style={{ color: C.alert }} /><p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
        </div>
      ) : distributions.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ border: `1px solid ${C.hair}`, background: C.paper }}>
          <span className="w-14 h-14 mx-auto mb-3 grid place-items-center rounded-2xl" style={{ background: C.hair2 }}><Inbox size={24} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
          <p className="text-[15px] font-bold" style={{ color: C.ink }}>No distributions yet</p>
          <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Create one to record a dividend payment for an SPV.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {distributions.map((d) => {
            const meta = STATUS_META[d.status] || STATUS_META.DRAFT;
            const Icon = meta.Icon; const cs = CS[d.currency] || "£";
            return (
              <div key={d.id} className="p-4 sm:p-5 rounded-2xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: meta.bg }}><Icon size={18} style={{ color: meta.fg }} /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: meta.bg, color: meta.fg }}>{meta.label}</span>
                        <span className="text-[14px] font-bold" style={{ color: C.ink }}>{d.declarationLabel}</span>
                      </div>
                      <p className="text-[12.5px] mt-1 truncate" style={{ color: C.ink2 }}>{d.spv?.spvName || "—"}{d.spv?.opportunity?.title ? ` · ${d.spv.opportunity.title}` : ""}</p>
                      <div className="flex items-center gap-3.5 mt-2 text-[11.5px] flex-wrap" style={{ color: C.ink3 }}>
                        <span className="inline-flex items-center gap-1 font-bold" style={{ color: C.ink, ...NUM }}>{cs}{Number(d.totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> Pay {new Date(d.paymentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {d.status !== "DRAFT" && <span className="inline-flex items-center gap-1"><Users size={11} /> {d.holdersAtRecord} holder{d.holdersAtRecord === 1 ? "" : "s"}</span>}
                        <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: C.hair2 }}>UK {d.taxYearUk}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.status === "DRAFT" && (
                      <button type="button" onClick={() => setConfirmRecord(d.id)} disabled={busyId === d.id}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12px] font-bold disabled:opacity-50" style={{ background: C.pos, color: "#fff", border: "none", cursor: "pointer" }}>
                        {busyId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Record
                      </button>
                    )}
                    {d.status !== "CANCELLED" && d.status !== "PAID" && (
                      <button type="button" onClick={() => cancelDist(d.id)} disabled={busyId === d.id}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-semibold disabled:opacity-50" style={{ background: C.paper, color: C.alert, border: `1px solid ${C.alert}33`, cursor: "pointer" }}>
                        <Trash2 size={13} /> Cancel
                      </button>
                    )}
                    <a href={`/admin/distributions/${d.id}`} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.hair}`, textDecoration: "none" }}>
                      View <ChevronRight size={13} />
                    </a>
                  </div>
                </div>

                <AnimatePresence>
                  {confirmRecord === d.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 p-3.5 rounded-xl" style={{ backgroundColor: C.amberSoft, border: `1px solid ${C.amber}22` }}>
                        <p className="text-[12.5px] font-bold mb-1" style={{ color: C.amber }}>Record this distribution?</p>
                        <p className="text-[12px] mb-3 leading-relaxed" style={{ color: C.ink2 }}>
                          Snapshots all current holders, attributes {cs}{Number(d.totalAmount).toLocaleString("en-GB")} pro-rata, and notifies them. It can’t be edited afterwards — only cancelled.
                        </p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => recordDist(d.id)} disabled={busyId === d.id} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[11.5px] font-bold disabled:opacity-50" style={{ background: C.pos, color: "#fff", border: "none", cursor: "pointer" }}>
                            {busyId === d.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm record
                          </button>
                          <button type="button" onClick={() => setConfirmRecord(null)} className="h-9 px-3 rounded-lg text-[11.5px] font-semibold" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.hair}`, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); flash("Draft created."); load(); }} flash={flash} />}
      </AnimatePresence>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, flash }) {
  const [spvs, setSpvs] = useState([]);
  const [form, setForm] = useState({ spvId: "", declarationLabel: "", totalAmount: "", recordDate: "", paymentDate: "", withholdingPct: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [loadingSpvs, setLoadingSpvs] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await fetch("/api/admin/spvs?pageSize=200", { credentials: "same-origin" }); const data = await res.json(); setSpvs(data.spvs || data.data?.spvs || []); } catch {}
      setLoadingSpvs(false);
    })();
  }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.spvId || !form.declarationLabel || !form.totalAmount || !form.recordDate || !form.paymentDate) { flash("Fill in SPV, label, amount, and both dates.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/distributions", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin",
        body: JSON.stringify({ spvId: form.spvId, declarationLabel: form.declarationLabel, totalAmount: form.totalAmount, recordDate: form.recordDate, paymentDate: form.paymentDate, withholdingPct: form.withholdingPct ? Number(form.withholdingPct) : null, description: form.description || undefined }) });
      const data = await res.json();
      if (data.success) onCreated(); else flash(data.message || "Failed to create", "error");
    } catch (err) { flash(err.message, "error"); }
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center p-4" style={{ backgroundColor: "rgba(7,12,24,0.55)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-md rounded-2xl" style={{ backgroundColor: C.paper, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(7,12,24,0.3)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.hair2}` }}>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink }}>New distribution</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink3 }}><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3.5">
          <Field label="SPV">
            {loadingSpvs ? <div className="text-[12px] py-2" style={{ color: C.ink3 }}>Loading SPVs…</div> : (
              <select value={form.spvId} onChange={(e) => set("spvId", e.target.value)} style={inputStyle}><option value="">Select an SPV…</option>{spvs.map((s) => <option key={s.id} value={s.id}>{s.spvName}</option>)}</select>
            )}
          </Field>
          <Field label="Label"><input type="text" value={form.declarationLabel} onChange={(e) => set("declarationLabel", e.target.value)} placeholder="e.g. Q4 2025 Dividend" style={inputStyle} /></Field>
          <Field label="Total amount (£)"><input type="number" min="0" step="0.01" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Record date"><input type="date" value={form.recordDate} onChange={(e) => set("recordDate", e.target.value)} style={inputStyle} /></Field>
            <Field label="Payment date"><input type="date" value={form.paymentDate} onChange={(e) => set("paymentDate", e.target.value)} style={inputStyle} /></Field>
          </div>
          <Field label="Withholding % (optional)"><input type="number" min="0" max="100" step="0.01" value={form.withholdingPct} onChange={(e) => set("withholdingPct", e.target.value)} placeholder="0" style={inputStyle} /></Field>
          <Field label="Description (optional)"><textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Narrative shown to investors…" style={{ ...inputStyle, resize: "none" }} /></Field>
        </div>
        <div className="flex gap-2 px-5 py-4" style={{ borderTop: `1px solid ${C.hair2}` }}>
          <button type="button" onClick={submit} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-[12.5px] font-bold disabled:opacity-50" style={{ background: C.navy, color: "#fff", border: "none", cursor: "pointer" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create draft
          </button>
          <button type="button" onClick={onClose} className="px-4 h-11 rounded-xl text-[12.5px] font-semibold" style={{ background: C.paper, color: C.ink2, border: `1px solid ${C.hair}`, cursor: "pointer" }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10.5px] font-bold tracking-[0.1em] uppercase block mb-1.5" style={{ color: C.ink3 }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { width: "100%", padding: "10px 12px", fontSize: "13px", color: C.ink, border: `1px solid ${C.hair}`, borderRadius: "10px", outline: "none", fontFamily: "inherit", backgroundColor: C.paper };
