"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
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
  Building2,
  Users,
  FileCheck,
  Lock,
  Layers,
  Hourglass,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Coins,
  RefreshCw,
  Home as HomeIcon,
  Banknote,
  Calendar,
  Eye,
  Sparkles,
  Workflow,
  GitBranch,
  Download,
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
const GREEN = "#0F6E56";
const RED = "#9B2C2C";

// ─── Section nav config ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: "process", label: "The B&W Process", Icon: Workflow },
  { id: "co-ownership", label: "Co-Ownership", Icon: Users },
  { id: "risk-returns", label: "Risk & Returns", Icon: TrendingUp },
  { id: "exit", label: "Exit Strategies", Icon: GitBranch },
];

// ─── Process steps data ─────────────────────────────────────────────────────
const PROCESS_STEPS = [
  {
    number: "01",
    icon: Mail,
    label: "Invitation",
    title: "We invite. You apply.",
    body: "Bricks & Wealth is private. You join via direct invitation, an existing-investor referral, or by registering your interest and being approved from the waitlist after manual review.",
    duration: "Same day · 48 hours",
  },
  {
    number: "02",
    icon: ShieldCheck,
    label: "Verification",
    title: "FCA-aligned KYC.",
    body: "Identity check, proof of address, and self-certification as a sophisticated or HNW investor. Reviewed by our admin team within 24–72 hours. AML and GDPR compliant from day one.",
    duration: "24 – 72 hours",
  },
  {
    number: "03",
    icon: Search,
    label: "Browse",
    title: "Explore live SPVs.",
    body: "Your dashboard unlocks. Each opportunity has full documentation: property briefing, SPV structure, mortgage details, projected yields, downside cases, and exit narrative.",
    duration: "At your pace",
  },
  {
    number: "04",
    icon: FileSignature,
    label: "Subscribe",
    title: "Choose shares. Sign.",
    body: "From £500 minimum. We auto-generate your subscription pack as PDFs. You sign digitally with timestamps. Pay via Stripe (GBP) or bank transfer with proof-of-payment upload.",
    duration: "10 – 20 minutes",
  },
  {
    number: "05",
    icon: PieChart,
    label: "Allocation",
    title: "Shares allocated.",
    body: "Once payment is verified, our admin team allocates your shares in the SPV's cap table and issues your share certificate. Dashboard updates immediately to show your holding.",
    duration: "1 – 3 working days",
  },
  {
    number: "06",
    icon: TrendingUp,
    label: "Ownership",
    title: "Track. Earn. Reinvest.",
    body: "Live holdings dashboard, document vault, quarterly property updates from us, and refer-and-earn rewards. List shares for resale via our secondary market when you're ready.",
    duration: "3 – 10 year hold",
  },
];

// ─── Co-ownership concepts ──────────────────────────────────────────────────
const SPV_CONCEPTS = [
  {
    icon: Building2,
    title: "One property = one SPV",
    body: "Every property is owned by its own Limited Company, registered at Companies House, with its own bank account, accounts, and tax filings. Never co-mingled.",
  },
  {
    icon: Layers,
    title: "Shares represent ownership",
    body: "Investors buy ordinary shares in the SPV. The SPV owns the property. You own a percentage of the SPV proportional to the shares you hold.",
  },
  {
    icon: ShieldCheck,
    title: "Ring-fenced by design",
    body: "If another SPV has problems, your investment is unaffected — they share no assets, no liabilities, no bank accounts. Bankruptcy-remote from each other and from Bricks & Wealth.",
  },
  {
    icon: FileCheck,
    title: "Audited cap table",
    body: "Your shareholding is recorded in the SPV's cap table, your share certificate is issued in PDF, and the register is reviewed by independent auditors annually.",
  },
];

