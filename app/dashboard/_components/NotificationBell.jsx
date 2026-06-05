"use client";

// app/dashboard/_components/NotificationBell.jsx
//
// Topbar bell icon. Shows unread count dot, opens dropdown with
// recent notifications. Polls every 5 seconds and immediately
// refetches when the investor switches back to the tab.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Sparkles, Building2, Megaphone, Shield, CreditCard,
  CheckCheck, Inbox,
} from "lucide-react";
import { playNotificationSound, useAudioWarmup } from "@/lib/notificationSound";

const NAVY_900 = "#0A1F44";
const CREAM = "#F8F4EC";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";

const POLL_INTERVAL_MS = 5_000;

// Icons per category
const CATEGORY_ICONS = {
  opportunity_published: Sparkles,
  subscription_update: CreditCard,
  admin_announcement: Megaphone,
  property_update: Building2,
  security_alert: Shield,
};

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef(null);
  // null = first load (no sound); Set<id> = known notification IDs
  const knownIdsRef = useRef(null);
  const router = useRouter();

  // Keep the shared AudioContext warm on every gesture so the chime is ready
  // when a notification arrives (and survives the browser suspending it).
  useAudioWarmup();

  // Poll for new notifications
  useEffect(() => {
    let cancelled = false;

    async function fetchRecent() {
      try {
        const res = await fetch("/api/dashboard/notifications/recent", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          const incoming = data.recent || [];

          // Play sound only when a genuinely new unread notification arrives
          // (skip on first fetch so we don't chime on page load)
          if (knownIdsRef.current !== null) {
            const hasNew = incoming.some(
              (n) => !n.readAt && !knownIdsRef.current.has(n.id)
            );
            if (hasNew) playNotificationSound();
          }

          knownIdsRef.current = new Set(incoming.map((n) => n.id));
          setRecent(incoming);
          setUnreadCount(data.unreadCount || 0);
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchRecent();
    const interval = setInterval(fetchRecent, POLL_INTERVAL_MS);

    // Refetch immediately when the investor switches back to this tab
    function onVisible() {
      if (document.visibilityState === "visible") fetchRecent();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleNotificationClick(notification) {
    // Optimistic local update
    if (!notification.readAt) {
      setRecent((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      // Fire-and-forget server update
      fetch(`/api/dashboard/notifications/${notification.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      }).catch(() => {});
    }

    setOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead(e) {
    e.stopPropagation();
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        setRecent((prev) =>
          prev.map((n) =>
            n.readAt ? n : { ...n, readAt: new Date().toISOString() }
          )
        );
        setUnreadCount(0);
      }
    } catch {}
    setMarkingAll(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-10 h-10 grid place-items-center transition-colors"
        style={{
          background: "transparent",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          color: open ? INK : TEXT_SECONDARY,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "rgba(10, 31, 68, 0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Bell size={17} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute top-1.5 right-1.5 grid place-items-center"
            style={{
              minWidth: unreadCount > 9 ? 16 : 8,
              height: unreadCount > 9 ? 16 : 8,
              padding: unreadCount > 9 ? "0 4px" : 0,
              backgroundColor: GOLD,
              borderRadius: "999px",
              border: `1.5px solid ${CREAM}`,
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ duration: 0.18, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="absolute right-0 top-full mt-2 z-50 overflow-hidden"
            style={{
              width: 380,
              maxWidth: "calc(100vw - 32px)",
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(10, 31, 68, 0.1)",
              borderRadius: "14px",
              boxShadow: "0 18px 40px rgba(10, 31, 68, 0.12), 0 4px 12px rgba(10, 31, 68, 0.05)",
              transformOrigin: "top right",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(10, 31, 68, 0.06)" }}
            >
              <div>
                <p
                  className="text-[16px] leading-tight"
                  style={{
                    color: INK,
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontWeight: 500,
                    }}
                >
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <p className="text-[10.5px] tracking-[0.14em] uppercase font-semibold mt-0.5" style={{ color: GOLD_DARK }}>
                    {unreadCount} unread
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{
                    color: TEXT_SECONDARY,
                    background: "transparent",
                    border: "none",
                    cursor: markingAll ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SECONDARY)}
                >
                  <CheckCheck size={11} strokeWidth={2} /> Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              {loading && <DropdownLoading />}
              {!loading && recent.length === 0 && <DropdownEmpty />}
              {!loading && recent.length > 0 && (
                <div className="py-1">
                  {recent.map((n, idx) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      index={idx}
                      onClick={() => handleNotificationClick(n)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3 text-center"
              style={{
                borderTop: "1px solid rgba(10, 31, 68, 0.06)",
                backgroundColor: "rgba(10, 31, 68, 0.015)",
              }}
            >
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-[11.5px] font-semibold"
                style={{ color: NAVY_900, textDecoration: "none" }}
              >
                See all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────

function NotificationItem({ notification, index, onClick }) {
  const Icon = CATEGORY_ICONS[notification.category] || Bell;
  const isUnread = !notification.readAt;

  return (
    <motion.button
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      type="button"
      onClick={onClick}
      className="w-full text-left px-5 py-3 flex items-start gap-3 transition-colors relative"
      style={{
        background: isUnread ? GOLD_LIGHT + "60" : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isUnread ? GOLD_LIGHT : "rgba(10, 31, 68, 0.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isUnread ? GOLD_LIGHT + "60" : "transparent";
      }}
    >
      {isUnread && (
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, backgroundColor: GOLD }}
        />
      )}
      <div
        className="w-8 h-8 grid place-items-center flex-shrink-0"
        style={{
          backgroundColor: isUnread ? GOLD_LIGHT : "rgba(10, 31, 68, 0.04)",
          borderRadius: "8px",
        }}
      >
        <Icon size={13} strokeWidth={1.75} style={{ color: isUnread ? GOLD_DARK : TEXT_MUTED }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-snug" style={{ color: INK }}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[11.5px] mt-1 leading-relaxed line-clamp-2" style={{ color: TEXT_SECONDARY }}>
            {notification.body}
          </p>
        )}
        <p className="text-[10.5px] mt-1.5" style={{ color: TEXT_MUTED }}>
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </motion.button>
  );
}

function DropdownLoading() {
  return (
    <div className="py-10 text-center">
      <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Loading...</p>
    </div>
  );
}

function DropdownEmpty() {
  return (
    <div className="py-12 px-6 text-center">
      <div
        className="w-12 h-12 grid place-items-center mx-auto mb-3"
        style={{ backgroundColor: GOLD_LIGHT, borderRadius: "12px" }}
      >
        <Inbox size={18} strokeWidth={1.5} style={{ color: GOLD_DARK }} />
      </div>
      <p
        className="text-[16px] mb-1"
        style={{
          color: INK,
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontWeight: 500,
          }}
      >
        All caught up
      </p>
      <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
        You have no notifications yet.
      </p>
    </div>
  );
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}