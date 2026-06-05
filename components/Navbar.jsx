"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { assets } from "@/assets/assets";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  ChevronDown,
  Home,
  Building2,
  Layers,
  Search,
  ArrowUpRight,
  Menu,
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  PieChart,
  Newspaper,
  Award,
  Briefcase,
  Lock,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_800 = "#0F2856";
const NAVY_700 = "#15326B";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const CREAM = "#F8F4EC";
const INK = "#0B1220";
const INK_SOFT = "#2A3447";
const WHITE = "#FFFFFF";

const SITE_URL = "https://brickandwealth.com";

// ─── Audience tabs ────────────────────────────────────────────────────────────
const AUDIENCE_TABS = [
  { label: "Home", href: "/" },
  { label: "Investors", href: "/investors" },
  { label: "Partners", href: "/partners" },
  { label: "Diaspora", href: "/diaspora" },
];

// ─── Primary navigation — dropdowns now use anchor links for sections ────────
const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
  },

  {
    label: "Opportunities",
    href: "/opportunities",
    dropdown: [
      {
        label: "Live Properties",
        href: "/opportunities#live",
        icon: Home,
        description: "Open SPVs accepting subscriptions",
      },
      {
        label: "Coming Soon",
        href: "/opportunities#upcoming",
        icon: Calendar,
        description: "Preview upcoming raises",
      },
      {
        label: "Past Raises",
        href: "/opportunities#closed",
        icon: Layers,
        description: "Closed and fully subscribed",
      },
      {
        label: "Browse All",
        href: "/opportunities#all",
        icon: Search,
        description: "Full portfolio of UK property SPVs",
      },
    ],
    featured: {
      eyebrow: "Now Open",
      stat: "£500",
      statLabel: "Minimum Per Share",
      stat2: "12",
      stat2Label: "Live Opportunities",
      href: "/opportunities#live",
      cta: "Browse Now",
    },
  },
  {
    label: "How It Works",
    href: "/how-it-works",
    dropdown: [
      {
        label: "The B&W Process",
        href: "/how-it-works#process",
        icon: PieChart,
        description: "From invitation to allocation",
      },
      {
        label: "Co-Ownership Explained",
        href: "/how-it-works#co-ownership",
        icon: Users,
        description: "How SPV shareholding works",
      },
      {
        label: "Risk & Returns",
        href: "/how-it-works#risk-returns",
        icon: TrendingUp,
        description: "Understanding the real numbers",
      },
      {
        label: "Exit Strategies",
        href: "/how-it-works#exit",
        icon: ArrowUpRight,
        description: "Sell, refinance, or hold",
      },
    ],
  },
  {
    label: "Education",
    href: "/education",
    dropdown: [
      {
        label: "UK Property Basics",
        href: "/education#basics",
        icon: BookOpen,
        description: "Beginner's guide to property investing",
      },
      {
        label: "Buy-to-Let Explained",
        href: "/education#buy-to-let",
        icon: Building2,
        description: "Yields, void periods, and management",
      },
      {
        label: "First-Time Buyer Status",
        href: "/education#ftb-status",
        icon: ShieldCheck,
        description: "Investing without losing your eligibility",
      },
      {
        label: "Webinars & Events",
        href: "/education#events",
        icon: GraduationCap,
        description: "Live sessions with our team",
      },
    ],
  },
  {
    label: "Company",
    href: "/company",
    dropdown: [
      {
        label: "About Bricks & Wealth",
        href: "/company#about",
        icon: Briefcase,
        description: "Founder story & vision",
      },
      {
        label: "Compliance & FCA",
        href: "/company#compliance",
        icon: ShieldCheck,
        description: "AML, KYC, and regulatory framework",
      },
      {
        label: "Contact & Book a Call",
        href: "/company#contact",
        icon: MessageSquare,
        description: "Speak with our investor team",
      },
    ],
  },
];

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <Image
      src={assets.logo}
      alt="Bricks & Wealth Logo"
      width={44}
      height={44}
      priority
      className="flex-shrink-0"
    />
  );
}

// ─── Visitor geolocation ──────────────────────────────────────────────────────
// Detects the visitor's country from /api/geo (CDN headers → geoip → GB fallback).
// Module-level cache so the fetch runs once and is shared by every consumer
// (desktop top bar + mobile menu) regardless of mount order.
let _geoCache = null;
let _geoPromise = null;

