"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Building2,
  Eye,
  GraduationCap,
  FileCheck,
  Scale,
  Hourglass,
} from "lucide-react";

/* ─── Brand tokens ──────────────────────────────────────────────────────── */
const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.30)";
const CREAM = "#F8F4EC";
const CREAM_DARK = "#EFE8D8";
const INK = "#0B1220";
const INK_MID = "#4A5468";
const INK_DIM = "#8A93A6";
const WHITE = "#FFFFFF";
const HAIRLINE = "rgba(10,31,68,0.08)";

const EASE = [0.16, 1, 0.3, 1];

/* ─── 6 operating principles ────────────────────────────────────────────── */
const PRINCIPLES = [
  {
    id: "ring-fenced",
    icon: Building2,
    number: "01",
    label: "Ring-Fenced Structure",
    headline: "One SPV per property, always.",
    body:
      "Every opportunity is its own legal entity — registered at Companies House with separate accounts, assets and liabilities. Your investment is never co-mingled with another deal.",
    bullets: [
      "Separate Companies House registration",
      "Independent bank accounts per SPV",
      "No cross-collateralisation",
      "Bankruptcy-remote from the platform",
    ],
    href: "/how-it-works#co-ownership",
  },
  {
    id: "oversight",
    icon: Eye,
    number: "02",
    label: "Independent Oversight",
    headline: "Reviewed before it reaches you.",
    body:
      "Every SPV undergoes legal review, surveyor valuation and independent due diligence before listing. Annual third-party audits verify the books. We don't grade our own homework.",
    bullets: [
      "Independent legal review per SPV",
      "RICS-aligned property valuations",
      "Annual third-party audit",
      "Quarterly investor reporting",
    ],
    href: "/company#compliance",
  },
  {
    id: "education",
    icon: GraduationCap,
    number: "03",
    label: "Education First",
    headline: "Learn before you commit.",
    body:
      "Property investment is a skill, not a lottery. Our library, webinars and one-to-one onboarding exist so you understand what you're buying — including the risks — before you place a share.",
    bullets: [
      "Plain-English risk briefings",
      "Free monthly investor webinars",
      "1-to-1 onboarding for new investors",
      "Glossary of every term used",
    ],
    href: "/education",
  },
  {
    id: "transparency",
    icon: FileCheck,
    number: "04",
    label: "Documented Transparency",
    headline: "If we did it, you can see it.",
    body:
      "Every subscription pack, share certificate, mortgage offer and statement lives in your investor vault. Nothing happens to your shares that isn't logged, timestamped and downloadable.",
    bullets: [
      "Encrypted document vault",
      "Cap table visible in real time",
      "Mortgage & lender documentation",
      "Audit-ready paper trail",
    ],
    href: "/company#compliance",
  },
  {
    id: "alignment",
    icon: Scale,
    number: "05",
    label: "Aligned Incentives",
    headline: "We invest alongside you.",
    body:
      "The founder and team subscribe to every SPV under the same terms as our investors. We earn when you earn and lose when you lose. No hidden fees, no preference shares, no special economics.",
    bullets: [
      "Founder co-invests in every SPV",
      "Same share class, same terms",
      "Transparent fee schedule upfront",
      "No carried interest above benchmark",
    ],
    href: "/company#about",
  },
  {
    id: "patient",
    icon: Hourglass,
    number: "06",
    label: "Patient Capital",
    headline: "Built for the long view.",
    body:
      "Property is an illiquid, multi-year asset and we treat it that way. SPVs are structured for 3–10 year holds, with quarterly distributions where applicable and an honest exit narrative from day one.",
    bullets: [
      "3–10 year holds stated upfront",
      "Quarterly distributions where applicable",
      "Pre-defined exit narrative per SPV",
      "Secondary market for share resale",
    ],
    href: "/how-it-works#exit",
  },
];

/* ─── Motion variants ───────────────────────────────────────────────────── */
const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ─── Principle Card ────────────────────────────────────────────────────── */
/* No expand-on-hover. All content is always visible. Hover only triggers a
   gentle lift, a gold border, a top accent line, and quiet colour shifts. */
