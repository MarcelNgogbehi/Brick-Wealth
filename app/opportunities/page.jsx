"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRegisterInterest } from "@/components/RegisterInterestModal";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Bookmark,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  Lock,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Bell,
  Home as HomeIcon,
  Filter,
  ChevronRight,
  CalendarClock,
  Archive,
  Layers,
} from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const NAVY_800 = "#0F2856";
const NAVY_700 = "#15326B";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const CREAM = "#F8F4EC";
const CREAM_DARK = "#EFE8D8";
const INK = "#0B1220";
const INK_MID = "#4A5468";
const INK_DIM = "#8A93A6";
const WHITE = "#FFFFFF";

// Strategy color coding
const STRATEGY_COLORS = {
  HMO: "#7B3F00",
  "Buy-to-Let": NAVY_700,
  Conversion: "#5B2E91",
  "Off-Plan": "#0F6E56",
  Commercial: "#3D3A35",
};
// Where a public opportunity card should take the visitor when clicked:
//   • guest    → portal (login / register)
//   • investor → their dashboard view of that opportunity
//   • admin    → the admin opportunity record
// Used by every card component + the page so the destination is consistent.
function useOpportunityHref() {
  const { authenticated, isAdmin } = useAuthSession();
  return (id) =>
    !authenticated
      ? "/portal"
      : isAdmin
      ? `/admin/opportunities/${id}`
      : `/dashboard/opportunities/${id}`;
}

function getTagColor(category) {
  return STRATEGY_COLORS[category] || NAVY_700;
}

// Per the developer brief, public teaser cards show no pricing. We gate the
// monetary figures (valuation, share price, raise amounts) behind the
// invitation wall — guests see a locked placeholder; signed-in members see
// the real figure.
function LockedFigure({ size = 13 }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ color: GOLD_DARK }}
      title="Pricing is shared with members"
    >
      <Lock size={size - 3} />
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
        Members
      </span>
    </span>
  );
}

// ─── Live SPVs ────────────────────────────────────────────────────────────────
const LIVE_SPVS = [
  {
    id: "spv-008",
    spvCode: "SPV-008",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=85&auto=format&fit=crop",
    name: "The Wilbraham",
    neighbourhood: "Fallowfield",
    city: "Manchester · M14",
    summary:
      "6-bed Victorian HMO refurbished to professional standard. Tenanted from completion with 11.6% gross yield on rent.",
    propertyValue: "£420,000",
    minPerShare: "£500",
    targetYield: "8.4%",
    holdPeriod: "5 yrs",
    investors: 47,
    subscribed: 73,
    closingDate: "12 May 2026",
    daysLeft: 14,
    raiseTarget: "£420,000",
    raisedSoFar: "£306,600",
    badge: "73% Subscribed",
  },
  {
    id: "spv-009",
    spvCode: "SPV-009",
    category: "Buy-to-Let",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=85&auto=format&fit=crop",
    name: "Brunswick Mews",
    neighbourhood: "Edgbaston",
    city: "Birmingham · B15",
    summary:
      "3-unit period conversion with long-let strategy targeting professional tenants in a stable rental market.",
    propertyValue: "£685,000",
    minPerShare: "£500",
    targetYield: "7.6%",
    holdPeriod: "7 yrs",
    investors: 23,
    subscribed: 41,
    closingDate: "30 May 2026",
    daysLeft: 32,
    raiseTarget: "£685,000",
    raisedSoFar: "£280,850",
    badge: "Featured",
  },
  {
    id: "spv-010",
    spvCode: "SPV-010",
    category: "Conversion",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&q=85&auto=format&fit=crop",
    name: "Holloway Court",
    neighbourhood: "Islington",
    city: "London · N7",
    summary:
      "Single dwelling converted to four well-appointed flats. Planning approved, 18-month delivery timeline.",
    propertyValue: "£1,180,000",
    minPerShare: "£1,000",
    targetYield: "11.2%",
    holdPeriod: "3 yrs",
    investors: 38,
    subscribed: 58,
    closingDate: "20 May 2026",
    daysLeft: 22,
    raiseTarget: "£1,180,000",
    raisedSoFar: "£684,400",
    badge: "Capital Growth",
  },
  {
    id: "spv-011",
    spvCode: "SPV-011",
    category: "Buy-to-Let",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85&auto=format&fit=crop",
    name: "Roundhay Gardens",
    neighbourhood: "Roundhay",
    city: "Leeds · LS8",
    summary:
      "4-bed semi-detached family home with A-rated EPC and green mortgage secured.",
    propertyValue: "£365,000",
    minPerShare: "£500",
    targetYield: "7.9%",
    holdPeriod: "5 yrs",
    investors: 12,
    subscribed: 22,
    closingDate: "15 Jun 2026",
    daysLeft: 48,
    raiseTarget: "£365,000",
    raisedSoFar: "£80,300",
    badge: "Just Listed",
  },
];

