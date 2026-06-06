"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Briefcase,
  ShieldCheck,
  MessageSquare,
  Quote,
  Building2,
  FileCheck,
  Lock,
  Eye,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  FileText,
  Download,
  Linkedin,
  Globe,
  Target,
  Scale,
  Heart,
  Compass,
  Send,
  Clock,
} from "lucide-react";
import { FaWhatsapp, FaXTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa6";
import mr_marcel from "@/assets/Mr Marcel.jpg";

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

// ─── Section nav ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "about", label: "About Brick & Wealth", Icon: Briefcase },
  { id: "compliance", label: "Compliance & FCA", Icon: ShieldCheck },
  { id: "contact", label: "Contact & Book a Call", Icon: MessageSquare },
];

// ─── About: company values ───────────────────────────────────────────────────
const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    body: "Every fee, every risk, every assumption — disclosed upfront. The investor pack you sign is the document we operate by, with no hidden carve-outs.",
  },
  {
    icon: Scale,
    title: "Alignment",
    body: "The founder co-invests in every SPV under the same terms as our investors. We earn when you earn, and we lose when you lose.",
  },
  {
    icon: Compass,
    title: "Patience",
    body: "Property is a long-duration asset and we treat it that way. No quarterly hype cycles, no chasing momentum — only deliberate, considered investments.",
  },
  {
    icon: Heart,
    title: "Education-first",
    body: "We'd rather you understand what you're investing in than rush to invest. Our library, webinars, and 1-to-1 onboarding all exist for this reason.",
  },
];

// ─── About: company milestones ───────────────────────────────────────────────
const MILESTONES = [
  {
    year: "2024",
    label: "Conception",
    title: "The idea takes shape",
    body: "After years advising HNW clients on UK property structures, Marcel begins designing a platform that makes professional-grade SPV co-investment accessible from £500.",
  },
  {
    year: "2025",
    label: "Foundation",
    title: "Brick & Wealth Holdings Ltd is incorporated",
    body: "Companies House registration. Legal counsel engaged. Compliance framework drafted to FCA-aligned standards. First investor advisory board convened.",
  },
  {
    year: "2026",
    label: "Launch",
    title: "First SPVs go live",
    body: "Platform opens to invitation-only investors. SPV-001 (Manchester HMO) closes oversubscribed within 14 days. By Q2, twelve live SPVs across Manchester, Birmingham, Leeds, and London.",
  },
  {
    year: "Today",
    label: "Where we are",
    title: "240+ investors. 12 live SPVs. £8.4M+ raised.",
    body: "Education-first. FCA-aligned. Independently audited. Building the most trusted private property co-investment platform in the UK — one ring-fenced SPV at a time.",
  },
];

// ─── Compliance pillars ─────────────────────────────────────────────────────
const COMPLIANCE_PILLARS = [
  {
    icon: ShieldCheck,
    title: "FCA Framework",
    short: "Operating to UK regulatory standards",
    body: "Brick & Wealth operates under the Financial Conduct Authority's framework for sophisticated and high-net-worth investors. Every investor self-certifies before accessing live opportunities.",
    documents: [
      "Investor self-certification process",
      "Promotional restrictions policy",
      "Risk warning standards",
    ],
  },
  {
    icon: Lock,
    title: "AML & KYC",
    short: "Anti-money-laundering compliance",
    body: "Every investor completes identity verification, proof of address, and source-of-funds checks before subscription. Our procedures align with the UK Money Laundering Regulations 2017.",
    documents: [
      "ID & proof of address verification",
      "Source of funds documentation",
      "PEP & sanctions screening",
    ],
  },
  {
    icon: Building2,
    title: "Companies House",
    short: "Every SPV legally registered",
    body: "Every Special Purpose Vehicle is registered at Companies House as a UK Limited Company with its own filing history, director records, and statutory accounts publicly searchable.",
    documents: [
      "Certificate of Incorporation (per SPV)",
      "Annual filings & confirmation statements",
      "Director & shareholder records",
    ],
  },
  {
    icon: FileCheck,
    title: "Independent Audit",
    short: "Third-party verification",
    body: "Our SPVs are reviewed annually by an independent UK audit firm. Investor reporting is generated from audited records, not internal estimates. The full audit trail is investor-accessible.",
    documents: [
      "Annual SPV accounts",
      "Independent auditor reports",
      "Quarterly investor statements",
    ],
  },
  {
    icon: FileText,
    title: "GDPR & Data",
    short: "Investor data protection",
    body: "We comply with UK GDPR and the Data Protection Act 2018. All investor documents are encrypted at rest and in transit, with access logs maintained for every dashboard interaction.",
    documents: [
      "Privacy policy & data processing",
      "Encrypted document vault",
      "Right-to-access procedures",
    ],
  },
  {
    icon: Scale,
    title: "Legal Reviews",
    short: "Independent counsel per SPV",
    body: "Every SPV's structure, subscription pack, and shareholders' agreement is reviewed by independent UK legal counsel before listing. We don't draft and approve our own documents.",
    documents: [
      "Subscription agreement template",
      "Shareholders' agreement",
      "Legal opinion per SPV",
    ],
  },
];

