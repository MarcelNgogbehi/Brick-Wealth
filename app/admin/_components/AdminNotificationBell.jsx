"use client";

// app/admin/_components/AdminNotificationBell.jsx
//
// Admin topbar bell. Polls /api/admin/notifications every 8s so investor
// messages (and other admin notifications) "drop in" without a refresh.
// Shows an unread badge, a dropdown feed, click-to-read, and mark-all-read.

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, MessageSquare, ShieldCheck, UserPlus, Wallet, Megaphone,
  CheckCheck, Inbox, AlertCircle,
} from "lucide-react";
import { playNotificationSound, useAudioWarmup } from "@/lib/notificationSound";

const C = {
  ink: "#0B1220",
  secondary: "#4A5468",
  muted: "#9AA0AD",
  gold: "#C9A24A",
  goldDark: "#9A7A2E",
  goldLight: "#FBF5E5",
  border: "rgba(6,14,28,0.08)",
  surface: "#FFFFFF",
  danger: "#9B2C2C",
  dangerBg: "#FBEAEA",
  hover: "#F6F7F9",
};

const POLL_MS = 8_000;

const CATEGORY_ICON = {
  investor_assistance: MessageSquare,
  kyc_submitted: ShieldCheck,
  registration: UserPlus,
  subscription_update: Wallet,
  admin_announcement: Megaphone,
};

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function relTime(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminNotificationBell() {
  const router = useRef(useRouter()).current;
  const [recent, setRecent] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  // null = first load (don't chime for the existing backlog); Set<id> after.
  const knownIdsRef = useRef(null);

  // Keep the shared AudioContext warm so the chime can play on new drops.
  useAudioWarmup();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { credentials: "same-origin" });
      if (!res.ok) return;
      const d = await res.json();
      if (d.success) {
        const incoming = d.recent || [];

        // Chime when a genuinely new unread notification drops in — every
        // category, no exception. Skipped on the very first fetch so opening
        // the console with a backlog of unreads doesn't blast a chime.
        if (knownIdsRef.current !== null) {
          const hasNew = incoming.some((n) => !n.readAt && !knownIdsRef.current.has(n.id));
          if (hasNew) playNotificationSound();
        }
        knownIdsRef.current = new Set(incoming.map((n) => n.id));

        setRecent(incoming);
        setUnread(d.unreadCount || 0);
      }
    } catch { /* ignore transient */ }
  }, []);

  // Poll + refetch on tab focus
  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, POLL_MS);
    const onFocus = () => fetchNotifs();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  async function markAll() {
    setUnread(0);
    setRecent((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {}
    fetchNotifs();
  }

  async function openItem(n) {
    if (!n.readAt) {
      setUnread((u) => Math.max(0, u - 1));
      setRecent((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
          credentials: "same-origin",
          body: JSON.stringify({ id: n.id }),
        });
      } catch {}
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ background: open ? "#F0F0F1" : "transparent", border: "none", cursor: "pointer", color: C.secondary }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = "#F0F0F1"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = "transparent"; }}
        aria-label="Notifications"
      >
        <Bell size={17} strokeWidth={1.75} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 grid place-items-center text-[9px] font-bold rounded-full px-1"
            style={{ minWidth: 16, height: 16, backgroundColor: C.gold, color: "#0B1220", border: "2px solid #fff" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
            style={{ width: 360, maxWidth: "90vw", backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 16px 48px rgba(6,14,28,0.18)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: C.ink }}>Notifications</span>
                {unread > 0 && (
                  <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.goldLight, color: C.goldDark }}>
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="flex items-center gap-1 text-[11.5px] font-semibold"
                  style={{ color: C.goldDark, background: "none", border: "none", cursor: "pointer" }}
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* Feed */}
            <div className="max-h-[420px] overflow-y-auto">
              {recent.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="grid place-items-center mx-auto mb-3" style={{ width: 44, height: 44, borderRadius: 12, background: C.hover }}>
                    <Inbox size={20} strokeWidth={1.5} style={{ color: C.muted }} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: C.ink }}>You're all caught up</p>
                  <p className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>Investor messages will appear here.</p>
                </div>
              ) : (
                recent.map((n) => {
                  const Icon = CATEGORY_ICON[n.category] || (n.category === "investor_assistance" ? MessageSquare : Bell);
                  const isUrgent = /URGENT/.test(n.title || "") || n.metadata?.urgency === "urgent";
                  const unreadRow = !n.readAt;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openItem(n)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{ borderBottom: `1px solid ${C.border}`, background: unreadRow ? "rgba(201,162,74,0.05)" : "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = unreadRow ? "rgba(201,162,74,0.05)" : "transparent")}
                    >
                      <div className="grid place-items-center flex-shrink-0 mt-0.5" style={{ width: 34, height: 34, borderRadius: 9, background: isUrgent ? C.dangerBg : C.goldLight }}>
                        {isUrgent
                          ? <AlertCircle size={16} style={{ color: C.danger }} />
                          : <Icon size={16} style={{ color: C.goldDark }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold leading-snug" style={{ color: C.ink }}>
                          {(n.title || "Notification").replace(/^🔴\s*URGENT\s*/, "")}
                        </p>
                        {n.body && (
                          <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: C.secondary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {n.body.replace(/\n+/g, " · ")}
                          </p>
                        )}
                        <p className="text-[10.5px] mt-1" style={{ color: C.muted }}>{relTime(n.createdAt)}</p>
                      </div>
                      {unreadRow && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: C.gold }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