// ─── Coming Soon ──────────────────────────────────────────────────────────────
const UPCOMING_SPVS = [
  {
    id: "spv-013",
    spvCode: "SPV-013",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1400&q=85&auto=format&fit=crop",
    name: "Selly Park House",
    neighbourhood: "Selly Park",
    city: "Birmingham · B29",
    summary:
      "8-bed student HMO in established letting district. Article 4 compliant.",
    expectedYield: "9.1%",
    expectedMin: "£500",
    expectedHold: "5 yrs",
    launchDate: "2 Jun 2026",
    waitlistCount: 67,
  },
  {
    id: "spv-014",
    spvCode: "SPV-014",
    category: "Commercial",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=85&auto=format&fit=crop",
    name: "Northern Quarter Suites",
    neighbourhood: "Manchester Central",
    city: "Manchester · M1",
    summary:
      "Mixed-use commercial unit on 15-year FRI lease to established UK retailer.",
    expectedYield: "6.8%",
    expectedMin: "£2,500",
    expectedHold: "10 yrs",
    launchDate: "18 Jun 2026",
    waitlistCount: 41,
  },
  {
    id: "spv-015",
    spvCode: "SPV-015",
    category: "Off-Plan",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=85&auto=format&fit=crop",
    name: "Albany Quarter",
    neighbourhood: "Hove",
    city: "Brighton · BN3",
    summary:
      "8-unit coastal development from a Tier-1 housebuilder. Two-year hold to first letting.",
    expectedYield: "9.6%",
    expectedMin: "£2,500",
    expectedHold: "4 yrs",
    launchDate: "8 Jul 2026",
    waitlistCount: 89,
  },
];

// ─── Past Raises ──────────────────────────────────────────────────────────────
const PAST_SPVS = [
  {
    id: "spv-007",
    spvCode: "SPV-007",
    category: "HMO",
    name: "Fallowfield Heights",
    city: "Manchester · M14",
    closedDate: "Mar 2026",
    deliveredYield: "8.2%",
    targetYield: "8.0%",
    investors: 52,
    raised: "£395,000",
    status: "Performing on plan",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85&auto=format&fit=crop",
  },
  {
    id: "spv-006",
    spvCode: "SPV-006",
    category: "Buy-to-Let",
    name: "Headingley Townhouse",
    city: "Leeds · LS6",
    closedDate: "Jan 2026",
    deliveredYield: "7.4%",
    targetYield: "7.2%",
    investors: 31,
    raised: "£325,000",
    status: "Performing on plan",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=85&auto=format&fit=crop",
  },
  {
    id: "spv-005",
    spvCode: "SPV-005",
    category: "Conversion",
    name: "Camberwell Conversion",
    city: "London · SE5",
    closedDate: "Nov 2025",
    deliveredYield: "10.8%",
    targetYield: "10.5%",
    investors: 44,
    raised: "£890,000",
    status: "Exited successfully",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=85&auto=format&fit=crop",
  },
  {
    id: "spv-004",
    spvCode: "SPV-004",
    category: "HMO",
    name: "Withington Chambers",
    city: "Manchester · M20",
    closedDate: "Sep 2025",
    deliveredYield: "8.6%",
    targetYield: "8.4%",
    investors: 38,
    raised: "£410,000",
    status: "Performing on plan",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=85&auto=format&fit=crop",
  },
];

const ALL_OPPORTUNITIES = [
  ...LIVE_SPVS,
  ...UPCOMING_SPVS.map((s) => ({ ...s, status: "Coming Soon" })),
];
const STRATEGIES = [
  "All Strategies",
  "Buy-to-Let",
  "HMO",
  "Conversion",
  "Off-Plan",
  "Commercial",
];

const SECTIONS = [
  { id: "live", label: "Live Properties", Icon: HomeIcon, count: LIVE_SPVS.length },
  { id: "upcoming", label: "Coming Soon", Icon: CalendarClock, count: UPCOMING_SPVS.length },
  { id: "closed", label: "Past Raises", Icon: Archive, count: PAST_SPVS.length },
  { id: "all", label: "Browse All", Icon: Layers, count: LIVE_SPVS.length + UPCOMING_SPVS.length },
];

