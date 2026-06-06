"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRegisterInterest } from "@/components/RegisterInterestModal";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Building2,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  Video,
  Mic,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  TrendingUp,
  Coins,
  Home as HomeIcon,
  PieChart,
  Wrench,
  FileText,
  HelpCircle,
  Quote,
  Globe,
  ArrowDown,
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
const AMBER = "#9A6E1B";

// ─── Section nav config ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: "basics", label: "UK Property Basics", Icon: BookOpen },
  { id: "buy-to-let", label: "Buy-to-Let Explained", Icon: Building2 },
  { id: "ftb-status", label: "First-Time Buyer Status", Icon: ShieldCheck },
  { id: "events", label: "Webinars & Events", Icon: GraduationCap },
];

// ─── UK Property Basics — fundamental concepts ───────────────────────────────
const BASICS_CONCEPTS = [
  {
    icon: HomeIcon,
    title: "Freehold vs Leasehold",
    short: "Two ways to own UK property",
    body: "Freehold means you own the property and the land outright, indefinitely. Leasehold means you own the right to live in the property for a fixed period (often 99–999 years), with the land owned by a freeholder. Most flats in England & Wales are leasehold; most houses are freehold.",
    keyPoint: "B&W typically buys freehold houses or long-leasehold flats with 100+ years remaining.",
  },
  {
    icon: PieChart,
    title: "Yield vs Capital Growth",
    short: "The two ways property earns money",
    body: "Rental yield is the annual rent expressed as a percentage of property value — your income return. Capital growth is the increase in property value over time — your equity return. Total return = yield + capital growth, before costs and tax.",
    keyPoint: "B&W targets 7–11% yield SPVs, with capital growth as a secondary benefit.",
  },
  {
    icon: Coins,
    title: "Stamp Duty & Costs",
    short: "What you actually pay beyond the purchase price",
    body: "Stamp Duty Land Tax (SDLT) applies to most UK property purchases. Rates rise with property value, with surcharges for second homes and overseas buyers. Other costs include legal fees, surveys, and lender fees — typically 3–6% of purchase price in total.",
    keyPoint: "All costs are included in SPV models — you only fund your subscription amount.",
  },
  {
    icon: TrendingUp,
    title: "The UK Property Cycle",
    short: "Why timing the market is harder than time in market",
    body: "UK property has historically risen ~5–7% annually over rolling 10-year periods, with cycles of expansion and correction. Regional variation matters: Manchester, Leeds, and Birmingham have outperformed London since 2017 by significant margins.",
    keyPoint: "B&W focuses on regional growth markets, not London prime — where yield + growth align.",
  },
  {
    icon: Wrench,
    title: "Repairs, Voids & Management",
    short: "The unglamorous costs that erode returns",
    body: "Real-world rental income is always lower than gross rent. Allow ~10% for management fees, ~5% for void periods (empty between tenants), and ~10% for repairs and maintenance. A 12% gross yield often becomes a 7–8% net yield after these.",
    keyPoint: "B&W modelled yields are NET — already adjusted for these realities.",
  },
  {
    icon: FileText,
    title: "Tax on Property Income",
    short: "How rental income and gains are taxed in the UK",
    body: "Rental income from a UK property held in a Limited Company is taxed at corporation tax rates (currently 19–25%). When the SPV sells the property, capital gains are also taxed. Distributions to investors are then dividend income, taxed at your personal rate.",
    keyPoint: "B&W's structure is tax-efficient for company profits, but not advice — speak to your accountant.",
  },
];

