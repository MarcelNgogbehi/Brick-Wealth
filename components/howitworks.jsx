"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Mail,
  ShieldCheck,
  Search,
  FileSignature,
  PieChart,
  TrendingUp,
} from "lucide-react";

/* ─── Brand tokens ──────────────────────────────────────────────────────── */
const NAVY_900 = "#0A1F44";
const NAVY_700 = "#15326B";
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

/* ─── Investor journey steps ────────────────────────────────────────────── */
const STEPS = [
  {
    id: "invitation",
    icon: Mail,
    number: "01",
    label: "Invitation",
    headline: "By Invitation Only",
    body:
      "Brick & Wealth is a private platform. Receive a direct founder invitation, an existing-investor referral, or register your interest to join the review waitlist.",
    bullets: [
      "Direct founder invitations",
      "Existing investor referrals",
      "Waitlist registration & review",
      "Welcome & onboarding link",
    ],
    href: "/register-interest",
  },
  {
    id: "verification",
    icon: ShieldCheck,
    number: "02",
    label: "Verification",
    headline: "KYC & Self-Certification",
    body:
      "We comply with FCA-aligned standards. Complete a brief onboarding flow, upload identity documents, and self-certify as a sophisticated or HNW investor.",
    bullets: [
      "ID & proof of address",
      "Self-certification questionnaire",
      "Risk acknowledgement",
      "Manual review · 24–72 hrs",
    ],
    href: "/how-it-works/verification",
  },
  {
    id: "browse",
    icon: Search,
    number: "03",
    label: "Browse",
    headline: "Explore Live SPVs",
    body:
      "Once approved, your investor dashboard unlocks. Browse live property opportunities, each with full documentation, SPV structure, projected yields and exit narratives.",
    bullets: [
      "Full opportunity briefings",
      "SPV legal documentation",
      "Photos, video & area data",
      "Plain-English risk summaries",
    ],
    href: "/opportunities",
  },
  {
    id: "subscribe",
    icon: FileSignature,
    number: "04",
    label: "Subscribe",
    headline: "Choose Shares & Sign",
    body:
      "Decide how many shares you want — from £500 minimum. Your subscription pack is generated for review, you sign digitally, then pay via Stripe or bank transfer.",
    bullets: [
      "Subscription pack auto-generated",
      "Digital signature & timestamps",
      "Stripe (GBP) or bank transfer",
      "Proof-of-payment upload",
    ],
    href: "/how-it-works/subscriptions",
  },
  {
    id: "allocation",
    icon: PieChart,
    number: "05",
    label: "Allocation",
    headline: "Shares Allocated to You",
    body:
      "Once payment is verified, our team allocates your shares in the SPV cap table and issues your share certificate. Your dashboard updates to show your holding instantly.",
    bullets: [
      "Cap table updated in real time",
      "Share certificate issued (PDF)",
      "Ownership % displayed",
      "Agreement securely archived",
    ],
    href: "/how-it-works/allocation",
  },
  {
    id: "ownership",
    icon: TrendingUp,
    number: "06",
    label: "Ownership",
    headline: "Track, Earn & Reinvest",
    body:
      "Your portfolio dashboard shows holdings across every SPV, performance snapshots, a document vault and quarterly updates. Buy more, refer friends, or list shares for sale.",
    bullets: [
      "Live holdings & performance",
      "Document vault & statements",
      "Quarterly property updates",
      "Refer-and-earn rewards",
    ],
    href: "/how-it-works/ownership",
  },
];

/* ─── Motion variants ───────────────────────────────────────────────────── */
const gridContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ─── Step Card ─────────────────────────────────────────────────────────── */
/* No expand-on-hover. All content is always visible. Hover only triggers a
   gentle lift, a gold border, a top accent line, and quiet colour shifts. */
