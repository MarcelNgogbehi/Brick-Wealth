"use client";

// app/admin/announcements/page.jsx
//
// Admin: create, edit, publish, delete announcements.
// Styled to match the Notification Center — same warm brand system,
// stat cards, pill filters and rounded panels.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Megaphone, Pin, Plus, Loader2, AlertCircle, CheckCircle2,
  Edit2, Trash2, Send, Eye, X, Users, FileText, Inbox, BarChart3,
  ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

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
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "expired", label: "Expired" },
];

function getCsrfToken() {
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

export default function AdminAnnouncementsPage() {
  const { confirm } = useDialog();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | {announcement}
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { setPage(1); }, [status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/announcements?${params}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setResult(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [status, page]);

  // Summary counts — independent of the active filter (mirrors the Notification Center).
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/announcements?page=1&pageSize=100`, { credentials: "same-origin" }).then((r) => r.json());
      const list = res.announcements || [];
      const now = Date.now();
      const expired = (a) => a.expiresAt && new Date(a.expiresAt).getTime() < now;
      setSummary({
        total: res.total ?? list.length,
        published: list.filter((a) => a.publishedAt && !expired(a)).length,
        drafts: list.filter((a) => !a.publishedAt).length,
        notified: list.reduce((s, a) => s + (a.notifiedCount || 0), 0),
      });
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  function showSuccess(msg) { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  function showError(msg) { setError(msg); setTimeout(() => setError(null), 5000); }

  async function handleDelete(announcementId) {
    const ok = await confirm({
      title: "Delete announcement?",
      message: "This permanently deletes the announcement and cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/announcements/${announcementId}`, {
        method: "DELETE", headers: { "X-CSRF-Token": getCsrfToken() }, credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) { showSuccess("Announcement deleted"); await load(); loadSummary(); }
      else showError(data.message || "Failed to delete");
    } catch (err) { showError(err.message); }
  }

  async function handlePublish(announcement) {
    const ok = await confirm({
      title: `Publish “${announcement.title}”?`,
      message: `This sends notifications to all matching investors (in-app + email per their preferences). Audience: ${announcement.audience}.`,
      confirmLabel: "Publish now",
      cancelLabel: "Not yet",
      tone: "warning",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}/publish`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() }, credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`${data.message}. ${data.notified.email} email${data.notified.email === 1 ? "" : "s"} sent, ${data.notified.inApp} in-app.`);
        await load(); loadSummary();
      } else showError(data.message || "Failed to publish");
    } catch (err) { showError(err.message); }
  }

  const announcements = result?.announcements || [];
  const totalPages = result?.totalPages || 1;
  const total = summary?.total ?? 0;
  const published = summary?.published ?? 0;
  const drafts = summary?.drafts ?? 0;
  const notified = summary?.notified ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>Announcements</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Send important news to your investors via in-app &amp; email.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12.5px] font-semibold self-start"
          style={{ background: C.navy, color: "#fff", border: "none", cursor: "pointer" }}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={!summary} icon={Inbox} label="Total" value={total} />
        <StatCard loading={!summary} icon={Megaphone} label="Published" value={published} accent={published > 0} />
        <StatCard loading={!summary} icon={FileText} label="Drafts" value={drafts} />
        <StatCard loading={!summary} icon={BarChart3} label="Notified" value={notified} />
      </div>

      {/* Banners */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 px-3.5 py-2.5 flex items-center gap-2 rounded-xl" style={{ backgroundColor: C.posSoft, color: C.pos }}>
            <CheckCircle2 size={15} strokeWidth={2} />
            <p className="text-[12.5px] font-semibold">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 px-3.5 py-2.5 flex items-start gap-2 rounded-xl" style={{ backgroundColor: C.alertSoft, color: C.alert }}>
            <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="text-[12.5px] font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pill filters */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const on = status === f.value;
          return (
            <button key={f.value} type="button" onClick={() => setStatus(f.value)}
              className="px-3.5 h-9 rounded-full text-[12.5px] font-semibold transition-colors"
              style={{ background: on ? C.navy : C.paper, color: on ? "#fff" : C.ink2, border: `1px solid ${on ? C.navy : C.hair}`, cursor: "pointer" }}>
              {f.label}{f.value === "draft" && drafts > 0 ? ` · ${drafts}` : ""}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
          <span className="text-[13px] font-bold" style={{ color: C.ink }}>Announcement Log</span>
          {!loading && <span className="text-[11px]" style={{ color: C.ink3 }}>{announcements.length} shown</span>}
        </div>

        {loading ? (
          <div className="divide-y" style={{ borderColor: C.hair2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
                  <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <span className="w-12 h-12 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><Megaphone size={22} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
            <p className="text-[14px] font-bold" style={{ color: C.ink }}>No announcements</p>
            <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Create your first announcement to notify investors.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: C.hair2 }}>
            {announcements.map((a) => (
              <AnnouncementRow key={a.id} announcement={a}
                onEdit={() => setEditing(a)} onDelete={() => handleDelete(a.id)} onPublish={() => handlePublish(a)} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.hair2}` }}>
            <span className="text-[11.5px]" style={{ color: C.ink3 }}>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <PagerBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={15} /></PagerBtn>
              <PagerBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={15} /></PagerBtn>
            </div>
          </div>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <AnnouncementEditor
            initialData={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(msg) => { setEditing(null); showSuccess(msg); load(); loadSummary(); }}
            onError={showError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AnnouncementRow({ announcement, onEdit, onDelete, onPublish }) {
  const isPublished = !!announcement.publishedAt;
  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

  const badge = isExpired
    ? { label: "Expired", bg: C.hair2, fg: C.ink3 }
    : isPublished
      ? { label: "Published", bg: C.posSoft, fg: C.pos }
      : { label: "Draft", bg: C.amberSoft, fg: C.amber };

  return (
    <div className="flex items-start gap-4 px-5 py-4 transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FBFBFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.04em] uppercase" style={{ backgroundColor: badge.bg, color: badge.fg }}>{badge.label}</span>
          {announcement.isPinned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-[0.04em] uppercase" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>
              <Pin size={9} strokeWidth={2.25} /> Pinned
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.ink3 }}><Users size={10} /> {announcement.audience}</span>
          {announcement.notifiedCount > 0 && <span className="text-[11px]" style={{ color: C.ink3 }}>· {announcement.notifiedCount} notified</span>}
          <span className="ml-auto inline-flex items-center gap-1 text-[10.5px]" style={{ color: C.ink3 }}><Clock size={10} />{relTime(announcement.createdAt)}</span>
        </div>
        <p className="text-[14.5px] font-bold leading-snug" style={{ color: C.ink }}>{announcement.title}</p>
        <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.ink3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {announcement.body}
        </p>

        <div className="flex items-center gap-2 mt-3">
          {!isPublished && !isExpired && (
            <button type="button" onClick={onPublish}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-bold"
              style={{ background: C.gold, color: "#fff", border: "none", cursor: "pointer" }}>
              <Send size={11} /> Publish
            </button>
          )}
          <button type="button" onClick={onEdit} title="Edit"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-semibold"
            style={{ color: C.ink2, background: C.paper, border: `1px solid ${C.hair}`, cursor: "pointer" }}>
            <Edit2 size={11} /> Edit
          </button>
          <button type="button" onClick={onDelete} title="Delete"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-semibold"
            style={{ color: C.alert, background: C.paper, border: `1px solid ${C.alert}33`, cursor: "pointer" }}>
            <Trash2 size={11} /> Delete
          </button>
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

// ─── Editor modal ─────────────────────────────────────────────────────────────

function AnnouncementEditor({ initialData, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    body: initialData?.body || "",
    audience: initialData?.audience || "all",
    customTag: (initialData?.audience || "").startsWith("tag:") ? (initialData.audience).slice(4) : "",
    isPinned: initialData?.isPinned || false,
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : "",
  });
  const [audienceMode, setAudienceMode] = useState(
    (initialData?.audience || "all").startsWith("tag:") ? "tag" : (initialData?.audience || "all")
  );
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function handleAudienceModeChange(mode) {
    setAudienceMode(mode);
    if (mode === "all" || mode === "activated") setForm((f) => ({ ...f, audience: mode }));
  }
  function getResolvedAudience() {
    if (audienceMode === "tag") { const tag = form.customTag.trim(); return tag ? `tag:${tag}` : "tag:"; }
    return audienceMode;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const audience = getResolvedAudience();
      if (audience === "tag:") { onError("Please enter a tag name"); setSubmitting(false); return; }
      const body = {
        title: form.title.trim(),
        body: form.body.trim(),
        audience,
        isPinned: form.isPinned,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const isUpdate = !!initialData;
      const url = isUpdate ? `/api/admin/announcements/${initialData.id}` : "/api/admin/announcements";
      const res = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) onSaved(isUpdate ? "Announcement updated" : "Draft created");
      else onError(data.message || "Failed to save");
    } catch (err) { onError(err.message); }
    setSubmitting(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(7,12,24,0.5)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ backgroundColor: C.paper, borderRadius: "16px", border: `1px solid ${C.hair}` }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.hair2}` }}>
          <h2 className="text-[17px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>{initialData ? "Edit Announcement" : "New Announcement"}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg" style={{ background: "transparent", border: "none", cursor: "pointer", color: C.ink3 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {!showPreview ? (
            <>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: C.ink3 }}>
                  Title <span style={{ color: C.alert }}>*</span>
                </label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={180}
                  style={inputStyle()} placeholder="e.g., New opportunity: Birmingham Townhouse" />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: C.ink3 }}>
                  Body <span style={{ color: C.alert }}>*</span>
                </label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required maxLength={10000} rows={8}
                  style={{ ...inputStyle(), height: "auto", padding: "12px 14px", resize: "vertical" }}
                  placeholder="Write your announcement here. Plain text is supported. Line breaks will be preserved." />
                <p className="text-[10.5px] mt-1" style={{ color: C.ink3 }}>{form.body.length} / 10,000 characters · First 280 will appear in notification preview</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: C.ink3 }}>
                  Audience <span style={{ color: C.alert }}>*</span>
                </label>
                <div className="space-y-2">
                  <AudienceOption selected={audienceMode === "all"} onClick={() => handleAudienceModeChange("all")} label="All investors" description="Every active investor account" icon={Users} />
                  <AudienceOption selected={audienceMode === "activated"} onClick={() => handleAudienceModeChange("activated")} label="Activated only" description="Only fully-activated accounts (KYC approved)" icon={CheckCircle2} />
                  <AudienceOption selected={audienceMode === "tag"} onClick={() => handleAudienceModeChange("tag")} label="By tag" description="Investors with a specific tag" icon={Pin} />
                </div>
                {audienceMode === "tag" && (
                  <input type="text" value={form.customTag} onChange={(e) => setForm({ ...form, customTag: e.target.value })} placeholder="e.g., vip" className="mt-2" style={inputStyle()} />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} style={{ accentColor: C.gold }} />
                  <span className="text-[13px]" style={{ color: C.ink }}>Pin to top</span>
                </label>
                <div>
                  <label className="block text-[10.5px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: C.ink3 }}>Expires (optional)</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ ...inputStyle(), height: 36, fontSize: 12 }} />
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair2}` }}>
              <p className="text-[10.5px] tracking-[0.18em] uppercase font-bold mb-3" style={{ color: C.ink3 }}>Preview (as investor sees)</p>
              <div className="p-5 rounded-2xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.gold}40`, boxShadow: "0 1px 3px rgba(184,146,60,0.08)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.06em] uppercase" style={{ backgroundColor: C.gold, color: "#fff" }}>New</span>
                  {form.isPinned && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.06em] uppercase" style={{ backgroundColor: C.goldWash, color: C.goldDeep }}>
                      <Pin size={9} /> Pinned
                    </span>
                  )}
                </div>
                <h3 className="text-[20px] leading-tight mb-2" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontStyle: "italic" }}>
                  {form.title || "Your title here"}
                </h3>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: C.ink2 }}>{form.body || "Your body here"}</p>
              </div>
            </div>
          )}
        </form>

        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
          <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.ink2, background: "transparent", border: "none", cursor: "pointer" }}>
            <Eye size={12} /> {showPreview ? "Edit" : "Preview"}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 h-10 rounded-xl text-[12.5px] font-semibold" style={{ color: C.ink2, background: C.paper, border: `1px solid ${C.hair}`, cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={submitting || !form.title.trim() || !form.body.trim()}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl text-[12.5px] font-bold disabled:opacity-50"
              style={{ backgroundColor: C.navy, color: "#fff", border: "none", cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {initialData ? "Save Changes" : "Save Draft"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AudienceOption({ selected, onClick, label, description, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left p-3 flex items-start gap-3 rounded-xl transition-all"
      style={{ backgroundColor: selected ? C.goldWash : C.paper, border: `1px solid ${selected ? C.gold : C.hair}`, cursor: "pointer" }}>
      <div className="w-8 h-8 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: selected ? "#FFFFFF" : C.hair2 }}>
        <Icon size={14} strokeWidth={1.9} style={{ color: selected ? C.goldDeep : C.ink3 }} />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{label}</p>
        <p className="text-[11.5px] mt-0.5" style={{ color: C.ink3 }}>{description}</p>
      </div>
    </button>
  );
}

function inputStyle() {
  return {
    width: "100%", height: 40, padding: "0 14px", fontSize: 13,
    border: `1px solid ${C.hair}`, borderRadius: "10px", color: C.ink,
    fontFamily: "inherit", backgroundColor: C.paper, outline: "none",
  };
}
