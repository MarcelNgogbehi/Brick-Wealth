"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { assets } from "@/assets/assets";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  ArrowUpRight,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  TrendingUp,
  Lock,
  FileCheck,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa6";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F"; // deepest base
const NAVY_800 = "#0F2856";
const NAVY_700 = "#15326B";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.16)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const BORD = "rgba(255,255,255,0.08)";
const BORD_STRONG = "rgba(255,255,255,0.14)";
const TEXT_MID = "rgba(255,255,255,0.55)";
const TEXT_DIM = "rgba(255,255,255,0.32)";
const TEXT_WHITE = "#FFFFFF";

const SITE_URL = "https://brickandwealth.com";

// ─── Footer nav columns ───────────────────────────────────────────────────────
const NAV_COLS = [
  {
    heading: "Opportunities",
    links: [
      { label: "Live Properties", href: "/opportunities/live" },
      { label: "Coming Soon", href: "/opportunities/upcoming" },
      { label: "Past Raises", href: "/opportunities/closed" },
      { label: "Browse All", href: "/opportunities" },
      { label: "How Subscriptions Work", href: "/how-it-works/subscriptions" },
      { label: "Cap Tables Explained", href: "/education/cap-tables" },
    ],
  },
  {
    heading: "Education",
    links: [
      { label: "UK Property Basics", href: "/education/uk-property" },
      { label: "Buy-to-Let Explained", href: "/education/buy-to-let" },
      { label: "Co-Ownership & SPVs", href: "/education/co-ownership" },
      { label: "First-Time Buyer Status", href: "/education/ftb-status" },
      { label: "Risk & Returns", href: "/how-it-works/risk-returns" },
      { label: "Webinars & Events", href: "/education/events" },
    ],
  },
  {
    heading: "For Investors",
    links: [
      { label: "Register Interest", href: "/register-interest" },
      { label: "Investor Login", href: "/portal" },
      { label: "Diaspora Investors", href: "/diaspora" },
      { label: "Investor FAQs", href: "/faq" },
      { label: "Refer a Friend", href: "/refer" },
      { label: "Document Vault", href: "/portal/documents" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Bricks & Wealth", href: "/company/about" },
      { label: "Founder Story", href: "/company/founder" },
      { label: "Compliance & FCA", href: "/company/compliance" },
      { label: "Insights & Reports", href: "/insights" },
      { label: "Careers", href: "/careers" },
      { label: "Contact & Book a Call", href: "/company/contact" },
    ],
  },
];

// ─── Trust strip ──────────────────────────────────────────────────────────────
const TRUST = [
  {
    icon: ShieldCheck,
    label: "FCA-Aligned",
    sub: "Operating under UK framework",
  },
  {
    icon: FileCheck,
    label: "AML & KYC",
    sub: "Verified onboarding",
  },
  {
    icon: Building2,
    label: "Ring-Fenced SPVs",
    sub: "Companies House registered",
  },
  {
    icon: Lock,
    label: "GDPR Compliant",
    sub: "Secure encrypted vault",
  },
  {
    icon: Award,
    label: "Independently Audited",
    sub: "Annual third-party review",
  },
  {
    icon: TrendingUp,
    label: "GBP Settlements",
    sub: "Stripe & bank transfer",
  },
];

// ─── Social ───────────────────────────────────────────────────────────────────
const SOCIAL = [
  { label: "X", href: "https://x.com/brickandwealth", Icon: FaXTwitter },
  { label: "LinkedIn", href: "https://linkedin.com/company/brickandwealth", Icon: FaLinkedinIn },
  { label: "YouTube", href: "https://youtube.com/@brickandwealth", Icon: FaYoutube },
  { label: "Instagram", href: "https://instagram.com/brickandwealth", Icon: FaInstagram },
  { label: "WhatsApp", href: "https://wa.me/442012345678", Icon: FaWhatsapp },
];

// ─── Legal ────────────────────────────────────────────────────────────────────
const LEGAL = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Cookie Policy", href: "/legal/cookies" },
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Risk Warning", href: "/legal/risk" },
  { label: "Complaints Procedure", href: "/legal/complaints" },
  { label: "Modern Slavery Statement", href: "/legal/modern-slavery" },
  { label: "Sitemap", href: "/sitemap" },
];

// ─── Logo Mark — stacked golden bricks ────────────────────────────────────────
function LogoMark({ size = 38 }) {
  return (
    <Image
      src={assets.logo}
      alt="Bricks & Wealth Logo"
      width={size}
      height={size}
      priority
      className="flex-shrink-0"
    />
  );
}