// ─── Compliance documents to download ───────────────────────────────────────
const COMPLIANCE_DOCS = [
  {
    title: "Risk Warning & Investor Self-Certification",
    description: "The standard FCA-aligned acknowledgement every investor signs",
    fileSize: "PDF · 2 pages",
  },
  {
    title: "Compliance & Regulatory Brief",
    description: "Full overview of our regulatory framework and operating standards",
    fileSize: "PDF · 12 pages",
  },
  {
    title: "Sample Subscription Pack",
    description: "What an SPV subscription document looks like — fully redacted example",
    fileSize: "PDF · 24 pages",
  },
  {
    title: "AML & KYC Policy Summary",
    description: "How we verify investor identity and source of funds",
    fileSize: "PDF · 6 pages",
  },
];

// ─── Contact methods ────────────────────────────────────────────────────────
const CONTACT_METHODS = [
  {
    icon: Calendar,
    title: "Book a Discovery Call",
    short: "30 minutes · No commitment",
    body: "The fastest way to understand if Brick & Wealth fits your investment goals. Speak directly with our investor team — no sales pressure, just a conversation.",
    cta: "Schedule a Call",
    ctaHref: "/company/contact#contact-form",
    accent: GOLD,
  },
  {
    icon: Mail,
    title: "Send Us a Message",
    short: "Reply within 24 hours",
    body: "For specific questions about an opportunity, our structure, or your circumstances. Our team reviews every message personally — no chatbots, no auto-responders.",
    cta: "Email investors@",
    ctaHref: "mailto:investors@brickandwealth.com",
    accent: NAVY_700,
  },
  {
    icon: Phone,
    title: "Call Our Office",
    short: "Mon–Fri · 09:00–18:00 GMT",
    body: "For time-sensitive matters or if you'd prefer a phone conversation. Our investor line is staffed by our team directly — no call centres, no scripts.",
    cta: "+44 (0) 20 1234 5678",
    ctaHref: "tel:+442012345678",
    accent: GREEN,
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
              radial-gradient(ellipse 70% 50% at 30% 20%, rgba(201,162,74,0.20) 0%, transparent 60%),
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
        {/* Italic ghost "VI" — sixth chapter (after I/II/III on home, IV on how-it-works, V on education) */}
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
          VI
        </div>
        {/* Stacked-brick logomark */}
        <svg
          className="absolute -top-20 left-12 opacity-[0.06]"
          width="380"
          height="380"
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
          <span style={{ color: GOLD_LIGHT }}>Company</span>
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
              <Briefcase size={11} style={{ color: GOLD_LIGHT }} />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                Brick &amp; Wealth Holdings Ltd
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
              Who we are.{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                How we operate
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
              .
            </motion.h1>

            <motion.p
              className="text-[15px] leading-relaxed max-w-xl"
              style={{ color: "rgba(255,255,255,0.72)", fontWeight: 300 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              The founder story, the regulatory framework, and the direct line
              to our team. No marketing department in the middle. No outsourced
              call centre. Just the company, transparently.
            </motion.p>
          </div>

          {/* Quick navigation panel */}
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
              Jump to
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
                  border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.12)"}`,
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
function SectionHeader({ number, eyebrow, title, titleAccent, description, dark = false }) {
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
// SECTION 1: ABOUT — Founder story, mission, values, timeline
// ═════════════════════════════════════════════════════════════════════════════
function AboutSection({ sectionRef }) {
  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute -bottom-16 -left-16 opacity-[0.04]"
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
          eyebrow="About Brick & Wealth"
          title="The founder story"
          titleAccent="& vision."
          description="Why Marcel started Brick & Wealth, what we believe about UK property, and the four values that govern every decision we make on behalf of investors."
        />

        {/* Founder feature block */}
        <FounderFeature />

        {/* Values grid */}
        <div className="mt-20">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Target size={14} style={{ color: GOLD_DARK }} />
            <p
              className="text-[10.5px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_DARK }}
            >
              Our Four Values
            </p>
          </motion.div>

          <motion.h3
            className="leading-tight mb-10"
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
            What we{" "}
            <em style={{ color: GOLD_DARK, fontWeight: 400 }}>actually</em>{" "}
            believe.
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUES.map((value, i) => (
              <ValueCard key={value.title} value={value} index={i} />
            ))}
          </div>
        </div>

        {/* Company timeline */}
        <div className="mt-20">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Clock size={14} style={{ color: GOLD_DARK }} />
            <p
              className="text-[10.5px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_DARK }}
            >
              Company Timeline
            </p>
          </motion.div>

          <motion.h3
            className="leading-tight mb-12"
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
            From idea to{" "}
            <em style={{ color: GOLD_DARK, fontWeight: 400 }}>
              twelve live SPVs.
            </em>
          </motion.h3>

          {/* Horizontal timeline */}
          <div className="relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-12 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD_BORD}, ${GOLD}, ${GOLD_BORD}, transparent)`,
              }}
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
              {MILESTONES.map((m, i) => (
                <MilestoneCard key={m.year} milestone={m} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderFeature() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-0 overflow-hidden"
      style={{
        border: `1px solid rgba(10,31,68,0.08)`,
        background: WHITE,
        borderRadius: "1px",
        boxShadow: "0 24px 60px -20px rgba(10,31,68,0.18)",
      }}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
    >
      {/* Left — founder image (placeholder) */}
      <div
        className="relative h-72 lg:h-auto overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${NAVY_900}, ${NAVY_700})`,
        }}
      >
        <Image
          src={mr_marcel}
          alt="Marcel Ngogbehei, Founder of Brick & Wealth"
          fill
          className="object-cover"
          style={{ filter: "saturate(0.85)" }}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(6,20,47,0.7) 0%, transparent 40%)",
          }}
        />
        {/* Name plate overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <p
            className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2"
            style={{ color: GOLD_LIGHT }}
          >
            Founder &amp; CEO
          </p>
          <p
            className="leading-tight mb-1"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "32px",
              color: WHITE,
            }}
          >
            Marcel Ngogbehei
          </p>
          <div className="flex items-center gap-3 mt-3">
            <a
              href="https://linkedin.com/in/marcelngogbehei"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 grid place-items-center transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: `1px solid rgba(255,255,255,0.18)`,
                borderRadius: "1px",
                color: WHITE,
              }}
              aria-label="Marcel on LinkedIn"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = GOLD_DIM;
                e.currentTarget.style.borderColor = GOLD_BORD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              }}
            >
              <FaLinkedinIn size={12} />
            </a>
            <a
              href="https://x.com/marcelngogbehei"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 grid place-items-center transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: `1px solid rgba(255,255,255,0.18)`,
                borderRadius: "1px",
                color: WHITE,
              }}
              aria-label="Marcel on X"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = GOLD_DIM;
                e.currentTarget.style.borderColor = GOLD_BORD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              }}
            >
              <FaXTwitter size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Right — story */}
      <div className="p-8 md:p-12 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-4">
          <Quote size={14} style={{ color: GOLD_DARK }} />
          <p
            className="text-[10.5px] font-bold tracking-[0.28em] uppercase"
            style={{ color: GOLD_DARK }}
          >
            From the Founder
          </p>
        </div>

        {/* Pull quote */}
        <p
          className="leading-tight mb-6"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(22px, 2.8vw, 32px)",
            color: INK,
            letterSpacing: "-0.005em",
          }}
        >
          &ldquo;Property investment shouldn&apos;t be the privilege of those who
          already have wealth. With the right{" "}
          <span style={{ color: GOLD_DARK }}>structure</span>, the right{" "}
          <span style={{ color: GOLD_DARK }}>education</span>, and the right{" "}
          <span style={{ color: GOLD_DARK }}>oversight</span> — it can be the
          quiet path that builds it.&rdquo;
        </p>

        <p
          className="text-[13.5px] leading-[1.78] mb-4"
          style={{ color: INK_MID, fontWeight: 300 }}
        >
          Marcel spent over a decade advising HNW clients and family offices on
          UK property structures — and watched, year after year, as the same
          opportunities that compound institutional wealth remained completely
          inaccessible to ordinary investors with £500–£25,000 to deploy.
        </p>

        <p
          className="text-[13.5px] leading-[1.78] mb-6"
          style={{ color: INK_MID, fontWeight: 300 }}
        >
          Brick &amp; Wealth was built to bridge that gap — not by reinventing
          property investment, but by making the same structures used by
          institutions accessible to invited individuals, in plain English,
          with FCA-aligned compliance and full documentation at every step.
        </p>
      </div>
    </motion.div>
  );
}

