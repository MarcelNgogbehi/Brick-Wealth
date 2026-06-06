"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { useInactivityTimeout } from "@/lib/useInactivityTimeout";
import { assets } from "@/assets/assets";
import AdminNotificationBell from "./AdminNotificationBell";
import {
  LayoutDashboard, Users, ShieldCheck, UserPlus,
  Building2, Briefcase, Sparkles, Megaphone, Wallet,
  Menu, LogOut, ChevronDown, Search, X, TrendingDown, Banknote, GitBranch, Bell, Activity, Inbox
} from "lucide-react";

const SIDEBAR_W = 256;
const C = {
  // Sidebar — deep navy rail (mirrors the investor dashboard)
  sbBg:         "#070C18",
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
  dangerSoft:   "#FF6B6F",
  // Canvas + top bar
  bg:           "#F0F1F5",
  surface:      "#FFFFFF",
  ink:          "#0B1220",
  secondary:    "#4A5468",
  muted:        "#9AA0AD",
  gold:         "#C9A24A",
  goldLight:    "#FBF5E5",
  goldDark:     "#9A7A2E",
  navy:         "#0A1F44",
  danger:       "#9B2C2C",
  dangerBg:     "#FBEAEA",
  border:       "rgba(6,14,28,0.08)",
  searchBg:     "#F3F4F7",
  searchBorder: "rgba(6,14,28,0.07)",
};

const NAV = [
  {
    group: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/registrations", label: "Registrations", icon: UserPlus, badge: "regs" },
      { href: "/admin/leads", label: "Leads", icon: Inbox, badge: "leads" },
      { href: "/admin/investors", label: "Investors", icon: Users },
      { href: "/admin/notifications", label: "Notifications", icon: Bell, badge: "notif" },
      { href: "/admin/kyc-queue", label: "KYC Queue", icon: ShieldCheck, badge: "kyc" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Wallet },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/distributions", label: "Distributions", icon: Banknote },
      { href: "/admin/referrals",     label: "Referrals",     icon: GitBranch }
    ],
  },
  {
    group: "Listings",
    items: [
      { href: "/admin/properties", label: "Properties", icon: Building2 },
      { href: "/admin/opportunities", label: "Opportunities", icon: Sparkles },
      { href: "/admin/spvs", label: "SPVs", icon: Briefcase },
      { label: "Share Sales", href: "/admin/sales", icon: TrendingDown }
    ],
  },
];

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// ─── Search destinations ──────────────────────────────────────────────────────
// Every console section the admin can jump to. `keywords` widens what counts as
// a match so natural phrases ("payouts", "compliance", "deals") still resolve.
const SEARCH_TARGETS = [
  { label: "Dashboard",      href: "/admin",               icon: LayoutDashboard, keywords: ["dashboard", "home", "overview", "console", "metrics", "stats"] },
  { label: "Activity",       href: "/admin/activity",      icon: Activity,        keywords: ["activity", "activities", "feed", "recent", "audit", "stream", "events", "timeline", "investor activity"] },
  { label: "Registrations",  href: "/admin/registrations", icon: UserPlus,        keywords: ["registrations", "applicants", "onboarding", "approve", "new", "signups"] },
  { label: "Leads",          href: "/admin/leads",         icon: Inbox,           keywords: ["leads", "register interest", "interest", "prospects", "enquiries", "enquiry", "request invitation", "waitlist", "marketing"] },
  { label: "Investors",      href: "/admin/investors",     icon: Users,           keywords: ["investors", "users", "accounts", "clients", "members"] },
  { label: "Notifications",  href: "/admin/notifications", icon: Bell,            keywords: ["notifications", "messages", "inbox", "assistance", "support", "replies", "investor messages", "alerts"] },
  { label: "KYC Queue",      href: "/admin/kyc-queue",     icon: ShieldCheck,     keywords: ["kyc", "compliance", "identity", "verification", "documents", "review"] },
  { label: "Subscriptions",  href: "/admin/subscriptions", icon: Wallet,          keywords: ["subscriptions", "commitments", "funding", "payments", "allocations"] },
  { label: "Announcements",  href: "/admin/announcements", icon: Megaphone,       keywords: ["announcements", "communications", "messages", "broadcast", "news"] },
  { label: "Distributions",  href: "/admin/distributions", icon: Banknote,        keywords: ["distributions", "dividends", "payouts", "payments", "income"] },
  { label: "Referrals",      href: "/admin/referrals",     icon: GitBranch,       keywords: ["referrals", "chains", "recognition", "invites", "rewards"] },
  { label: "Properties",     href: "/admin/properties",    icon: Building2,       keywords: ["properties", "assets", "real estate", "buildings", "listings"] },
  { label: "Opportunities",  href: "/admin/opportunities", icon: Sparkles,        keywords: ["opportunities", "offerings", "deals", "investments", "drafts", "live"] },
  { label: "SPVs",           href: "/admin/spvs",          icon: Briefcase,       keywords: ["spvs", "special purpose vehicles", "entities", "vehicles"] },
  { label: "Share Sales",    href: "/admin/sales",         icon: TrendingDown,    keywords: ["share sales", "sales", "secondary", "transfers", "sell"] },
];