// ─── Wordmark (BRICK & WEALTH with italic ampersand) ──────────────────────────
function Wordmark({ size = "md" }) {
  const sizes = {
    sm: { text: "13px", amp: "16px", tag: "9px" },
    md: { text: "19px", amp: "22px", tag: "11px" },
    lg: { text: "22px", amp: "26px", tag: "12px" },
  };
  const s = sizes[size];
  return (
    <div className="flex flex-col leading-none">
      <span
        className="font-extrabold text-white tracking-[0.04em] uppercase"
        style={{ fontSize: s.text }}
      >
        Brick
        <span
          className="mx-0.5"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: s.amp,
            color: GOLD_LIGHT,
            letterSpacing: 0,
          }}
        >
          &amp;
        </span>
        Wealth
      </span>
      <span
        className="font-semibold text-white tracking-[0.04em] uppercase"
        style={{ fontSize: s.text, marginTop: "2px" }}
      >
        Holdings
      </span>
      {size !== "sm" && (
        <span
          className="mt-1.5"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: s.tag,
            color: GOLD_LIGHT,
            letterSpacing: "0.06em",
          }}
        >
          Building Wealth, Brick by Brick
        </span>
      )}
    </div>
  );
}

// ─── Newsletter Form ──────────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | success | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    setState("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setState("success");
    setEmail("");
  };

  return (
    <div>
      <p
        className="text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
        style={{ color: GOLD_LIGHT }}
      >
        Investor Briefings
      </p>
      <h3
        className="text-white text-[24px] mb-2 leading-tight"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontWeight: 500,
        }}
      >
        Quiet, considered notes from{" "}
        <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>our desk to yours.</em>
      </h3>
      <p
        className="text-[13.5px] leading-relaxed mb-6 max-w-md"
        style={{ color: TEXT_MID }}
      >
        Monthly UK property analysis, new SPV launches, and founder commentary —
        delivered to invited investors only. No marketing fluff.
      </p>

      <AnimatePresence mode="wait">
        {state === "success" ? (
          <motion.div
            key="ok"
            className="flex items-center gap-3 px-4 py-3.5 max-w-[420px]"
            style={{
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORD}`,
              borderRadius: "2px",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle size={16} style={{ color: GOLD_LIGHT }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: GOLD_LIGHT }}
            >
              You&apos;re subscribed. Welcome aboard.
            </span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex max-w-[420px]">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@email.com"
                  aria-label="Email address for investor briefings"
                  className={`w-full h-[50px] text-[13px] px-4 outline-none min-w-0 font-medium transition-shadow ${
                    state === "error" ? "ring-1 ring-red-500" : ""
                  }`}
                  style={{
                    background: "#F8F4EC",
                    color: NAVY_900,
                    fontFamily: "inherit",
                    border: "1px solid transparent",
                    borderRadius: 0,
                  }}
                />
                {state === "error" && (
                  <AlertCircle
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={state === "loading"}
                className="h-[50px] px-6 text-[11.5px] font-extrabold tracking-[0.12em] uppercase flex items-center gap-2 flex-shrink-0 disabled:opacity-60 transition-colors duration-200"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY_900,
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (state !== "loading")
                    e.currentTarget.style.backgroundColor = GOLD_LIGHT;
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = GOLD)
                }
              >
                {state === "loading" ? (
                  <motion.div
                    className="w-3.5 h-3.5 rounded-full"
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
                    Subscribe <ArrowUpRight size={12} />
                  </>
                )}
              </button>
            </div>
            {state === "error" && (
              <p className="text-red-400 text-[12px] mt-2" role="alert">
                Please enter a valid email address.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      <p
        className="text-[11.5px] mt-4 leading-relaxed max-w-[420px]"
        style={{ color: TEXT_DIM }}
      >
        Capital is at risk. Past performance is not indicative of future results.
        See our{" "}
        <Link
          href="/legal/risk"
          className="underline transition-colors"
          style={{ color: GOLD_LIGHT }}
          onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_WHITE)}
          onMouseLeave={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
        >
          risk warning
        </Link>{" "}
        and{" "}
        <Link
          href="/legal/privacy"
          className="underline transition-colors"
          style={{ color: GOLD_LIGHT }}
          onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_WHITE)}
          onMouseLeave={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
        >
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export default function Footer() {
  const year = new Date().getFullYear();
  const { authenticated, dashboardHref, dashboardLabel } = useAuthSession();

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        backgroundColor: NAVY_950,
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
      aria-label="Bricks & Wealth site footer"
      role="contentinfo"
    >
      {/* SEO: Organization schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Bricks & Wealth Holdings Ltd",
            alternateName: "Bricks & Wealth",
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            description:
              "Private UK property co-investment platform enabling individuals to participate in carefully selected UK property opportunities through ring-fenced Special Purpose Vehicles.",
            address: {
              "@type": "PostalAddress",
              addressCountry: "GB",
              addressLocality: "London",
            },
            contactPoint: [
              {
                "@type": "ContactPoint",
                telephone: "+44-20-1234-5678",
                contactType: "investor relations",
                areaServed: "GB",
                availableLanguage: ["English"],
              },
            ],
            sameAs: SOCIAL.map((s) => s.href),
          }),
        }}
      />

      {/* ══ DECORATIVE BACKGROUND ═══════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Faint grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Large faint logo bricks — top right */}
        <svg
          className="absolute -top-20 -right-20 opacity-[0.035]"
          width="560"
          height="560"
          viewBox="0 0 44 44"
          fill="none"
        >
          <path
            d="M22 4 L36 12 L22 20 L8 12 Z"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.4"
          />
          <path
            d="M22 14 L36 22 L22 30 L8 22 Z"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.4"
          />
          <path
            d="M22 24 L36 32 L22 40 L8 32 Z"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.4"
          />
        </svg>
        {/* Gold accent line bottom left */}
        <div
          className="absolute bottom-0 left-0 w-[480px] h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            opacity: 0.2,
          }}
        />
        {/* Soft radial glow top center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse at top, ${GOLD} 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* ══ CTA BAND ═══════════════════════════════════════════════════ */}
      <div
        className="relative"
        style={{
          background: `linear-gradient(135deg, ${NAVY_900} 0%, ${NAVY_700} 100%)`,
          borderBottom: `1px solid ${BORD}`,
        }}
      >
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-16 md:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 mb-5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: GOLD_LIGHT }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <span
                  className="text-[11px] font-bold tracking-[0.28em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Private · Invitation Only
                </span>
              </div>

              <h2
                className="text-white mb-6 leading-[0.98]"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "clamp(34px, 5.2vw, 60px)",
                  letterSpacing: "-0.01em",
                }}
              >
                Build wealth on a{" "}
                <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                  foundation of trust,
                </em>
                <br />
                brick by brick.
              </h2>

              <p
                className="text-[15px] font-normal leading-relaxed max-w-xl"
                style={{ color: TEXT_MID }}
              >
                Bricks &amp; Wealth gives invited investors structured access to
                carefully selected UK property opportunities — through transparent,
                ring-fenced Special Purpose Vehicles, with the documents, oversight
                and education you&apos;d expect from a traditional fund.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <Link
                href="/register-interest"
                className="inline-flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.12em] uppercase px-7 py-4 transition-all duration-200"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY_900,
                  borderRadius: "2px",
                  boxShadow: "0 8px 22px -8px rgba(201,162,74,0.55)",
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
                Register Interest <ArrowUpRight size={12} />
              </Link>
              <Link
                href="/company/contact"
                className="inline-flex items-center gap-2 text-white text-[11.5px] font-bold tracking-[0.1em] uppercase px-7 py-4 border transition-all duration-200"
                style={{
                  borderColor: "rgba(255,255,255,0.22)",
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = GOLD_LIGHT)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)")
                }
              >
                Book a Call <ArrowUpRight size={12} />
              </Link>
              <Link
                href={authenticated ? dashboardHref : "/portal"}
                className="inline-flex items-center gap-2 text-[11.5px] font-bold tracking-[0.1em] uppercase px-6 py-4 border transition-all duration-200"
                style={{
                  color: GOLD_LIGHT,
                  borderColor: GOLD_BORD,
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD_LIGHT;
                  e.currentTarget.style.background = GOLD_DIM;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = GOLD_BORD;
                  e.currentTarget.style.background = "";
                }}
              >
                <Lock size={11} /> {authenticated ? (dashboardLabel || "Investor Dashboard") : "Investor Login"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TRUST STRIP ════════════════════════════════════════════════ */}
      <div
        className="relative"
        style={{
          borderBottom: `1px solid ${BORD}`,
          backgroundColor: "rgba(15,40,86,0.4)",
        }}
      >
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {TRUST.map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex-shrink-0 grid place-items-center"
                  style={{
                    background: GOLD_DIM,
                    border: `1px solid ${GOLD_BORD}`,
                    borderRadius: "2px",
                  }}
                >
                  <Icon size={13} style={{ color: GOLD_LIGHT }} />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-[12px] leading-tight mb-0.5">
                    {label}
                  </p>
                  <p
                    className="text-[10.5px] leading-tight"
                    style={{ color: TEXT_DIM }}
                  >
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BRAND + NAV COLUMNS ════════════════════════════════════════ */}
      <div className="relative" style={{ borderBottom: `1px solid ${BORD}` }}>
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">
            {/* Brand column */}
            <div className="flex-shrink-0 max-w-[300px]">
              <Link
                href="/"
                className="flex items-center gap-3.5 mb-6 group"
                aria-label="Bricks & Wealth — home"
              >
                <LogoMark size={42} />
                <Wordmark size="md" />
              </Link>

              <p
                className="text-[13.5px] leading-relaxed mb-7"
                style={{ color: TEXT_MID }}
              >
                A trust-first property co-investment platform. We give invited
                individuals structured access to UK property opportunities through
                ring-fenced SPVs — built for transparency, documented for scrutiny.
              </p>

              {/* Contact */}
              <div className="flex flex-col gap-3 mb-6">
                {[
                  {
                    href: "tel:+442012345678",
                    Icon: Phone,
                    text: "+44 (0) 20 1234 5678",
                  },
                  {
                    href: "mailto:investors@brickandwealth.com",
                    Icon: Mail,
                    text: "investors@brickandwealth.com",
                  },
                  {
                    href: "/company/contact",
                    Icon: MapPin,
                    text: "Registered in England & Wales",
                  },
                ].map(({ href, Icon, text }) => (
                  <a
                    key={href}
                    href={href}
                    className="flex items-center gap-3 text-[13px] transition-colors duration-150"
                    style={{ color: TEXT_MID }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = GOLD_LIGHT)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = TEXT_MID)
                    }
                  >
                    <Icon size={12} style={{ color: GOLD_LIGHT, flexShrink: 0 }} />
                    {text}
                  </a>
                ))}
              </div>

              {/* Companies House badge */}
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{
                  border: `1px solid ${BORD_STRONG}`,
                  borderRadius: "2px",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <FileCheck size={12} style={{ color: GOLD_LIGHT }} />
                <span
                  className="text-[10.5px] font-bold tracking-[0.14em] uppercase"
                  style={{ color: TEXT_MID }}
                >
                  Companies House · No. XXXXXXX
                </span>
              </div>
            </div>

            {/* Nav columns */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
              {NAV_COLS.map((col) => (
                <div key={col.heading}>
                  <div
                    className="flex items-center gap-2.5 mb-5 pb-3"
                    style={{ borderBottom: `1px solid ${BORD}` }}
                  >
                    <div
                      className="w-1 h-4"
                      style={{ backgroundColor: GOLD }}
                      aria-hidden="true"
                    />
                    <h3 className="text-white font-bold text-[12.5px] tracking-[0.06em] uppercase">
                      {col.heading}
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-3" role="list">
                    {col.links.map((link) => {
                      // Swap the "Investor Login" entry for a dashboard link
                      // once the visitor is signed in.
                      const isLoginLink = link.href === "/portal";
                      const href = authenticated && isLoginLink ? dashboardHref : link.href;
                      const label =
                        authenticated && isLoginLink
                          ? dashboardLabel || "Investor Dashboard"
                          : link.label;
                      return (
                        <li key={link.href}>
                          <Link
                            href={href}
                            className="text-[12.5px] leading-snug transition-colors duration-150 block"
                            style={{ color: TEXT_MID }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = GOLD_LIGHT)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = TEXT_MID)
                            }
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ NEWSLETTER + SOCIAL ════════════════════════════════════════ */}
      <div className="relative" style={{ borderBottom: `1px solid ${BORD}` }}>
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-12 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
            {/* Newsletter */}
            <NewsletterForm />

            {/* Social + Trust badges */}
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.28em] uppercase mb-3"
                style={{ color: GOLD_LIGHT }}
              >
                Quietly Connected
              </p>
              <h3
                className="text-white text-[24px] mb-2 leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                }}
              >
                Follow our{" "}
                <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                  considered journey.
                </em>
              </h3>
              <p
                className="text-[13.5px] leading-relaxed mb-6 max-w-md"
                style={{ color: TEXT_MID }}
              >
                Founder commentary, market reflections, and the occasional
                behind-the-scenes look at how a SPV gets built — never noisy,
                always considered.
              </p>

              {/* Social icons */}
              <div
                className="flex flex-wrap gap-2 mb-8"
                role="list"
                aria-label="Social media links"
              >
                {SOCIAL.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    aria-label={`Follow Bricks & Wealth on ${label}`}
                    className="w-11 h-11 grid place-items-center transition-all duration-200"
                    style={{
                      border: `1px solid ${BORD_STRONG}`,
                      backgroundColor: "rgba(255,255,255,0.02)",
                      color: TEXT_MID,
                      borderRadius: "2px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = GOLD_DIM;
                      e.currentTarget.style.borderColor = GOLD_BORD;
                      e.currentTarget.style.color = GOLD_LIGHT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = BORD_STRONG;
                      e.currentTarget.style.color = TEXT_MID;
                    }}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    line1: "Operating Under",
                    line2: "FCA Framework",
                    Icon: ShieldCheck,
                  },
                  {
                    line1: "Independently",
                    line2: "Audited Annually",
                    Icon: Award,
                  },
                  {
                    line1: "GDPR &",
                    line2: "Cyber Essentials",
                    Icon: Lock,
                  },
                ].map(({ line1, line2, Icon }) => (
                  <div
                    key={line1}
                    className="flex items-center gap-2.5 px-3.5 py-2.5"
                    style={{
                      border: `1px solid ${GOLD_BORD}`,
                      background: GOLD_DIM,
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      className="w-7 h-7 flex-shrink-0 grid place-items-center"
                      style={{
                        backgroundColor: `${GOLD}30`,
                        borderRadius: "2px",
                      }}
                    >
                      <Icon size={11} style={{ color: GOLD_LIGHT }} />
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-extrabold tracking-[0.08em] uppercase leading-none"
                        style={{ color: GOLD_LIGHT }}
                      >
                        {line1}
                      </p>
                      <p
                        className="text-[10px] font-bold tracking-[0.08em] uppercase leading-none mt-1"
                        style={{ color: TEXT_MID }}
                      >
                        {line2}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ RISK DISCLOSURE STRIP ══════════════════════════════════════ */}
      <div
        className="relative"
        style={{
          backgroundColor: "rgba(0,0,0,0.25)",
          borderBottom: `1px solid ${BORD}`,
        }}
      >
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-5">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={14}
              className="flex-shrink-0 mt-0.5"
              style={{ color: GOLD_LIGHT }}
            />
            <p
              className="text-[11.5px] leading-relaxed"
              style={{ color: TEXT_MID }}
            >
              <span className="font-bold" style={{ color: TEXT_WHITE }}>
                Risk warning ·
              </span>{" "}
              Bricks &amp; Wealth investments are illiquid, long-term, and your
              capital is at risk. Past performance is not a reliable indicator of
              future results. The value of investments can go down as well as up.
              You may not get back the amount you originally invested. This site
              does not constitute financial, tax, or legal advice — please seek
              independent professional advice before investing.
            </p>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM BAR ═════════════════════════════════════════════════ */}
      <div
        className="relative"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 py-6">
          {/* Legal links */}
          <div
            className="flex flex-wrap gap-x-5 gap-y-2 pb-5 mb-5"
            style={{ borderBottom: `1px solid ${BORD}` }}
          >
            {LEGAL.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[11.5px] font-medium transition-colors duration-150"
                style={{ color: TEXT_DIM }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_DIM)}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Copyright row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[11.5px] leading-relaxed" style={{ color: TEXT_DIM }}>
              © {year} Bricks &amp; Wealth Holdings Ltd. All rights reserved.
              Registered in England &amp; Wales · Company No. XXXXXXX.
            </p>

            <div className="flex items-center gap-5 flex-shrink-0">
              {/* Mini logo */}
              <Link
                href="/"
                aria-label="Bricks & Wealth home"
                className="flex items-center gap-2.5 group"
              >
                <LogoMark size={24} />
                <Wordmark size="sm" />
              </Link>

              {/* Divider */}
              <div
                className="w-px h-4"
                style={{ backgroundColor: BORD_STRONG }}
                aria-hidden="true"
              />

              {/* Back to top */}
              <button
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-200"
                style={{
                  color: TEXT_DIM,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = GOLD_LIGHT)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_DIM)}
                aria-label="Back to top"
              >
                Back to Top <ChevronUp size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}