function ValueCard({ value, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = value.icon;

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden p-7"
      style={{
        background: WHITE,
        border: `1px solid rgba(10,31,68,0.08)`,
        borderRadius: "1px",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      whileHover={{
        borderColor: GOLD_BORD,
        boxShadow: "0 16px 40px -16px rgba(10,31,68,0.15)",
        y: -3,
      }}
    >
      <div
        className="absolute top-0 left-0 w-8 h-px"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <div
        className="absolute top-0 left-0 w-px h-8"
        style={{ background: GOLD, opacity: 0.6 }}
      />

      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 grid place-items-center flex-shrink-0"
          style={{
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORD}`,
            borderRadius: "1px",
          }}
        >
          <Icon size={18} style={{ color: GOLD_DARK }} />
        </div>
        <div className="flex-1">
          <h4
            className="leading-tight mb-2"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "24px",
              color: INK,
            }}
          >
            {value.title}
          </h4>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: INK_MID }}
          >
            {value.body}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function MilestoneCard({ milestone, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const isLatest = milestone.year === "Today";

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Year disc */}
      <div className="relative z-10 mb-5">
        <div
          className="w-24 h-24 grid place-items-center"
          style={{
            background: isLatest ? NAVY_900 : WHITE,
            border: `2px solid ${GOLD}`,
            borderRadius: "50%",
            boxShadow: isLatest
              ? "0 12px 32px -8px rgba(10,31,68,0.3)"
              : "0 8px 24px -8px rgba(201,162,74,0.4)",
          }}
        >
          <p
            className="leading-none"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: milestone.year === "Today" ? "20px" : "26px",
              color: isLatest ? GOLD_LIGHT : NAVY_900,
            }}
          >
            {milestone.year}
          </p>
        </div>
      </div>

      <span
        className="text-[10px] font-bold tracking-[0.24em] uppercase mb-2"
        style={{ color: GOLD_DARK }}
      >
        {milestone.label}
      </span>
      <h4
        className="leading-tight mb-2 px-2"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "20px",
          color: INK,
        }}
      >
        {milestone.title}
      </h4>
      <p
        className="text-[12.5px] leading-relaxed px-2"
        style={{ color: INK_MID }}
      >
        {milestone.body}
      </p>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2: COMPLIANCE & FCA — pillars + downloadable docs
// ═════════════════════════════════════════════════════════════════════════════
function ComplianceSection({ sectionRef }) {
  return (
    <section
      id="compliance"
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
          eyebrow="Compliance & FCA"
          title="The regulatory"
          titleAccent="framework."
          description="How Brick & Wealth meets UK regulatory standards across six pillars — with the documentation you can request, inspect, and verify independently."
          dark
        />

        {/* Trust banner — Companies House registration */}
        <motion.div
          className="mb-12 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
            border: `1px solid ${GOLD_BORD}`,
            borderLeft: `3px solid ${GOLD}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 grid place-items-center flex-shrink-0"
              style={{
                background: "rgba(201,162,74,0.18)",
                border: `1px solid ${GOLD_BORD}`,
                borderRadius: "1px",
              }}
            >
              <Building2 size={22} style={{ color: GOLD_LIGHT }} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold tracking-[0.28em] uppercase mb-1"
                style={{ color: GOLD_LIGHT }}
              >
                Companies House Verified
              </p>
              <p
                className="leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "22px",
                  color: WHITE,
                }}
              >
                Brick &amp; Wealth Holdings Ltd
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Company No. 14582930 · Registered in England &amp; Wales · 2025
              </p>
            </div>
          </div>
          <Link
            href="https://find-and-update.company-information.service.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-extrabold tracking-[0.14em] uppercase border transition-all duration-200 whitespace-nowrap"
            style={{
              color: GOLD_LIGHT,
              borderColor: GOLD_BORD,
              borderRadius: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = GOLD_LIGHT;
              e.currentTarget.style.background = GOLD_DIM;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = GOLD_BORD;
              e.currentTarget.style.background = "transparent";
            }}
          >
            Verify on Companies House
            <ArrowUpRight size={11} />
          </Link>
        </motion.div>

        {/* Six compliance pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {COMPLIANCE_PILLARS.map((pillar, i) => (
            <CompliancePillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>

        {/* Downloadable documents */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Download size={14} style={{ color: GOLD_LIGHT }} />
            <span
              className="text-[11px] font-bold tracking-[0.32em] uppercase"
              style={{ color: GOLD_LIGHT }}
            >
              Downloadable Documents
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
            Inspect{" "}
            <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
              the actual paperwork.
            </em>
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMPLIANCE_DOCS.map((doc, i) => (
              <DocumentRow key={doc.title} doc={doc} index={i} />
            ))}
          </div>

          {/* Disclaimer */}
          <motion.div
            className="mt-10 p-5 flex items-start gap-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${INK_DIM}`,
              borderRadius: "1px",
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles
              size={14}
              style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 2 }}
            />
            <p
              className="text-[12.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <strong style={{ color: WHITE }}>
                We don&apos;t hold these behind paywalls.
              </strong>{" "}
              Anyone can request these documents — investors, lawyers, journalists,
              regulators. If we operate transparently, we shouldn&apos;t fear
              being read.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CompliancePillarCard({ pillar, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = pillar.icon;

  return (
    <motion.div
      ref={ref}
      className="p-7 relative overflow-hidden h-full flex flex-col"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "1px",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.06 }}
      whileHover={{
        y: -4,
        borderColor: GOLD_BORD,
        background: "rgba(201,162,74,0.04)",
      }}
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
        className="w-12 h-12 grid place-items-center mb-5"
        style={{
          background: GOLD_DIM,
          border: `1px solid ${GOLD_BORD}`,
          borderRadius: "1px",
        }}
      >
        <Icon size={18} style={{ color: GOLD_LIGHT }} />
      </div>

      <p
        className="text-[10px] font-bold tracking-[0.24em] uppercase mb-2"
        style={{ color: GOLD_LIGHT }}
      >
        {pillar.short}
      </p>

      <h3
        className="leading-tight mb-3"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "24px",
          color: WHITE,
        }}
      >
        {pillar.title}
      </h3>

      <p
        className="text-[13px] leading-relaxed mb-5 flex-1"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {pillar.body}
      </p>

      <ul
        className="flex flex-col gap-2 pt-4"
        style={{ borderTop: `1px solid rgba(255,255,255,0.08)` }}
      >
        {pillar.documents.map((doc) => (
          <li
            key={doc}
            className="flex items-start gap-2 text-[11.5px]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <CheckCircle2
              size={11}
              style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 3 }}
            />
            {doc}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function DocumentRow({ doc, index }) {
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
          <FileText size={16} style={{ color: GOLD_LIGHT }} />
        </div>
        <div className="min-w-0">
          <p
            className="leading-tight mb-1"
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontWeight: 500,
              fontSize: "17px",
              color: WHITE,
            }}
          >
            {doc.title}
          </p>
          <p
            className="text-[11.5px]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {doc.description} · {doc.fileSize}
          </p>
        </div>
      </div>
      <Download
        size={14}
        style={{ color: GOLD_LIGHT }}
        className="flex-shrink-0 transition-transform group-hover:translate-y-0.5"
      />
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3: CONTACT — multi-channel contact + form
// ═════════════════════════════════════════════════════════════════════════════
function ContactSection({ sectionRef }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General Question");
  const [message, setMessage] = useState("");
  const [state, setState] = useState("idle");
  const [focused, setFocused] = useState(null);

  const TOPICS = [
    "General Question",
    "About a specific SPV",
    "Compliance / Regulatory",
    "Press / Partnership",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    setState("loading");
    await new Promise((r) => setTimeout(r, 1400));
    setState("success");
  };

  const inputStyle = (field) => ({
    width: "100%",
    height: 52,
    backgroundColor: WHITE,
    border: `1px solid ${focused === field ? GOLD : "rgba(10,31,68,0.12)"}`,
    color: INK,
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 500,
    padding: "0 16px",
    outline: "none",
    transition: "border-color 0.2s",
    borderRadius: "1px",
  });

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: CREAM, padding: "100px 0" }}
    >
      <div className="absolute inset-0 pointer-events-none">
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
          number="03"
          eyebrow="Contact & Book a Call"
          title="Speak with"
          titleAccent="our team."
          description="Three ways to get in touch — pick the one that suits you. Every message is reviewed by a member of our investor team within 24 hours, no exceptions."
        />

        {/* Three contact methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {CONTACT_METHODS.map((method, i) => (
            <ContactMethodCard key={method.title} method={method} index={i} />
          ))}
        </div>

        {/* Contact form + office details */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <motion.div
            className="p-8 md:p-10 relative overflow-hidden"
            style={{
              background: WHITE,
              border: `1px solid rgba(10,31,68,0.08)`,
              borderTop: `3px solid ${GOLD}`,
              borderRadius: "1px",
              boxShadow: "0 16px 48px -16px rgba(10,31,68,0.15)",
            }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <AnimatePresence mode="wait">
              {state === "success" ? (
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center text-center gap-5 py-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-16 h-16 grid place-items-center"
                    style={{
                      background: GOLD_DIM,
                      border: `1px solid ${GOLD_BORD}`,
                      borderRadius: "1px",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 14,
                      delay: 0.1,
                    }}
                  >
                    <CheckCircle2 size={28} style={{ color: GOLD_DARK }} />
                  </motion.div>
                  <div>
                    <p
                      className="text-[10.5px] font-bold tracking-[0.28em] uppercase mb-2"
                      style={{ color: GOLD_DARK }}
                    >
                      Message Sent
                    </p>
                    <h3
                      className="leading-tight mb-3"
                      style={{
                        fontFamily: "var(--font-cormorant), serif",
                        fontWeight: 500,
                        fontSize: "26px",
                        color: INK,
                      }}
                    >
                      Thank you. We&apos;ll be in touch soon.
                    </h3>
                    <p
                      className="text-[13px] leading-relaxed max-w-md"
                      style={{ color: INK_MID }}
                    >
                      Our team reviews every message personally. Expect a reply
                      within 24 hours from one of our investor advisors.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Send size={12} style={{ color: GOLD_DARK }} />
                    <p
                      className="text-[10.5px] font-bold tracking-[0.28em] uppercase"
                      style={{ color: GOLD_DARK }}
                    >
                      Send a Message
                    </p>
                  </div>
                  <h3
                    className="leading-tight mb-2"
                    style={{
                      fontFamily: "var(--font-cormorant), serif",
                      fontWeight: 500,
                      fontSize: "28px",
                      color: INK,
                    }}
                  >
                    Tell us what&apos;s on your mind.
                  </h3>
                  <p
                    className="text-[12.5px] mb-7"
                    style={{ color: INK_MID }}
                  >
                    No automation, no chatbot. Reviewed personally within 24 hours.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                          style={{ color: INK_MID }}
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          style={inputStyle("name")}
                          onFocus={() => setFocused("name")}
                          onBlur={() => setFocused(null)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                          style={{ color: INK_MID }}
                        >
                          Email <span style={{ color: GOLD_DARK }}>*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.name@email.com"
                          style={inputStyle("email")}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused(null)}
                          aria-required="true"
                          aria-invalid={state === "error"}
                        />
                      </div>
                    </div>

                    {/* Topic selector */}
                    <div className="flex flex-col gap-2.5">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: INK_MID }}
                      >
                        Topic
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setTopic(opt)}
                            className="px-4 py-2 text-[11px] font-bold tracking-[0.08em] uppercase transition-all duration-200"
                            style={{
                              backgroundColor: topic === opt ? NAVY_900 : "transparent",
                              color: topic === opt ? WHITE : INK_MID,
                              border: `1px solid ${
                                topic === opt ? NAVY_900 : "rgba(10,31,68,0.16)"
                              }`,
                              borderRadius: "1px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: INK_MID }}
                      >
                        Your Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share as much detail as you'd like..."
                        rows={5}
                        style={{
                          ...inputStyle("message"),
                          height: "auto",
                          padding: "14px 16px",
                          resize: "vertical",
                          minHeight: 120,
                          lineHeight: 1.5,
                        }}
                        onFocus={() => setFocused("message")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>

                    {state === "error" && (
                      <p
                        className="text-[12px] flex items-center gap-2"
                        style={{ color: "#9B2C2C" }}
                        role="alert"
                      >
                        <Sparkles size={12} />
                        Please enter a valid email address.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={state === "loading"}
                      className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-60"
                      style={{
                        backgroundColor: GOLD,
                        color: NAVY_900,
                        fontFamily: "inherit",
                        cursor: state === "loading" ? "not-allowed" : "pointer",
                        borderRadius: "1px",
                        boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)",
                        border: "none",
                      }}
                      onMouseEnter={(e) => {
                        if (state !== "loading") {
                          e.currentTarget.style.backgroundColor = GOLD_LIGHT;
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = GOLD;
                        e.currentTarget.style.transform = "";
                      }}
                    >
                      {state === "loading" ? (
                        <motion.div
                          className="w-4 h-4 rounded-full"
                          style={{
                            border: `2px solid rgba(10,31,68,0.2)`,
                            borderTopColor: NAVY_900,
                          }}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        <>
                          Send Message
                          <Send size={12} />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Office details + WhatsApp */}
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Office card */}
            <div
              className="p-7 relative overflow-hidden"
              style={{
                background: NAVY_900,
                borderRadius: "1px",
                color: WHITE,
              }}
            >
              <div
                className="absolute top-0 right-0 w-72 h-72 opacity-[0.10] pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
                }}
              />
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} style={{ color: GOLD_LIGHT }} />
                <p
                  className="text-[10px] font-bold tracking-[0.28em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Our Office
                </p>
              </div>
              <h4
                className="leading-tight mb-3"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "24px",
                  color: WHITE,
                }}
              >
                London, United Kingdom
              </h4>
              <address
                className="text-[13px] leading-relaxed not-italic mb-5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Brick &amp; Wealth Holdings Ltd
                <br />
                Registered Office
                <br />
                London, EC2M
                <br />
                United Kingdom
              </address>
              <div
                className="pt-5 flex flex-col gap-3"
                style={{ borderTop: `1px solid rgba(255,255,255,0.08)` }}
              >
                <a
                  href="tel:+442012345678"
                  className="flex items-center gap-3 text-[13px] font-semibold transition-colors"
                  style={{ color: WHITE }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = WHITE)}
                >
                  <Phone size={13} style={{ color: GOLD_LIGHT }} />
                  +44 (0) 20 1234 5678
                </a>
                <a
                  href="mailto:investors@brickandwealth.com"
                  className="flex items-center gap-3 text-[13px] font-semibold transition-colors"
                  style={{ color: WHITE }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = WHITE)}
                >
                  <Mail size={13} style={{ color: GOLD_LIGHT }} />
                  investors@brickandwealth.com
                </a>
              </div>
            </div>

            {/* WhatsApp option */}
            <a
              href="https://wa.me/442012345678"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 flex items-center gap-4 transition-all duration-200 group"
              style={{
                background: WHITE,
                border: `1px solid rgba(10,31,68,0.08)`,
                borderRadius: "1px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#25D366";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px -12px rgba(37,211,102,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(10,31,68,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="w-12 h-12 grid place-items-center flex-shrink-0"
                style={{
                  background: "rgba(37,211,102,0.10)",
                  border: `1px solid rgba(37,211,102,0.25)`,
                  borderRadius: "1px",
                }}
              >
                <FaWhatsapp size={20} style={{ color: "#25D366" }} />
              </div>
              <div className="flex-1">
                <p
                  className="leading-tight mb-0.5"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "20px",
                    color: INK,
                  }}
                >
                  Message us on WhatsApp
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: INK_MID }}
                >
                  Quick replies during office hours
                </p>
              </div>
              <ArrowUpRight
                size={14}
                style={{ color: INK_DIM }}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            {/* Social links */}
            <div
              className="p-6"
              style={{
                background: WHITE,
                border: `1px solid rgba(10,31,68,0.08)`,
                borderRadius: "1px",
              }}
            >
              <p
                className="text-[10px] font-bold tracking-[0.28em] uppercase mb-4"
                style={{ color: GOLD_DARK }}
              >
                Follow our work
              </p>
              <div className="flex items-center gap-3">
                {[
                  { Icon: FaLinkedinIn, href: "https://linkedin.com/company/brickandwealth", label: "LinkedIn" },
                  { Icon: FaXTwitter, href: "https://x.com/brickandwealth", label: "X (Twitter)" },
                  { Icon: FaInstagram, href: "https://instagram.com/brickandwealth", label: "Instagram" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 grid place-items-center transition-all"
                    style={{
                      background: CREAM,
                      border: `1px solid rgba(10,31,68,0.08)`,
                      borderRadius: "1px",
                      color: INK_MID,
                    }}
                    aria-label={label}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = NAVY_900;
                      e.currentTarget.style.color = WHITE;
                      e.currentTarget.style.borderColor = NAVY_900;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = CREAM;
                      e.currentTarget.style.color = INK_MID;
                      e.currentTarget.style.borderColor = "rgba(10,31,68,0.08)";
                    }}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactMethodCard({ method, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = method.icon;

  return (
    <motion.div
      ref={ref}
      className="p-7 relative overflow-hidden flex flex-col h-full"
      style={{
        background: WHITE,
        border: `1px solid rgba(10,31,68,0.08)`,
        borderTop: `3px solid ${method.accent}`,
        borderRadius: "1px",
        transition: "all 0.3s ease",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.08 }}
      whileHover={{
        y: -4,
        boxShadow: "0 24px 48px -16px rgba(10,31,68,0.18)",
      }}
    >
      <div
        className="w-12 h-12 grid place-items-center mb-5"
        style={{
          background: `${method.accent}15`,
          border: `1px solid ${method.accent}30`,
          borderRadius: "1px",
        }}
      >
        <Icon size={18} style={{ color: method.accent }} />
      </div>

      <p
        className="text-[10px] font-bold tracking-[0.24em] uppercase mb-2"
        style={{ color: method.accent }}
      >
        {method.short}
      </p>

      <h3
        className="leading-tight mb-3"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
          fontSize: "24px",
          color: INK,
        }}
      >
        {method.title}
      </h3>

      <p
        className="text-[13px] leading-relaxed mb-6 flex-1"
        style={{ color: INK_MID }}
      >
        {method.body}
      </p>

      <Link
        href={method.ctaHref}
        className="inline-flex items-center justify-between gap-2 px-5 py-3.5 text-[11px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 group"
        style={{
          background: method.accent,
          color: WHITE,
          borderRadius: "1px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = `0 12px 28px -10px ${method.accent}80`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {method.cta}
        <ArrowUpRight
          size={11}
          className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function CompanyPage() {
  const [activeSection, setActiveSection] = useState("about");

  const aboutRef = useRef(null);
  const complianceRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const sections = [
      { id: "about", el: aboutRef.current },
      { id: "compliance", el: complianceRef.current },
      { id: "contact", el: contactRef.current },
    ].filter((s) => s.el);

    const onScroll = () => {
      const scrollY = window.scrollY + 250;
      let current = "about";
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
            "@type": "Organization",
            name: "Brick & Wealth Holdings Ltd",
            url: "https://brickandwealth.com",
            logo: "https://brickandwealth.com/logo.png",
            description:
              "Private property co-investment platform for invited UK investors.",
            founder: {
              "@type": "Person",
              name: "Marcel Ngogbehei",
              jobTitle: "Founder & CEO",
            },
            foundingDate: "2025",
            address: {
              "@type": "PostalAddress",
              addressLocality: "London",
              addressCountry: "GB",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+44-20-1234-5678",
              contactType: "investor relations",
              email: "investors@brickandwealth.com",
              availableLanguage: ["English"],
            },
            sameAs: [
              "https://linkedin.com/company/brickandwealth",
              "https://x.com/brickandwealth",
              "https://instagram.com/brickandwealth",
            ],
          }),
        }}
      />

      <PageHero />
      <SectionNav activeSection={activeSection} />
      <AboutSection sectionRef={aboutRef} />
      <ComplianceSection sectionRef={complianceRef} />
      <ContactSection sectionRef={contactRef} />
    </main>
  );
}