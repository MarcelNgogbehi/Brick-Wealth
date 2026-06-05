"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDashboardSearch } from "../_components/search-context";
import {
  Bell, Inbox, CheckCheck, Loader2, ChevronLeft, ChevronRight,
  Sparkles, Building2, Megaphone, Shield, CreditCard,
  Mail, MessageSquare, Smartphone, Star, ArrowUpRight, Headset,
} from "lucide-react";

const C = {
  bg:           "#F0F1F5",
  ink:          "#060E1C",
  inkSoft:      "#0A1628",
  secondary:    "#4B5768",
  muted:        "#9AA0AD",
  border:       "rgba(6,14,28,0.08)",
  borderStrong: "rgba(6,14,28,0.14)",
  surface:      "#FFFFFF",
  gold:         "#C9A44A",
  goldDark:     "#9A7A2E",
  goldLight:    "#F7F0E2",
  goldSoft:     "#E3C77A",
  goldDim:      "rgba(201,164,74,0.10)",
  success:      "#0A6E4F",
  successDim:   "rgba(10,110,79,0.10)",
};

const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";

const CATEGORY_CONFIG = {
  opportunity_published: {
    Icon: Sparkles,
    iconBg: "rgba(10,110,79,0.10)",
    iconColor: "#0A6E4F",
    border: "#0A6E4F",
    label: "Opportunity",
    actionLabel: "Reserve Slot",
    actionDanger: false,
    featured: true,
  },
  subscription_update: {
    Icon: CreditCard,
    iconBg: "#FEF9EE",
    iconColor: "#9A7A2E",
    border: "#C9A44A",
    label: "Subscription",
    actionLabel: "View Transaction",
    actionDanger: false,
  },
  admin_announcement: {
    Icon: Megaphone,
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
    border: "#3B82F6",
    label: "Announcement",
    actionLabel: "Read More",
    actionDanger: false,
  },
  property_update: {
    Icon: Building2,
    iconBg: "#F1F5F9",
    iconColor: "#475569",
    border: "#060E1C",
    label: "Property Update",
    actionLabel: "View Update",
    actionDanger: false,
  },
  security_alert: {
    Icon: Shield,
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
    border: "#EF4444",
    label: "Security",
    actionLabel: "This was me",
    actionDanger: true,
  },
};

const DEFAULT_CONFIG = {
  Icon: Bell,
  iconBg: "#F1F5F9",
  iconColor: "#9AA0AD",
  border: "rgba(6,14,28,0.15)",
  label: "Notification",
  actionLabel: "View",
  actionDanger: false,
};

const TABS = ["All", "Unread", "Investments", "System"];