// ═════════════════════════════════════════════════════════════════════════════
// PAGE HERO
// ═════════════════════════════════════════════════════════════════════════════
function PageHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: NAVY_950,
        paddingTop: "148px",
        paddingBottom: "60px",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 80% 20%, rgba(201,162,74,0.18) 0%, transparent 60%),
              linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 50%, ${NAVY_700} 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
          }}
        />
        <svg
          className="absolute -top-20 -right-20 opacity-[0.07]"
          width="500"
          height="500"
          viewBox="0 0 44 44"
          fill="none"
        >
          <path d="M22 4 L36 12 L22 20 L8 12 Z" fill="none" stroke={GOLD} strokeWidth="0.4" />
          <path d="M22 14 L36 22 L22 30 L8 22 Z" fill="none" stroke={GOLD} strokeWidth="0.4" />
          <path d="M22 24 L36 32 L22 40 L8 32 Z" fill="none" stroke={GOLD} strokeWidth="0.4" />
        </svg>
      </div>

      <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6 text-[11px] font-medium tracking-[0.16em] uppercase"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={11} />
          <span style={{ color: GOLD_LIGHT }}>Opportunities</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-end">
          <div>
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="w-8 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
              <Sparkles size={11} style={{ color: GOLD_LIGHT }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                The Brick &amp; Wealth Portfolio
              </span>
            </motion.div>

            <motion.h1
              className="leading-[0.96] mb-6"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(44px, 6.5vw, 88px)",
                letterSpacing: "-0.018em",
                color: WHITE,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Every UK property{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                opportunity
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="14"
                  viewBox="0 0 240 14"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M2 8 Q 60 2, 120 7 T 238 6"
                    stroke={GOLD}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, delay: 0.9, ease: "easeInOut" }}
                  />
                </svg>
              </em>
              <br />
              we&apos;ve ever offered.
            </motion.h1>

            <motion.p
              className="text-[15px] leading-relaxed max-w-xl"
              style={{ color: "rgba(255,255,255,0.72)", fontWeight: 300 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Live opportunities accepting subscriptions today, raises preparing
              to launch, and the full archive of every SPV we&apos;ve ever
              completed — fully documented, indexed, and searchable.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { v: "12", l: "Live Now" },
              { v: "3", l: "Coming Soon" },
              { v: "27", l: "Completed" },
              { v: "£8.4M+", l: "Raised to Date" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="px-5 py-4 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: "2px",
                }}
              >
                <div
                  className="absolute top-0 left-0 w-6 h-px"
                  style={{ background: GOLD, opacity: 0.6 }}
                />
                <div
                  className="absolute top-0 left-0 w-px h-6"
                  style={{ background: GOLD, opacity: 0.6 }}
                />
                <p
                  className="leading-none mb-2"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "32px",
                    color: WHITE,
                  }}
                >
                  {stat.v}
                </p>
                <p
                  className="text-[10px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {stat.l}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STICKY SECTION NAV