function PrincipleCard({ principle }) {
  const Icon = principle.icon;

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="h-full"
    >
      <Link
        href={principle.href}
        className="group relative flex h-full flex-col overflow-hidden bg-white"
        style={{
          border: `1px solid ${HAIRLINE}`,
          borderRadius: "2px",
          boxShadow: "0 1px 2px rgba(10,31,68,0.04)",
          transition:
            "box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = GOLD_BORD;
          e.currentTarget.style.boxShadow =
            "0 28px 64px -28px rgba(10,31,68,0.30)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = HAIRLINE;
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(10,31,68,0.04)";
        }}
      >
        {/* Gold accent line that draws in on hover */}
        <div
          className="absolute left-0 top-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
          style={{
            background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD_LIGHT})`,
          }}
          aria-hidden="true"
        />

        {/* Oversized ghost number — editorial watermark */}
        <span
          className="pointer-events-none absolute -right-1 -top-3 select-none leading-none"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "120px",
            color: NAVY_900,
            opacity: 0.04,
          }}
          aria-hidden="true"
        >
          {principle.number}
        </span>

        <div className="relative flex flex-1 flex-col p-7 sm:p-8">
          {/* Icon + index */}
          <div className="mb-6 flex items-center justify-between">
            <div
              className="grid h-11 w-11 place-items-center transition-colors duration-300 group-hover:bg-[rgba(201,162,74,0.16)]"
              style={{
                backgroundColor: GOLD_DIM,
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "2px",
              }}
            >
              <Icon size={18} style={{ color: GOLD_DARK }} />
            </div>
            <span
              className="text-[11px] font-bold tracking-[0.3em]"
              style={{ color: INK_DIM }}
            >
              {principle.number}
              <span style={{ opacity: 0.45 }}> / 06</span>
            </span>
          </div>

          {/* Label */}
          <p
            className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: GOLD_DARK }}
          >
            {principle.label}
          </p>

          {/* Headline */}
          <h3
            className="mb-4 leading-tight"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "26px",
              letterSpacing: "-0.005em",
              color: INK,
            }}
          >
            {principle.headline}
          </h3>

          {/* Body — always visible */}
          <p
            className="mb-6 text-[13.5px] leading-relaxed"
            style={{ color: INK_MID }}
          >
            {principle.body}
          </p>

          {/* Bullets — always visible */}
          <ul className="mb-7 flex flex-col gap-2.5" role="list">
            {principle.bullets.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 text-[12.5px]"
                style={{ color: INK }}
              >
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rotate-45"
                  style={{ backgroundColor: GOLD }}
                  aria-hidden="true"
                />
                {b}
              </li>
            ))}
          </ul>

          {/* CTA pinned to the bottom */}
          <div
            className="mt-auto flex items-center justify-between pt-5 text-[10.5px] font-extrabold uppercase tracking-[0.16em]"
            style={{ borderTop: `1px solid ${CREAM_DARK}`, color: GOLD_DARK }}
          >
            <span>Read the Detail</span>
            <ArrowUpRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Bottom info tile ──────────────────────────────────────────────────── */
function InfoTile({ label, sub, href }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      className={[
        "group relative flex items-center justify-between px-7 py-6 transition-colors duration-300",
        "border-t md:border-t-0 md:border-l first:border-t-0 md:first:border-l-0",
      ].join(" ")}
      style={{ borderColor: HAIRLINE, backgroundColor: hover ? NAVY_900 : WHITE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div>
        <p
          className="text-[13px] font-extrabold tracking-[0.03em] transition-colors duration-300"
          style={{ color: hover ? WHITE : INK }}
        >
          {label}
        </p>
        <p
          className="mt-1 text-[12px] transition-colors duration-300"
          style={{ color: hover ? "rgba(255,255,255,0.6)" : INK_MID }}
        >
          {sub}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="flex-shrink-0 transition-all duration-300 group-hover:translate-x-1"
        style={{ color: hover ? GOLD_LIGHT : GOLD_DARK }}
      />
    </Link>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   EXPORTED SECTION
   ═════════════════════════════════════════════════════════════════════════ */
export default function OperatingPrinciplesGrid() {
  const headerRef = useRef(null);
  const inView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM }}
      aria-labelledby="principles-grid-heading"
    >
      {/* Top + bottom hairlines */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_BORD}, transparent)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_BORD}, transparent)`,
        }}
        aria-hidden="true"
      />

      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="absolute bottom-0 left-0 opacity-[0.05]"
          width="320"
          height="320"
        >
          <defs>
            <pattern
              id="prin-grid-dots"
              x="0"
              y="0"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill={GOLD} />
            </pattern>
          </defs>
          <rect width="320" height="320" fill="url(#prin-grid-dots)" />
        </svg>

        <svg
          className="absolute -left-16 -top-16 opacity-[0.04]"
          width="380"
          height="380"
          viewBox="0 0 44 44"
          fill="none"
        >
          <path d="M22 4 L36 12 L22 20 L8 12 Z" stroke={NAVY_900} strokeWidth="0.4" />
          <path d="M22 14 L36 22 L22 30 L8 22 Z" stroke={NAVY_900} strokeWidth="0.4" />
          <path d="M22 24 L36 32 L22 40 L8 32 Z" stroke={NAVY_900} strokeWidth="0.4" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1300px] px-5 py-24 sm:px-8 md:py-28 xl:px-10">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-14 flex flex-col justify-between gap-8 md:mb-16 md:flex-row md:items-end"
        >
          <div>
            <motion.div
              className="mb-5 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="h-px w-8" style={{ backgroundColor: GOLD }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.32em]"
                style={{ color: GOLD_DARK }}
              >
                Operating Principles
              </span>
            </motion.div>

            <motion.h2
              id="principles-grid-heading"
              className="leading-[0.96]"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(38px, 5.5vw, 72px)",
                letterSpacing: "-0.018em",
                color: INK,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
            >
              Six <em style={{ color: GOLD_DARK, fontWeight: 400 }}>principles.</em>
              <br />
              Every SPV,{" "}
              <em
                style={{
                  color: GOLD_DARK,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                without exception
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
                    animate={inView ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.4, delay: 0.9, ease: "easeInOut" }}
                  />
                </svg>
              </em>
              .
            </motion.h2>
          </div>

          <motion.div
            className="flex max-w-sm flex-col items-start gap-4 md:items-end"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
          >
            <p
              className="hidden text-[13.5px] leading-relaxed md:block md:text-right"
              style={{ color: INK_MID }}
            >
              These aren&apos;t marketing pillars. They are the operating rules we
              apply to every property, every SPV, and every investor — the same
              way, every time.
            </p>
            <Link
              href="#compliance"
              className="group inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[0.14em] transition-all duration-200"
              style={{ color: INK }}
            >
              <span style={{ borderBottom: `1.5px solid ${GOLD}`, paddingBottom: 2 }}>
                The Compliance Framework
              </span>
              <ArrowRight
                size={13}
                style={{ color: GOLD_DARK }}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>

        {/* Principles grid */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
          variants={gridContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {PRINCIPLES.map((principle) => (
            <PrincipleCard key={principle.id} principle={principle} />
          ))}
        </motion.div>

        {/* Bottom info band */}
        <motion.div
          className="mt-14 grid grid-cols-1 overflow-hidden bg-white md:mt-16 md:grid-cols-3"
          style={{ border: `1px solid ${HAIRLINE}`, borderRadius: "2px" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {[
            {
              label: "Read the Compliance Brief",
              sub: "FCA framework, AML & KYC explained",
              href: "/company#compliance",
            },
            {
              label: "Inspect a Sample SPV Pack",
              sub: "Full subscription documents",
              href: "/how-it-works#process",
            },
            {
              label: "Speak With Our Team",
              sub: "Independent advisors on call",
              href: "/company#contact",
            },
          ].map((tile) => (
            <InfoTile key={tile.label} {...tile} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}