function StepCard({ step }) {
  const Icon = step.icon;

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="h-full"
    >
      <Link
        href={step.href}
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

        {/* Oversized ghost step number — editorial watermark */}
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
          {step.number}
        </span>

        <div className="relative flex flex-1 flex-col p-7 sm:p-8">
          {/* Icon + step index */}
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
              {step.number}
              <span style={{ opacity: 0.45 }}> / 06</span>
            </span>
          </div>

          {/* Label */}
          <p
            className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: GOLD_DARK }}
          >
            {step.label}
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
            {step.headline}
          </h3>

          {/* Body — always visible */}
          <p
            className="mb-6 text-[13.5px] leading-relaxed"
            style={{ color: INK_MID }}
          >
            {step.body}
          </p>

          {/* Bullets — always visible */}
          <ul className="mb-7 flex flex-col gap-2.5" role="list">
            {step.bullets.map((b) => (
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
            <span>Learn More</span>
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
function InfoTile({ label, sub, href, index }) {
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

/* ─── How It Works Section ──────────────────────────────────────────────── */
export default function HowItWorksSection() {
  const headerRef = useRef(null);
  const inView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: CREAM,
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
      aria-labelledby="how-it-works-heading"
    >
      {/* Top hairline */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px"
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
          className="absolute bottom-0 right-0 opacity-[0.05]"
          width="320"
          height="320"
        >
          <defs>
            <pattern
              id="hiw-dots"
              x="0"
              y="0"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill={GOLD} />
            </pattern>
          </defs>
          <rect width="320" height="320" fill="url(#hiw-dots)" />
        </svg>

        <div
          className="absolute -left-8 top-1/2 hidden -translate-y-1/2 select-none leading-none lg:block"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(140px, 22vw, 320px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(10,31,68,0.05)",
          }}
        >
          II
        </div>

        <svg
          className="absolute -right-16 -top-16 opacity-[0.04]"
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

      <div className="relative mx-auto max-w-[1300px] px-5 pb-20 pt-20 sm:px-8 md:pb-28 md:pt-28 xl:px-10">
        {/* Vertical editorial label */}
        <div
          className="absolute left-3 top-32 hidden items-center gap-3 xl:flex"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          aria-hidden="true"
        >
          <div className="h-10 w-px" style={{ backgroundColor: GOLD, opacity: 0.6 }} />
          <span
            className="text-[9px] font-bold uppercase tracking-[0.4em]"
            style={{ color: INK_DIM }}
          >
            The Investor Journey · Six Steps
          </span>
        </div>

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
                How It Works
              </span>
            </motion.div>

            <motion.h2
              id="how-it-works-heading"
              className="leading-[0.96]"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(38px, 5.5vw, 76px)",
                letterSpacing: "-0.018em",
                color: INK,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
            >
              From invitation to{" "}
              <em style={{ color: GOLD_DARK, fontWeight: 400 }}>ownership.</em>
              <br />
              Six considered{" "}
              <em style={{ color: GOLD_DARK, fontWeight: 400 }}>steps.</em>
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
              No surprises, no opacity. The Brick &amp; Wealth journey is the same
              for every investor — clear, documented, and built to be reviewed by
              lawyers and regulators alike.
            </p>
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[0.14em] transition-all duration-200"
              style={{ color: INK }}
            >
              <span style={{ borderBottom: `1.5px solid ${GOLD}`, paddingBottom: 2 }}>
                The Full Process
              </span>
              <ArrowRight
                size={13}
                style={{ color: GOLD_DARK }}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>

        {/* Steps grid */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
          variants={gridContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {STEPS.map((step) => (
            <StepCard key={step.id} step={step} />
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
              label: "Free 30-Min Discovery Call",
              sub: "Speak with the team, no commitment",
              href: "/company/contact",
            },
            {
              label: "FCA-Aligned Onboarding",
              sub: "AML, KYC & GDPR compliant",
              href: "/company#compliance",
            },
            {
              label: "From £500 Per Share",
              sub: "Across 12 live UK opportunities",
              href: "/opportunities",
            },
          ].map((tile, i) => (
            <InfoTile key={tile.label} index={i} {...tile} />
          ))}
        </motion.div>
      </div>

      {/* Bottom hairline */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_BORD}, transparent)`,
        }}
        aria-hidden="true"
      />
    </section>
  );
}