const INVEST_CATS = ["opportunity_published", "subscription_update", "property_update"];
const SYSTEM_CATS = ["admin_announcement", "security_alert"];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab]       = useState("All");
  const [page, setPage]     = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { setPage(1); }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "Unread") params.set("onlyUnread", "true");
      params.set("page", String(page));
      params.set("pageSize", "20");
      const res  = await fetch(`/api/dashboard/notifications?${params}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const { query } = useDashboardSearch();   // scoped from the topbar
  const q = query.trim().toLowerCase();

  const allNotifs = result?.notifications || [];

  const notifications = allNotifs.filter(n => {
    if (tab === "Investments" && !INVEST_CATS.includes(n.category)) return false;
    if (tab === "System"      && !SYSTEM_CATS.includes(n.category)) return false;
    if (q && !`${n.title || ""} ${n.body || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPages  = result?.totalPages || 0;
  const unreadCount = result?.unreadCount || 0;

  async function handleMarkAllRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await fetch("/api/dashboard/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ markAllRead: true }),
      });
      await load();
    } catch {}
    setMarkingAll(false);
  }

  async function markRead(notification) {
    if (notification.readAt) return;
    fetch(`/api/dashboard/notifications/${notification.id}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
      credentials: "same-origin",
    }).catch(() => {});
  }

  async function handleAction(e, notification) {
    e.stopPropagation();
    await markRead(notification);
    if (notification.link) router.push(notification.link);
    else await load();
  }

  async function handleDismiss(e, notification) {
    e.stopPropagation();
    try {
      await fetch(`/api/dashboard/notifications/${notification.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
    } catch {}
    await load();
  }

  return (
    <div className="flex gap-6 items-start">

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Tabs + mark all read */}
        <div
          className="flex items-center justify-between flex-wrap gap-3"
          style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}
        >
          <div className="flex items-center">
            {TABS.map(t => {
              const isActive = tab === t;
              const badge    = t === "Unread" && unreadCount > 0 ? unreadCount : null;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold transition-colors"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: isActive ? `2px solid ${C.ink}` : "2px solid transparent",
                    marginBottom: -1,
                    color: isActive ? C.ink : C.muted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                  {badge && (
                    <span
                      className="inline-flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ minWidth: 18, height: 18, padding: "0 4px", backgroundColor: C.gold, color: C.ink }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 pb-2.5 text-[12.5px] font-semibold transition-opacity"
              style={{
                background: "none",
                border: "none",
                color: C.goldDark,
                cursor: markingAll ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: markingAll ? 0.6 : 1,
              }}
            >
              {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={14} strokeWidth={2.25} />}
              Mark all as read
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            <p className="text-[12.5px]" style={{ color: C.muted }}>Loading notifications…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && <EmptyState tab={tab} />}

        {/* List */}
        {!loading && notifications.length > 0 && (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {notifications.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onAction={e => handleAction(e, n)}
                onSecondary={e => handleDismiss(e, n)}
              />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && tab !== "Investments" && tab !== "System" && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <PaginationBtn disabled={page === 1}          onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </PaginationBtn>
              <PaginationBtn disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar ────────────────────────────────────────── */}
      <aside className="w-[300px] flex-shrink-0 space-y-5 hidden lg:block">
        <EngagementInsightsCard />
        <DeliveryChannelsCard />
        <ConciergeCard />
      </aside>
    </div>
  );
}

/* ── Notification card ─────────────────────────────────────────── */
function NotificationCard({ notification, onAction, onSecondary }) {
  const cfg    = CATEGORY_CONFIG[notification.category] || DEFAULT_CONFIG;
  const isUnread = !notification.readAt;

  if (cfg.featured) return <FeaturedCard notification={notification} cfg={cfg} onAction={onAction} />;
  if (cfg.actionDanger) return <SecurityCard notification={notification} cfg={cfg} onAction={onAction} onSecondary={onSecondary} />;

  const { Icon, iconBg, iconColor } = cfg;
  const meta   = notification.metadata || {};
  const hasTxn = meta.amount != null || meta.account;

  return (
    <CardShell isUnread={isUnread} accent={cfg.border}>
      {/* Icon */}
      <div className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: iconBg }}>
        <Icon size={17} strokeWidth={1.75} style={{ color: iconColor }} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14.5px] font-semibold leading-snug" style={{ color: C.ink }}>
            {notification.title}
          </p>
          <p className="text-[11.5px] whitespace-nowrap flex-shrink-0" style={{ color: C.muted }}>
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {notification.body && (
          <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: C.secondary }}>
            {notification.body}
          </p>
        )}

        {/* Transaction detail box */}
        {hasTxn && (
          <div
            className="flex items-center justify-between gap-4 mt-3.5 p-3.5"
            style={{ backgroundColor: C.bg, borderRadius: "10px" }}
          >
            <div className="flex items-center gap-8">
              {meta.amount != null && (
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-1" style={{ color: C.muted }}>Amount</p>
                  <p className="text-[15px] font-bold" style={{ color: C.success }}>{formatAmount(meta.amount, meta.currency)}</p>
                </div>
              )}
              {meta.account && (
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-1" style={{ color: C.muted }}>Account</p>
                  <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{meta.account}</p>
                </div>
              )}
            </div>
            {notification.link && (
              <button type="button" onClick={onAction} style={outlineBtn} className="flex-shrink-0 transition-colors"
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold, e.currentTarget.style.color = C.goldDark)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderStrong, e.currentTarget.style.color = C.ink)}>
                {cfg.actionLabel}
              </button>
            )}
          </div>
        )}

        {/* Plain action */}
        {!hasTxn && notification.link && (
          <div className="mt-3">
            <button type="button" onClick={onAction} style={outlineBtn} className="transition-colors"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.bg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              {cfg.actionLabel}
            </button>
          </div>
        )}
      </div>

      {isUnread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: C.gold }} />}
    </CardShell>
  );
}