// ─── Buy-to-Let topics ──────────────────────────────────────────────────────
const BTL_TOPICS = [
  {
    label: "Strategy",
    title: "What is Buy-to-Let?",
    body: "Buy-to-Let (BTL) is the practice of purchasing residential property specifically to rent out, rather than to live in. It generates rental income (yield) and may appreciate in value (capital growth). It is the most common UK property investment strategy.",
  },
  {
    label: "Yield",
    title: "How yields are calculated",
    body: "Gross yield = annual rent ÷ property value × 100. So a £200,000 property rented at £1,250/month earns £15,000/year — a 7.5% gross yield. Net yield subtracts management, repairs, void costs, and tax — typically 1.5–3 percentage points lower.",
  },
  {
    label: "Tenants",
    title: "Tenant types & risk profiles",
    body: "Professional tenants (single occupancy, AST contracts) offer stability. Family tenants offer the longest tenures. Student lets and HMOs offer higher gross yields but more management complexity. B&W matches tenant strategy to property type and location.",
  },
  {
    label: "Voids",
    title: "Void periods explained",
    body: "A void is a period when the property is empty between tenants. Even a 4-week void per year reduces gross yield by ~8%. Good location, well-maintained property, and competitive pricing minimise voids — and a 5–8% void allowance is built into every B&W model.",
  },
  {
    label: "Management",
    title: "Self-managed vs agency",
    body: "Direct management means dealing with tenants, repairs, and inspections yourself — no fee, but significant time and expertise required. Letting agents charge 8–15% of rent for full management. All B&W SPVs use vetted managing agents — the cost is in the model.",
  },
  {
    label: "Mortgages",
    title: "BTL mortgages & leverage",
    body: "BTL mortgages typically require 25–40% deposit, with higher interest rates than residential mortgages. Most B&W SPVs use ~70% LTV mortgages — the lower the LTV, the lower the risk. Rising rates compress margins, which is why fixed-rate products are preferred.",
  },
];

// ─── FTB Status FAQ ─────────────────────────────────────────────────────────
const FTB_FAQS = [
  {
    q: "If I invest in a B&W SPV, do I lose my UK first-time buyer status?",
    a: "No. You become a shareholder in a Limited Company that owns property — you do not personally own UK property. UK first-time buyer rules under the Stamp Duty Land Tax framework define a first-time buyer as someone who has never owned a residential property in their own name (or jointly), anywhere in the world. Owning shares in a property-holding SPV is not the same as owning property in your name.",
    icon: ShieldCheck,
  },
  {
    q: "What about overseas property I already own — does that affect B&W?",
    a: "Owning property overseas (in your name) does affect your UK first-time buyer eligibility regardless of B&W. If preserving FTB status is critical, speak to an accountant before committing. Investing in B&W SPVs does not, on its own, change your FTB status — but other property holdings might.",
    icon: Globe,
  },
  {
    q: "How is this different from buying a property directly?",
    a: "When you buy property directly, your name appears on HM Land Registry as the legal owner — at which point you cease to be a first-time buyer for SDLT purposes. With a B&W SPV, the SPV company appears on Land Registry. You appear on the SPV's cap table as a shareholder. Different legal positions, different tax treatments.",
    icon: FileText,
  },
  {
    q: "Will Brick & Wealth confirm this in writing?",
    a: "Yes. Every subscription pack includes a structural summary and risk acknowledgement that explains how shareholding differs from direct ownership. We always recommend you have your own legal and tax advisor review your specific situation — and we can refer you to independent solicitors familiar with the B&W structure.",
    icon: CheckCircle2,
  },
  {
    q: "What if I plan to buy my own home in the next 5 years?",
    a: "You can typically continue investing in B&W SPVs alongside saving for your own home purchase. The two are not mutually exclusive. When you eventually buy your own residence, your B&W shareholdings remain in place. Plan with your accountant to ensure timing works for your personal goals.",
    icon: HomeIcon,
  },
];

// ─── Upcoming events ────────────────────────────────────────────────────────
const EVENTS = [
  {
    type: "webinar",
    typeLabel: "Live Webinar",
    title: "Q2 UK Property Outlook 2026",
    presenter: "Marcel Ngogbehei + Independent Surveyor",
    date: "15 May 2026",
    time: "19:00 BST",
    duration: "60 min · Live Q&A",
    spots: "412 registered · Open",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1400&q=85&auto=format&fit=crop",
    tags: ["Market Outlook", "Q&A"],
    icon: Video,
  },
  {
    type: "in-person",
    typeLabel: "In-Person · London",
    title: "Diaspora Investor Roundtable",
    presenter: "By invitation, max 18 attendees",
    date: "22 May 2026",
    time: "18:30 BST",
    duration: "Drinks reception + 90 min",
    spots: "12 / 18 confirmed",
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1400&q=85&auto=format&fit=crop",
    tags: ["Diaspora", "Roundtable"],
    icon: Users,
  },
  {
    type: "webinar",
    typeLabel: "Live Webinar",
    title: "Buy-to-Let Fundamentals for First-Time Investors",
    presenter: "Sarah Akinbiyi, Investor Education Lead",
    date: "5 Jun 2026",
    time: "12:30 BST",
    duration: "45 min + 15 min Q&A",
    spots: "203 registered · Open",
    image:
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1400&q=85&auto=format&fit=crop",
    tags: ["Beginner", "BTL"],
    icon: GraduationCap,
  },
  {
    type: "podcast",
    typeLabel: "Podcast Drop",
    title: "How We Underwrite an SPV — Behind the Scenes",
    presenter: "Marcel Ngogbehei + Investment Committee",
    date: "12 Jun 2026",
    time: "On Demand",
    duration: "38 min episode",
    spots: "Subscribe to receive",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1400&q=85&auto=format&fit=crop",
    tags: ["Audio", "Behind the Scenes"],
    icon: Mic,
  },
];

