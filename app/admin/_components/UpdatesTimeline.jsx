"use client";

// app/dashboard/_components/UpdatesTimeline.jsx
//
// Drop-in component for the investor opportunity detail page.
// Renders a timeline of property updates with reactions + comments.
//
// Usage:
//   <UpdatesTimeline opportunityId={opportunityId} />

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Inbox, Heart, Hand, CheckCircle2, MessageCircle,
  Send, MoreHorizontal, Trash2, Edit2, Flag, X, Pin,
  Key, Hammer, Home, Banknote, BarChart3, Target, FileText,
  Image as ImageIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

const NAVY_900 = "#0A1F44";
const CREAM = "#F8F4EC";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const DANGER = "#9B2C2C";

const TYPE_META = {
  acquisition:  { icon: Key,       label: "Acquisition",  color: "#7A5C1E" },
  refurb:       { icon: Hammer,    label: "Refurbishment", color: "#3A5874" },
  letting:      { icon: Home,      label: "Letting",      color: "#2E6855" },
  distribution: { icon: Banknote,  label: "Distribution", color: GOLD_DARK },
  valuation:    { icon: BarChart3, label: "Valuation",    color: NAVY_900 },
  exit:         { icon: Target,    label: "Exit",         color: "#7A1E3A" },
  general:      { icon: FileText,  label: "Update",       color: TEXT_MUTED },
};

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function UpdatesTimeline({ opportunityId }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/opportunities/${opportunityId}/updates?page=${page}&pageSize=20`,
        { credentials: "same-origin" }
      );
      const data = await res.json();
      if (data.success) {
        setUpdates(data.updates || []);
        setTotalPages(data.totalPages || 0);
      } else {
        setError(data.message || "Could not load updates");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [opportunityId, page]);

  useEffect(() => { load(); }, [load]);

  // Update a single item in the list (used by reaction/comment callbacks)
  function patchUpdate(updateId, fn) {
    setUpdates((prev) => prev.map((u) => (u.id === updateId ? fn(u) : u)));
  }

  async function handleToggleReaction(updateId, type) {
    // Optimistic update
    patchUpdate(updateId, (u) => {
      const hasIt = (u.myReactions || []).includes(type);
      const newMy = hasIt
        ? u.myReactions.filter((t) => t !== type)
        : [...(u.myReactions || []), type];
      const counts = { ...(u.reactionCounts || {}) };
      counts[type] = (counts[type] || 0) + (hasIt ? -1 : 1);
      if (counts[type] < 0) counts[type] = 0;
      return { ...u, myReactions: newMy, reactionCounts: counts };
    });

    try {
      const res = await fetch(`/api/dashboard/updates/${updateId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!data.success) {
        // Roll back
        load();
      }
    } catch {
      load();
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 size={20} className="animate-spin mx-auto mb-3" style={{ color: GOLD }} />
        <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>Loading updates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px]" style={{ color: DANGER }}>{error}</p>
      </div>
    );
  }

  if (updates.length === 0) {
    return <EmptyTimeline />;
  }

  return (
    <div>
      <motion.div
        className="relative"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        {/* Vertical timeline line */}
        <div
          className="absolute left-[19px] top-3 bottom-3 w-px"
          style={{ backgroundColor: "rgba(10, 31, 68, 0.08)" }}
        />

        {updates.map((update) => (
          <UpdateCard
            key={update.id}
            update={update}
            onToggleReaction={(type) => handleToggleReaction(update.id, type)}
            onLightboxOpen={setLightboxImage}
          />
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(10, 31, 68, 0.1)",
                borderRadius: "8px",
                cursor: "pointer",
                color: INK,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(10, 31, 68, 0.1)",
                borderRadius: "8px",
                cursor: "pointer",
                color: INK,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single Update Card ──────────────────────────────────────────

function UpdateCard({ update, onToggleReaction, onLightboxOpen }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const meta = TYPE_META[update.type] || TYPE_META.general;
  const Icon = meta.icon;
  const commentCount = update._count?.comments || 0;

  // Distribution metadata pretty-print
  const distInfo = update.type === "distribution" && update.metadata?.distributionPerUnit
    ? `${update.metadata.currency === "USD" ? "$" : update.metadata.currency === "EUR" ? "€" : "£"}${update.metadata.distributionPerUnit}/unit`
    : null;

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      className="relative pl-12 pb-7 last:pb-0"
    >
      {/* Timeline node */}
      <div
        className="absolute left-0 top-0 w-10 h-10 grid place-items-center"
        style={{
          backgroundColor: "#FFFFFF",
          border: `2px solid ${meta.color}`,
          borderRadius: "999px",
          color: meta.color,
          boxShadow: "0 1px 3px rgba(10, 31, 68, 0.06)",
        }}
      >
        <Icon size={15} strokeWidth={1.75} />
      </div>

      <div
        className="p-5"
        style={{
          backgroundColor: "#FFFFFF",
          border: `1px solid ${update.isPinned ? GOLD + "40" : "rgba(10, 31, 68, 0.07)"}`,
          borderRadius: "12px",
          boxShadow: update.isPinned ? "0 1px 3px rgba(201, 162, 74, 0.08)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {update.isPinned && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
                style={{ backgroundColor: GOLD_LIGHT, color: GOLD_DARK, borderRadius: "3px" }}
              >
                <Pin size={9} strokeWidth={2.25} /> Pinned
              </span>
            )}
            {distInfo && (
              <span
                className="px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ backgroundColor: GOLD_LIGHT, color: GOLD_DARK, borderRadius: "4px" }}
              >
                {distInfo}
              </span>
            )}
          </div>
          <span className="text-[11px] flex-shrink-0" style={{ color: TEXT_MUTED }}>
            {formatDate(update.publishedAt || update.createdAt)}
          </span>
        </div>

        <h3
          className="text-[20px] leading-tight mb-2"
          style={{
            color: INK,
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontWeight: 500,
            fontStyle: "italic",
          }}
        >
          {update.title}
        </h3>

        <p
          className="text-[13.5px] leading-relaxed whitespace-pre-wrap mb-3"
          style={{ color: TEXT_SECONDARY }}
        >
          {update.body}
        </p>

        {/* Image gallery */}
        {update.images && update.images.length > 0 && (
          <ImageGallery images={update.images} onOpen={onLightboxOpen} />
        )}

        {/* Action row */}
        <div
          className="mt-4 pt-3 flex items-center gap-1 flex-wrap"
          style={{ borderTop: "1px solid rgba(10, 31, 68, 0.05)" }}
        >
          <ReactionButton
            icon={Heart}
            label="heart"
            active={(update.myReactions || []).includes("heart")}
            count={update.reactionCounts?.heart || 0}
            onClick={() => onToggleReaction("heart")}
          />
          <ReactionButton
            icon={Hand}
            label="clap"
            active={(update.myReactions || []).includes("clap")}
            count={update.reactionCounts?.clap || 0}
            onClick={() => onToggleReaction("clap")}
          />
          <ReactionButton
            icon={CheckCircle2}
            label="acknowledge"
            active={(update.myReactions || []).includes("acknowledge")}
            count={update.reactionCounts?.acknowledge || 0}
            onClick={() => onToggleReaction("acknowledge")}
          />

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setCommentsOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors"
            style={{
              color: commentsOpen ? INK : TEXT_SECONDARY,
              background: commentsOpen ? "rgba(10, 31, 68, 0.04)" : "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <MessageCircle size={12} strokeWidth={1.75} />
            {commentCount > 0 ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : "Comment"}
          </button>
        </div>

        <AnimatePresence>
          {commentsOpen && (
            <CommentsSection updateId={update.id} />
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ─── Reaction Button ─────────────────────────────────────────────

function ReactionButton({ icon: Icon, label, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-semibold transition-all"
      style={{
        color: active ? GOLD_DARK : TEXT_SECONDARY,
        background: active ? GOLD_LIGHT : "transparent",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "rgba(10, 31, 68, 0.04)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
      aria-label={label}
    >
      <Icon size={12} strokeWidth={active ? 2.25 : 1.75} fill={active && label === "heart" ? GOLD_DARK : "none"} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

// ─── Image Gallery ───────────────────────────────────────────────

function ImageGallery({ images, onOpen }) {
  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(images[0])}
        className="block w-full overflow-hidden mt-3"
        style={{ borderRadius: "10px", border: "none", padding: 0, cursor: "pointer", background: "transparent" }}
      >
        <img
          src={images[0]}
          alt=""
          className="w-full h-auto block"
          style={{ maxHeight: "420px", objectFit: "cover" }}
        />
      </button>
    );
  }

  return (
    <div
      className="mt-3 grid gap-1"
      style={{
        gridTemplateColumns: images.length === 2 ? "1fr 1fr" :
                            images.length === 3 ? "2fr 1fr" :
                            "1fr 1fr",
      }}
    >
      {images.slice(0, 4).map((url, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onOpen(url)}
          className="block overflow-hidden relative"
          style={{
            borderRadius: "8px",
            border: "none",
            padding: 0,
            cursor: "pointer",
            background: "transparent",
            aspectRatio: images.length === 3 && idx === 0 ? "auto" : "1 / 1",
            gridRow: images.length === 3 && idx === 0 ? "span 2" : "auto",
          }}
        >
          <img src={url} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
          {idx === 3 && images.length > 4 && (
            <div
              className="absolute inset-0 grid place-items-center text-[15px] font-semibold"
              style={{ backgroundColor: "rgba(6, 20, 47, 0.55)", color: CREAM }}
            >
              +{images.length - 4}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────

function Lightbox({ image, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(6, 20, 47, 0.92)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 grid place-items-center"
        style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "999px", cursor: "pointer", color: CREAM }}
      >
        <X size={18} />
      </button>
      <motion.img
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        src={image}
        alt=""
        className="max-w-full max-h-full"
        style={{ borderRadius: "8px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

// ─── Comments Section ────────────────────────────────────────────

function CommentsSection({ updateId }) {
  const { alert } = useDialog();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/updates/${updateId}/comments`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) setComments(data.comments || []);
    } catch {}
    setLoading(false);
  }, [updateId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const body = inputRef.current?.value?.trim();
    if (!body || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/dashboard/updates/${updateId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({
          body,
          parentCommentId: replyTo || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (inputRef.current) inputRef.current.value = "";
        setReplyTo(null);
        load();
      } else {
        await alert({ title: "Couldn’t post", message: data.message || "Failed to post your comment.", tone: "danger" });
      }
    } catch (err) {
      await alert({ title: "Couldn’t post", message: err.message, tone: "danger" });
    }
    setSubmitting(false);
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ overflow: "hidden" }}
      className="mt-3"
    >
      <div
        className="pt-3"
        style={{ borderTop: "1px solid rgba(10, 31, 68, 0.06)" }}
      >
        {/* Comment input */}
        <form onSubmit={handleSubmit} className="mb-4">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5" style={{ backgroundColor: GOLD_LIGHT, borderRadius: "6px" }}>
              <span className="text-[11px]" style={{ color: GOLD_DARK }}>
                Replying to comment
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: GOLD_DARK }}
              >
                <X size={11} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              placeholder={replyTo ? "Write your reply..." : "Add a comment..."}
              maxLength={1000}
              rows={2}
              className="flex-1 text-[13px] outline-none transition-all"
              style={{
                padding: "9px 12px",
                border: "1px solid rgba(10, 31, 68, 0.12)",
                borderRadius: "8px",
                resize: "vertical",
                fontFamily: "inherit",
                color: INK,
                backgroundColor: "#FFFFFF",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-9 h-9 grid place-items-center flex-shrink-0 disabled:opacity-50"
              style={{
                backgroundColor: NAVY_900,
                color: CREAM,
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "wait" : "pointer",
              }}
              aria-label="Post comment"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </form>

        {/* Comments list */}
        {loading && (
          <div className="py-4 text-center">
            <Loader2 size={14} className="animate-spin mx-auto" style={{ color: TEXT_MUTED }} />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-[12px] py-2 text-center" style={{ color: TEXT_MUTED }}>
            No comments yet — be the first.
          </p>
        )}

        {!loading && comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={() => setReplyTo(c.id)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Single Comment ──────────────────────────────────────────────

function CommentItem({ comment, onReply, onChanged }) {
  const { confirm, alert, prompt } = useDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.body);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this comment?",
      message: "The comment will be permanently removed.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/dashboard/comments/${comment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      onChanged();
    } catch {}
  }

  async function handleEdit() {
    if (!editValue.trim() || editValue === comment.body) {
      setEditing(false);
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ body: editValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        onChanged();
      } else {
        await alert({ title: "Couldn’t save", message: data.message || "Failed to save your changes.", tone: "danger" });
      }
    } catch {}
  }

  async function handleFlag() {
    const reason = await prompt({
      title: "Flag this comment?",
      message: "Tell us why (optional). Our team will review it.",
      placeholder: "Reason (optional)",
      confirmLabel: "Submit flag",
      cancelLabel: "Cancel",
      tone: "warning",
      multiline: true,
    });
    if (reason === null) return;
    try {
      await fetch(`/api/dashboard/comments/${comment.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      setMenuOpen(false);
      await alert({ title: "Flag submitted", message: "Thank you. Our team will review this comment.", tone: "success" });
    } catch {}
  }

  const initials = comment.authorName.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex gap-2.5">
      <div
        className="w-7 h-7 grid place-items-center text-[10px] font-bold flex-shrink-0"
        style={{
          backgroundColor: comment.authorIsAdmin ? NAVY_900 : "rgba(10, 31, 68, 0.08)",
          color: comment.authorIsAdmin ? CREAM : TEXT_SECONDARY,
          borderRadius: "999px",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className="text-[12px] font-semibold" style={{ color: INK }}>
            {comment.authorName}
          </span>
          {comment.authorIsAdmin && (
            <span
              className="px-1.5 py-px text-[9px] font-bold tracking-[0.06em] uppercase"
              style={{ backgroundColor: GOLD, color: "#FFFFFF", borderRadius: "3px" }}
            >
              B&amp;W Team
            </span>
          )}
          {comment.isPinnedByAdmin && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-semibold"
              style={{ color: GOLD_DARK }}
            >
              <Pin size={8} strokeWidth={2.25} /> Pinned
            </span>
          )}
          <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
            {formatRelativeTime(comment.createdAt)}
            {comment.editedAt && " · edited"}
          </span>
        </div>

        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              maxLength={1000}
              rows={2}
              className="w-full text-[13px] outline-none"
              style={{
                padding: "6px 8px",
                border: `1px solid ${GOLD}`,
                borderRadius: "6px",
                fontFamily: "inherit",
                color: INK,
              }}
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={handleEdit}
                className="px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: NAVY_900,
                  color: CREAM,
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditValue(comment.body); }}
                className="px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: "transparent",
                  color: TEXT_SECONDARY,
                  border: "1px solid rgba(10, 31, 68, 0.12)",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: comment.isDeleted ? TEXT_MUTED : INK, fontStyle: comment.isDeleted ? "italic" : "normal" }}
          >
            {comment.body}
          </p>
        )}

        {!editing && !comment.isDeleted && (
          <div className="flex items-center gap-3 mt-1.5">
            {!comment.parentCommentId && (
              <button
                type="button"
                onClick={onReply}
                className="text-[10.5px] font-semibold"
                style={{ color: TEXT_MUTED, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Reply
              </button>
            )}
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid place-items-center"
                style={{ width: 20, height: 20, background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED, borderRadius: "4px" }}
                aria-label="More"
              >
                <MoreHorizontal size={12} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-10 py-1 min-w-[140px]"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(10, 31, 68, 0.1)",
                    borderRadius: "6px",
                    boxShadow: "0 8px 24px rgba(10, 31, 68, 0.1)",
                  }}
                >
                  <CommentMenuButton onClick={() => { setEditing(true); setMenuOpen(false); }} icon={Edit2}>Edit (5min window)</CommentMenuButton>
                  <CommentMenuButton onClick={() => { handleDelete(); setMenuOpen(false); }} icon={Trash2} danger>Delete</CommentMenuButton>
                  <CommentMenuButton onClick={handleFlag} icon={Flag}>Flag</CommentMenuButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-3 space-y-3" style={{ borderLeft: "2px solid rgba(10, 31, 68, 0.06)" }}>
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                onReply={onReply}
                onChanged={onChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentMenuButton({ icon: Icon, danger, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11.5px] text-left"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: danger ? DANGER : INK,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = danger ? "rgba(155, 44, 44, 0.05)" : "rgba(10, 31, 68, 0.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <Icon size={11} />
      {children}
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────────────

function EmptyTimeline() {
  return (
    <div
      className="py-16 text-center"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px dashed rgba(10, 31, 68, 0.12)",
        borderRadius: "12px",
      }}
    >
      <div
        className="w-14 h-14 grid place-items-center mx-auto mb-5"
        style={{ backgroundColor: GOLD_LIGHT, borderRadius: "14px" }}
      >
        <FileText size={22} strokeWidth={1.5} style={{ color: GOLD_DARK }} />
      </div>
      <p
        className="text-[22px] mb-2"
        style={{
          color: INK,
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontWeight: 500,
          fontStyle: "italic",
        }}
      >
        No updates yet
      </p>
      <p className="text-[13px] max-w-md mx-auto" style={{ color: TEXT_SECONDARY }}>
        Updates on this property will appear here — from acquisition through to distributions and exit.
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}