// ─── Risk & returns scenarios (the same SPV under three cases) ──────────────
const SCENARIOS = [
  {
    label: "Downside",
    sub: "If things go poorly",
    accent: RED,
    yield: "4.2%",
    capital: "−8%",
    total: "−2.1%",
    summary:
      "Extended void periods, repair overruns, or a softer market at exit can reduce yield and erode capital value.",
    likelihood: "Possible",
  },
  {
    label: "Base Case",
    sub: "Our planning assumption",
    accent: GOLD_DARK,
    yield: "8.4%",
    capital: "+18%",
    total: "+11.0%",
    summary:
      "Tenanted on schedule, rent collected as forecast, modest capital growth in line with regional ONS averages over the hold period.",
    likelihood: "Most likely",
  },
  {
    label: "Upside",
    sub: "If conditions favour",
    accent: GREEN,
    yield: "9.1%",
    capital: "+34%",
    total: "+16.4%",
    summary:
      "Strong tenant retention, above-trend rental growth, and outperformance of the local market through the hold period.",
    likelihood: "Plausible",
  },
];

// ─── Risk acknowledgements (we name the risks) ──────────────────────────────
const RISKS = [
  {
    title: "Capital is at risk",
    body: "Property values can fall as well as rise. You may receive back less than you invested — including the possibility of total loss in extreme scenarios.",
  },
  {
    title: "Illiquidity",
    body: "Property is not a daily-traded asset. While we operate a secondary market, there is no guarantee of finding a buyer for your shares before the SPV's planned exit.",
  },
  {
    title: "Yield is targeted, not guaranteed",
    body: "All projected yields are forecasts based on current rental data and assumptions. Void periods, repair costs, and tax changes can reduce actual returns.",
  },
  {
    title: "Mortgage and leverage risk",
    body: "Most SPVs use a mortgage. Rising interest rates at refinance can compress margins. If repayments fall behind, the lender retains rights over the property.",
  },
];

