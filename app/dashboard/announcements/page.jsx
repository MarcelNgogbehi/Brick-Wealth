"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Pin, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const C = {
  bg: "#F0F1F5",
  gold: "#C9A44A",
  goldDark: "#9A7A2E",
  goldLight: "#F7F0E2",
  goldDim: "rgba(201,164,74,0.10)",
  ink: "#060E1C",
  secondary: "#4B5768",
  muted: "#8896A8",
  border: "rgba(6,14,28,0.07)",
  surface: "#FFFFFF",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/announcements?page=${page}&pageSize=20`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function markRead(announcementId) {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            announcements: prev.announcements.map((a) =>
              a.id === announcementId ? { ...a, isRead: true } : a
            ),
          }
        : prev
    );
    fetch(`/api/dashboard/announcements/${announcementId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
      credentials: "same-origin",
    }).catch(() => {});
  }

  async function markAllRead() {
    const ids = announcements.filter((a) => !a.isRead).map((a) => a.id);
    if (!ids.length) return;
    setResult((prev) => (prev ? { ...prev, announcements: prev.announcements.map((a) => ({ ...a, isRead: true })) } : prev));
    await Promise.all(ids.map((id) =>
      fetch(`/api/dashboard/announcements/${id}/read`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() }, credentials: "same-origin" }).catch(() => {})
    ));
  }

  const announcements = result?.announcements || [];
  const totalPages = result?.totalPages || 0;
  const unread = announcements.filter((a) => !a.isRead).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>
            From Brick &amp; Wealth
          </p>
          <h1 className="text-[38px] lg:text-[46px] leading-none" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.01em" }}>
            Announcements
          </h1>
          <p className="text-[14px] mt-2.5" style={{ color: C.secondary }}>Important news and updates from our team.</p>
        </div>
        {!loading && (unread > 0 ? (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ backgroundColor: C.goldDim, color: C.goldDark }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.gold }} />{unread} unread
            </span>
            <button type="button" onClick={markAllRead} className="text-[12px] font-semibold transition-colors" style={{ color: C.muted, background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
              Mark all read
            </button>
          </div>
        ) : announcements.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold flex-shrink-0" style={{ backgroundColor: "rgba(6,14,28,0.05)", color: C.secondary }}>
            <CheckCircle2 size={13} strokeWidth={2.25} /> All caught up
          </span>
        ) : null)}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
          <p className="text-[12.5px]" style={{ color: C.muted }}>Loading announcements…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && announcements.length === 0 && <EmptyState />}

      {/* List */}
      {!loading && announcements.length > 0 && (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onMarkRead={() => markRead(a.id)} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-10 flex items-center justify-between"
        >
          <p className="text-[12px] font-medium" style={{ color: C.muted }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <PaginationBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={14} />
            </PaginationBtn>
            <PaginationBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight size={14} />
            </PaginationBtn>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, onMarkRead }) {
  const [expanded, setExpanded] = useState(!announcement.isRead);
  const isUnread = !announcement.isRead;

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${isUnread ? `${C.gold}35` : C.border}`,
        borderRadius: "16px",
        boxShadow: isUnread
          ? "0 2px 12px rgba(201,164,74,0.10)"
          : "0 1px 4px rgba(6,14,28,0.05)",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease",
      }}
    >
      {isUnread && <div style={{ height: 3, backgroundColor: C.gold }} />}

      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-11 h-11 grid place-items-center flex-shrink-0"
            style={{
              backgroundColor: isUnread ? C.goldDim : "rgba(6,14,28,0.05)",
              borderRadius: "12px",
            }}
          >
            <Megaphone size={17} strokeWidth={1.75} style={{ color: isUnread ? C.goldDark : C.muted }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {announcement.isPinned && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
                  style={{ backgroundColor: C.goldDim, color: C.goldDark, borderRadius: "4px" }}
                >
                  <Pin size={9} strokeWidth={2.25} /> Pinned
                </span>
              )}
              {isUnread && (
                <span
                  className="px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
                  style={{ backgroundColor: C.gold, color: "#FFFFFF", borderRadius: "4px" }}
                >
                  New
                </span>
              )}
              <span className="text-[11px]" style={{ color: C.muted }}>
                {formatDate(announcement.publishedAt)}
              </span>
            </div>
            <h2
              className="text-[22px] leading-tight"
              style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500 }}
            >
              {announcement.title}
            </h2>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="text-[14px] leading-relaxed whitespace-pre-wrap"
                style={{ color: C.secondary }}
              >
                {announcement.body}
              </div>

              <div className="mt-5 flex items-center gap-3">
                {isUnread && (
                  <button
                    type="button"
                    onClick={onMarkRead}
                    className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold transition-all"
                    style={{
                      backgroundColor: C.ink,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.goldDark; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.ink; }}
                  >
                    <CheckCircle2 size={12} /> Mark as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-[11.5px] font-semibold transition-colors"
                  style={{ color: C.muted, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Collapse
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[12px] font-semibold transition-colors"
            style={{ color: C.goldDark, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            Read more →
          </button>
        )}
      </div>
    </motion.article>
  );
}

function PaginationBtn({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-9 w-9 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: C.ink,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = `${C.gold}66`;
          e.currentTarget.style.backgroundColor = C.goldLight;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.backgroundColor = C.surface;
      }}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-20 px-6 text-center"
      style={{
        backgroundColor: C.surface,
        border: "1px dashed rgba(6,14,28,0.12)",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(6,14,28,0.04)",
      }}
    >
      <div
        className="w-14 h-14 grid place-items-center mx-auto mb-5"
        style={{ backgroundColor: C.goldDim, borderRadius: "14px" }}
      >
        <Megaphone size={22} strokeWidth={1.5} style={{ color: C.gold }} />
      </div>
      <p
        className="text-[24px] mb-2"
        style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500 }}
      >
        No announcements yet
      </p>
      <p className="text-[13.5px] max-w-md mx-auto leading-relaxed" style={{ color: C.secondary }}>
        When our team posts important news, you'll see it here.
      </p>
    </motion.div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