function scoreTarget(target, q) {
  const label = target.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
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

  useEffect(() => { setActiveIdx(0); }, [query]);

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
    <div ref={wrapRef} className="relative hidden md:block" style={{ width: 280, maxWidth: "30vw" }}>
      <div className="flex items-center gap-2.5 px-3.5 h-10 rounded-full"
        style={{ backgroundColor: C.searchBg, border: `1px solid ${C.searchBorder}` }}>
        <Search size={15} style={{ color: C.muted, flexShrink: 0 }} />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="admin-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px]"
          style={{ color: C.ink }}
          aria-label="Search the console"
        />
      </div>

      {showDropdown && (
        <div
          id="admin-search-results"
          role="listbox"
          className="absolute left-0 right-0 mt-2 py-1.5 rounded-2xl overflow-hidden z-50"
          style={{ backgroundColor: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 16px 40px rgba(6,14,28,0.16)" }}
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
                  style={{ backgroundColor: active ? C.searchBg : "transparent", border: "none", cursor: "pointer" }}
                >
                  <span className="w-7 h-7 grid place-items-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: active ? C.ink : C.searchBg }}>
                    <Icon size={14} style={{ color: active ? "#fff" : C.secondary }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate" style={{ color: C.ink }}>{t.label}</span>
                    <span className="block text-[11px] truncate" style={{ color: C.muted }}>{t.href}</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase flex-shrink-0" style={{ color: active ? C.gold : "transparent" }}>↵</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [kycCount, setKycCount] = useState(0);
  const [regCount, setRegCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useInactivityTimeout({ logoutUrl: "/api/admin/auth/logout", redirectUrl: "/portal" });

  useEffect(() => {
    let dead = false;
    const pullStats = () => {
      fetch("/api/admin/stats", { credentials: "same-origin" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (dead || !d) return;
          setKycCount(d.stats?.pendingKyc ?? 0);
          setRegCount(d.stats?.pendingRegistrations ?? 0);
          setLeadsCount(d.stats?.newLeads ?? 0);
        })
        .catch(() => {});
    };
    // Unread notification badge — short poll so investor messages surface fast.
    const pullNotif = () => {
      fetch("/api/admin/notifications", { credentials: "same-origin" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (!dead && d?.success) setNotifCount(d.unreadCount ?? 0); })
        .catch(() => {});
    };
    pullStats();
    pullNotif();
    const tStats = setInterval(pullStats, 60_000);
    const tNotif = setInterval(pullNotif, 10_000);
    const onFocus = () => { pullStats(); pullNotif(); };
    window.addEventListener("focus", onFocus);
    return () => { dead = true; clearInterval(tStats); clearInterval(tNotif); window.removeEventListener("focus", onFocus); };
  }, []);

  useEffect(() => { setOpen(false); setProfileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const fn = (e) => { if (!e.target.closest("[data-pm]")) setProfileOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [profileOpen]);

  function active(item) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  async function logout() {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST", credentials: "same-origin",
        headers: { "X-CSRF-Token": getCsrf() },
      });
    } catch {}
    window.location.href = "/portal";
  }

  const { title: pageTitle, subtitle: pageSubtitle, search: searchPlaceholder } = (() => {
    if (pathname === "/admin")                          return { title: "Dashboard",      subtitle: "Operational overview & key metrics",  search: "Search the console…" };
    if (pathname.startsWith("/admin/activity"))         return { title: "Investor Activity", subtitle: "Live feed of investor actions",    search: "Search activity…" };
    if (pathname.startsWith("/admin/registrations"))    return { title: "Registrations",  subtitle: "Approve and onboard new applicants",  search: "Search registrations…" };
    if (pathname.startsWith("/admin/leads"))            return { title: "Leads",          subtitle: "Register-interest submissions to triage", search: "Search leads…" };
    if (pathname.startsWith("/admin/investors"))        return { title: "Investors",      subtitle: "Manage investor accounts",            search: "Search investors…" };
    if (pathname.startsWith("/admin/notifications"))    return { title: "Notifications",  subtitle: "Investor messages & account activity", search: "Search notifications…" };
    if (pathname.startsWith("/admin/kyc-queue"))        return { title: "KYC Queue",      subtitle: "Review identity & compliance docs",   search: "Search KYC submissions…" };
    if (pathname.startsWith("/admin/properties"))       return { title: "Properties",     subtitle: "Underlying property assets",          search: "Search properties…" };
    if (pathname.startsWith("/admin/opportunities"))    return { title: "Opportunities",  subtitle: "Live and draft investment offerings", search: "Search opportunities…" };
    if (pathname.startsWith("/admin/spvs"))             return { title: "SPVs",           subtitle: "Special Purpose Vehicles",            search: "Search SPVs…" };
    if (pathname.startsWith("/admin/subscriptions"))    return { title: "Subscriptions",  subtitle: "Investor commitments & funding",      search: "Search subscriptions…" };
    if (pathname.startsWith("/admin/distributions"))    return { title: "Distributions",  subtitle: "Dividends & investor payouts",        search: "Search distributions…" };
    if (pathname.startsWith("/admin/referrals"))        return { title: "Referrals",      subtitle: "Referral chains & recognition",       search: "Search referrals…" };
    if (pathname.startsWith("/admin/sales"))            return { title: "Share Sales",    subtitle: "Secondary share transfers",           search: "Search sales…" };
    if (pathname.startsWith("/admin/certificates"))     return { title: "Certificates",   subtitle: "Issued ownership certificates",       search: "Search certificates…" };
    if (pathname.startsWith("/admin/announcements"))    return { title: "Announcements",  subtitle: "Investor communications",             search: "Search announcements…" };
    return { title: "Admin", subtitle: "Internal administration", search: "Search…" };
  })();

  const initials = (admin?.fullName || admin?.email || "?")
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const SidebarContent = (
    <div className="h-full flex flex-col" style={{ backgroundColor: C.sbBg }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-start justify-between flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <div className="w-9 h-9 flex-shrink-0 grid place-items-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.sbBorder}` }}>
            <Image src={assets.logo} alt="" width={26} height={26} priority />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight tracking-[-0.01em]" style={{ color: "#fff" }}>
              Brick<span style={{ color: C.gold }}>&amp;</span>Wealth
            </div>
            <div className="text-[8.5px] font-bold tracking-[0.22em] uppercase mt-1" style={{ color: C.sbBrandSub }}>
              Admin Console
            </div>
          </div>
        </Link>
        <button type="button" onClick={() => setOpen(false)}
          className="lg:hidden w-8 h-8 grid place-items-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <div className="px-3 mb-1.5 text-[9.5px] font-bold tracking-[0.22em] uppercase select-none"
              style={{ color: C.sbLabel }}>
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active(item);
                const badge = item.badge === "kyc" ? kycCount : item.badge === "regs" ? regCount : item.badge === "leads" ? leadsCount : item.badge === "notif" ? notifCount : 0;
                return (
                  <li key={item.href}>
                    <Link href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
                      style={{
                        backgroundColor: isActive ? C.sbActiveBg : "transparent",
                        color: isActive ? C.sbTextActive : C.sbText,
                        border: `1px solid ${isActive ? C.sbActiveBorder : "transparent"}`,
                        boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.25)" : "none",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = C.sbHoverBg; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <Icon size={15} strokeWidth={isActive ? 2.25 : 1.75}
                        style={{ color: isActive ? C.gold : C.sbIcon, flexShrink: 0 }} />
                      <span className="flex-1 leading-none">{item.label}</span>
                      {badge > 0 ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none"
                          style={{ backgroundColor: C.gold, color: "#0B1220", minWidth: 18, textAlign: "center" }}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ) : isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.gold }} />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${C.sbDivider}` }}>
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 grid place-items-center rounded-full text-[11px] font-bold flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.10)", color: "#fff", border: `1px solid ${C.sbBorder}` }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: "#fff" }}>
              {admin?.fullName || admin?.email}
            </div>
            <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase mt-0.5" style={{ color: C.gold }}>
              {admin?.role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          </div>
          <button type="button" onClick={logout} title="Sign out"
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: C.sbIcon }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.dangerSoft; e.currentTarget.style.backgroundColor = "rgba(229,72,77,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.sbIcon; e.currentTarget.style.backgroundColor = "transparent"; }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex" style={{ backgroundColor: C.bg, color: C.ink }}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(11,18,32,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 flex-shrink-0 transition-transform duration-300 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: SIDEBAR_W, height: "100vh", boxShadow: open ? "2px 0 24px rgba(0,0,0,0.35)" : "1px 0 0 rgba(6,14,28,0.06)" }}>
        {SidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 min-h-[76px] flex items-center justify-between gap-4 px-4 lg:px-7 py-3"
          style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg flex-shrink-0"
              style={{ color: C.ink, background: "transparent", border: "none", cursor: "pointer" }}>
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[18px] sm:text-[20px] font-bold leading-tight truncate" style={{ color: C.ink, letterSpacing: "-0.01em" }}>
                {pageTitle}
              </h1>
              <p className="hidden sm:block text-[12px] truncate mt-0.5" style={{ color: C.muted }}>
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
            {/* Search */}
            <TopbarSearch placeholder={searchPlaceholder} />

            {/* Bell — live notification feed */}
            <AdminNotificationBell />

            {/* Profile */}
            <div className="relative" data-pm>
              <button type="button" onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-lg transition-colors"
                style={{
                  background: profileOpen ? "#F0F0F1" : "transparent",
                  border: `1px solid ${profileOpen ? C.border : "transparent"}`,
                  cursor: "pointer", color: C.ink,
                }}>
                <div className="w-7 h-7 grid place-items-center rounded-full text-[10.5px] font-bold"
                  style={{ backgroundColor: C.navy, color: "#fff" }}>
                  {initials}
                </div>
                <span className="hidden sm:block text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {admin?.fullName?.split(" ")[0] || "Admin"}
                </span>
                <ChevronDown size={12} style={{ color: C.muted }} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl py-1"
                  style={{
                    backgroundColor: "#fff",
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  }}>
                  <div className="px-3.5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>{admin?.fullName}</div>
                    <div className="text-[11px] truncate mt-0.5" style={{ color: C.muted }}>{admin?.email}</div>
                  </div>
                  <button type="button" onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-left transition-colors"
                    style={{ color: C.danger, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.dangerBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto" style={{ backgroundColor: C.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
