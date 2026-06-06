"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Megaphone, Pin, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const C = {
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

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/announcements/${id}`, { credentials: "same-origin" });
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (data.success) setAnnouncement(data.announcement);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin" style={{ color: C.gold }} />
        <p className="text-[13px]" style={{ color: C.muted }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !announcement) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div
          className="w-14 h-14 grid place-items-center mx-auto mb-5"
          style={{ backgroundColor: C.goldDim, borderRadius: "14px" }}
        >
          <AlertCircle size={22} strokeWidth={1.5} style={{ color: C.gold }} />
        </div>
        <h1
          className="text-[30px] mb-2"
          style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500 }}
        >
          Announcement not found
        </h1>
        <p className="text-[13.5px] mb-8 leading-relaxed" style={{ color: C.secondary }}>
          This announcement may have been removed or is no longer available.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/announcements")}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all"
          style={{
            backgroundColor: C.ink,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.goldDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.ink; }}
        >
          <ArrowLeft size={13} /> View all announcements
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        type="button"
        onClick={() => router.push("/dashboard/announcements")}
        className="flex items-center gap-2 mb-8 text-[12.5px] font-semibold transition-colors"
        style={{
          color: C.secondary,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.ink; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.secondary; }}
      >
        <ArrowLeft size={13} /> All announcements
      </motion.button>

      {/* Article card */}
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.65, 0.3, 0.9] }}
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "18px",
          boxShadow: "0 4px 24px rgba(6,14,28,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Gold accent bar */}
        <div style={{ height: 4, backgroundColor: C.gold }} />

        <div className="p-8">
          <div className="flex items-start gap-4 mb-7">
            <div
              className="w-12 h-12 grid place-items-center flex-shrink-0"
              style={{ backgroundColor: C.goldDim, borderRadius: "12px" }}
            >
              <Megaphone size={20} strokeWidth={1.75} style={{ color: C.goldDark }} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {announcement.isPinned && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
                    style={{ backgroundColor: C.goldDim, color: C.goldDark, borderRadius: "4px" }}
                  >
                    <Pin size={9} strokeWidth={2.25} /> Pinned
                  </span>
                )}
                <span className="text-[12px]" style={{ color: C.muted }}>
                  {formatDate(announcement.publishedAt)}
                </span>
              </div>
              <h1
                className="leading-tight"
                style={{
                  color: C.ink,
                  fontFamily: SERIF,
                  fontWeight: 500,
                  fontSize: "clamp(26px, 3vw, 34px)",
                  letterSpacing: "-0.01em",
                }}
              >
                {announcement.title}
              </h1>
            </div>
          </div>

          {/* Body text */}
          <div
            className="text-[14.5px] leading-[1.78] whitespace-pre-wrap"
            style={{ color: C.secondary }}
          >
            {announcement.body}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-4 flex items-center justify-between"
          style={{
            borderTop: `1px solid ${C.border}`,
            backgroundColor: "rgba(6,14,28,0.015)",
          }}
        >
          <p
            className="text-[11px] font-semibold tracking-[0.1em] uppercase"
            style={{ color: C.muted }}
          >
            Brick &amp; Wealth Team
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/announcements")}
            className="text-[12px] font-semibold transition-colors"
            style={{
              color: C.secondary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.goldDark; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.secondary; }}
          >
            ← Back to all
          </button>
        </div>
      </motion.article>
    </div>
  );
}