/* Security alert — two-button variant */
function SecurityCard({ notification, cfg, onAction, onSecondary }) {
  const { Icon, iconBg, iconColor } = cfg;
  return (
    <CardShell isUnread={!notification.readAt} accent={cfg.border}>
      <div className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: iconBg }}>
        <Icon size={17} strokeWidth={1.75} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14.5px] font-semibold leading-snug" style={{ color: C.ink }}>{notification.title}</p>
          <p className="text-[11.5px] whitespace-nowrap flex-shrink-0" style={{ color: C.muted }}>
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {notification.body && (
          <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: C.secondary }}>{notification.body}</p>
        )}
        <div className="flex items-center gap-2.5 mt-3">
          <button type="button" onClick={onAction}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-opacity"
            style={{ backgroundColor: C.ink, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            This was me
          </button>
          <button type="button" onClick={onSecondary}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: "transparent", color: C.ink, border: `1px solid ${C.borderStrong}`, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
            No, secure account
          </button>
        </div>
      </div>
    </CardShell>
  );
}

/* Featured / premium early-access — dark navy variant */
function FeaturedCard({ notification, cfg, onAction }) {
  const meta = notification.metadata || {};
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
      className="flex gap-4 p-5 rounded-2xl relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A1628 0%, #060E1C 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }} />
      <div className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: "rgba(201,164,74,0.16)" }}>
        <Star size={17} strokeWidth={1.75} style={{ color: C.gold }} fill={C.gold} />
      </div>
      <div className="flex-1 min-w-0 relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14.5px] font-semibold leading-snug" style={{ color: "#fff" }}>{notification.title}</p>
          <p className="text-[11.5px] whitespace-nowrap flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
            {meta.expiresLabel || formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {notification.body && (
          <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>{notification.body}</p>
        )}
        <div className="flex items-center gap-4 mt-3.5">
          {notification.link && (
            <button type="button" onClick={onAction}
              className="px-4 py-2 text-[11px] font-bold tracking-[0.08em] uppercase rounded-lg transition-opacity"
              style={{ backgroundColor: C.gold, color: C.ink, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              {cfg.actionLabel}
            </button>
          )}
          {meta.irr != null && (
            <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.goldSoft }}>
              <ArrowUpRight size={13} /> Projected {meta.irr}% IRR
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CardShell({ children, isUnread, accent }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
      className="flex gap-4 p-5"
      style={{
        backgroundColor: C.surface,
        border:       `1px solid ${C.border}`,
        borderLeft:   `3px solid ${accent}`,
        borderRadius: "14px",
        boxShadow:    isUnread ? "0 2px 12px rgba(6,14,28,0.07)" : "0 1px 3px rgba(6,14,28,0.04)",
      }}
    >
      {children}
    </motion.div>
  );
}

const outlineBtn = {
  padding: "8px 14px",
  fontSize: "12px",
  fontWeight: 600,
  backgroundColor: "transparent",
  color: C.ink,
  border: `1px solid ${C.borderStrong}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

/* ── Right sidebar cards ───────────────────────────────────────── */
function EngagementInsightsCard() {
  const bars = [42, 56, 48, 70, 62, 84, 76];
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <p className="text-[14px] font-bold mb-4" style={{ color: C.ink }}>Engagement Insights</p>
      <div
        className="rounded-xl p-4 mb-4 flex items-end justify-between gap-1.5"
        style={{ backgroundColor: C.goldLight, height: 110 }}
      >
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
            className="flex-1 rounded-t-[3px]"
            style={{ backgroundColor: i === bars.length - 2 ? C.gold : "#E0CFA0" }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Open Rate" value="92%" />
        <StatBox label="Action Speed" value="1.4h" />
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="p-3 rounded-xl" style={{ backgroundColor: C.bg }}>
      <p className="text-[9.5px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: C.muted }}>{label}</p>
      <p className="text-[22px] leading-none font-bold" style={{ color: C.ink, fontFamily: SERIF }}>{value}</p>
    </div>
  );
}

function DeliveryChannelsCard() {
  const [channels, setChannels] = useState([
    { Icon: Mail,          label: "Email Alerts",      sub: "Primary Contact",  on: true  },
    { Icon: MessageSquare, label: "SMS Notifications", sub: "Critical Security", on: true  },
    { Icon: Smartphone,    label: "Mobile Push",       sub: "Real-time Trading", on: false },
  ]);
  const toggle = i => setChannels(cs => cs.map((c, j) => (j === i ? { ...c, on: !c.on } : c)));

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <p className="text-[14px] font-bold mb-4" style={{ color: C.ink }}>Delivery Channels</p>
      <div className="space-y-4">
        {channels.map(({ Icon, label, sub, on }, i) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: C.bg }}>
                <Icon size={15} strokeWidth={1.75} style={{ color: C.secondary }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight" style={{ color: C.ink }}>{label}</p>
                <p className="text-[11px]" style={{ color: C.muted }}>{sub}</p>
              </div>
            </div>
            <Toggle on={on} onClick={() => toggle(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="relative flex-shrink-0 transition-colors"
      style={{
        width: 40, height: 22, borderRadius: 999,
        backgroundColor: on ? C.success : "#D4D7DD",
        border: "none", cursor: "pointer", padding: 0,
      }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="block rounded-full bg-white"
        style={{
          width: 16, height: 16,
          position: "absolute", top: 3,
          left: on ? 21 : 3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function ConciergeCard() {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: C.ink }}>
      <div className="flex items-center gap-2.5 mb-2">
        <Headset size={16} strokeWidth={1.75} style={{ color: C.gold }} />
        <p className="text-[14px] font-bold" style={{ color: "#fff" }}>Concierge Support</p>
      </div>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
        Receive verbal alert summaries and priority transaction clearance via your dedicated Relationship Manager.
      </p>
      <button
        type="button"
        className="w-full py-2.5 rounded-xl text-[11.5px] font-bold tracking-[0.1em] uppercase transition-colors"
        style={{ backgroundColor: "#fff", color: C.ink, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0F1F5")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fff")}
      >
        Speak to Concierge
      </button>
    </div>
  );
}

/* ── Pagination button ─────────────────────────────────────────── */
function PaginationBtn({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-9 w-9 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: C.ink,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = C.ink; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
    >
      {children}
    </button>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */
function EmptyState({ tab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-16 px-6 text-center"
      style={{
        backgroundColor: C.surface,
        border: `1px dashed ${C.borderStrong}`,
        borderRadius: "16px",
      }}
    >
      <div
        className="w-12 h-12 grid place-items-center mx-auto mb-4"
        style={{ backgroundColor: C.goldDim, borderRadius: "12px" }}
      >
        <Inbox size={20} strokeWidth={1.5} style={{ color: C.gold }} />
      </div>
      <p className="text-[15px] font-semibold mb-1" style={{ color: C.ink }}>
        {tab === "Unread" ? "All caught up" : "No notifications"}
      </p>
      <p className="text-[13px]" style={{ color: C.muted }}>
        {tab === "Unread"
          ? "You've read every notification."
          : "Nothing here yet — check back later."}
      </p>
    </motion.div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */
function formatAmount(amount, currency = "USD") {
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d       = new Date(dateStr);
  const diffMs  = Date.now() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60)          return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)          return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1)            return "Yesterday";
  if (days < 7)              return `${days} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
