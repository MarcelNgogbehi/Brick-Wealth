"use client";

// app/admin/_components/OpportunityUpdatesTab.jsx
//
// Admin tab for managing property updates inside the opportunity edit page.
//
// Usage:
//   <OpportunityUpdatesTab opportunityId={id} />

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pin, Loader2, AlertCircle, CheckCircle2,
  Edit2, Trash2, Send, X, FileText, Image as ImageIcon,
  Upload, Eye, Key, Hammer, Home, Banknote, BarChart3, Target,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const WARNING_BG = "#FBF5E1";
const WARNING = "#B8860B";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";

const TYPE_OPTIONS = [
  { value: "acquisition",  label: "Acquisition",   icon: Key },
  { value: "refurb",       label: "Refurbishment", icon: Hammer },
  { value: "letting",      label: "Letting",       icon: Home },
  { value: "distribution", label: "Distribution",  icon: Banknote },
  { value: "valuation",    label: "Valuation",     icon: BarChart3 },
  { value: "exit",         label: "Exit",          icon: Target },
  { value: "general",      label: "General",       icon: FileText },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function OpportunityUpdatesTab({ opportunityId }) {
  const { confirm } = useDialog();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | update
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunityId}/updates`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) setUpdates(data.updates || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [opportunityId]);

  useEffect(() => { load(); }, [load]);

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4500);
  }

  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(null), 5500);
  }

  async function handleDelete(update) {
    const ok = await confirm({
      title: "Delete update?",
      message: `“${update.title}” will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunityId}/updates/${update.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Update deleted");
        load();
      } else {
        showError(data.message || "Failed to delete");
      }
    } catch (err) {
      showError(err.message);
    }
  }

  async function handlePublish(update) {
    const ok = await confirm({
      title: `Publish “${update.title}”?`,
      message: "This makes the update visible to investors who can see this opportunity.",
      confirmLabel: "Publish",
      cancelLabel: "Not yet",
      tone: "warning",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunityId}/updates/${update.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message || "Published");
        load();
      } else {
        showError(data.message || "Failed to publish");
      }
    } catch (err) {
      showError(err.message);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase font-bold mb-1" style={{ color: TEXT_MUTED }}>
            Investor-facing
          </p>
          <h2 className="text-[20px] font-bold leading-tight" style={{ color: INK }}>Property Updates</h2>
          <p className="text-[12.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
            Post updates that appear on the investor timeline for this opportunity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-semibold"
          style={{
            backgroundColor: NAVY_900,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Plus size={13} /> Post Update
        </button>
      </div>

      {/* Banners */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 flex items-center gap-2"
          style={{ backgroundColor: SUCCESS_BG, border: `1px solid ${SUCCESS}30`, borderRadius: "8px" }}
        >
          <CheckCircle2 size={14} strokeWidth={2} style={{ color: SUCCESS }} />
          <p className="text-[13px] font-semibold" style={{ color: SUCCESS }}>{success}</p>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 flex items-start gap-2"
          style={{ backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "8px" }}
        >
          <AlertCircle size={14} strokeWidth={2} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[13px]" style={{ color: DANGER }}>{error}</p>
        </motion.div>
      )}

      {/* List */}
      {loading && (
        <div className="py-12 text-center">
          <Loader2 size={18} className="animate-spin mx-auto" style={{ color: GOLD }} />
        </div>
      )}

      {!loading && updates.length === 0 && (
        <div
          className="py-12 text-center"
          style={{ backgroundColor: "#FAFAFA", border: "1px dashed rgba(10,31,68,0.12)", borderRadius: "10px" }}
        >
          <FileText size={24} strokeWidth={1.5} style={{ color: TEXT_MUTED, margin: "0 auto" }} />
          <p className="text-[13px] font-semibold mt-2" style={{ color: INK }}>No updates yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
            Post your first update to keep investors informed.
          </p>
        </div>
      )}

      {!loading && updates.length > 0 && (
        <div className="space-y-2">
          {updates.map((u) => (
            <AdminUpdateRow
              key={u.id}
              update={u}
              onEdit={() => setEditing(u)}
              onDelete={() => handleDelete(u)}
              onPublish={() => handlePublish(u)}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <UpdateEditor
            opportunityId={opportunityId}
            initialData={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(msg) => {
              setEditing(null);
              showSuccess(msg);
              load();
            }}
            onError={showError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────

function AdminUpdateRow({ update, onEdit, onDelete, onPublish }) {
  const isPublished = !!update.publishedAt;
  const typeMeta = TYPE_OPTIONS.find((t) => t.value === update.type) || TYPE_OPTIONS[6];
  const TypeIcon = typeMeta.icon;

  return (
    <div
      className="p-3.5 flex items-start gap-3"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(10,31,68,0.08)",
        borderRadius: "10px",
      }}
    >
      <div
        className="w-9 h-9 grid place-items-center flex-shrink-0"
        style={{ backgroundColor: "rgba(10, 31, 68, 0.04)", borderRadius: "8px" }}
      >
        <TypeIcon size={13} strokeWidth={1.75} style={{ color: TEXT_SECONDARY }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
            style={{
              backgroundColor: isPublished ? SUCCESS_BG : WARNING_BG,
              color: isPublished ? SUCCESS : WARNING,
              borderRadius: "3px",
            }}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
          <span className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: TEXT_MUTED }}>
            {typeMeta.label}
          </span>
          {update.isPinned && (
            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: GOLD_DARK }}>
              <Pin size={9} strokeWidth={2.25} /> Pinned
            </span>
          )}
          {update.images && update.images.length > 0 && (
            <span className="flex items-center gap-1 text-[10.5px]" style={{ color: TEXT_MUTED }}>
              <ImageIcon size={10} /> {update.images.length}
            </span>
          )}
          {update._count?.comments > 0 && (
            <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
              · {update._count.comments} comments
            </span>
          )}
        </div>
        <p className="text-[14px] font-semibold leading-tight mb-0.5" style={{ color: INK }}>
          {update.title}
        </p>
        <p className="text-[11.5px] line-clamp-1" style={{ color: TEXT_SECONDARY }}>
          {update.body}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isPublished && (
          <button
            type="button"
            onClick={onPublish}
            title="Publish"
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold"
            style={{
              backgroundColor: GOLD,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Send size={10} /> Publish
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          className="w-8 h-8 grid place-items-center"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(10,31,68,0.12)",
            borderRadius: "6px",
            cursor: "pointer",
            color: TEXT_SECONDARY,
          }}
        >
          <Edit2 size={11} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="w-8 h-8 grid place-items-center"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(155,44,44,0.2)",
            borderRadius: "6px",
            cursor: "pointer",
            color: DANGER,
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Editor Modal ────────────────────────────────────────────────

function UpdateEditor({ opportunityId, initialData, onClose, onSaved, onError }) {
  const { prompt } = useDialog();
  const [form, setForm] = useState({
    type: initialData?.type || "general",
    title: initialData?.title || "",
    body: initialData?.body || "",
    images: initialData?.images || [],
    isPinned: initialData?.isPinned || false,
    distributionPerUnit: initialData?.metadata?.distributionPerUnit || "",
    currency: initialData?.metadata?.currency || "GBP",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (form.images.length + files.length > 6) {
      onError("Maximum 6 images per update");
      return;
    }
    setUploading(true);
    try {
      // Re-use your existing UploadThing endpoint. Many setups expose
      // a /api/uploadthing route. Adjust the endpoint name if yours differs.
      const formData = new FormData();
      for (const file of files) formData.append("files", file);

      const res = await fetch("/api/admin/uploads/property-image", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": getCsrfToken() },
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls)) {
        setForm((f) => ({ ...f, images: [...f.images, ...data.urls].slice(0, 6) }));
      } else {
        onError(data.message || "Upload failed — wire your UploadThing route at /api/admin/uploads/property-image or paste image URLs directly");
      }
    } catch (err) {
      onError("Upload failed. You can paste image URLs directly using the URL input below.");
    }
    setUploading(false);
    e.target.value = ""; // reset input
  }

  async function addImageByUrl() {
    const url = await prompt({
      title: "Add image by URL",
      message: "Paste a direct image URL from your CDN.",
      placeholder: "https://…/image.jpg",
      confirmLabel: "Add image",
      tone: "info",
      required: true,
    });
    if (!url || !url.trim()) return;
    if (form.images.length >= 6) {
      onError("Maximum 6 images per update");
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url.trim()] }));
  }

  function removeImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const metadata = form.type === "distribution" && form.distributionPerUnit
        ? {
            distributionPerUnit: parseFloat(form.distributionPerUnit) || undefined,
            currency: form.currency,
          }
        : undefined;

      const body = {
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
        images: form.images,
        isPinned: form.isPinned,
        ...(metadata ? { metadata } : {}),
      };

      const isUpdate = !!initialData;
      const url = isUpdate
        ? `/api/admin/opportunities/${opportunityId}/updates/${initialData.id}`
        : `/api/admin/opportunities/${opportunityId}/updates`;

      const res = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(isUpdate ? "Update saved" : "Draft created");
      } else {
        onError(data.message || "Failed to save");
      }
    } catch (err) {
      onError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(10, 31, 68, 0.5)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "#FFFFFF", borderRadius: "14px" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(10,31,68,0.08)" }}
        >
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            {initialData ? "Edit Update" : "Post Update"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 grid place-items-center"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="block text-[11.5px] font-semibold mb-2" style={{ color: TEXT_SECONDARY }}>
              Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = form.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: opt.value })}
                    className="flex flex-col items-center gap-1 p-2 transition-all"
                    style={{
                      backgroundColor: active ? GOLD_LIGHT : "#FFFFFF",
                      border: `1px solid ${active ? GOLD : "rgba(10,31,68,0.1)"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Icon size={13} strokeWidth={1.75} style={{ color: active ? GOLD_DARK : TEXT_MUTED }} />
                    <span className="text-[10.5px] font-semibold" style={{ color: active ? GOLD_DARK : TEXT_SECONDARY }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Title <span style={{ color: DANGER }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={180}
              style={inputStyle()}
              placeholder="e.g., Refurbishment complete"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Body <span style={{ color: DANGER }}>*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              maxLength={10_000}
              rows={6}
              style={{ ...inputStyle(), height: "auto", padding: "10px 12px", resize: "vertical" }}
              placeholder="What's the update? Plain text. Line breaks preserved."
            />
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
              {form.body.length} / 10,000
            </p>
          </div>

          {/* Distribution-specific */}
          {form.type === "distribution" && (
            <div
              className="p-3 grid grid-cols-2 gap-3"
              style={{ backgroundColor: GOLD_LIGHT, borderRadius: "8px" }}
            >
              <div>
                <label className="block text-[10.5px] font-semibold mb-1" style={{ color: GOLD_DARK }}>
                  Distribution per unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.distributionPerUnit}
                  onChange={(e) => setForm({ ...form, distributionPerUnit: e.target.value })}
                  style={{ ...inputStyle(), height: 36, backgroundColor: "#FFFFFF" }}
                  placeholder="312"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold mb-1" style={{ color: GOLD_DARK }}>
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  style={{ ...inputStyle(), height: 36, backgroundColor: "#FFFFFF" }}
                >
                  <option value="GBP">GBP £</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                </select>
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Images <span className="font-normal" style={{ color: TEXT_MUTED }}>({form.images.length}/6)</span>
            </label>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative" style={{ aspectRatio: "1 / 1" }}>
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full"
                      style={{ objectFit: "cover", borderRadius: "6px" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 grid place-items-center"
                      style={{
                        backgroundColor: "rgba(10, 31, 68, 0.85)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "999px",
                        cursor: "pointer",
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.images.length < 6 && (
              <div className="flex gap-2">
                <label
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11.5px] font-semibold cursor-pointer"
                  style={{
                    border: "1px dashed rgba(10,31,68,0.2)",
                    borderRadius: "8px",
                    color: TEXT_SECONDARY,
                  }}
                >
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                  {uploading ? "Uploading..." : "Upload images"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  type="button"
                  onClick={addImageByUrl}
                  className="px-3 py-2 text-[11px] font-semibold"
                  style={{
                    backgroundColor: "transparent",
                    color: TEXT_SECONDARY,
                    border: "1px solid rgba(10,31,68,0.12)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Add URL
                </button>
              </div>
            )}
          </div>

          {/* Pin */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              style={{ accentColor: GOLD }}
            />
            <span className="text-[12.5px]" style={{ color: INK }}>Pin to top of timeline</span>
          </label>
        </form>

        <div
          className="px-6 py-4 flex items-center justify-end gap-2"
          style={{ borderTop: "1px solid rgba(10,31,68,0.08)", backgroundColor: "#FAFAFA" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-semibold"
            style={{
              color: TEXT_SECONDARY,
              background: "transparent",
              border: "1px solid rgba(10,31,68,0.12)",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.body.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold disabled:opacity-50"
            style={{
              backgroundColor: NAVY_900,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: submitting ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitting ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
            {initialData ? "Save Changes" : "Save Draft"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    height: 40,
    padding: "0 12px",
    fontSize: 13,
    border: "1px solid rgba(10, 31, 68, 0.12)",
    borderRadius: "8px",
    color: INK,
    fontFamily: "inherit",
    backgroundColor: "#FFFFFF",
    outline: "none",
  };
}