// ═════════════════════════════════════════════════════════════════════════════
function SectionNav({ activeSection }) {
  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div
      className="sticky top-[128px] z-20"
      style={{
        backgroundColor: NAVY_900,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        <div className="flex items-center gap-1 overflow-x-auto py-3">
          {SECTIONS.map(({ id, label, Icon, count }) => {
            const active = activeSection === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className="flex items-center gap-2.5 px-5 py-2.5 text-[11.5px] font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-all duration-200"
                style={{
                  color: active ? NAVY_900 : "rgba(255,255,255,0.7)",
                  backgroundColor: active ? GOLD_LIGHT : "transparent",
                  borderRadius: "1px",
                  border: `1px solid ${
                    active ? GOLD : "rgba(255,255,255,0.12)"
                  }`,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = WHITE;
                    e.currentTarget.style.borderColor = GOLD_BORD;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }
                }}
              >
                <Icon size={12} />
                {label}
                <span
                  className="text-[10px] font-extrabold opacity-80"
                  style={{ color: active ? NAVY_900 : GOLD_LIGHT }}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═════════════════════════════════════════════════════════════════════════════
function SectionHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  count,
  ctaLabel,
  ctaHref,
  dark = false,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
    >
      <div>
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div
            className="w-8 h-px"
            style={{ backgroundColor: dark ? GOLD_LIGHT : GOLD }}
          />
          <span
            className="text-[11px] font-bold tracking-[0.32em] uppercase"
            style={{ color: dark ? GOLD_LIGHT : GOLD_DARK }}
          >
            {eyebrow}
            {count !== undefined && (
              <span
                className="ml-3 px-2 py-0.5 text-[10px]"
                style={{
                  backgroundColor: dark
                    ? "rgba(201,162,74,0.16)"
                    : GOLD_DIM,
                  border: `1px solid ${GOLD_BORD}`,
                  borderRadius: "1px",
                  color: dark ? GOLD_LIGHT : GOLD_DARK,
                }}
              >
                {count} {count === 1 ? "ITEM" : "ITEMS"}
              </span>
            )}
          </span>
        </motion.div>

        <motion.h2
          className="leading-[0.96]"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "clamp(36px, 5vw, 64px)",
            letterSpacing: "-0.018em",
            color: dark ? WHITE : INK,
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.1 }}
        >
          {title}{" "}
          <em
            style={{
              color: dark ? GOLD_LIGHT : GOLD_DARK,
              fontWeight: 400,
            }}
          >
            {titleAccent}
          </em>
        </motion.h2>
      </div>

      <motion.div
        className="flex flex-col items-start md:items-end gap-3 max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, delay: 0.2 }}
      >
        {description && (
          <p
            className="text-[13.5px] leading-relaxed md:text-right"
            style={{ color: dark ? "rgba(255,255,255,0.6)" : INK_MID }}
          >
            {description}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 group"
            style={{ color: dark ? WHITE : INK }}
          >
            <span
              style={{
                borderBottom: `1.5px solid ${GOLD}`,
                paddingBottom: 2,
              }}
            >
              {ctaLabel}
            </span>
            <ArrowRight
              size={13}
              style={{ color: dark ? GOLD_LIGHT : GOLD_DARK }}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        )}
      </motion.div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LIVE SPV CARD
// ═════════════════════════════════════════════════════════════════════════════
function LiveSPVCard({ spv, index }) {
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const opportunityHref = useOpportunityHref();
  const { authenticated } = useAuthSession();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.08 }}
    >
      <Link
        href={opportunityHref(spv.id)}
        className="flex flex-col overflow-hidden block"
        style={{
          backgroundColor: WHITE,
          boxShadow: hovered
            ? "0 24px 60px -16px rgba(10,31,68,0.22), 0 4px 16px -4px rgba(10,31,68,0.08)"
            : "0 4px 18px -8px rgba(10,31,68,0.10), 0 1px 3px rgba(10,31,68,0.04)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "box-shadow 0.35s ease, transform 0.35s ease",
          borderRadius: "1px",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative overflow-hidden" style={{ height: 260 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spv.image}
            alt={`${spv.name} in ${spv.city}`}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? "scale(1.07)" : "scale(1.0)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(6,20,47,0.85) 0%, rgba(6,20,47,0.20) 50%, transparent 75%)",
            }}
          />

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
                style={{
                  backgroundColor: getTagColor(spv.category),
                  borderRadius: "1px",
                }}
              >
                {spv.category}
              </span>
              <span
                className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY_900,
                  borderRadius: "1px",
                }}
              >
                {spv.badge}
              </span>
              <span
                className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
                style={{
                  backgroundColor: "rgba(6,20,47,0.6)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "1px",
                }}
              >
                {spv.spvCode}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setSaved((s) => !s);
              }}
              className="w-8 h-8 grid place-items-center transition-all duration-200 flex-shrink-0"
              style={{
                backgroundColor: saved ? GOLD : "rgba(6,20,47,0.55)",
                borderRadius: "1px",
              }}
              aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Bookmark
                size={12}
                className="text-white"
                fill={saved ? "white" : "none"}
              />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#86efac" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="text-[10px] font-bold tracking-[0.22em] uppercase"
                style={{ color: "#86efac" }}
              >
                Now Open · Closes in {spv.daysLeft} days
              </span>
            </div>
            <h3
              className="leading-tight text-white mb-1"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "26px",
              }}
            >
              {spv.name},{" "}
              <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                {spv.neighbourhood}
              </em>
            </h3>
            <div className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color: "rgba(255,255,255,0.65)" }} />
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {spv.city}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p
            className="text-[13px] leading-relaxed mb-5"
            style={{ color: INK_MID }}
          >
            {spv.summary}
          </p>

          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: "Property Value", value: authenticated ? spv.propertyValue : <LockedFigure />, accent: false },
              { label: "Per Share", value: authenticated ? spv.minPerShare : <LockedFigure />, accent: true },
              { label: "Target Yield", value: spv.targetYield, accent: false },
              { label: "Hold", value: spv.holdPeriod, accent: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-2.5 py-2.5"
                style={{
                  backgroundColor: stat.accent ? GOLD_DIM : CREAM,
                  border: `1px solid ${
                    stat.accent ? GOLD_BORD : "rgba(10,31,68,0.06)"
                  }`,
                  borderRadius: "1px",
                }}
              >
                <p
                  className="leading-none mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "17px",
                    color: stat.accent ? GOLD_DARK : INK,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[8.5px] font-bold tracking-[0.1em] uppercase leading-tight"
                  style={{ color: INK_DIM }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4" style={{ borderTop: `1px solid ${CREAM_DARK}` }}>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold tracking-[0.16em] uppercase"
                style={{ color: INK_DIM }}
              >
                {authenticated ? `${spv.raisedSoFar} of ${spv.raiseTarget} raised` : "Funding in progress"}
              </span>
              <span
                className="text-[11px] font-extrabold"
                style={{ color: GOLD_DARK }}
              >
                {spv.subscribed}%
              </span>
            </div>
            <div
              className="h-1 w-full overflow-hidden"
              style={{
                backgroundColor: "rgba(10,31,68,0.08)",
                borderRadius: "2px",
              }}
            >
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${spv.subscribed}%` } : {}}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: INK_MID }}
                >
                  <Users size={11} style={{ color: GOLD_DARK }} />
                  {spv.investors} investors
                </span>
                <span
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: INK_MID }}
                >
                  <Calendar size={11} style={{ color: GOLD_DARK }} />
                  Closes {spv.closingDate}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.12em] uppercase"
                style={{ color: hovered ? GOLD_DARK : INK_MID }}
              >
                View Details
                <ArrowUpRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// UPCOMING SPV CARD
// ═════════════════════════════════════════════════════════════════════════════
function UpcomingSPVCard({ spv, index }) {
  const [notify, setNotify] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { authenticated } = useAuthSession();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1 }}
      className="relative overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: NAVY_800,
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
      }}
    >
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spv.image}
          alt={spv.name}
          className="w-full h-full object-cover"
          style={{ filter: "blur(0.5px) saturate(0.8)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,20,47,0.55) 0%, rgba(10,31,68,0.65) 100%)",
          }}
        />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
            style={{
              backgroundColor: getTagColor(spv.category),
              borderRadius: "1px",
            }}
          >
            {spv.category}
          </span>
          <span
            className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
            style={{
              backgroundColor: "rgba(6,20,47,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "1px",
            }}
          >
            {spv.spvCode}
          </span>
        </div>

        <div className="absolute bottom-4 left-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: "1px",
            }}
          >
            <CalendarClock size={12} style={{ color: NAVY_900 }} />
            <span
              className="text-[10px] font-extrabold tracking-[0.18em] uppercase"
              style={{ color: NAVY_900 }}
            >
              Launches {spv.launchDate}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3
          className="leading-tight text-white mb-1"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "22px",
          }}
        >
          {spv.name},{" "}
          <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
            {spv.neighbourhood}
          </em>
        </h3>
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={11} style={{ color: "rgba(255,255,255,0.5)" }} />
          <span
            className="text-[12px] font-semibold"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {spv.city}
          </span>
        </div>

        <p
          className="text-[12.5px] leading-relaxed mb-5 flex-1"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {spv.summary}
        </p>

        <div
          className="grid grid-cols-3 gap-2 mb-5 pb-5"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.08)` }}
        >
          {[
            { label: "Expected Yield", value: spv.expectedYield, accent: true },
            { label: "Min Per Share", value: authenticated ? spv.expectedMin : <LockedFigure />, accent: false },
            { label: "Hold Period", value: spv.expectedHold, accent: false },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-2.5 py-2.5"
              style={{
                backgroundColor: stat.accent
                  ? "rgba(201,162,74,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  stat.accent ? GOLD_BORD : "rgba(255,255,255,0.06)"
                }`,
                borderRadius: "1px",
              }}
            >
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "16px",
                  color: stat.accent ? GOLD_LIGHT : WHITE,
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase leading-tight"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <Users size={11} style={{ color: GOLD_LIGHT }} />
            {spv.waitlistCount} on waitlist
          </span>
          <button
            onClick={() => setNotify((n) => !n)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[10.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200"
            style={{
              backgroundColor: notify ? GOLD : "transparent",
              color: notify ? NAVY_900 : GOLD_LIGHT,
              border: `1px solid ${GOLD_BORD}`,
              borderRadius: "1px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Bell size={11} fill={notify ? "currentColor" : "none"} />
            {notify ? "Notifying" : "Notify Me"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAST SPV CARD
// ═════════════════════════════════════════════════════════════════════════════
function PastSPVCard({ spv, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const opportunityHref = useOpportunityHref();
  const { authenticated } = useAuthSession();
  const beatTarget =
    parseFloat(spv.deliveredYield) > parseFloat(spv.targetYield);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.08 }}
    >
      <Link
        href={opportunityHref(spv.id)}
        className="flex flex-col md:flex-row items-stretch overflow-hidden block group"
        style={{
          backgroundColor: WHITE,
          border: `1px solid rgba(10,31,68,0.08)`,
          borderRadius: "1px",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = GOLD_BORD;
          e.currentTarget.style.boxShadow =
            "0 12px 32px -8px rgba(10,31,68,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(10,31,68,0.08)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div className="relative md:w-44 h-32 md:h-auto flex-shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spv.image}
            alt={spv.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ filter: "saturate(0.7)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(6,20,47,0.2), transparent)",
            }}
          />
          <div
            className="absolute top-3 left-3 px-2 py-1 text-[8.5px] font-extrabold tracking-[0.18em] uppercase text-white"
            style={{
              backgroundColor: "rgba(6,20,47,0.85)",
              border: `1px solid ${GOLD_BORD}`,
              borderRadius: "1px",
            }}
          >
            Closed
          </div>
        </div>

        <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[9.5px] font-extrabold tracking-[0.16em] uppercase"
                style={{ color: getTagColor(spv.category) }}
              >
                {spv.category}
              </span>
              <span
                className="text-[9.5px] font-bold tracking-[0.14em] uppercase"
                style={{ color: INK_DIM }}
              >
                · {spv.spvCode} · Closed {spv.closedDate}
              </span>
            </div>
            <h3
              className="leading-tight mb-1"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "22px",
                color: INK,
              }}
            >
              {spv.name}
            </h3>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={10} style={{ color: INK_DIM }} />
              <span
                className="text-[12px] font-semibold"
                style={{ color: INK_MID }}
              >
                {spv.city}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} style={{ color: "#0F6E56" }} />
              <span
                className="text-[11px] font-bold tracking-[0.06em]"
                style={{ color: "#0F6E56" }}
              >
                {spv.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: beatTarget ? "#0F6E56" : INK,
                }}
              >
                {spv.deliveredYield}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase"
                style={{ color: INK_DIM }}
              >
                Delivered
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: INK_DIM }}>
                Target: {spv.targetYield}
              </p>
            </div>
            <div>
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: INK,
                }}
              >
                {spv.investors}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase"
                style={{ color: INK_DIM }}
              >
                Investors
              </p>
            </div>
            <div>
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: INK,
                }}
              >
                {authenticated ? spv.raised : <LockedFigure size={16} />}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase"
                style={{ color: INK_DIM }}
              >
                Total Raised
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function OpportunitiesPage() {
  const [activeSection, setActiveSection] = useState("live");
  const [activeStrategy, setActiveStrategy] = useState("All Strategies");
  const { open: openRegisterInterest } = useRegisterInterest();
  const opportunityHref = useOpportunityHref();

  const liveRef = useRef(null);
  const upcomingRef = useRef(null);
  const closedRef = useRef(null);
  const allRef = useRef(null);

  useEffect(() => {
    const sections = [
      { id: "live", el: liveRef.current },
      { id: "upcoming", el: upcomingRef.current },
      { id: "closed", el: closedRef.current },
      { id: "all", el: allRef.current },
    ].filter((s) => s.el);

    const onScroll = () => {
      const scrollY = window.scrollY + 200;
      let current = "live";
      for (const s of sections) {
        if (s.el.offsetTop <= scrollY) current = s.id;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredAll =
    activeStrategy === "All Strategies"
      ? ALL_OPPORTUNITIES
      : ALL_OPPORTUNITIES.filter((s) => s.category === activeStrategy);

  return (
    <main
      style={{
        fontFamily: "var(--font-montserrat), sans-serif",
        backgroundColor: CREAM,
        scrollPaddingTop: "200px",
      }}
    >
      <style jsx global>{`
        section[id] {
          scroll-margin-top: 200px;
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Brick & Wealth Opportunities",
            itemListElement: LIVE_SPVS.map((spv, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "InvestmentOrDeposit",
                name: `${spv.name}, ${spv.neighbourhood}`,
                identifier: spv.spvCode,
                description: spv.summary,
                amount: {
                  "@type": "MonetaryAmount",
                  currency: "GBP",
                  value: spv.minPerShare,
                },
              },
            })),
          }),
        }}
      />

      <PageHero />
      <SectionNav activeSection={activeSection} />

      {/* SECTION 1: LIVE PROPERTIES */}
      <section
        id="live"
        ref={liveRef}
        className="relative overflow-hidden"
        style={{ backgroundColor: CREAM, padding: "80px 0" }}
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <svg
            className="absolute -top-16 -right-16 opacity-[0.04]"
            width="380"
            height="380"
            viewBox="0 0 44 44"
            fill="none"
          >
            <path d="M22 4 L36 12 L22 20 L8 12 Z" fill="none" stroke={NAVY_900} strokeWidth="0.4" />
            <path d="M22 14 L36 22 L22 30 L8 22 Z" fill="none" stroke={NAVY_900} strokeWidth="0.4" />
            <path d="M22 24 L36 32 L22 40 L8 32 Z" fill="none" stroke={NAVY_900} strokeWidth="0.4" />
          </svg>
        </div>

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
          <SectionHeader
            eyebrow="Open for Subscription"
            title="Live"
            titleAccent="properties."
            description="SPVs accepting investor subscriptions right now. Each opportunity is fully documented, ring-fenced, and reviewed before listing. Subscriptions close when fully raised."
            count={LIVE_SPVS.length}
          />

          <div
            className="flex items-center justify-between gap-4 mb-8 px-6 py-4 flex-wrap"
            style={{
              backgroundColor: WHITE,
              border: `1px solid ${GOLD_BORD}`,
              borderLeft: `3px solid ${GOLD}`,
              borderRadius: "1px",
            }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#10B981" }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="text-[11px] font-extrabold tracking-[0.18em] uppercase"
                style={{ color: NAVY_900 }}
              >
                {LIVE_SPVS.length} opportunities live · Updated 2 minutes ago
              </span>
            </div>
            <div
              className="flex items-center gap-4 text-[11px]"
              style={{ color: INK_MID }}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} style={{ color: GOLD_DARK }} />
                FCA-Aligned
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck size={12} style={{ color: GOLD_DARK }} />
                Independently Audited
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {LIVE_SPVS.map((spv, i) => (
              <LiveSPVCard key={spv.id} spv={spv} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: COMING SOON */}
      <section
        id="upcoming"
        ref={upcomingRef}
        className="relative overflow-hidden"
        style={{ backgroundColor: NAVY_950, padding: "80px 0" }}
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.10]"
            style={{
              background: `radial-gradient(ellipse at top, ${GOLD} 0%, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
          <SectionHeader
            eyebrow="Preparing to Launch"
            title="Coming"
            titleAccent="soon."
            description="Opportunities that are documented, verified, and queued for launch. Add yourself to the notify list and we'll email you the moment subscriptions open."
            count={UPCOMING_SPVS.length}
            dark
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UPCOMING_SPVS.map((spv, i) => (
              <UpcomingSPVCard key={spv.id} spv={spv} index={i} />
            ))}
          </div>

          <motion.div
            className="mt-12 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: "1px",
            }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} style={{ color: GOLD_LIGHT }} />
                <p
                  className="text-[11px] font-bold tracking-[0.28em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Don&apos;t miss the next one
                </p>
              </div>
              <h3
                className="leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "26px",
                  color: WHITE,
                }}
              >
                Subscribe to all upcoming{" "}
                <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                  launch alerts.
                </em>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => openRegisterInterest("opportunities-launch-alerts")}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[11.5px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: GOLD,
                color: NAVY_900,
                borderRadius: "1px",
                boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = GOLD_LIGHT)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = GOLD)
              }
            >
              Notify Me of All Launches
              <ArrowUpRight size={12} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: PAST RAISES */}
      <section
        id="closed"
        ref={closedRef}
        className="relative overflow-hidden"
        style={{ backgroundColor: CREAM, padding: "80px 0" }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg
            className="absolute bottom-0 left-0 opacity-[0.04]"
            width="240"
            height="240"
          >
            <defs>
              <pattern
                id="past-dots"
                x="0"
                y="0"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.2" fill={NAVY_900} />
              </pattern>
            </defs>
            <rect width="240" height="240" fill="url(#past-dots)" />
          </svg>
        </div>

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
          <SectionHeader
            eyebrow="Closed & Fully Subscribed"
            title="The"
            titleAccent="archive."
            description="Every SPV we've ever launched, with delivered performance against targets. Read each one as a case study in how we operate."
            count={PAST_SPVS.length}
            ctaLabel="View Performance Report"
            ctaHref="/insights/case-studies"
          />

          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-10 overflow-hidden"
            style={{
              border: `1px solid rgba(10,31,68,0.08)`,
              backgroundColor: WHITE,
              borderRadius: "1px",
            }}
          >
            {[
              { v: "27", l: "SPVs Completed" },
              { v: "100%", l: "Delivered on Plan" },
              { v: "8.6%", l: "Avg Delivered Yield" },
              { v: "£8.4M+", l: "Total Raised" },
            ].map((stat, i) => (
              <div
                key={stat.l}
                className="p-6 relative"
                style={{
                  borderRight:
                    i < 3 ? `1px solid rgba(10,31,68,0.08)` : "none",
                }}
              >
                <p
                  className="leading-none mb-2"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "32px",
                    color: INK,
                  }}
                >
                  {stat.v}
                </p>
                <p
                  className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: INK_DIM }}
                >
                  {stat.l}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {PAST_SPVS.map((spv, i) => (
              <PastSPVCard key={spv.id} spv={spv} index={i} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/insights/case-studies"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-[11.5px] font-extrabold tracking-[0.14em] uppercase border-2 transition-all duration-200 group"
              style={{
                borderColor: NAVY_900,
                color: NAVY_900,
                borderRadius: "1px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = NAVY_900;
                e.currentTarget.style.color = WHITE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = NAVY_900;
              }}
            >
              Browse All 27 Past Raises
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: BROWSE ALL */}
      <section
        id="all"
        ref={allRef}
        className="relative overflow-hidden"
        style={{ backgroundColor: NAVY_950, padding: "80px 0" }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
          <SectionHeader
            eyebrow="Full Portfolio"
            title="Browse"
            titleAccent="everything."
            description="The complete portfolio — live and upcoming combined. Filter by investment strategy to find the opportunities that match your thesis."
            count={ALL_OPPORTUNITIES.length}
            dark
          />

          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 flex-wrap">
            <Filter
              size={14}
              style={{ color: GOLD_LIGHT }}
              className="flex-shrink-0 mr-2"
            />
            {STRATEGIES.map((strat) => {
              const active = activeStrategy === strat;
              return (
                <button
                  key={strat}
                  onClick={() => setActiveStrategy(strat)}
                  className="px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-all duration-200"
                  style={{
                    backgroundColor: active ? GOLD : "transparent",
                    color: active ? NAVY_900 : "rgba(255,255,255,0.65)",
                    border: `1px solid ${
                      active ? GOLD : "rgba(255,255,255,0.14)"
                    }`,
                    borderRadius: "1px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {strat}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStrategy}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {filteredAll.length > 0 ? (
                filteredAll.map((spv, i) => {
                  const isLive = LIVE_SPVS.find((l) => l.id === spv.id);
                  return (
                    <motion.div
                      key={spv.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    >
                      <Link
                        href={opportunityHref(spv.id)}
                        className="block overflow-hidden h-full transition-all duration-300 group"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          border: `1px solid rgba(255,255,255,0.08)`,
                          borderRadius: "1px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = GOLD_BORD;
                          e.currentTarget.style.transform = "translateY(-4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.08)";
                          e.currentTarget.style.transform = "";
                        }}
                      >
                        <div className="relative h-44 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={spv.image}
                            alt={spv.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to top, rgba(6,20,47,0.7) 0%, transparent 60%)",
                            }}
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span
                              className="px-2 py-0.5 text-[9px] font-extrabold tracking-[0.14em] uppercase text-white"
                              style={{
                                backgroundColor: getTagColor(spv.category),
                                borderRadius: "1px",
                              }}
                            >
                              {spv.category}
                            </span>
                            <span
                              className="px-2 py-0.5 text-[9px] font-extrabold tracking-[0.14em] uppercase text-white"
                              style={{
                                backgroundColor: isLive
                                  ? "#10B981"
                                  : "rgba(6,20,47,0.7)",
                                borderRadius: "1px",
                              }}
                            >
                              {isLive ? "LIVE" : "SOON"}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h4
                              className="text-white leading-tight"
                              style={{
                                fontFamily: "var(--font-cormorant), serif",
                                fontWeight: 500,
                                fontSize: "18px",
                              }}
                            >
                              {spv.name}
                            </h4>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <MapPin
                              size={10}
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            />
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              {spv.city}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[14px]"
                              style={{
                                fontFamily: "var(--font-cormorant), serif",
                                fontWeight: 500,
                                color: GOLD_LIGHT,
                              }}
                            >
                              {spv.targetYield || spv.expectedYield} target
                            </span>
                            <ArrowUpRight
                              size={12}
                              style={{ color: GOLD_LIGHT }}
                              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                  <div
                    className="w-14 h-14 grid place-items-center"
                    style={{
                      backgroundColor: GOLD_DIM,
                      border: `1px solid ${GOLD_BORD}`,
                      borderRadius: "1px",
                    }}
                  >
                    <Building2 size={22} style={{ color: GOLD_LIGHT }} />
                  </div>
                  <p
                    className="text-[14px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    No live or upcoming opportunities in this strategy yet.
                  </p>
                  <button
                    onClick={() => setActiveStrategy("All Strategies")}
                    className="text-[12px] font-bold tracking-[0.12em] uppercase transition-colors"
                    style={{
                      color: GOLD_LIGHT,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Reset Filter →
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${NAVY_900} 0%, ${NAVY_700} 100%)`,
          padding: "80px 0",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-[0.15] pointer-events-none"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
          }}
        />

        <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-8 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
              <Lock size={11} style={{ color: GOLD_LIGHT }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                Invitation Only
              </span>
              <div className="w-8 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
            </div>
            <h2
              className="leading-[0.96] mb-6 max-w-3xl mx-auto"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(34px, 5vw, 56px)",
                color: WHITE,
              }}
            >
              Subscriptions require an{" "}
              <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                approved investor account.
              </em>
            </h2>
            <p
              className="text-[14.5px] leading-relaxed max-w-xl mx-auto mb-8"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              Brick &amp; Wealth is a private platform. Request an invitation to
              unlock full SPV documentation, subscribe to opportunities, and
              build your UK property portfolio.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => openRegisterInterest("opportunities-cta")}
                className="inline-flex items-center gap-2 px-7 py-4 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY_900,
                  borderRadius: "1px",
                  boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = GOLD_LIGHT;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = GOLD;
                  e.currentTarget.style.transform = "";
                }}
              >
                Request Invitation
                <ArrowUpRight size={12} />
              </button>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 px-7 py-4 text-[11.5px] font-bold tracking-[0.12em] uppercase border transition-all duration-200"
                style={{
                  color: WHITE,
                  borderColor: "rgba(255,255,255,0.22)",
                  borderRadius: "1px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = GOLD_LIGHT)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")
                }
              >
                <Lock size={11} />
                Investor Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}