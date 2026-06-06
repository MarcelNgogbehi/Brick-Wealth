"use client";

// app/admin/leads/page.jsx
//
// Leads — triage queue for public "Register Interest" / "Request Invitation"
// submissions (Name, Email, Location). Each lead can be moved through a simple
// pipeline (new → contacted → qualified → converted / archived) and annotated
// with internal notes. Captured by POST /api/leads from the marketing site.

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Sparkles, Mail, MapPin, Clock, Loader2, AlertCircle, CheckCircle2,
  ArrowLeft, Inbox, MessageSquare, Trash2, Globe, Tag, StickyNote, Send,
} from "lucide-react";

// ── Brand system (matches the admin dashboard) ────────────────────────────────
const C = {
  obsidian: "#070C18", navy: "#0A1F44", navySoft: "#2A4A7F",
  gold: "#B8923C", goldDeep: "#8F6E26", goldWash: "#F4ECD8",
  ink: "#0B1220", ink2: "#3C4456", ink3: "#7B8497",
  hair: "#ECEBE6", hair2: "#F3F2EE", paper: "#FFFFFF", canvas: "#F5F5F2",
  slate: "#AEB4C0",
  pos: "#1C7A5E", posSoft: "#E7F1EC",
  alert: "#9B2C2C", alertSoft: "#F7EAEA",
  amber: "#9A6B12", amberSoft: "#F6EEDD",
  blue: "#2A4A7F", blueSoft: "#EAF0FA",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE = [0.16, 1, 0.3, 1];

// Pipeline statuses + how they present
const STATUS_META = {
  new:       { label: "New",       bg: C.goldWash, fg: C.goldDeep, dot: C.gold },
  contacted: { label: "Contacted", bg: C.blueSoft, fg: C.blue,     dot: C.blue },
  qualified: { label: "Qualified", bg: C.amberSoft, fg: C.amber,   dot: C.amber },
  converted: { label: "Converted", bg: C.posSoft,  fg: C.pos,      dot: C.pos },
  archived:  { label: "Archived",  bg: C.hair2,    fg: C.ink3,     dot: C.slate },
};
const STATUS_ORDER = ["new", "contacted", "qualified", "converted", "archived"];

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
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function sourceLabel(s) {
  if (!s) return "Website";
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Human-readable labels for the "Register Interest" qualifiers (developer brief).
const QUALIFIER_LABELS = {
  investorType: { uk: "UK-based", diaspora: "Diaspora" },
  budgetRange: { under_25k: "Under £25k", "25k_100k": "£25k–£100k", "100k_500k": "£100k–£500k", over_500k: "£500k+" },
  interestType: { co_ownership: "Co-ownership", buy_to_let: "Buy-to-let", buy_to_own: "Buy-to-own" },
};
function qualifierLabel(field, value) {
  return (value && QUALIFIER_LABELS[field]?.[value]) || null;
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
function StatusPill({ status, size = "sm" }) {
  const m = STATUS_META[status] || STATUS_META.new;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${pad}`} style={{ backgroundColor: m.bg, color: m.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | <status>

  const load = useCallback(async () => {
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/leads${qs}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      const list = data.leads || [];
      setLeads(list);
      setCounts(data.counts || counts);
      setSelectedId((cur) => (cur && list.some((l) => l.id === cur)) ? cur : (list[0]?.id ?? null));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const selected = leads.find((l) => l.id === selectedId) || null;

  // Apply a lead update returned by the API to local state.
  function applyUpdate(updated) {
    setLeads((prev) => {
      // If a status filter is on and the new status no longer matches, drop it.
      if (filter !== "all" && updated.status !== filter) {
        const next = prev.filter((l) => l.id !== updated.id);
        setSelectedId((cur) => (cur === updated.id ? (next[0]?.id ?? null) : cur));
        return next;
      }
      return prev.map((l) => (l.id === updated.id ? updated : l));
    });
    setTimeout(load, 600);
  }
  function removeLocal(id) {
    setLeads((prev) => {
      const next = prev.filter((l) => l.id !== id);
      setSelectedId((cur) => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
    setTimeout(load, 600);
  }

  const FILTERS = useMemo(() => ([
    { key: "all", label: "All", count: counts.total },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] || 0 })),
  ]), [counts]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Leads</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Register-interest submissions from the marketing site — triage and follow up.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: counts.new > 0 ? C.gold : C.pos }} />
          <span className="text-[12px] font-semibold" style={{ color: C.ink2, ...NUM }}>{counts.new} new</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={Inbox} label="Total" value={counts.total} />
        <StatCard loading={loading} icon={Sparkles} label="New" value={counts.new} accent={counts.new > 0} />
        <StatCard loading={loading} icon={MessageSquare} label="Contacted" value={counts.contacted} />
        <StatCard loading={loading} icon={CheckCircle2} label="Converted" value={counts.converted} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-[12px] font-bold transition-colors"
              style={{
                backgroundColor: on ? C.navy : C.paper,
                color: on ? "#fff" : C.ink2,
                border: `1px solid ${on ? C.navy : C.hair}`,
                cursor: "pointer",
              }}>
              {f.label}
              <span className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: on ? "rgba(255,255,255,0.18)" : C.hair2, color: on ? "#fff" : C.ink3, ...NUM }}>{f.count}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}>
          <AlertCircle size={16} style={{ color: C.alert }} />
          <p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
        </div>
      )}

      {!loading && !error && leads.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-14 h-14 mx-auto mb-4 grid place-items-center rounded-full" style={{ backgroundColor: C.goldWash }}><Inbox size={26} style={{ color: C.goldDeep }} strokeWidth={2} /></span>
          <h2 className="text-[17px] font-bold mb-1.5" style={{ color: C.ink }}>No leads here</h2>
          <p className="text-[13px] max-w-md mx-auto" style={{ color: C.ink3 }}>
            {filter === "all" ? "New register-interest submissions appear here automatically." : `No leads with status “${STATUS_META[filter]?.label}”.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* Queue */}
          <div className={`rounded-2xl overflow-hidden ${selected ? "hidden lg:block" : "block"}`} style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
              <span className="text-[13px] font-bold" style={{ color: C.ink }}>Leads</span>
              {!loading && <span className="grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: C.navy, color: "#fff", ...NUM }}>{leads.length}</span>}
            </div>
            {loading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}` }}>
                    <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: C.hair2 }} />
                    <div className="flex-1 space-y-2"><div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-1/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[66vh] overflow-y-auto">
                {leads.map((lead) => {
                  const on = lead.id === selectedId;
                  const tint = avatarTint(lead.name || lead.email);
                  return (
                    <button key={lead.id} type="button" onClick={() => setSelectedId(lead.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors relative"
                      style={{ borderBottom: `1px solid ${C.hair2}`, background: on ? C.goldWash : "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#FBFBFA"; }}
                      onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                      {on && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: C.gold }} />}
                      <span className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(lead.name)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{lead.name}</span>
                        </div>
                        <div className="text-[11.5px] truncate flex items-center gap-1" style={{ color: C.ink3 }}><MapPin size={10} /> {lead.location}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusPill status={lead.status} />
                        <span className="text-[10px]" style={{ color: C.ink3 }}>{relTime(lead.createdAt)}</span>
                      </div>
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
                  <span className="w-14 h-14 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><Sparkles size={26} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
                  <p className="text-[14px] font-bold" style={{ color: C.ink }}>Select a lead</p>
                  <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Choose someone from the queue to review and follow up.</p>
                </div>
              </div>
            ) : (
              <LeadDetail key={selected.id} lead={selected} onUpdated={applyUpdate} onDeleted={removeLocal} onBack={() => setSelectedId(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function LeadDetail({ lead, onUpdated, onDeleted, onBack }) {
  const [busy, setBusy] = useState(null);          // status key being applied
  const [notes, setNotes] = useState(lead.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState(null);
  const tint = avatarTint(lead.name || lead.email);

  // Reset the notes field only when switching to a *different* lead — keying on
  // lead.id (not lead.notes) so a background list refresh never clobbers an
  // admin's in-progress edits to the currently-selected lead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setNotes(lead.notes || ""); setNotesSaved(false); }, [lead.id]);

  async function patch(body) {
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Update failed");
    return (await res.json()).lead;
  }

  async function setStatus(status) {
    if (busy) return; setBusy(status); setErr(null);
    try { onUpdated(await patch({ status })); }
    catch (e) { setErr(e.message); }
    finally { setBusy(null); }
  }
  async function saveNotes() {
    if (savingNotes) return; setSavingNotes(true); setErr(null);
    try { onUpdated(await patch({ notes })); setNotesSaved(true); }
    catch (e) { setErr(e.message); }
    finally { setSavingNotes(false); }
  }
  async function remove() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (busy) return; setBusy("delete"); setErr(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE", headers: { "X-CSRF-Token": getCsrf() }, credentials: "same-origin" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted(lead.id);
    } catch (e) { setErr(e.message); setBusy(null); }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      {/* Top bar */}
      <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${C.hair2}` }}>
        <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-4" style={{ color: C.ink2, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to leads
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0 text-[14px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(lead.name)}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={lead.status} size="md" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: C.hair2, color: C.ink3 }}><Tag size={9} /> {sourceLabel(lead.source)}</span>
              </div>
              <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] mt-1.5" style={{ color: C.ink }}>{lead.name}</h2>
              <p className="text-[12.5px] mt-0.5 flex items-center gap-1.5" style={{ color: C.ink3 }}>
                <Clock size={12} /> Registered {fullDate(lead.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold" style={{ color: "#fff", background: C.navy, textDecoration: "none" }}>
              <Send size={14} /> Email
            </a>
            <button type="button" onClick={remove} disabled={busy === "delete"}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[12.5px] font-bold disabled:opacity-50"
              style={{ color: C.alert, backgroundColor: C.paper, border: `1px solid ${C.alert}33`, cursor: busy ? "wait" : "pointer" }}>
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{confirmDelete ? "Confirm" : ""}
            </button>
          </div>
        </div>
        {err && <p className="text-[12px] mt-3 font-semibold" style={{ color: C.alert }}>{err}</p>}
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-2 gap-px" style={{ backgroundColor: C.hair2 }}>
        {/* Contact details */}
        <div className="p-5 sm:p-6" style={{ backgroundColor: C.paper }}>
          <SectionTitle icon={Inbox} title="Contact Details" />
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mt-4">
            <Field icon={Mail} label="Email">
              <a href={`mailto:${lead.email}`} className="font-semibold break-words" style={{ color: C.blue, textDecoration: "none" }}>{lead.email}</a>
            </Field>
            <Field icon={MapPin} label="Location" value={lead.location} />
            <Field icon={Globe} label="Source" value={sourceLabel(lead.source)} />
            <Field icon={Clock} label="Registered" value={relTime(lead.createdAt)} />
            {qualifierLabel("investorType", lead.investorType) && (
              <Field icon={Globe} label="Investor Type" value={qualifierLabel("investorType", lead.investorType)} />
            )}
            {qualifierLabel("budgetRange", lead.budgetRange) && (
              <Field icon={Sparkles} label="Budget Range" value={qualifierLabel("budgetRange", lead.budgetRange)} />
            )}
            {qualifierLabel("interestType", lead.interestType) && (
              <Field icon={Tag} label="Interest" value={qualifierLabel("interestType", lead.interestType)} />
            )}
          </div>
          {lead.message && (
            <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair}` }}>
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5 flex items-center gap-1.5" style={{ color: C.ink3 }}><MessageSquare size={11} /> Their message</div>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: C.ink2 }}>{lead.message}</p>
            </div>
          )}
        </div>

        {/* Triage */}
        <div className="p-5 sm:p-6" style={{ backgroundColor: C.paper }}>
          <SectionTitle icon={Tag} title="Pipeline" />
          <div className="flex flex-wrap gap-2 mt-4">
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              const active = lead.status === s;
              return (
                <button key={s} type="button" onClick={() => setStatus(s)} disabled={busy !== null}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: active ? m.bg : C.paper,
                    color: active ? m.fg : C.ink2,
                    border: `1px solid ${active ? m.fg + "55" : C.hair}`,
                    cursor: busy ? "wait" : "pointer",
                  }}>
                  {busy === s ? <Loader2 size={12} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />}
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: C.ink3 }}><StickyNote size={11} /> Internal notes</div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Add a private note about this prospect…"
              rows={4}
              maxLength={2000}
              className="w-full p-3.5 text-[13px] rounded-xl outline-none resize-y"
              style={{ border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit", lineHeight: 1.6 }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px]" style={{ color: C.ink3 }}>
                {lead.handledAt ? `Last actioned ${relTime(lead.handledAt)}` : "Not yet actioned"}
              </span>
              <button type="button" onClick={saveNotes} disabled={savingNotes}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-bold disabled:opacity-60"
                style={{ color: "#fff", background: C.navy, border: "none", cursor: savingNotes ? "wait" : "pointer" }}>
                {savingNotes ? <Loader2 size={13} className="animate-spin" /> : notesSaved ? <CheckCircle2 size={13} /> : <StickyNote size={13} />}
                {notesSaved ? "Saved" : "Save notes"}
              </button>
            </div>
          </div>
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
function Field({ icon: Icon, label, value, children }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold tracking-[0.12em] uppercase mb-1 flex items-center gap-1.5" style={{ color: C.ink3 }}>
        {Icon && <Icon size={11} />}{label}
      </div>
      <div className="text-[13.5px] font-semibold break-words" style={{ color: C.ink }}>{children || value || "—"}</div>
    </div>
  );
}