function useVisitorGeo() {
  const [geo, setGeo] = useState(_geoCache);

  useEffect(() => {
    if (_geoCache) { setGeo(_geoCache); return; }
    if (!_geoPromise) {
      _geoPromise = fetch("/api/geo", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.success) { _geoCache = d; return d; } return null; })
        .catch(() => null);
    }
    let dead = false;
    _geoPromise.then((d) => { if (!dead && d) setGeo(d); });
    return () => { dead = true; };
  }, []);

  return geo;
}

// ISO alpha-2 → flag image URL (crisp on every platform via flagcdn).
function flagUrl(cc) {
  const code = (cc || "GB").toLowerCase();
  return `https://flagcdn.com/40x30/${code}.png`;
}


// ─── Smart anchor click — smooth scroll if same page, normal nav if different ─
function useSmartAnchorClick() {
  const pathname = usePathname();

  return useCallback(
    (href, onAfterClick) => (e) => {
      if (!href.includes("#")) return;
      const [path, hash] = href.split("#");
      if (path === pathname || (path === "" && pathname)) {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `#${hash}`);
        }
        onAfterClick?.();
      }
    },
    [pathname]
  );
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────
function DropdownMenu({ items, isOpen, menuId, featured, onItemClick }) {
  const wide = !!featured;
  const handleAnchor = useSmartAnchorClick();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={menuId}
          role="menu"
          aria-label="Submenu"
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white overflow-hidden flex rounded-md ${
            wide ? "w-[560px]" : "w-80"
          }`}
          style={{
            borderTop: `2px solid ${GOLD}`,
            boxShadow:
              "0 24px 60px -20px rgba(10,31,68,0.28), 0 8px 16px -8px rgba(10,31,68,0.12)",
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex flex-col flex-1 p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={handleAnchor(item.href, onItemClick)}
                  role="menuitem"
                  className="flex items-start gap-3 px-3 py-3 rounded transition-colors duration-150 group hover:bg-[#F8F4EC]"
                >
                  {Icon && (
                    <div
                      className="w-9 h-9 flex-shrink-0 grid place-items-center rounded transition-colors duration-150"
                      style={{ backgroundColor: CREAM }}
                    >
                      <Icon size={15} style={{ color: GOLD }} aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span
                      className="block text-[13px] font-bold tracking-[0.02em] leading-tight"
                      style={{ color: NAVY_900 }}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        className="block text-[11.5px] font-normal mt-0.5 leading-snug"
                        style={{ color: INK_SOFT }}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {featured && (
            <div
              className="w-48 flex-shrink-0 flex flex-col justify-between p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(160deg, ${NAVY_900}, ${NAVY_700})`,
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative">
                <p
                  className="text-[9px] font-bold tracking-[0.3em] uppercase mb-4"
                  style={{ color: GOLD_LIGHT }}
                >
                  {featured.eyebrow || "Featured"}
                </p>
                <p
                  className="text-[28px] font-black text-white leading-none"
                  style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}
                >
                  {featured.stat}
                </p>
                <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/50 mt-1 mb-4">
                  {featured.statLabel}
                </p>
                <p
                  className="text-[22px] font-black text-white leading-none"
                  style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}
                >
                  {featured.stat2}
                </p>
                <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/50 mt-1">
                  {featured.stat2Label}
                </p>
              </div>
              <Link
                href={featured.href}
                onClick={handleAnchor(featured.href, onItemClick)}
                role="menuitem"
                className="relative inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase pb-1 transition-all duration-200 mt-5 self-start hover:gap-2.5"
                style={{
                  color: GOLD_LIGHT,
                  borderBottom: `1px solid rgba(217,181,96,0.35)`,
                }}
              >
                {featured.cta}
                <ArrowUpRight size={10} aria-hidden="true" />
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, pathname, scrolled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);
  const menuId = `bw-nav-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname?.startsWith(item.href + "/");

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const handleOutside = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [handleOutside]);

  const idleColor = scrolled
    ? isActive
      ? NAVY_900
      : INK_SOFT
    : isActive
    ? WHITE
    : "rgba(255,255,255,0.85)";

  const baseStyle = {
    color: idleColor,
    transition: "color 0.25s",
  };

  if (!item.dropdown) {
    return (
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className="relative flex items-center h-full px-4 text-[15px] font-semibold tracking-[0.04em] transition-colors duration-200 group"
        style={baseStyle}
        onMouseEnter={(e) => (e.currentTarget.style.color = scrolled ? NAVY_900 : WHITE)}
        onMouseLeave={(e) => (e.currentTarget.style.color = idleColor)}
      >
        {item.label}
        <span
          className={`absolute bottom-3 left-4 right-4 h-[2px] transition-transform duration-300 origin-left ${
            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
          style={{ backgroundColor: GOLD }}
          aria-hidden="true"
        />
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative h-full flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        className="relative flex items-center gap-1.5 h-full px-4 text-[15px] font-semibold tracking-[0.04em] transition-colors duration-200 group bg-transparent border-0 cursor-pointer"
        style={baseStyle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onMouseEnter={(e) => (e.currentTarget.style.color = scrolled ? NAVY_900 : WHITE)}
        onMouseLeave={(e) => (e.currentTarget.style.color = idleColor)}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDown
          size={13}
          className={`mt-px transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        <span
          className={`absolute bottom-3 left-4 right-4 h-[2px] transition-transform duration-300 origin-left ${
            isActive || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
          style={{ backgroundColor: GOLD }}
          aria-hidden="true"
        />
      </button>

      <DropdownMenu
        items={item.dropdown}
        isOpen={open}
        menuId={menuId}
        featured={item.featured}
        onItemClick={() => setOpen(false)}
      />
    </div>
  );
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────
function MobileMenu({ isOpen, onClose, pathname, authenticated, dashboardHref, dashboardLabel }) {
  const [expanded, setExpanded] = useState(null);
  const menuRef = useRef(null);
  const handleAnchor = useSmartAnchorClick();
  const geo = useVisitorGeo();
  const mCountryCode = geo?.countryCode || "GB";
  const mCountryName = geo?.country || "United Kingdom";

  useEffect(() => {
    if (!isOpen) return;
    const el = menuRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    };
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };

    el.addEventListener("keydown", trap);
    document.addEventListener("keydown", esc);
    first?.focus();

    return () => {
      el.removeEventListener("keydown", trap);
      document.removeEventListener("keydown", esc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 h-full w-[320px] max-w-full bg-white flex flex-col z-50 lg:hidden"
            style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="h-[3px]"
              style={{
                background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})`,
              }}
              aria-hidden="true"
            />

            <div
              className="flex items-center justify-between px-5 py-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${NAVY_900}, ${NAVY_700})`,
              }}
            >
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3"
                aria-label="Bricks & Wealth — home"
              >
                <LogoMark />
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-white text-[16px] tracking-[0.04em] uppercase">
                    Brick
                    <span
                      className="mx-0.5"
                      style={{
                        fontFamily: "var(--font-cormorant), serif",
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: "18px",
                        color: GOLD_LIGHT,
                      }}
                    >
                      &amp;
                    </span>
                    Wealth
                  </span>
                  <span
                    className="font-semibold text-white text-[16px] tracking-[0.04em] uppercase"
                    style={{ marginTop: "2px" }}
                  >
                    Holdings
                  </span>
                  <span
                    className="mt-1"
                    style={{
                      color: GOLD_LIGHT,
                      fontFamily: "var(--font-cormorant), serif",
                      fontStyle: "italic",
                      fontWeight: 400,
                      letterSpacing: "0.06em",
                      fontSize: "11px",
                    }}
                  >
                    Building Wealth, Brick by Brick
                  </span>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={20} className="text-white" aria-hidden="true" />
              </button>
            </div>

            <div
              className="px-4 py-3 border-b border-gray-100 flex gap-2"
              style={{ backgroundColor: CREAM }}
            >
              <Link
                href="/opportunities"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2.5 rounded-sm border transition-colors"
                style={{ borderColor: GOLD, color: GOLD_DARK }}
              >
                Browse
              </Link>
              <Link
                href={authenticated ? dashboardHref : "/portal"}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-extrabold py-2.5 rounded-sm tracking-[0.08em] uppercase transition-colors"
                style={{ backgroundColor: GOLD, color: NAVY_900 }}
              >
                {authenticated ? "Dashboard" : "Login / Register"}
              </Link>
            </div>

            <div
              className="flex border-b border-gray-100"
              style={{ backgroundColor: NAVY_900 }}
            >
              {AUDIENCE_TABS.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 text-[10px] font-bold tracking-[0.16em] uppercase transition-colors"
                    style={{
                      color: active ? WHITE : "rgba(255,255,255,0.55)",
                      backgroundColor: active ? NAVY_700 : "transparent",
                    }}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <nav className="flex-1 overflow-y-auto" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="border-b border-gray-100">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() =>
                          setExpanded(expanded === item.label ? null : item.label)
                        }
                        className="w-full flex items-center justify-between px-5 py-3.5 text-[13px] font-semibold tracking-[0.04em] transition-colors"
                        style={{ color: INK }}
                        aria-expanded={expanded === item.label}
                      >
                        {item.label}
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 text-gray-400 ${
                            expanded === item.label ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded === item.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                            style={{ backgroundColor: CREAM }}
                          >
                            {item.dropdown.map((sub) => {
                              const Icon = sub.icon;
                              return (
                                <Link
                                  key={sub.href + sub.label}
                                  href={sub.href}
                                  onClick={(e) => {
                                    handleAnchor(sub.href, onClose)(e);
                                    if (!sub.href.includes("#")) onClose();
                                  }}
                                  className="flex items-center gap-3 pl-8 pr-5 py-3 text-[12.5px] font-medium border-t border-gray-200 transition-colors"
                                  style={{ color: INK_SOFT }}
                                >
                                  {Icon && (
                                    <Icon
                                      size={12}
                                      className="flex-shrink-0"
                                      style={{ color: GOLD }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="block px-5 py-3.5 text-[13px] font-semibold tracking-[0.04em] transition-colors"
                      style={pathname === item.href ? { color: GOLD_DARK } : { color: INK }}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <Link
                href={authenticated ? dashboardHref : "/portal"}
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold tracking-[0.04em] border-b border-gray-100"
                style={{ color: NAVY_900 }}
              >
                <Lock size={12} style={{ color: GOLD }} aria-hidden="true" />
                {authenticated ? (dashboardLabel || "Investor Dashboard") : "Investor Login"}
              </Link>
            </nav>

            <div
              className="px-5 pt-4 pb-6 border-t border-gray-200"
              style={{ backgroundColor: CREAM }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-3 rounded-sm overflow-hidden inline-block flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl(mCountryCode)}
                    alt=""
                    width={20}
                    height={12}
                    className="w-full h-full object-cover"
                  />
                </span>
                <span
                  className="text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: GOLD_DARK }}
                >
                  {mCountryName} · GBP
                </span>
              </div>
              <a
                href="tel:+442012345678"
                className="flex items-center gap-2 text-[12.5px] font-semibold mb-2 transition-colors"
                style={{ color: NAVY_900 }}
              >
                <Phone size={12} style={{ color: GOLD }} aria-hidden="true" />
                +44 (0) 20 1234 5678
              </a>
              <a
                href="mailto:investors@brickandwealth.com"
                className="flex items-center gap-2 text-[12.5px] font-semibold transition-colors"
                style={{ color: NAVY_900 }}
              >
                <MessageSquare size={12} style={{ color: GOLD }} aria-hidden="true" />
                investors@brickandwealth.com
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Top utility bar ──────────────────────────────────────────────────────────
function TopUtilityBar({ pathname }) {
  const geo = useVisitorGeo();
  const countryCode = geo?.countryCode || "GB";
  const countryName = geo?.country || "United Kingdom";
  const locationLabel = geo?.city ? `${geo.city}, ${countryName}` : countryName;

  return (
    <div
      className="hidden md:block relative z-10"
      style={{ backgroundColor: NAVY_900 }}
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 xl:px-10 flex items-stretch justify-between h-11">
        <ul className="flex items-stretch gap-0 list-none m-0 p-0">
          {AUDIENCE_TABS.map((tab, idx) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || pathname?.startsWith(tab.href + "/");

            if (active) {
              return (
                <li key={tab.href} className="relative">
                  <Link
                    href={tab.href}
                    className="inline-flex items-center h-full pl-5 pr-8 text-[11px] font-extrabold tracking-[0.16em] uppercase"
                    style={{
                      backgroundColor: WHITE,
                      color: NAVY_900,
                      clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 100%, 0 100%)",
                    }}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`inline-flex items-center h-full px-5 text-[11px] font-bold tracking-[0.16em] uppercase transition-colors hover:text-white ${
                    idx > 0 ? "" : "pl-7"
                  }`}
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-stretch">
          <span
            className="inline-flex items-center px-5 text-[11px] font-extrabold tracking-[0.06em]"
            style={{
              backgroundColor: WHITE,
              color: NAVY_900,
              clipPath: "polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)",
            }}
            aria-label="Language: English"
          >
            EN
          </span>

          <Link
            href="/company/compliance"
            className="inline-flex items-center px-4 text-[11px] font-bold tracking-[0.16em] uppercase transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Compliance
          </Link>
          <Link
            href="/company/contact"
            className="inline-flex items-center px-4 text-[11px] font-bold tracking-[0.16em] uppercase transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Contact
          </Link>

          <span
            className="inline-flex items-center gap-2 pl-4 pr-1 text-[11px] font-extrabold tracking-[0.16em] uppercase"
            style={{ color: GOLD_LIGHT }}
            aria-label={`Detected region: ${locationLabel}`}
            title={locationLabel}
          >
            <span
              className="inline-block w-[22px] h-[14px] rounded-sm overflow-hidden"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.15)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagUrl(countryCode)}
                srcSet={`https://flagcdn.com/80x60/${countryCode.toLowerCase()}.png 2x`}
                alt=""
                width={22}
                height={14}
                className="w-full h-full object-cover"
              />
            </span>
            {countryName}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const { authenticated, dashboardHref, dashboardLabel } = useAuthSession();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": NAV_ITEMS.flatMap((item) => {
              const entries = [
                {
                  "@type": "SiteNavigationElement",
                  name: item.label,
                  url: `${SITE_URL}${item.href}`,
                },
              ];
              item.dropdown?.forEach((sub) =>
                entries.push({
                  "@type": "SiteNavigationElement",
                  name: sub.label,
                  url: `${SITE_URL}${sub.href}`,
                })
              );
              return entries;
            }),
          }),
        }}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-30 w-full transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          scrolled
            ? "bg-white shadow-[0_1px_0_rgba(10,31,68,0.06),0_8px_28px_-12px_rgba(10,31,68,0.18)]"
            : "bg-transparent"
        }`}
        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        role="banner"
        aria-label="Bricks & Wealth site navigation"
      >
        <TopUtilityBar pathname={pathname} />

        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 xl:px-10 flex items-center justify-between h-[84px]">
          <Link
            href="/"
            className="flex items-center gap-3.5 group flex-shrink-0"
            aria-label="Bricks & Wealth — home"
          >
            <LogoMark />
            <div className="flex flex-col leading-none">
              <span
                className="font-extrabold text-[18px] tracking-[0.04em] uppercase transition-colors duration-[350ms]"
                style={{ color: scrolled ? NAVY_900 : WHITE }}
              >
                Brick
                <span
                  className="mx-0.5"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "22px",
                    color: GOLD,
                    letterSpacing: 0,
                  }}
                >
                  &amp;
                </span>
                Wealth
              </span>
              <span
                className="font-semibold text-[18px] tracking-[0.04em] uppercase transition-colors duration-[350ms] hidden sm:block"
                style={{ color: scrolled ? NAVY_900 : WHITE, marginTop: "2px" }}
              >
                Holdings
              </span>
              <span
                className="mt-1 hidden sm:block transition-colors duration-[350ms]"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  color: scrolled ? GOLD : GOLD_LIGHT,
                }}
              >
                Building Wealth, Brick by Brick
              </span>
            </div>
          </Link>

          <nav
            className="hidden lg:flex items-center h-full"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                pathname={pathname}
                scrolled={scrolled}
              />
            ))}
          </nav>

          <div
            className="hidden lg:flex items-center gap-3 flex-shrink-0"
            role="group"
            aria-label="Account actions"
          >
            <Link
              href={authenticated ? dashboardHref : "/portal"}
              className="inline-flex items-center gap-2 h-11 px-6 text-[12px] font-extrabold tracking-[0.1em] uppercase transition-all duration-200"
              style={{
                backgroundColor: GOLD,
                color: NAVY_900,
                borderRadius: "2px",
                boxShadow: "0 6px 16px -6px rgba(201,162,74,0.55)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = GOLD_LIGHT;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 10px 22px -8px rgba(201,162,74,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = GOLD;
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px -6px rgba(201,162,74,0.55)";
              }}
              aria-label={authenticated ? dashboardLabel : "Login or register account"}
            >
              {authenticated ? (
                <>
                  {dashboardLabel}
                  <ArrowUpRight size={11} aria-hidden="true" />
                </>
              ) : (
                <>
                  Login / Register
                  <ArrowUpRight size={11} aria-hidden="true" />
                </>
              )}
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded transition-colors"
            style={{ color: scrolled ? NAVY_900 : WHITE }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = scrolled
                ? CREAM
                : "rgba(255,255,255,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-haspopup="true"
            aria-controls="bw-mobile-menu"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={closeMobile}
        pathname={pathname}
        authenticated={authenticated}
        dashboardHref={dashboardHref}
        dashboardLabel={dashboardLabel}
      />
    </>
  );
}