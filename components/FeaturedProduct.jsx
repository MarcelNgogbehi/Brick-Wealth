"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Bookmark,
  Building2,
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
  Layers,
  ShieldCheck,
} from "lucide-react";

// ═════════════════════════════════════════════════════════════════════════════
// BRAND TOKENS
// ═════════════════════════════════════════════════════════════════════════════
const NAVY_900 = "#0A1F44";
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

// Strategy color coding — consistent across site
const STRATEGY_COLORS = {
  HMO: "#7B3F00",
  "Buy-to-Let": NAVY_700,
  Conversion: "#5B2E91",
  "Off-Plan": "#0F6E56",
  Commercial: "#3D3A35",
};

export function getStrategyColor(category) {
  return STRATEGY_COLORS[category] || NAVY_700;
}

// ═════════════════════════════════════════════════════════════════════════════
// OPPORTUNITIES DATA — single source of truth
// ═════════════════════════════════════════════════════════════════════════════
//
// Status values: "live" | "upcoming" | "closed"
// Featured opportunities (homepage) are picked from `live` first, then `upcoming`
//
export const ALL_OPPORTUNITIES = [
  // ─── LIVE ────────────────────────────────────────────────────────────────
  {
    id: "spv-008",
    spvCode: "SPV-008",
    status: "live",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=85&auto=format&fit=crop",
    name: "The Wilbraham",
    neighbourhood: "Fallowfield",
    city: "Manchester",
    region: "M14",
    summary:
      "6-bed Victorian HMO refurbished to professional standard. Tenanted from completion with strong demand from young professionals.",
    targetYield: "8.4%",
    holdPeriod: "5 yrs",
    investors: 47,
    subscribed: 73,
    closingDate: "12 May 2026",
    daysLeft: 14,
    badge: "Closing Soon",
    featured: true,
  },
  {
    id: "spv-009",
    spvCode: "SPV-009",
    status: "live",
    category: "Buy-to-Let",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=85&auto=format&fit=crop",
    name: "Brunswick Mews",
    neighbourhood: "Edgbaston",
    city: "Birmingham",
    region: "B15",
    summary:
      "3-unit period conversion with long-let strategy targeting professional tenants in a stable rental market.",
    targetYield: "7.6%",
    holdPeriod: "7 yrs",
    investors: 23,
    subscribed: 41,
    closingDate: "30 May 2026",
    daysLeft: 32,
    badge: "Featured",
    featured: true,
  },
  {
    id: "spv-010",
    spvCode: "SPV-010",
    status: "live",
    category: "Conversion",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&q=85&auto=format&fit=crop",
    name: "Holloway Court",
    neighbourhood: "Islington",
    city: "London",
    region: "N7",
    summary:
      "Single dwelling converted to four well-appointed flats. Planning approved, 18-month delivery timeline.",
    targetYield: "11.2%",
    holdPeriod: "3 yrs",
    investors: 38,
    subscribed: 58,
    closingDate: "20 May 2026",
    daysLeft: 22,
    badge: "Capital Growth",
    featured: true,
  },
  {
    id: "spv-011",
    spvCode: "SPV-011",
    status: "live",
    category: "Buy-to-Let",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85&auto=format&fit=crop",
    name: "Roundhay Gardens",
    neighbourhood: "Roundhay",
    city: "Leeds",
    region: "LS8",
    summary:
      "4-bed semi-detached family home with A-rated EPC and green mortgage secured.",
    targetYield: "7.9%",
    holdPeriod: "5 yrs",
    investors: 12,
    subscribed: 22,
    closingDate: "15 Jun 2026",
    daysLeft: 48,
    badge: "Just Listed",
    featured: true,
  },
  {
    id: "spv-012",
    spvCode: "SPV-012",
    status: "live",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1400&q=85&auto=format&fit=crop",
    name: "Heaton Quarter",
    neighbourhood: "Heaton",
    city: "Newcastle",
    region: "NE6",
    summary:
      "5-bed professional HMO close to RVI hospital. Refurbished to A-rated EPC standard.",
    targetYield: "9.2%",
    holdPeriod: "5 yrs",
    investors: 19,
    subscribed: 35,
    closingDate: "10 Jun 2026",
    daysLeft: 42,
    badge: "High Yield",
    featured: true,
  },

  // ─── UPCOMING ────────────────────────────────────────────────────────────
  {
    id: "spv-013",
    spvCode: "SPV-013",
    status: "upcoming",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1400&q=85&auto=format&fit=crop",
    name: "Selly Park House",
    neighbourhood: "Selly Park",
    city: "Birmingham",
    region: "B29",
    summary:
      "8-bed student HMO in established letting district. Article 4 compliant.",
    targetYield: "9.1%",
    holdPeriod: "5 yrs",
    investors: 0,
    subscribed: 0,
    launchDate: "2 Jun 2026",
    waitlistCount: 67,
    badge: "Coming Soon",
    featured: false,
  },
  {
    id: "spv-014",
    spvCode: "SPV-014",
    status: "upcoming",
    category: "Commercial",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=85&auto=format&fit=crop",
    name: "Northern Quarter Suites",
    neighbourhood: "Manchester Central",
    city: "Manchester",
    region: "M1",
    summary:
      "Mixed-use commercial unit on 15-year FRI lease to established UK retailer.",
    targetYield: "6.8%",
    holdPeriod: "10 yrs",
    investors: 0,
    subscribed: 0,
    launchDate: "18 Jun 2026",
    waitlistCount: 41,
    badge: "Coming Soon",
    featured: false,
  },
  {
    id: "spv-015",
    spvCode: "SPV-015",
    status: "upcoming",
    category: "Off-Plan",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=85&auto=format&fit=crop",
    name: "Albany Quarter",
    neighbourhood: "Hove",
    city: "Brighton",
    region: "BN3",
    summary:
      "8-unit coastal development from a Tier-1 housebuilder. Two-year hold to first letting.",
    targetYield: "9.6%",
    holdPeriod: "4 yrs",
    investors: 0,
    subscribed: 0,
    launchDate: "8 Jul 2026",
    waitlistCount: 89,
    badge: "Coming Soon",
    featured: false,
  },

  // ─── CLOSED ──────────────────────────────────────────────────────────────
  {
    id: "spv-007",
    spvCode: "SPV-007",
    status: "closed",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85&auto=format&fit=crop",
    name: "Fallowfield Heights",
    neighbourhood: "Fallowfield",
    city: "Manchester",
    region: "M14",
    summary:
      "5-bed Victorian HMO refurbished to professional standard, fully tenanted at completion.",
    targetYield: "8.0%",
    deliveredYield: "8.2%",
    holdPeriod: "5 yrs",
    investors: 52,
    closedDate: "Mar 2026",
    badge: "Performing",
    featured: false,
  },
  {
    id: "spv-006",
    spvCode: "SPV-006",
    status: "closed",
    category: "Buy-to-Let",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=85&auto=format&fit=crop",
    name: "Headingley Townhouse",
    neighbourhood: "Headingley",
    city: "Leeds",
    region: "LS6",
    summary:
      "3-bed period townhouse let to professional tenants on a long-term basis.",
    targetYield: "7.2%",
    deliveredYield: "7.4%",
    holdPeriod: "7 yrs",
    investors: 31,
    closedDate: "Jan 2026",
    badge: "Performing",
    featured: false,
  },
  {
    id: "spv-005",
    spvCode: "SPV-005",
    status: "closed",
    category: "Conversion",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=85&auto=format&fit=crop",
    name: "Camberwell Conversion",
    neighbourhood: "Camberwell",
    city: "London",
    region: "SE5",
    summary:
      "Single dwelling converted to four flats. Exited successfully ahead of schedule.",
    targetYield: "10.5%",
    deliveredYield: "10.8%",
    holdPeriod: "3 yrs",
    investors: 44,
    closedDate: "Nov 2025",
    badge: "Exited",
    featured: false,
  },
  {
    id: "spv-004",
    spvCode: "SPV-004",
    status: "closed",
    category: "HMO",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=85&auto=format&fit=crop",
    name: "Withington Chambers",
    neighbourhood: "Withington",
    city: "Manchester",
    region: "M20",
    summary:
      "6-bed professional HMO with strong tenant retention through hold period.",
    targetYield: "8.4%",
    deliveredYield: "8.6%",
    holdPeriod: "5 yrs",
    investors: 38,
    closedDate: "Sep 2025",
    badge: "Performing",
    featured: false,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// HELPER ACCESSORS — derived from ALL_OPPORTUNITIES
// ═════════════════════════════════════════════════════════════════════════════
export const LIVE_OPPORTUNITIES = ALL_OPPORTUNITIES.filter(
  (o) => o.status === "live"
);
export const UPCOMING_OPPORTUNITIES = ALL_OPPORTUNITIES.filter(
  (o) => o.status === "upcoming"
);
export const CLOSED_OPPORTUNITIES = ALL_OPPORTUNITIES.filter(
  (o) => o.status === "closed"
);

// First 5 featured for homepage preview (live, marked featured)
export const FEATURED_OPPORTUNITIES = ALL_OPPORTUNITIES.filter(
  (o) => o.featured && o.status === "live"
).slice(0, 5);

export const STRATEGIES = [
  "All Strategies",
  "Buy-to-Let",
  "HMO",
  "Conversion",
  "Off-Plan",
  "Commercial",
];

// ═════════════════════════════════════════════════════════════════════════════
// OPPORTUNITY CARD — reusable, no price, no "Invest Now"
// ═════════════════════════════════════════════════════════════════════════════
// Public opportunity cards route guests to the portal (login/register) and
// authenticated investors/admins to their respective detail view.
function useOpportunityHref() {
  const { authenticated, isAdmin } = useAuthSession();
  return (id) =>
    !authenticated
      ? "/portal"
      : isAdmin
      ? `/admin/opportunities/${id}`
      : `/dashboard/opportunities/${id}`;
}

export function OpportunityCard({ spv, index = 0, variant = "default" }) {
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const opportunityHref = useOpportunityHref();

  const isClosed = spv.status === "closed";
  const isUpcoming = spv.status === "upcoming";
  const isLive = spv.status === "live";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.06 }}
      className="h-full"
    >
      <Link
        href={opportunityHref(spv.id)}
        className="flex flex-col h-full overflow-hidden"
        style={{
          backgroundColor: WHITE,
          boxShadow: hovered
            ? "0 24px 60px -16px rgba(10,31,68,0.22), 0 4px 16px -4px rgba(10,31,68,0.08)"
            : "0 4px 18px -8px rgba(10,31,68,0.10), 0 1px 3px rgba(10,31,68,0.04)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "box-shadow 0.35s ease, transform 0.35s ease",
          borderRadius: "1px",
          border: `1px solid ${
            hovered ? GOLD_BORD : "rgba(10,31,68,0.06)"
          }`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* IMAGE */}
        <div
          className="relative overflow-hidden"
          style={{ height: variant === "compact" ? 220 : 260 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spv.image}
            alt={`${spv.name} in ${spv.city}`}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              transform: hovered ? "scale(1.06)" : "scale(1.0)",
              filter: isClosed ? "saturate(0.7)" : "saturate(1)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(6,20,47,0.85) 0%, rgba(6,20,47,0.20) 50%, transparent 75%)",
            }}
          />

          {/* Top badges + bookmark */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
                style={{
                  backgroundColor: getStrategyColor(spv.category),
                  borderRadius: "1px",
                }}
              >
                {spv.category}
              </span>
              <span
                className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase"
                style={{
                  backgroundColor: isClosed
                    ? "rgba(6,20,47,0.85)"
                    : isUpcoming
                    ? "rgba(255,255,255,0.95)"
                    : GOLD,
                  color: isClosed
                    ? GOLD_LIGHT
                    : isUpcoming
                    ? NAVY_900
                    : NAVY_900,
                  borderRadius: "1px",
                  border: isClosed ? `1px solid ${GOLD_BORD}` : "none",
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

            {!isClosed && (
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
                aria-label={
                  saved ? "Remove from watchlist" : "Add to watchlist"
                }
              >
                <Bookmark
                  size={12}
                  className="text-white"
                  fill={saved ? "white" : "none"}
                />
              </button>
            )}
          </div>

          {/* Bottom — name + status */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {isLive && (
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
                  Open · {spv.daysLeft} days left
                </span>
              </div>
            )}
            {isUpcoming && (
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar size={10} style={{ color: GOLD_LIGHT }} />
                <span
                  className="text-[10px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Launches {spv.launchDate}
                </span>
              </div>
            )}
            {isClosed && (
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: GOLD_LIGHT }}
                />
                <span
                  className="text-[10px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Closed {spv.closedDate}
                </span>
              </div>
            )}
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
              <MapPin
                size={11}
                style={{ color: "rgba(255,255,255,0.65)" }}
              />
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {spv.city} · {spv.region}
              </span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 flex-1 flex flex-col">
          <p
            className="text-[13px] leading-relaxed mb-5 flex-1"
            style={{ color: INK_MID }}
          >
            {spv.summary}
          </p>

          {/* Stat tiles — yield + hold + investors (NO price, NO per-share) */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div
              className="px-3 py-3"
              style={{
                backgroundColor: GOLD_DIM,
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: GOLD_DARK,
                }}
              >
                {isClosed ? spv.deliveredYield : spv.targetYield}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase leading-tight"
                style={{ color: INK_DIM }}
              >
                {isClosed ? "Delivered" : "Target Yield"}
              </p>
            </div>
            <div
              className="px-3 py-3"
              style={{
                backgroundColor: CREAM,
                border: `1px solid rgba(10,31,68,0.06)`,
                borderRadius: "1px",
              }}
            >
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: INK,
                }}
              >
                {spv.holdPeriod}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase leading-tight"
                style={{ color: INK_DIM }}
              >
                Hold Period
              </p>
            </div>
            <div
              className="px-3 py-3"
              style={{
                backgroundColor: CREAM,
                border: `1px solid rgba(10,31,68,0.06)`,
                borderRadius: "1px",
              }}
            >
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: INK,
                }}
              >
                {isUpcoming ? spv.waitlistCount : spv.investors}
              </p>
              <p
                className="text-[8.5px] font-bold tracking-[0.1em] uppercase leading-tight"
                style={{ color: INK_DIM }}
              >
                {isUpcoming ? "Waitlist" : "Investors"}
              </p>
            </div>
          </div>

          {/* Footer — progress bar (live) OR closing date (upcoming) OR delivered (closed) */}
          <div
            className="pt-4"
            style={{ borderTop: `1px solid ${CREAM_DARK}` }}
          >
            {isLive && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-bold tracking-[0.16em] uppercase"
                    style={{ color: INK_DIM }}
                  >
                    Subscription Progress
                  </span>
                  <span
                    className="text-[11px] font-extrabold"
                    style={{ color: GOLD_DARK }}
                  >
                    {spv.subscribed}%
                  </span>
                </div>
                <div
                  className="h-1 w-full overflow-hidden mb-3"
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
                <div className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: INK_MID }}
                  >
                    <Calendar size={10} style={{ color: GOLD_DARK }} />
                    Closes {spv.closingDate}
                  </span>
                  <div
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.14em] uppercase"
                    style={{ color: hovered ? GOLD_DARK : INK_MID }}
                  >
                    View Opportunity
                    <ArrowUpRight size={11} />
                  </div>
                </div>
              </>
            )}

            {isUpcoming && (
              <div className="flex items-center justify-between">
                <span
                  className="flex items-center gap-1.5 text-[10.5px]"
                  style={{ color: INK_MID }}
                >
                  <Users size={10} style={{ color: GOLD_DARK }} />
                  {spv.waitlistCount} on waitlist
                </span>
                <div
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.14em] uppercase"
                  style={{ color: hovered ? GOLD_DARK : INK_MID }}
                >
                  Join Waitlist
                  <ArrowUpRight size={11} />
                </div>
              </div>
            )}

            {isClosed && (
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-bold tracking-[0.04em]"
                  style={{ color: "#0F6E56" }}
                >
                  Target {spv.targetYield} → Delivered {spv.deliveredYield}
                </span>
                <div
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.14em] uppercase"
                  style={{ color: hovered ? GOLD_DARK : INK_MID }}
                >
                  View Case Study
                  <ArrowUpRight size={11} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEPAGE PREVIEW SECTION — shows 5 featured + browse-all CTA
// ═════════════════════════════════════════════════════════════════════════════
export function OpportunitiesPreview() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      {/* Subtle bg decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute -top-16 -right-16 opacity-[0.04]"
          width="380"
          height="380"
          viewBox="0 0 44 44"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M22 4 L36 12 L22 20 L8 12 Z"
            fill="none"
            stroke={NAVY_900}
            strokeWidth="0.4"
          />
          <path
            d="M22 14 L36 22 L22 30 L8 22 Z"
            fill="none"
            stroke={NAVY_900}
            strokeWidth="0.4"
          />
          <path
            d="M22 24 L36 32 L22 40 L8 32 Z"
            fill="none"
            stroke={NAVY_900}
            strokeWidth="0.4"
          />
        </svg>
        {/* Italic ghost "II" */}
        <div
          className="absolute -left-8 bottom-0 select-none leading-none pointer-events-none opacity-100"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(180px, 22vw, 320px)",
            color: "transparent",
            WebkitTextStroke: `1px rgba(10,31,68,0.06)`,
            userSelect: "none",
          }}
        >
          II
        </div>
      </div>

      <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        {/* HEADER */}
        <div
          ref={headerRef}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14"
        >
          <div>
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={headerInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="w-8 h-px" style={{ backgroundColor: GOLD }} />
              <Sparkles size={11} style={{ color: GOLD_DARK }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_DARK }}
              >
                Selected Opportunities
              </span>
            </motion.div>

            <motion.h2
              className="leading-[0.96] mb-5"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(36px, 5vw, 64px)",
                letterSpacing: "-0.018em",
                color: INK,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.1 }}
            >
              Live UK property{" "}
              <em
                style={{
                  color: GOLD_DARK,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                opportunities
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
                    animate={headerInView ? { pathLength: 1 } : {}}
                    transition={{
                      duration: 1.2,
                      delay: 0.5,
                      ease: "easeInOut",
                    }}
                  />
                </svg>
              </em>
              <span style={{ color: INK_MID, fontWeight: 400 }}>.</span>
            </motion.h2>

            <motion.p
              className="text-[14px] leading-relaxed max-w-lg"
              style={{ color: INK_MID }}
              initial={{ opacity: 0, y: 16 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.2 }}
            >
              A preview of the SPVs currently accepting investor subscriptions.
              Each one is fully documented, ring-fenced, and reviewed before
              listing.
            </motion.p>
          </div>

          {/* Live status badge */}
          <motion.div
            className="flex items-center gap-3 px-5 py-3"
            style={{
              background: WHITE,
              border: `1px solid ${GOLD_BORD}`,
              borderLeft: `3px solid ${GOLD}`,
              borderRadius: "1px",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.3 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#10B981" }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.18em] uppercase leading-none mb-1"
                style={{ color: NAVY_900 }}
              >
                {LIVE_OPPORTUNITIES.length} Live Now
              </p>
              <p
                className="text-[10.5px]"
                style={{ color: INK_DIM }}
              >
                Showing {Math.min(5, FEATURED_OPPORTUNITIES.length)} featured
              </p>
            </div>
          </motion.div>
        </div>

        {/* GRID — featured 5 in editorial layout */}
        <FeaturedGrid />

        {/* CLOSING CTA */}
        <motion.div
          className="mt-14 max-w-3xl mx-auto p-8 md:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
          style={{
            background: WHITE,
            border: `1px solid rgba(10,31,68,0.08)`,
            borderRadius: "1px",
            boxShadow: "0 16px 48px -16px rgba(10,31,68,0.12)",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Gold corner accents */}
          <div
            className="absolute top-0 left-0 w-12 h-px"
            style={{ background: GOLD }}
          />
          <div
            className="absolute top-0 left-0 w-px h-12"
            style={{ background: GOLD }}
          />
          <div
            className="absolute bottom-0 right-0 w-12 h-px"
            style={{ background: GOLD }}
          />
          <div
            className="absolute bottom-0 right-0 w-px h-12"
            style={{ background: GOLD }}
          />

          <div className="flex items-center gap-5 relative">
            <div
              className="w-14 h-14 grid place-items-center flex-shrink-0"
              style={{
                background: GOLD_DIM,
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <Layers size={20} style={{ color: GOLD_DARK }} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.28em] uppercase mb-1.5"
                style={{ color: GOLD_DARK }}
              >
                The Full Portfolio
              </p>
              <p
                className="leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "24px",
                  color: INK,
                }}
              >
                Browse every{" "}
                <em style={{ color: GOLD_DARK, fontWeight: 400 }}>
                  live, upcoming, and past
                </em>{" "}
                opportunity.
              </p>
            </div>
          </div>

          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-7 py-4 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 whitespace-nowrap relative"
            style={{
              backgroundColor: NAVY_900,
              color: WHITE,
              borderRadius: "1px",
              boxShadow: "0 12px 28px -10px rgba(10,31,68,0.45)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = NAVY_700;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = NAVY_900;
              e.currentTarget.style.transform = "";
            }}
          >
            Browse All Opportunities
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FEATURED GRID — editorial 5-card layout
// ═════════════════════════════════════════════════════════════════════════════
//
// Layout strategy: 1 hero card (2/3 width) + 4 secondary cards (in 2x2 right-side grid)
// On smaller screens, falls back to a 1-2-3 column responsive grid
//
function FeaturedGrid() {
  const cards = FEATURED_OPPORTUNITIES;

  if (cards.length === 0) return null;

  return (
    <>
      {/* Desktop layout — editorial asymmetric grid */}
      <div className="hidden lg:grid grid-cols-3 gap-5">
        {/* Hero card — first opportunity, spans 2 columns and full height */}
        <div className="col-span-2 row-span-2">
          <FeaturedHeroCard spv={cards[0]} />
        </div>

        {/* Secondary cards — 2x2 grid on the right */}
        {cards.slice(1, 5).map((spv, i) => (
          <OpportunityCard
            key={spv.id}
            spv={spv}
            index={i + 1}
            variant="compact"
          />
        ))}
      </div>

      {/* Tablet — 2 columns */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-5">
        {cards.map((spv, i) => (
          <OpportunityCard key={spv.id} spv={spv} index={i} />
        ))}
      </div>

      {/* Mobile — single column */}
      <div className="grid md:hidden grid-cols-1 gap-5">
        {cards.map((spv, i) => (
          <OpportunityCard key={spv.id} spv={spv} index={i} />
        ))}
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HERO CARD — large featured card for the lead opportunity
// ═════════════════════════════════════════════════════════════════════════════
function FeaturedHeroCard({ spv }) {
  const opportunityHref = useOpportunityHref();
  const [hovered, setHovered] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="h-full"
    >
      <Link
        href={opportunityHref(spv.id)}
        className="relative h-full overflow-hidden block group"
        style={{
          backgroundColor: NAVY_900,
          boxShadow: hovered
            ? "0 32px 80px -20px rgba(10,31,68,0.35)"
            : "0 12px 40px -12px rgba(10,31,68,0.18)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "box-shadow 0.4s ease, transform 0.4s ease",
          borderRadius: "1px",
          minHeight: 540,
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Full-bleed image */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spv.image}
            alt={`${spv.name} in ${spv.city}`}
            className="w-full h-full object-cover transition-transform duration-1000"
            style={{ transform: hovered ? "scale(1.05)" : "scale(1.0)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(6,20,47,0.95) 0%, rgba(6,20,47,0.6) 40%, rgba(6,20,47,0.15) 75%, transparent 100%)",
            }}
          />
        </div>

        {/* TOP — badges + bookmark */}
        <div className="relative z-10 p-7 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1.5 text-[10px] font-extrabold tracking-[0.18em] uppercase"
              style={{
                backgroundColor: GOLD,
                color: NAVY_900,
                borderRadius: "1px",
              }}
            >
              ★ Featured
            </span>
            <span
              className="px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.16em] uppercase text-white"
              style={{
                backgroundColor: getStrategyColor(spv.category),
                borderRadius: "1px",
              }}
            >
              {spv.category}
            </span>
            <span
              className="px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.16em] uppercase text-white"
              style={{
                backgroundColor: "rgba(6,20,47,0.5)",
                backdropFilter: "blur(8px)",
                border: `1px solid rgba(255,255,255,0.12)`,
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
            className="w-10 h-10 grid place-items-center transition-all duration-200 flex-shrink-0"
            style={{
              backgroundColor: saved ? GOLD : "rgba(6,20,47,0.55)",
              border: `1px solid ${
                saved ? GOLD : "rgba(255,255,255,0.15)"
              }`,
              borderRadius: "1px",
            }}
            aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Bookmark
              size={14}
              className="text-white"
              fill={saved ? "white" : "none"}
            />
          </button>
        </div>

        {/* Spacer pushes content to bottom */}
        <div className="flex-1" />

        {/* BOTTOM — content */}
        <div className="relative z-10 p-7 pt-0">
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-3">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#86efac" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="text-[10.5px] font-bold tracking-[0.28em] uppercase"
              style={{ color: "#86efac" }}
            >
              Open · {spv.daysLeft} days remaining
            </span>
          </div>

          {/* Headline */}
          <h3
            className="leading-[0.96] text-white mb-3"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "clamp(34px, 4vw, 48px)",
              letterSpacing: "-0.012em",
            }}
          >
            {spv.name},
            <br />
            <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
              {spv.neighbourhood}
            </em>
          </h3>

          <div className="flex items-center gap-2 mb-5">
            <MapPin
              size={12}
              style={{ color: "rgba(255,255,255,0.7)" }}
            />
            <span
              className="text-[13px] font-semibold"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {spv.city} · {spv.region}
            </span>
          </div>

          <p
            className="text-[13.5px] leading-relaxed mb-6 max-w-md"
            style={{ color: "rgba(255,255,255,0.78)", fontWeight: 300 }}
          >
            {spv.summary}
          </p>

          {/* Stat strip — yield + hold + investors (NO price) */}
          <div
            className="grid grid-cols-3 gap-0 mb-6 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: "1px",
              backdropFilter: "blur(8px)",
            }}
          >
            {[
              { label: "Target Yield", value: spv.targetYield, accent: true },
              { label: "Hold Period", value: spv.holdPeriod, accent: false },
              { label: "Investors", value: spv.investors, accent: false },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="px-5 py-4"
                style={{
                  borderRight:
                    i < 2 ? `1px solid rgba(255,255,255,0.08)` : "none",
                }}
              >
                <p
                  className="leading-none mb-1.5"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "28px",
                    color: stat.accent ? GOLD_LIGHT : WHITE,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[9.5px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Subscription progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Subscription Progress
              </span>
              <span
                className="text-[11px] font-extrabold"
                style={{ color: GOLD_LIGHT }}
              >
                {spv.subscribed}%
              </span>
            </div>
            <div
              className="h-1 w-full overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
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
                transition={{ duration: 1.4, delay: 0.4 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <span
              className="flex items-center gap-1.5 text-[11.5px]"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <Calendar size={11} style={{ color: GOLD_LIGHT }} />
              Closes {spv.closingDate}
            </span>
            <div
              className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.14em] uppercase transition-all"
              style={{ color: hovered ? GOLD_LIGHT : WHITE }}
            >
              <span
                style={{
                  borderBottom: `1.5px solid ${
                    hovered ? GOLD_LIGHT : "rgba(255,255,255,0.4)"
                  }`,
                  paddingBottom: 2,
                  transition: "border-color 0.2s",
                }}
              >
                View Opportunity
              </span>
              <ArrowUpRight
                size={12}
                style={{ color: GOLD_LIGHT }}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}