// ─── Exit strategies ─────────────────────────────────────────────────────────
const EXIT_STRATEGIES = [
  {
    icon: HomeIcon,
    title: "Sell the property",
    timeframe: "End of planned hold",
    description:
      "At the end of the SPV's stated hold period (typically 3–10 years), the property is marketed and sold. Proceeds are distributed to shareholders pro-rata after costs, debt repayment, and tax.",
    bullets: [
      "Independent valuation before sale",
      "Investor vote on offers above floor price",
      "Distribution within 60 days of completion",
      "Audited final accounts issued",
    ],
  },
  {
    icon: RefreshCw,
    title: "Refinance & hold",
    timeframe: "Mid-hold optionality",
    description:
      "If the property has appreciated and rates are favourable, the SPV can refinance to release capital. Investors can elect to take a partial distribution while retaining their shareholding.",
    bullets: [
      "Triggered by valuation uplift",
      "Investor vote required",
      "Partial capital return preserves ownership",
      "Yield typically continues",
    ],
  },
  {
    icon: Coins,
    title: "Resell shares",
    timeframe: "Anytime, secondary market",
    description:
      "List your shares on our internal secondary market. Other approved investors can bid. Bricks & Wealth facilitates the transfer and updates the cap table — subject to liquidity and pricing.",
    bullets: [
      "List from your investor dashboard",
      "Buyer must be KYC-approved",
      "Cap table updates within 5 working days",
      "Liquidity not guaranteed",
    ],
  },
  {
    icon: Banknote,
    title: "Hold for income",
    timeframe: "Indefinite, where stated",
    description:
      "For income-strategy SPVs, investors can choose to hold past the stated minimum period and continue receiving quarterly distributions. The SPV continues operating until investors vote to exit.",
    bullets: [
      "Quarterly rent distributions",
      "Reviewed annually by board",
      "Majority vote can trigger sale",
      "Long-duration capital play",
    ],
  },
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
              radial-gradient(ellipse 70% 50% at 20% 20%, rgba(201,162,74,0.18) 0%, transparent 60%),
              linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 50%, ${NAVY_700} 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
          }}
        />
        {/* Italic ghost numeral */}
        <div
          className="absolute -right-10 top-1/2 -translate-y-1/2 select-none leading-none pointer-events-none"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(180px, 28vw, 380px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(201,162,74,0.07)",
            userSelect: "none",
          }}
        >
          IV
        </div>
      </div>

      <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        {/* Breadcrumb */}
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
          <span style={{ color: GOLD_LIGHT }}>How It Works</span>
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
              <Eye size={11} style={{ color: GOLD_LIGHT }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                The Operating Manual
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
              How Bricks &amp; Wealth{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                actually
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
              </em>{" "}
              works.
            </motion.h1>

            <motion.p
              className="text-[15px] leading-relaxed max-w-xl"
              style={{ color: "rgba(255,255,255,0.72)", fontWeight: 300 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              From your first invitation to your eventual exit — the full process,
              the share structure, the real numbers (including the downside),
              and the exit options. No marketing fluff. The operating manual.
            </motion.p>
          </div>

          {/* Right — quick jump panel */}
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2"
              style={{ color: GOLD_LIGHT }}
            >
              Jump to chapter
            </p>
            {SECTIONS.map(({ id, label, Icon }, i) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", `#${id}`);
                }}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-all duration-200 group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: "1px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD_BORD;
                  e.currentTarget.style.background = "rgba(201,162,74,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-extrabold tracking-[0.2em]"
                    style={{ color: GOLD_LIGHT }}
                  >
                    0{i + 1}
                  </span>
                  <div
                    className="w-px h-4"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  />
                  <Icon size={13} style={{ color: GOLD_LIGHT }} />
                  <span
                    className="text-[12px] font-bold tracking-[0.04em]"
                    style={{ color: WHITE }}
                  >
                    {label}
                  </span>
                </div>
                <ArrowRight
                  size={12}
                  style={{ color: GOLD_LIGHT }}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </a>
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
          {SECTIONS.map(({ id, label, Icon }, i) => {
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
                <span
                  className="text-[10px] font-extrabold opacity-80"
                  style={{ color: active ? NAVY_900 : GOLD_LIGHT }}
                >
                  0{i + 1}
                </span>
                <Icon size={12} />
                {label}
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
  number,
  title,
  titleAccent,
  description,
  dark = false,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14"
    >
      <div>
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {number && (
            <span
              className="text-[11px] font-extrabold tracking-[0.32em]"
              style={{ color: dark ? GOLD_LIGHT : GOLD_DARK }}
            >
              {number}
            </span>
          )}
          <div
            className="w-8 h-px"
            style={{ backgroundColor: dark ? GOLD_LIGHT : GOLD }}
          />
          <span
            className="text-[11px] font-bold tracking-[0.32em] uppercase"
            style={{ color: dark ? GOLD_LIGHT : GOLD_DARK }}
          >
            {eyebrow}
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

      {description && (
        <motion.p
          className="text-[14px] leading-relaxed max-w-md md:text-right"
          style={{ color: dark ? "rgba(255,255,255,0.65)" : INK_MID }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1: THE B&W PROCESS — Vertical timeline
// ═════════════════════════════════════════════════════════════════════════════
function ProcessSection({ sectionRef }) {
  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      {/* Decorative bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute -top-16 -left-16 opacity-[0.04]"
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
          number="01"
          eyebrow="The B&W Process"
          title="From invitation"
          titleAccent="to allocation."
          description="The same six steps, every time, every investor — clear, documented, and built to be reviewed by lawyers and regulators alike."
        />

        {/* Vertical timeline with steps */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical connector line */}
          <div
            className="absolute left-[28px] md:left-[44px] top-2 bottom-2 w-px"
            style={{ background: `linear-gradient(to bottom, ${GOLD_BORD}, ${GOLD}, ${GOLD_BORD})` }}
            aria-hidden="true"
          />

          <div className="flex flex-col gap-3">
            {PROCESS_STEPS.map((step, i) => (
              <ProcessStep key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Process diagram callout */}
        <motion.div
          className="mt-14 max-w-3xl mx-auto p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: WHITE,
            border: `1px solid rgba(10,31,68,0.08)`,
            borderLeft: `3px solid ${GOLD}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 grid place-items-center flex-shrink-0"
              style={{
                backgroundColor: GOLD_DIM,
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <Download size={18} style={{ color: GOLD_DARK }} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase mb-1"
                style={{ color: GOLD_DARK }}
              >
                Reference Document
              </p>
              <p
                className="leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  color: INK,
                }}
              >
                Download the full process flow as PDF.
              </p>
            </div>
          </div>
          <Link
            href="/documents/process-flow.pdf"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-extrabold tracking-[0.14em] uppercase border-2 transition-all duration-200 whitespace-nowrap"
            style={{ borderColor: NAVY_900, color: NAVY_900, borderRadius: "1px" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = NAVY_900;
              e.currentTarget.style.color = WHITE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = NAVY_900;
            }}
          >
            Download PDF
            <Download size={11} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ProcessStep({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-5 md:gap-8"
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      {/* Number disc */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className="w-14 h-14 md:w-[88px] md:h-[88px] grid place-items-center"
          style={{
            background: WHITE,
            border: `2px solid ${GOLD}`,
            borderRadius: "50%",
            boxShadow: "0 8px 24px -8px rgba(201,162,74,0.4)",
          }}
        >
          <step.icon
            size={20}
            className="md:hidden"
            style={{ color: GOLD_DARK }}
          />
          <span
            className="hidden md:block leading-none"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "32px",
              color: NAVY_900,
            }}
          >
            {step.number}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 p-5 md:p-7 mb-3"
        style={{
          background: WHITE,
          border: `1px solid rgba(10,31,68,0.08)`,
          borderRadius: "1px",
          boxShadow: "0 2px 12px -4px rgba(10,31,68,0.06)",
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <step.icon size={14} style={{ color: GOLD_DARK }} className="hidden md:block" />
            <span
              className="text-[10.5px] font-bold tracking-[0.24em] uppercase"
              style={{ color: GOLD_DARK }}
            >
              Step {step.number} · {step.label}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{
              backgroundColor: CREAM,
              border: `1px solid ${CREAM_DARK}`,
              borderRadius: "1px",
              color: INK_MID,
            }}
          >
            <Calendar size={10} />
            {step.duration}
          </div>
        </div>
        <h3
          className="leading-tight mb-3"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "26px",
            color: INK,
          }}
        >
          {step.title}
        </h3>
        <p
          className="text-[13.5px] leading-relaxed"
          style={{ color: INK_MID }}
        >
          {step.body}
        </p>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2: CO-OWNERSHIP — Visual diagram + concepts
// ═════════════════════════════════════════════════════════════════════════════
function CoOwnershipSection({ sectionRef }) {
  return (
    <section
      id="co-ownership"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: NAVY_950, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
          number="02"
          eyebrow="Co-Ownership Explained"
          title="How SPV"
          titleAccent="shareholding works."
          description="A Special Purpose Vehicle is a Limited Company that owns one property and nothing else. You buy shares in the SPV. The SPV owns the property. Your shares = your ownership."
          dark
        />

        {/* SPV Structure Diagram */}
        <SPVDiagram />

        {/* Four concept cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-14">
          {SPV_CONCEPTS.map((concept, i) => (
            <SPVConceptCard key={concept.title} concept={concept} index={i} />
          ))}
        </div>

        {/* Worked example */}
        <WorkedExample />
      </div>
    </section>
  );
}

function SPVDiagram() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="relative max-w-4xl mx-auto p-8 md:p-12 my-8"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
    >
      <div className="flex items-center gap-2 mb-8">
        <Sparkles size={12} style={{ color: GOLD_LIGHT }} />
        <p
          className="text-[10px] font-bold tracking-[0.32em] uppercase"
          style={{ color: GOLD_LIGHT }}
        >
          The Structure, Visualised
        </p>
      </div>

      {/* SVG Diagram */}
      <div className="flex flex-col items-center gap-2">
        {/* Investors row */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
          {[1, 2, 3, 4, 5].map((n, i) => (
            <motion.div
              key={n}
              className="w-14 h-14 grid place-items-center relative"
              style={{
                background: "rgba(201,162,74,0.08)",
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "50%",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
            >
              <Users size={18} style={{ color: GOLD_LIGHT }} />
            </motion.div>
          ))}
        </div>
        <p
          className="text-[10px] font-bold tracking-[0.24em] uppercase mb-4"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Investors (Shareholders)
        </p>

        {/* Down arrow */}
        <motion.svg
          width="40"
          height="50"
          viewBox="0 0 40 50"
          fill="none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
        >
          <line x1="20" y1="0" x2="20" y2="38" stroke={GOLD} strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M14 32 L20 42 L26 32" stroke={GOLD} strokeWidth="1.5" fill="none" />
        </motion.svg>
        <p
          className="text-[10px] font-medium italic mb-4 -mt-3"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            color: GOLD_LIGHT,
            fontSize: "13px",
          }}
        >
          buy shares in
        </p>

        {/* SPV box */}
        <motion.div
          className="relative px-8 py-6 w-full max-w-md"
          style={{
            background: `linear-gradient(135deg, ${NAVY_800}, ${NAVY_700})`,
            border: `2px solid ${GOLD}`,
            borderRadius: "1px",
            boxShadow: "0 16px 40px -12px rgba(201,162,74,0.4)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* Gold corner accents */}
          <div className="absolute top-0 left-0 w-6 h-px" style={{ background: GOLD }} />
          <div className="absolute top-0 left-0 w-px h-6" style={{ background: GOLD }} />
          <div className="absolute bottom-0 right-0 w-6 h-px" style={{ background: GOLD }} />
          <div className="absolute bottom-0 right-0 w-px h-6" style={{ background: GOLD }} />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="text-[9.5px] font-bold tracking-[0.24em] uppercase mb-1"
                style={{ color: GOLD_LIGHT }}
              >
                Special Purpose Vehicle
              </p>
              <p
                className="leading-tight mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "22px",
                  color: WHITE,
                }}
              >
                The Wilbraham SPV Ltd
              </p>
              <p
                className="text-[10.5px] font-medium"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Companies House · 13245678 · Registered 2026
              </p>
            </div>
            <div
              className="w-12 h-12 grid place-items-center flex-shrink-0"
              style={{
                background: "rgba(201,162,74,0.18)",
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <ShieldCheck size={20} style={{ color: GOLD_LIGHT }} />
            </div>
          </div>
        </motion.div>

        {/* Down arrow 2 */}
        <motion.svg
          width="40"
          height="50"
          viewBox="0 0 40 50"
          fill="none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
        >
          <line x1="20" y1="0" x2="20" y2="38" stroke={GOLD} strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M14 32 L20 42 L26 32" stroke={GOLD} strokeWidth="1.5" fill="none" />
        </motion.svg>
        <p
          className="text-[10px] font-medium italic mb-4 -mt-3"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            color: GOLD_LIGHT,
            fontSize: "13px",
          }}
        >
          owns the
        </p>

        {/* Property */}
        <motion.div
          className="flex items-center gap-3 px-6 py-4"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <HomeIcon size={20} style={{ color: WHITE }} />
          <div>
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "18px",
                color: WHITE,
              }}
            >
              The Property
            </p>
            <p
              className="text-[10.5px] font-medium mt-1"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Held on the SPV&apos;s balance sheet
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SPVConceptCard({ concept, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = concept.icon;

  return (
    <motion.div
      ref={ref}
      className="p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
        position: "relative",
        overflow: "hidden",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div
        className="absolute top-0 left-0 w-8 h-px"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <div
        className="absolute top-0 left-0 w-px h-8"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <div
        className="w-11 h-11 grid place-items-center mb-4"
        style={{
          background: GOLD_DIM,
          border: `1px solid ${GOLD_BORD}`,
          borderRadius: "1px",
        }}
      >
        <Icon size={17} style={{ color: GOLD_LIGHT }} />
      </div>
      <h3
        className="leading-tight mb-2.5"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "22px",
          color: WHITE,
        }}
      >
        {concept.title}
      </h3>
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {concept.body}
      </p>
    </motion.div>
  );
}

function WorkedExample() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="mt-14 max-w-4xl mx-auto p-8 md:p-10 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(201,162,74,0.06), rgba(201,162,74,0.02))`,
        border: `1px solid ${GOLD_BORD}`,
        borderRadius: "1px",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Layers size={12} style={{ color: GOLD_LIGHT }} />
        <p
          className="text-[10px] font-bold tracking-[0.32em] uppercase"
          style={{ color: GOLD_LIGHT }}
        >
          A Worked Example
        </p>
      </div>

      <h3
        className="leading-tight mb-6"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "26px",
          color: WHITE,
        }}
      >
        If you subscribe £5,000 to a £400,000 SPV...
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Your Investment", value: "£5,000", sub: "Across 10 shares at £500 each" },
          { label: "SPV Total Raise", value: "£400,000", sub: "Across 800 shares at £500 each" },
          { label: "Your Ownership", value: "1.25%", sub: "10 shares ÷ 800 total shares" },
        ].map((item) => (
          <div
            key={item.label}
            className="p-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: "1px",
            }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {item.label}
            </p>
            <p
              className="leading-none mb-2"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "32px",
                color: GOLD_LIGHT,
              }}
            >
              {item.value}
            </p>
            <p
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      <p
        className="text-[13.5px] leading-relaxed italic"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          color: "rgba(255,255,255,0.75)",
          fontSize: "16px",
        }}
      >
        &ldquo;You hold 1.25% of the SPV. When the SPV earns rent or sells the
        property, you receive 1.25% of the distributable amount, minus your share
        of costs. Your name is on the cap table. Your share certificate is in
        your vault.&rdquo;
      </p>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3: RISK & RETURNS — scenarios + risks
// ═════════════════════════════════════════════════════════════════════════════
function RiskReturnsSection({ sectionRef }) {
  return (
    <section
      id="risk-returns"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute bottom-0 right-0 opacity-[0.04]"
          width="280"
          height="280"
        >
          <defs>
            <pattern id="rr-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill={NAVY_900} />
            </pattern>
          </defs>
          <rect width="280" height="280" fill="url(#rr-dots)" />
        </svg>
      </div>

      <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        <SectionHeader
          number="03"
          eyebrow="Risk & Returns"
          title="The real numbers,"
          titleAccent="downside included."
          description="Every SPV pack contains three scenarios — base case, downside, and upside — modelled on the same property, the same hold period, and the same rental data. Below is what those typically look like."
        />

        {/* Three scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {SCENARIOS.map((scenario, i) => (
            <ScenarioCard key={scenario.label} scenario={scenario} index={i} />
          ))}
        </div>

        {/* Comparison disclaimer */}
        <motion.div
          className="max-w-3xl mx-auto p-5 mb-12 flex items-start gap-3"
          style={{
            background: WHITE,
            border: `1px solid rgba(10,31,68,0.08)`,
            borderLeft: `3px solid ${INK_DIM}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <AlertTriangle
            size={16}
            style={{ color: INK_MID, flexShrink: 0, marginTop: 2 }}
          />
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: INK_MID }}
          >
            <strong style={{ color: INK }}>These are illustrative ranges,
            not promises.</strong>{" "}
            Each live SPV has its own pack with its own modelled scenarios based
            on the specific property, neighbourhood, and structure. Past
            performance does not guarantee future results.
          </p>
        </motion.div>

        {/* Section header for risks */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AlertTriangle size={14} style={{ color: GOLD_DARK }} />
            <span
              className="text-[11px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_DARK }}
            >
              The Risks We Name
            </span>
          </motion.div>

          <motion.h3
            className="leading-tight mb-8"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "clamp(28px, 4vw, 42px)",
              color: INK,
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            The four risks every investor must{" "}
            <em style={{ color: GOLD_DARK, fontWeight: 400 }}>understand.</em>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RISKS.map((risk, i) => (
              <RiskCard key={risk.title} risk={risk} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScenarioCard({ scenario, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const isBase = scenario.label === "Base Case";

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden h-full flex flex-col"
      style={{
        background: WHITE,
        border: `1px solid ${isBase ? GOLD_BORD : "rgba(10,31,68,0.08)"}`,
        borderRadius: "1px",
        boxShadow: isBase
          ? "0 24px 60px -16px rgba(201,162,74,0.25)"
          : "0 4px 16px -8px rgba(10,31,68,0.08)",
        transform: isBase ? "translateY(-8px)" : "translateY(0)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: isBase ? -8 : 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1 }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: scenario.accent }}
      />

      <div className="p-7 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span
              className="text-[10px] font-bold tracking-[0.24em] uppercase"
              style={{ color: scenario.accent }}
            >
              {scenario.label}
            </span>
            <p
              className="text-[12px] mt-1"
              style={{ color: INK_DIM }}
            >
              {scenario.sub}
            </p>
          </div>
          <span
            className="px-2 py-1 text-[9px] font-bold tracking-[0.18em] uppercase"
            style={{
              background: `${scenario.accent}15`,
              color: scenario.accent,
              borderRadius: "1px",
            }}
          >
            {scenario.likelihood}
          </span>
        </div>

        {/* Three numbers */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div
            className="p-3"
            style={{
              background: CREAM,
              borderRadius: "1px",
            }}
          >
            <p
              className="text-[8.5px] font-bold tracking-[0.14em] uppercase mb-1.5"
              style={{ color: INK_DIM }}
            >
              Annual Yield
            </p>
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "22px",
                color: scenario.accent,
              }}
            >
              {scenario.yield}
            </p>
          </div>
          <div
            className="p-3"
            style={{
              background: CREAM,
              borderRadius: "1px",
            }}
          >
            <p
              className="text-[8.5px] font-bold tracking-[0.14em] uppercase mb-1.5"
              style={{ color: INK_DIM }}
            >
              Capital Δ
            </p>
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "22px",
                color: scenario.accent,
              }}
            >
              {scenario.capital}
            </p>
          </div>
          <div
            className="p-3"
            style={{
              background: CREAM,
              borderRadius: "1px",
            }}
          >
            <p
              className="text-[8.5px] font-bold tracking-[0.14em] uppercase mb-1.5"
              style={{ color: INK_DIM }}
            >
              Total IRR
            </p>
            <p
              className="leading-none"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "22px",
                color: scenario.accent,
              }}
            >
              {scenario.total}
            </p>
          </div>
        </div>

        <p
          className="text-[12.5px] leading-relaxed flex-1"
          style={{ color: INK_MID }}
        >
          {scenario.summary}
        </p>
      </div>
    </motion.div>
  );
}

function RiskCard({ risk, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="p-6 flex gap-4"
      style={{
        background: WHITE,
        border: `1px solid rgba(10,31,68,0.08)`,
        borderRadius: "1px",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className="w-9 h-9 grid place-items-center flex-shrink-0"
        style={{
          background: "rgba(155,44,44,0.08)",
          border: `1px solid rgba(155,44,44,0.2)`,
          borderRadius: "1px",
        }}
      >
        <AlertTriangle size={14} style={{ color: RED }} />
      </div>
      <div>
        <h4
          className="leading-tight mb-2"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "20px",
            color: INK,
          }}
        >
          {risk.title}
        </h4>
        <p
          className="text-[13px] leading-relaxed"
          style={{ color: INK_MID }}
        >
          {risk.body}
        </p>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 4: EXIT STRATEGIES
// ═════════════════════════════════════════════════════════════════════════════
function ExitSection({ sectionRef }) {
  return (
    <section
      id="exit"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: NAVY_950, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none">
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
          number="04"
          eyebrow="Exit Strategies"
          title="Four ways"
          titleAccent="to exit."
          description="Property is illiquid. We don't pretend otherwise. But there are four legitimate paths to capital recovery — clearly defined upfront, with the trade-offs each one carries."
          dark
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXIT_STRATEGIES.map((strategy, i) => (
            <ExitCard key={strategy.title} strategy={strategy} index={i} />
          ))}
        </div>

        {/* Closing FAQ teaser */}
        <motion.div
          className="mt-14 max-w-3xl mx-auto p-8 text-center"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p
            className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3"
            style={{ color: GOLD_LIGHT }}
          >
            Still Have Questions?
          </p>
          <h3
            className="leading-tight mb-6"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "clamp(22px, 3.5vw, 32px)",
              color: WHITE,
            }}
          >
            Read the full investor FAQ, or{" "}
            <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
              speak with our team
            </em>{" "}
            directly.
          </h3>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/education#ftb-status"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200"
              style={{
                backgroundColor: GOLD,
                color: NAVY_900,
                borderRadius: "1px",
                boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
            >
              Read Investor FAQ
              <ArrowUpRight size={12} />
            </Link>
            <Link
              href="/company/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[11.5px] font-bold tracking-[0.12em] uppercase border transition-all duration-200"
              style={{
                color: WHITE,
                borderColor: "rgba(255,255,255,0.22)",
                borderRadius: "1px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD_LIGHT)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")}
            >
              Book a Call
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ExitCard({ strategy, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = strategy.icon;

  return (
    <motion.div
      ref={ref}
      className="p-7 relative overflow-hidden h-full"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <div
        className="absolute top-0 left-0 w-8 h-px"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <div
        className="absolute top-0 left-0 w-px h-8"
        style={{ background: GOLD, opacity: 0.6 }}
      />

      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 grid place-items-center"
          style={{
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORD}`,
            borderRadius: "1px",
          }}
        >
          <Icon size={18} style={{ color: GOLD_LIGHT }} />
        </div>
        <span
          className="px-2.5 py-1 text-[9.5px] font-bold tracking-[0.18em] uppercase"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid rgba(255,255,255,0.1)`,
            color: GOLD_LIGHT,
            borderRadius: "1px",
          }}
        >
          {strategy.timeframe}
        </span>
      </div>

      <h3
        className="leading-tight mb-3"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "26px",
          color: WHITE,
        }}
      >
        {strategy.title}
      </h3>

      <p
        className="text-[13px] leading-relaxed mb-5"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {strategy.description}
      </p>

      <ul
        className="flex flex-col gap-2.5 pt-5"
        style={{ borderTop: `1px solid rgba(255,255,255,0.08)` }}
      >
        {strategy.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 text-[12.5px]"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            <CheckCircle2
              size={12}
              style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 3 }}
            />
            {b}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function HowItWorksPage() {
  const [activeSection, setActiveSection] = useState("process");

  const processRef = useRef(null);
  const coOwnershipRef = useRef(null);
  const riskReturnsRef = useRef(null);
  const exitRef = useRef(null);

  useEffect(() => {
    const sections = [
      { id: "process", el: processRef.current },
      { id: "co-ownership", el: coOwnershipRef.current },
      { id: "risk-returns", el: riskReturnsRef.current },
      { id: "exit", el: exitRef.current },
    ].filter((s) => s.el);

    const onScroll = () => {
      const scrollY = window.scrollY + 250;
      let current = "process";
      for (const s of sections) {
        if (s.el.offsetTop <= scrollY) current = s.id;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main
      style={{
        fontFamily: "var(--font-montserrat), sans-serif",
        backgroundColor: CREAM,
      }}
    >
      <style jsx global>{`
        section[id] {
          scroll-margin-top: 200px;
        }
      `}</style>

      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How Bricks & Wealth Works",
            description:
              "The complete operating manual: process, co-ownership, risk & returns, and exit strategies for Bricks & Wealth investors.",
            step: PROCESS_STEPS.map((step, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: step.label,
              text: step.body,
            })),
          }),
        }}
      />

      <PageHero />
      <SectionNav activeSection={activeSection} />
      <ProcessSection sectionRef={processRef} />
      <CoOwnershipSection sectionRef={coOwnershipRef} />
      <RiskReturnsSection sectionRef={riskReturnsRef} />
      <ExitSection sectionRef={exitRef} />
    </main>
  );
}