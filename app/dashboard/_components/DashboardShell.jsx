"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";
import {
  Home, Sparkles, Wallet, FileText, Bell,
  LogOut, Menu, X, Search,
  ReceiptText, User, Settings, Share2, TrendingDown,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import MessageAdminButton from "./MessageAdminButton";
import { DashboardSearchContext } from "./search-context";
import { useInactivityTimeout } from "@/lib/useInactivityTimeout";

/* ─── tokens ─────────────────────────────────────────────────────── */
const C = {
  // Sidebar — deep navy "private wealth" rail
  sbBg:         "#070C18",
  sbBg2:        "#0A1224",
  sbBorder:     "rgba(255,255,255,0.06)",
  sbText:       "rgba(255,255,255,0.74)",
  sbTextActive: "#FFFFFF",
  sbActiveBg:   "rgba(255,255,255,0.07)",
  sbActiveBorder: "rgba(255,255,255,0.10)",
  sbHoverBg:    "rgba(255,255,255,0.045)",
  sbLabel:      "rgba(255,255,255,0.40)",
  sbIcon:       "rgba(255,255,255,0.55)",
  sbDivider:    "rgba(255,255,255,0.07)",
  sbBrandSub:   "rgba(255,255,255,0.40)",
  danger:       "#E5484D",
  dangerSoft:   "#FF6B6F",
  // App canvas + top bar
  bg:           "#F0F1F5",
  surface:      "#FFFFFF",
  gold:         "#C9A44A",
  goldSoft:     "#E3C77A",
  ink:          "#060E1C",
  secondary:    "#4B5768",
  muted:        "#9AA0AD",
  border:       "rgba(6,14,28,0.08)",
  searchBg:     "#F3F4F7",
  searchBorder: "rgba(6,14,28,0.07)",
};

const SIDEBAR_W = 248;

/* Investor avatar — uploaded picture if present, else initials on navy. */
function Avatar({ user, initials, size = 32, fontSize = 11 }) {
  const dim = { width: size, height: size };
  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className="rounded-full object-cover flex-shrink-0"
        style={{ ...dim, backgroundColor: C.ink }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full font-bold flex-shrink-0"
      style={{ ...dim, backgroundColor: C.ink, color: "#fff", fontSize }}
    >
      {initials}
    </div>
  );
}

const NAV = [
  {
    label: "Investments",
    items: [
      { href: "/dashboard",               label: "Overview",        icon: Home,       exact: true },
      { href: "/dashboard/opportunities", label: "Opportunities",   icon: Sparkles },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { href: "/dashboard/holdings",      label: "Holdings",        icon: Wallet },
      { href: "/dashboard/subscriptions", label: "Subscriptions",   icon: ReceiptText },
      { href: "/dashboard/sales",         label: "Share Sales",     icon: TrendingDown },
      { href: "/dashboard/documents",     label: "Documents",       icon: FileText },
      { href: "/dashboard/statements",    label: "Annual Statements", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile",       label: "Profile",         icon: User },
      { href: "/dashboard/notifications", label: "Notifications",   icon: Bell },
      { href: "/dashboard/referrals",     label: "Invite & Referrals", icon: Share2 },
    ],
  },
];

// Dashboards whose topbar search filters that page's OWN items (exact route
// match, so detail pages like /opportunities/[id] don't show a scoped search).
const LOCAL_SEARCH_ROUTES = new Set([
  "/dashboard/opportunities",
  "/dashboard/holdings",
  "/dashboard/subscriptions",
  "/dashboard/sales",
  "/dashboard/documents",
  "/dashboard/statements",
  "/dashboard/notifications",
  "/dashboard/referrals",
]);

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function isActive(item, pathname) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

// ─── SidebarInner is defined OUTSIDE DashboardShell so React never
//     sees it as a new component type on re-render, which would unmount
//     and blank out the page children.
function SidebarInner({ user, initials, pathname, onClose, isMobile, onLogout, showBrand }) {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: C.sbBg }}>

      {/* Brand — only the mobile drawer needs it; on desktop it lives in the topbar */}
      {showBrand && (
        <div className="px-5 pt-6 pb-5 flex items-start justify-between flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
            <div className="w-9 h-9 flex-shrink-0 grid place-items-center rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.sbBorder}` }}>
              <Image src={assets.logo} alt="" width={28} height={28} priority />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight tracking-[-0.01em]" style={{ color: "#fff" }}>
                Bricks<span style={{ color: C.gold }}>&amp;</span>Wealth
              </p>
              <p className="text-[8.5px] font-bold tracking-[0.22em] uppercase mt-1" style={{ color: C.sbBrandSub }}>
                Private Wealth Management
              </p>
            </div>
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 grid place-items-center rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto px-3 py-4 ${showBrand ? "pt-1" : "pt-5"}`}>
        {NAV.map((section, si) => (
          <div key={section.label} className={si > 0 ? "mt-5" : ""}>
            <p
              className="px-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] uppercase select-none"
              style={{ color: C.sbLabel }}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon    = item.icon;
                const active  = isActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
                      style={{
                        backgroundColor: active ? C.sbActiveBg : "transparent",
                        color:           active ? C.sbTextActive : C.sbText,
                        border:          `1px solid ${active ? C.sbActiveBorder : "transparent"}`,
                        textDecoration:  "none",
                        boxShadow:       active ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = C.sbHoverBg; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <Icon
                        size={15}
                        strokeWidth={active ? 2.25 : 1.75}
                        style={{ color: active ? "#fff" : C.sbIcon, flexShrink: 0 }}
                      />
                      <span className="flex-1 leading-none">{item.label}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.gold }} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-5 pt-3 flex-shrink-0 space-y-0.5"
        style={{ borderTop: `1px solid ${C.sbDivider}` }}
      >
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ color: C.sbText, textDecoration: "none", backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.sbHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Settings size={15} strokeWidth={1.75} style={{ color: C.sbIcon, flexShrink: 0 }} />
          <span className="flex-1 leading-none">Settings</span>
        </Link>

        <MessageAdminButton
          text="Message Admin"
          iconColor={C.sbIcon}
          textColor={C.sbText}
          hoverBg={C.sbHoverBg}
        />

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ color: C.dangerSoft, backgroundColor: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(229,72,77,0.10)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <LogOut size={15} strokeWidth={1.75} style={{ color: C.dangerSoft, flexShrink: 0 }} />
          <span className="flex-1 leading-none text-left">Logout</span>
        </button>
      </div>
    </div>
  );
}

// ─── Search destinations ──────────────────────────────────────────────────────
// Every place an investor can jump to. `keywords` widens what counts as a match
// so natural phrases ("my shares", "tax", "refer a friend") still resolve.
const SEARCH_TARGETS = [
  { label: "Overview",          href: "/dashboard",               icon: Home,        keywords: ["overview", "home", "dashboard", "portfolio", "summary", "glance"] },
  { label: "Opportunities",     href: "/dashboard/opportunities", icon: Sparkles,    keywords: ["opportunities", "invest", "investment", "new investment", "deals", "offerings", "properties", "buy", "available"] },
  { label: "Holdings",          href: "/dashboard/holdings",      icon: Wallet,      keywords: ["holdings", "positions", "performance", "units", "shares", "my shares", "portfolio", "growth"] },
  { label: "Subscriptions",     href: "/dashboard/subscriptions", icon: ReceiptText, keywords: ["subscriptions", "commitments", "payment", "payments", "proof of payment", "pending", "allocation"] },
  { label: "Share Sales",       href: "/dashboard/sales",         icon: TrendingDown,keywords: ["sales", "sell", "sell shares", "sell units", "liquidity", "exit", "redeem", "dispose", "share sale", "sale request"] },
  { label: "Documents",         href: "/dashboard/documents",     icon: FileText,    keywords: ["documents", "files", "paperwork", "certificate", "certificates", "agreement", "contracts"] },
  { label: "Annual Statements", href: "/dashboard/statements",    icon: FileText,    keywords: ["statements", "annual statements", "transactions", "history", "tax", "activity", "records"] },
  { label: "Profile",           href: "/dashboard/profile",       icon: User,        keywords: ["profile", "account", "settings", "password", "preferences", "kyc", "security", "personal"] },
  { label: "Notifications",     href: "/dashboard/notifications", icon: Bell,        keywords: ["notifications", "alerts", "updates", "messages"] },
  { label: "Invite & Referrals",href: "/dashboard/referrals",     icon: Share2,      keywords: ["referrals", "invite", "refer", "refer a friend", "share", "rewards"] },
];

function scoreTarget(target, q) {
  const label = target.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  // Best keyword match
  let best = 0;
  for (const k of target.keywords) {
    if (k === q) best = Math.max(best, 70);
    else if (k.startsWith(q)) best = Math.max(best, 50);
    else if (k.includes(q)) best = Math.max(best, 30);
  }
  return best;
}

function TopbarSearch({ placeholder }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_TARGETS
      .map((t) => ({ t, score: scoreTarget(t, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.t);
  }, [query]);

  // Reset highlight whenever the result set changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Close the dropdown on any outside click
  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function go(target) {
    if (!target) return;
    setQuery("");
    setOpen(false);
    router.push(target.href);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIdx] || results[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative hidden md:block" style={{ width: 300, maxWidth: "34vw" }}>
      <div
        className="flex items-center gap-2.5 px-3.5 h-10 rounded-full"
        style={{ backgroundColor: C.searchBg, border: `1px solid ${C.searchBorder}` }}
      >
        <Search size={15} style={{ color: C.muted, flexShrink: 0 }} />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="dashboard-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px]"
          style={{ color: C.ink }}
          aria-label="Search the dashboard"
        />
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            id="dashboard-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 mt-2 py-1.5 rounded-2xl overflow-hidden z-50"
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(6,14,28,0.16)",
            }}
          >
            {results.length === 0 ? (
              <div className="px-4 py-3 text-[12.5px]" style={{ color: C.muted }}>
                No matches for “{query.trim()}”
              </div>
            ) : (
              results.map((t, i) => {
                const Icon = t.icon;
                const active = i === activeIdx;
                return (
                  <button
                    key={t.href}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => go(t)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
                    style={{
                      backgroundColor: active ? C.searchBg : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="w-7 h-7 grid place-items-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: active ? C.ink : C.searchBg }}
                    >
                      <Icon size={14} style={{ color: active ? "#fff" : C.secondary }} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold truncate" style={{ color: C.ink }}>
                        {t.label}
                      </span>
                      <span className="block text-[11px] truncate" style={{ color: C.muted }}>
                        {t.href}
                      </span>
                    </span>
                    <span className="text-[10px] font-bold tracking-wider uppercase flex-shrink-0" style={{ color: active ? C.gold : "transparent" }}>
                      ↵
                    </span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Scoped search ────────────────────────────────────────────────────────────
// Used on every non-Overview dashboard: a plain controlled input that writes the
// query into context, which the current page reads to filter its own items.
function LocalSearch({ placeholder, query, setQuery }) {
  return (
    <div className="relative hidden md:block" style={{ width: 300, maxWidth: "34vw" }}>
      <div
        className="flex items-center gap-2.5 px-3.5 h-10 rounded-full"
        style={{ backgroundColor: C.searchBg, border: `1px solid ${C.searchBorder}` }}
      >
        <Search size={15} style={{ color: C.muted, flexShrink: 0 }} />
        <input
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px]"
          style={{ color: C.ink }}
          aria-label={placeholder}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="grid place-items-center flex-shrink-0 rounded-full"
            style={{ width: 18, height: 18, background: "rgba(6,14,28,0.06)", border: "none", cursor: "pointer", color: C.secondary }}
          >
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardShell({ user, children }) {
  const pathname        = usePathname();
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");

  useInactivityTimeout({ logoutUrl: "/api/auth/logout", redirectUrl: "/portal" });
  useEffect(() => { setOpen(false); }, [pathname]);
  // Scoped search is per-page — clear it whenever the route changes.
  useEffect(() => { setQuery(""); }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": getCsrf() },
      });
    } catch { /* ignore */ }
    window.location.href = "/portal";
  }

  const { title: pageTitle, subtitle: pageSubtitle, search: searchPlaceholder } = (() => {
    if (pathname === "/dashboard")                       return { title: "Overview",          subtitle: "Your portfolio at a glance",          search: "Search your portfolio…" };
    if (pathname.startsWith("/dashboard/opportunities")) return { title: "Opportunities",     subtitle: "Curated institutional offerings",     search: "Search opportunities…" };
    if (pathname.startsWith("/dashboard/holdings"))      return { title: "Holdings",          subtitle: "Your positions and performance",      search: "Search holdings…" };
    if (pathname.startsWith("/dashboard/subscriptions")) return { title: "Subscriptions",     subtitle: "Track your investment commitments",    search: "Search subscriptions…" };
    if (pathname.startsWith("/dashboard/sales"))         return { title: "Share Sales",       subtitle: "Request and track unit sales",        search: "Search sale requests…" };
    if (pathname.startsWith("/dashboard/documents"))     return { title: "Documents",         subtitle: "Manage your institutional paperwork",  search: "Search files, categories…" };
    if (pathname.startsWith("/dashboard/statements"))    return { title: "Account Statements", subtitle: "Portfolio activity & history",         search: "Search transactions…" };
    if (pathname.startsWith("/dashboard/profile"))       return { title: "Profile",           subtitle: "Your account & preferences",          search: "Search settings…" };
    if (pathname.startsWith("/dashboard/notifications")) return { title: "Notifications",     subtitle: "Updates and alerts",                  search: "Search notifications…" };
    if (pathname.startsWith("/dashboard/referrals"))     return { title: "Invite & Referrals", subtitle: "Share access, earn recognition",      search: "Search…" };
    return { title: "Dashboard", subtitle: "Private wealth management", search: "Search…" };
  })();

  const initials = (user?.fullName || user?.email || "?")
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const sidebarProps = { user, initials, pathname, onClose: () => setOpen(false), onLogout: logout };

  // Search mode: Overview = global navigator; listed routes = scoped to the page.
  const isOverview     = pathname === "/dashboard";
  const localSearchable = LOCAL_SEARCH_ROUTES.has(pathname);

  return (
    <DashboardSearchContext.Provider value={{ query, setQuery }}>
    <div className="dashboard-root h-screen overflow-hidden flex" style={{ backgroundColor: C.bg, color: C.ink }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: "rgba(6,14,28,0.40)", backdropFilter: "blur(2px)" }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop (full height, brand at the top) */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: SIDEBAR_W, boxShadow: "1px 0 0 rgba(6,14,28,0.06)" }}
      >
        <SidebarInner {...sidebarProps} showBrand />
      </aside>

      {/* Sidebar — mobile (slides in) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 lg:hidden transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: SIDEBAR_W, boxShadow: "2px 0 24px rgba(0,0,0,0.35)" }}
      >
        <SidebarInner {...sidebarProps} isMobile showBrand />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar — single clean row */}
        <header
          className="sticky top-0 z-30 min-h-[76px] flex items-center justify-between gap-4 px-5 sm:px-7 py-3 flex-shrink-0"
          style={{ backgroundColor: "#FFFFFF", borderBottom: `1px solid ${C.border}` }}
        >
          {/* Left: menu (mobile) + page title/subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg flex-shrink-0"
              style={{ color: C.ink, background: "transparent", border: "none", cursor: "pointer" }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[19px] sm:text-[21px] font-bold leading-tight truncate" style={{ color: C.ink, letterSpacing: "-0.015em" }}>
                {pageTitle}
              </h1>
              <p className="hidden sm:block text-[12px] truncate mt-0.5" style={{ color: C.muted }}>
                {pageSubtitle}
              </p>
            </div>
          </div>

          {/* Right: scoped search + bell + avatar */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
            {isOverview
              ? <TopbarSearch placeholder={searchPlaceholder} />
              : localSearchable
                ? <LocalSearch placeholder={searchPlaceholder} query={query} setQuery={setQuery} />
                : null}

            <NotificationBell />

            <Link
              href="/dashboard/profile"
              title="Profile"
              className="group flex items-center gap-2.5 sm:pl-1 sm:pr-3 sm:py-1 rounded-full transition-colors active:scale-[0.98]"
              style={{ textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.searchBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div className="rounded-full flex-shrink-0" style={{ padding: 2, border: `1.5px solid ${C.border}` }}>
                <Avatar user={user} initials={initials} size={30} fontSize={11} />
              </div>
              <div className="hidden sm:flex flex-col leading-none min-w-0 max-w-[160px]">
                <span className="text-[12.5px] font-bold truncate" style={{ color: C.ink }}>
                  {user?.fullName || "Investor"}
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.04em] truncate mt-0.5" style={{ color: C.muted }}>
                  {user?.email ? user.email.split("@")[0] : "View profile"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="flex-1 overflow-auto"
          style={{ backgroundColor: C.bg }}
        >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-7 lg:px-9 py-7 lg:py-9">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
    </DashboardSearchContext.Provider>
  );
}