// ─── Past events archive ────────────────────────────────────────────────────
const PAST_EVENTS = [
  {
    title: "FCA Framework & Investor Protection",
    date: "Apr 2026",
    duration: "52 min",
    views: "1,248",
  },
  {
    title: "HMOs vs Single Lets: Which Strategy Fits You?",
    date: "Mar 2026",
    duration: "61 min",
    views: "892",
  },
  {
    title: "Manchester vs Birmingham: Regional Yield Analysis",
    date: "Feb 2026",
    duration: "44 min",
    views: "1,556",
  },
  {
    title: "Founder AMA: First Year of Brick & Wealth",
    date: "Jan 2026",
    duration: "73 min",
    views: "2,104",
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
              radial-gradient(ellipse 70% 50% at 80% 30%, rgba(201,162,74,0.18) 0%, transparent 60%),
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
        {/* Italic "V" — fifth chapter (after I/II/III on home, IV on how-it-works) */}
        <div
          className="absolute -left-10 top-1/2 -translate-y-1/2 select-none leading-none pointer-events-none"
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
          V
        </div>
        {/* Stylized open-book SVG decoration */}
        <svg
          className="absolute top-20 right-12 opacity-[0.05]"
          width="300"
          height="200"
          viewBox="0 0 300 200"
          fill="none"
        >
          <path
            d="M30 40 Q30 30 40 30 L140 30 Q150 30 150 40 L150 170 Q150 180 140 180 L40 180 Q30 180 30 170 Z"
            stroke={GOLD}
            strokeWidth="1"
          />
          <path
            d="M150 40 Q150 30 160 30 L260 30 Q270 30 270 40 L270 170 Q270 180 260 180 L160 180 Q150 180 150 170 Z"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line x1="50" y1="60" x2="130" y2="60" stroke={GOLD} strokeWidth="0.5" />
          <line x1="50" y1="80" x2="130" y2="80" stroke={GOLD} strokeWidth="0.5" />
          <line x1="50" y1="100" x2="130" y2="100" stroke={GOLD} strokeWidth="0.5" />
          <line x1="170" y1="60" x2="250" y2="60" stroke={GOLD} strokeWidth="0.5" />
          <line x1="170" y1="80" x2="250" y2="80" stroke={GOLD} strokeWidth="0.5" />
          <line x1="170" y1="100" x2="250" y2="100" stroke={GOLD} strokeWidth="0.5" />
        </svg>
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
          <span style={{ color: GOLD_LIGHT }}>Education</span>
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
              <BookOpen size={11} style={{ color: GOLD_LIGHT }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                Education First
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
              Learn{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                before
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
              you commit.
            </motion.h1>

            <motion.p
              className="text-[15px] leading-relaxed max-w-xl"
              style={{ color: "rgba(255,255,255,0.72)", fontWeight: 300 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              UK property investment, in plain English. Concepts explained, jargon
              translated, real numbers shown. The library is open whether you
              eventually invest with us or not.
            </motion.p>
          </div>

          {/* Quick access panel */}
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
              Pick a topic
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
// SECTION HEADER (reusable)
// ═════════════════════════════════════════════════════════════════════════════
function SectionHeader({
  number,
  eyebrow,
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
// SECTION 1: UK PROPERTY BASICS — concept cards
// ═════════════════════════════════════════════════════════════════════════════
function BasicsSection({ sectionRef }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section
      id="basics"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
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
          eyebrow="UK Property Basics"
          title="The fundamentals,"
          titleAccent="in plain English."
          description="Six core concepts every UK property investor should understand — covered without the jargon, with the practical implications spelled out for B&W investors."
        />

        {/* Two-column: list left, content right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8">
          {/* Left — clickable concept list */}
          <div className="flex flex-col gap-2">
            {BASICS_CONCEPTS.map((concept, i) => {
              const Icon = concept.icon;
              const active = activeIdx === i;
              return (
                <motion.button
                  key={concept.title}
                  onClick={() => setActiveIdx(i)}
                  className="text-left relative overflow-hidden flex items-start gap-4 p-5 transition-all duration-300"
                  style={{
                    background: active ? NAVY_900 : WHITE,
                    border: `1px solid ${
                      active ? "transparent" : "rgba(10,31,68,0.08)"
                    }`,
                    borderRadius: "1px",
                    boxShadow: active
                      ? `0 16px 40px -12px rgba(10,31,68,0.25), 0 0 0 1px ${GOLD_BORD}`
                      : "0 2px 8px -4px rgba(10,31,68,0.06)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  {/* Number stripe */}
                  <span
                    className="text-[11px] font-extrabold tracking-[0.24em] flex-shrink-0 mt-1"
                    style={{ color: active ? GOLD_LIGHT : INK_DIM }}
                  >
                    0{i + 1}
                  </span>
                  <div
                    className="w-9 h-9 grid place-items-center flex-shrink-0"
                    style={{
                      background: active
                        ? "rgba(201,162,74,0.18)"
                        : GOLD_DIM,
                      border: `1px solid ${GOLD_BORD}`,
                      borderRadius: "1px",
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: active ? GOLD_LIGHT : GOLD_DARK }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="leading-tight mb-1"
                      style={{
                        fontFamily: "var(--font-cormorant), serif",
                        fontWeight: 500,
                        fontSize: "18px",
                        color: active ? WHITE : INK,
                      }}
                    >
                      {concept.title}
                    </p>
                    <p
                      className="text-[11.5px] leading-snug"
                      style={{
                        color: active
                          ? "rgba(255,255,255,0.6)"
                          : INK_DIM,
                      }}
                    >
                      {concept.short}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{
                      color: active ? GOLD_LIGHT : INK_DIM,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                    className={active ? "translate-x-0.5" : ""}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Right — active concept detail */}
          <div className="lg:sticky lg:top-[220px] h-fit">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                className="p-8 md:p-10 relative overflow-hidden"
                style={{
                  background: WHITE,
                  border: `1px solid rgba(10,31,68,0.08)`,
                  borderTop: `3px solid ${GOLD}`,
                  borderRadius: "1px",
                  boxShadow: "0 16px 48px -16px rgba(10,31,68,0.15)",
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Gold corner */}
                <div
                  className="absolute top-0 right-0 w-12 h-12"
                  style={{
                    background: `linear-gradient(225deg, ${GOLD_DIM}, transparent 70%)`,
                  }}
                />
                <div className="flex items-center gap-2 mb-3 relative">
                  <span
                    className="text-[10px] font-bold tracking-[0.24em] uppercase"
                    style={{ color: GOLD_DARK }}
                  >
                    Concept {String(activeIdx + 1).padStart(2, "0")} ·{" "}
                    {BASICS_CONCEPTS[activeIdx].title}
                  </span>
                </div>

                <h3
                  className="leading-tight mb-5 relative"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "clamp(26px, 3.4vw, 36px)",
                    color: INK,
                  }}
                >
                  {BASICS_CONCEPTS[activeIdx].short}.
                </h3>

                <p
                  className="text-[14px] leading-[1.78] mb-6 relative"
                  style={{ color: INK_MID, fontWeight: 300 }}
                >
                  {BASICS_CONCEPTS[activeIdx].body}
                </p>

                {/* Key point callout */}
                <div
                  className="p-4 flex items-start gap-3 relative"
                  style={{
                    background: GOLD_DIM,
                    border: `1px solid ${GOLD_BORD}`,
                    borderLeft: `3px solid ${GOLD}`,
                    borderRadius: "1px",
                  }}
                >
                  <Sparkles
                    size={14}
                    style={{ color: GOLD_DARK, flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5"
                      style={{ color: GOLD_DARK }}
                    >
                      How this applies at B&amp;W
                    </p>
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: INK }}
                    >
                      {BASICS_CONCEPTS[activeIdx].keyPoint}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2: BUY-TO-LET — magazine-style topic grid
// ═════════════════════════════════════════════════════════════════════════════
function BuyToLetSection({ sectionRef }) {
  return (
    <section
      id="buy-to-let"
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
          eyebrow="Buy-to-Let Explained"
          title="Yields, voids,"
          titleAccent="and management."
          description="The actual mechanics of UK Buy-to-Let investment — how yields are calculated, why net yields differ from gross, and what the real costs of property management look like."
          dark
        />

        {/* Featured intro card */}
        <motion.div
          className="mb-10 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-0 overflow-hidden"
          style={{
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="relative h-64 lg:h-auto overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${NAVY_700}, ${NAVY_800})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=85&auto=format&fit=crop"
              alt="UK Buy-to-Let property"
              className="w-full h-full object-cover"
              style={{ filter: "saturate(0.85)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,31,68,0.5) 0%, rgba(6,20,47,0.65) 100%)",
              }}
            />
            {/* Stat overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <p
                className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2"
                style={{ color: GOLD_LIGHT }}
              >
                Average UK BTL Yield
              </p>
              <p
                className="leading-none mb-1"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "60px",
                  color: WHITE,
                }}
              >
                7.4
                <span style={{ color: GOLD_LIGHT, fontSize: "44px" }}>%</span>
              </p>
              <p
                className="text-[11.5px] font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Regional average · 2026 (gross)
              </p>
            </div>
          </div>

          <div
            className="p-8 md:p-10 flex flex-col justify-center"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3"
              style={{ color: GOLD_LIGHT }}
            >
              What you&apos;ll learn here
            </p>
            <h3
              className="leading-tight mb-5"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "28px",
                color: WHITE,
              }}
            >
              The complete picture of how a Buy-to-Let actually generates returns —{" "}
              <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                with the unglamorous parts included.
              </em>
            </h3>
            <p
              className="text-[13.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Most BTL marketing focuses on gross yield. We focus on net yield —
              what you actually take home after management, voids, and repairs.
              The difference is significant, and understanding it is the
              difference between investing well and being surprised.
            </p>
          </div>
        </motion.div>

        {/* Topic grid — magazine layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BTL_TOPICS.map((topic, i) => (
            <BTLTopicCard key={topic.label} topic={topic} index={i} />
          ))}
        </div>

        {/* Net yield example callout */}
        <motion.div
          className="mt-12 max-w-4xl mx-auto p-8 md:p-10 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(201,162,74,0.06), rgba(201,162,74,0.02))`,
            border: `1px solid ${GOLD_BORD}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={12} style={{ color: GOLD_LIGHT }} />
            <p
              className="text-[10px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_LIGHT }}
            >
              Gross vs Net Yield · A Worked Example
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
            A £200,000 property at £1,250/month rent...
          </h3>

          {/* Yield breakdown */}
          <div className="space-y-3 mb-6">
            {[
              { label: "Annual gross rent", value: "£15,000", calc: "£1,250 × 12 months" },
              {
                label: "− Management fee (10%)",
                value: "−£1,500",
                calc: "Vetted UK letting agent",
                negative: true,
              },
              {
                label: "− Repairs & maintenance",
                value: "−£1,200",
                calc: "~8% of annual rent",
                negative: true,
              },
              {
                label: "− Void allowance",
                value: "−£625",
                calc: "5% — ~2.5 weeks/yr",
                negative: true,
              },
              {
                label: "− Insurance & compliance",
                value: "−£400",
                calc: "Buildings + landlord cover",
                negative: true,
              },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3"
                style={{
                  borderBottom: `1px dashed rgba(255,255,255,0.08)`,
                }}
              >
                <div className="flex-1">
                  <p
                    className="text-[12.5px] font-semibold"
                    style={{
                      color: row.negative ? "rgba(255,255,255,0.7)" : WHITE,
                    }}
                  >
                    {row.label}
                  </p>
                  <p
                    className="text-[10.5px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {row.calc}
                  </p>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "20px",
                    color: row.negative
                      ? "rgba(255,255,255,0.55)"
                      : WHITE,
                  }}
                >
                  {row.value}
                </p>
              </div>
            ))}

            {/* Net result */}
            <div
              className="flex items-center justify-between gap-4 pt-5 mt-3"
              style={{ borderTop: `2px solid ${GOLD}` }}
            >
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
                  style={{ color: GOLD_LIGHT }}
                >
                  Net Annual Income
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Net yield: <strong style={{ color: GOLD_LIGHT }}>5.6%</strong>{" "}
                  · Gross was 7.5%
                </p>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "32px",
                  color: GOLD_LIGHT,
                }}
              >
                £11,275
              </p>
            </div>
          </div>

          <p
            className="text-[12.5px] italic leading-relaxed pt-4"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "15px",
              borderTop: `1px solid rgba(255,255,255,0.08)`,
            }}
          >
            &ldquo;This is why every B&amp;W projection uses{" "}
            <strong style={{ color: GOLD_LIGHT, fontStyle: "normal" }}>
              net yield
            </strong>
            , not gross. We model the whole picture — including the
            unglamorous bits.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function BTLTopicCard({ topic, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.article
      ref={ref}
      className="p-6 relative overflow-hidden h-full"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <div
        className="absolute top-0 left-0 w-8 h-px"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <div
        className="absolute top-0 left-0 w-px h-8"
        style={{ background: GOLD, opacity: 0.6 }}
      />

      <span
        className="inline-block px-2.5 py-1 text-[9.5px] font-bold tracking-[0.18em] uppercase mb-4"
        style={{
          background: GOLD_DIM,
          border: `1px solid ${GOLD_BORD}`,
          color: GOLD_LIGHT,
          borderRadius: "1px",
        }}
      >
        {topic.label}
      </span>
      <h3
        className="leading-tight mb-3"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "22px",
          color: WHITE,
        }}
      >
        {topic.title}
      </h3>
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {topic.body}
      </p>
    </motion.article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3: FIRST-TIME BUYER STATUS — Q&A accordion
// ═════════════════════════════════════════════════════════════════════════════
function FTBSection({ sectionRef }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section
      id="ftb-status"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute -bottom-16 -right-16 opacity-[0.04]"
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
          number="03"
          eyebrow="First-Time Buyer Status"
          title="Invest without losing"
          titleAccent="your eligibility."
          description="The most-asked question we get from younger investors and the diaspora community. Here's how the legal structure protects your UK first-time buyer status, with the sources that back it up."
        />

        {/* Trust banner — the central claim */}
        <motion.div
          className="max-w-4xl mx-auto mb-12 p-7 md:p-9 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${NAVY_900}, ${NAVY_700})`,
            border: `1px solid ${GOLD_BORD}`,
            borderLeft: `4px solid ${GOLD}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 opacity-[0.12] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
            }}
          />
          <div className="flex items-start gap-5 relative">
            <div
              className="w-14 h-14 grid place-items-center flex-shrink-0"
              style={{
                background: "rgba(201,162,74,0.18)",
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <ShieldCheck size={22} style={{ color: GOLD_LIGHT }} />
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold tracking-[0.28em] uppercase mb-3"
                style={{ color: GOLD_LIGHT }}
              >
                The Headline Answer
              </p>
              <h3
                className="leading-tight mb-4"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "clamp(22px, 3.2vw, 30px)",
                  color: WHITE,
                }}
              >
                Investing in a B&amp;W SPV does{" "}
                <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                  not affect
                </em>{" "}
                your UK first-time buyer status.
              </h3>
              <p
                className="text-[13.5px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                You become a shareholder in a Limited Company that owns property —
                not the legal owner of property in your personal name. HM Land
                Registry shows the SPV as owner; you remain a first-time buyer
                for SDLT purposes. Always verify with your own accountant or
                solicitor for your specific circumstances.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle size={14} style={{ color: GOLD_DARK }} />
            <p
              className="text-[10.5px] font-bold tracking-[0.28em] uppercase"
              style={{ color: GOLD_DARK }}
            >
              The Five Questions We&apos;re Asked Most
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FTB_FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>

          {/* Disclaimer */}
          <motion.div
            className="mt-10 p-5 flex items-start gap-3"
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
              size={14}
              style={{ color: AMBER, flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p
                className="text-[12.5px] leading-relaxed"
                style={{ color: INK_MID }}
              >
                <strong style={{ color: INK }}>
                  This is not personal tax or legal advice.
                </strong>{" "}
                The information here reflects our understanding of HMRC rules
                and the SDLT framework as of 2026. Your situation may differ.
                Always confirm with an independent accountant or solicitor
                before making investment decisions. We&apos;re happy to refer
                you to advisors familiar with the B&amp;W structure.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, index, isOpen, onToggle }) {
  const Icon = faq.icon;
  return (
    <motion.div
      className="overflow-hidden"
      style={{
        background: WHITE,
        border: `1px solid ${isOpen ? GOLD_BORD : "rgba(10,31,68,0.08)"}`,
        borderLeft: `3px solid ${isOpen ? GOLD : "transparent"}`,
        borderRadius: "1px",
        boxShadow: isOpen
          ? "0 12px 32px -12px rgba(10,31,68,0.15)"
          : "0 2px 8px -4px rgba(10,31,68,0.05)",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-5 md:p-6 flex items-start gap-4 transition-colors"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        aria-expanded={isOpen}
      >
        <div
          className="w-9 h-9 grid place-items-center flex-shrink-0 transition-colors"
          style={{
            background: isOpen ? GOLD_DIM : CREAM,
            border: `1px solid ${isOpen ? GOLD_BORD : "rgba(10,31,68,0.08)"}`,
            borderRadius: "1px",
          }}
        >
          <Icon size={14} style={{ color: GOLD_DARK }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="leading-tight"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "20px",
              color: INK,
            }}
          >
            {faq.q}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="flex-shrink-0 transition-transform duration-300 mt-1"
          style={{
            color: isOpen ? GOLD_DARK : INK_DIM,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 md:px-6 pb-6 ml-[52px]"
              style={{ borderTop: `1px dashed rgba(10,31,68,0.08)`, paddingTop: 16 }}
            >
              <p
                className="text-[13.5px] leading-[1.78]"
                style={{ color: INK_MID }}
              >
                {faq.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 4: WEBINARS & EVENTS
// ═════════════════════════════════════════════════════════════════════════════
function EventsSection({ sectionRef }) {
  const { open: openRegisterInterest } = useRegisterInterest();
  return (
    <section
      id="events"
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
          eyebrow="Webinars & Events"
          title="Live sessions"
          titleAccent="with our team."
          description="Investor briefings, market outlooks, and educational sessions — most are open to the waitlist, some are by invitation only. Recordings of past sessions are available on demand."
          dark
        />

        {/* Event cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {EVENTS.map((event, i) => (
            <EventCard key={event.title} event={event} index={i} />
          ))}
        </div>

        {/* Past events archive */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <PlayCircle size={14} style={{ color: GOLD_LIGHT }} />
            <span
              className="text-[11px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_LIGHT }}
            >
              On-Demand · Past Sessions
            </span>
          </motion.div>

          <motion.h3
            className="leading-tight mb-8"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "clamp(28px, 4vw, 42px)",
              color: WHITE,
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Catch up on{" "}
            <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
              what you missed.
            </em>
          </motion.h3>

          <div className="flex flex-col gap-2">
            {PAST_EVENTS.map((event, i) => (
              <PastEventRow key={event.title} event={event} index={i} />
            ))}
          </div>
        </div>

        {/* Newsletter signup CTA */}
        <motion.div
          className="mt-14 max-w-3xl mx-auto p-8 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 opacity-[0.10] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
            }}
          />
          <p
            className="text-[10.5px] font-bold tracking-[0.32em] uppercase mb-3"
            style={{ color: GOLD_LIGHT }}
          >
            Never Miss a Session
          </p>
          <h3
            className="leading-tight mb-6"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "clamp(24px, 3.5vw, 36px)",
              color: WHITE,
            }}
          >
            Get event invites delivered to{" "}
            <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
              your inbox.
            </em>
          </h3>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => openRegisterInterest("education-events")}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer"
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
              Join Event Waitlist
              <ArrowUpRight size={12} />
            </button>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-[11.5px] font-bold tracking-[0.12em] uppercase border transition-all duration-200"
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
              Browse Insights
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EventCard({ event, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = event.icon;
  const isInvitationOnly = event.type === "in-person";

  return (
    <motion.article
      ref={ref}
      className="overflow-hidden flex flex-col h-full group"
      style={{
        background: NAVY_800,
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.08 }}
      whileHover={{ y: -4, borderColor: GOLD_BORD }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "saturate(0.85) brightness(0.7)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(6,20,47,0.85) 0%, rgba(10,31,68,0.3) 60%, transparent 100%)",
          }}
        />

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-white"
              style={{
                backgroundColor: isInvitationOnly ? GOLD_DARK : NAVY_700,
                borderRadius: "1px",
              }}
            >
              <Icon size={10} />
              {event.typeLabel}
            </span>
          </div>
          {event.type === "webinar" && (
            <motion.span
              className="flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.16em] uppercase"
              style={{ color: "#86efac" }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#86efac" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Live
            </motion.span>
          )}
        </div>

        {/* Date stamp */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div
            className="px-3 py-1.5 flex items-center gap-2"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: "1px",
            }}
          >
            <Calendar size={11} style={{ color: NAVY_900 }} />
            <span
              className="text-[10.5px] font-extrabold tracking-[0.14em] uppercase"
              style={{ color: NAVY_900 }}
            >
              {event.date} · {event.time}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9.5px] font-bold tracking-[0.18em] uppercase px-2 py-0.5"
              style={{
                color: GOLD_LIGHT,
                background: GOLD_DIM,
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h3
          className="leading-tight mb-3"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontSize: "24px",
            color: WHITE,
          }}
        >
          {event.title}
        </h3>

        <p
          className="text-[12.5px] leading-relaxed mb-5 flex-1"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {event.presenter}
        </p>

        {/* Footer info row */}
        <div
          className="pt-4 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid rgba(255,255,255,0.08)` }}
        >
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span className="flex items-center gap-1.5">
              <Clock size={10} style={{ color: GOLD_LIGHT }} />
              {event.duration}
            </span>
          </div>
          <span
            className="text-[10.5px] font-bold tracking-[0.12em] uppercase"
            style={{ color: GOLD_LIGHT }}
          >
            {event.spots}
          </span>
        </div>

        <Link
          href="/events/register"
          className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200"
          style={{
            backgroundColor: isInvitationOnly ? "transparent" : GOLD,
            color: isInvitationOnly ? GOLD_LIGHT : NAVY_900,
            border: `1px solid ${isInvitationOnly ? GOLD_BORD : GOLD}`,
            borderRadius: "1px",
          }}
          onMouseEnter={(e) => {
            if (!isInvitationOnly) {
              e.currentTarget.style.backgroundColor = GOLD_LIGHT;
            }
          }}
          onMouseLeave={(e) => {
            if (!isInvitationOnly) {
              e.currentTarget.style.backgroundColor = GOLD;
            }
          }}
        >
          {isInvitationOnly ? "Request Invitation" : "Register Free"}
          <ArrowUpRight size={11} />
        </Link>
      </div>
    </motion.article>
  );
}

function PastEventRow({ event, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-between gap-4 p-5 transition-all duration-200 group cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
      }}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{
        borderColor: GOLD_BORD,
        background: "rgba(201,162,74,0.05)",
        x: 4,
      }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-10 h-10 grid place-items-center flex-shrink-0"
          style={{
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORD}`,
            borderRadius: "1px",
          }}
        >
          <PlayCircle size={16} style={{ color: GOLD_LIGHT }} />
        </div>
        <div className="min-w-0">
          <p
            className="leading-tight mb-1 truncate"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "18px",
              color: WHITE,
            }}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-3 text-[10.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>{event.date}</span>
            <span>·</span>
            <span>{event.duration}</span>
            <span>·</span>
            <span>{event.views} views</span>
          </div>
        </div>
      </div>
      <ArrowUpRight
        size={14}
        style={{ color: GOLD_LIGHT }}
        className="flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function EducationPage() {
  const [activeSection, setActiveSection] = useState("basics");

  const basicsRef = useRef(null);
  const btlRef = useRef(null);
  const ftbRef = useRef(null);
  const eventsRef = useRef(null);

  useEffect(() => {
    const sections = [
      { id: "basics", el: basicsRef.current },
      { id: "buy-to-let", el: btlRef.current },
      { id: "ftb-status", el: ftbRef.current },
      { id: "events", el: eventsRef.current },
    ].filter((s) => s.el);

    const onScroll = () => {
      const scrollY = window.scrollY + 250;
      let current = "basics";
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

      {/* SEO Schema — FAQPage for FTB section */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FTB_FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />

      <PageHero />
      <SectionNav activeSection={activeSection} />
      <BasicsSection sectionRef={basicsRef} />
      <BuyToLetSection sectionRef={btlRef} />
      <FTBSection sectionRef={ftbRef} />
      <EventsSection sectionRef={eventsRef} />
    </main>
  );
}