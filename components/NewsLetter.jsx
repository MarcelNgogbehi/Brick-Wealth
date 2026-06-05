"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Lock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

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
const BORD = "rgba(255,255,255,0.08)";
const BORD_STRONG = "rgba(255,255,255,0.14)";
const TEXT_MID = "rgba(255,255,255,0.55)";
const TEXT_DIM = "rgba(255,255,255,0.32)";
const WHITE = "#FFFFFF";

// ─── Investor benefits (replaces "Perks") ────────────────────────────────────
const BENEFITS = [
  "Priority access to live SPV opportunities",
  "Monthly UK property market briefings",
  "Founder commentary &amp; case-study reports",
  "Webinar invitations &amp; investor events",
];

// ─── Live SPV tickers (replaces property listings) ───────────────────────────
const TICKERS = [
  { city: "Manchester · M14", name: "The Wilbraham", spv: "SPV-008", yield: "8.4%", tag: "Now Open" },
  { city: "London · N7", name: "Holloway Court", spv: "SPV-010", yield: "11.2%", tag: "Featured" },
  { city: "Birmingham · B15", name: "Brunswick Mews", spv: "SPV-009", yield: "7.6%", tag: "Now Open" },
  { city: "Leeds · LS8", name: "Roundhay Gardens", spv: "SPV-011", yield: "7.9%", tag: "New" },
  { city: "Brighton · BN3", name: "Albany Quarter", spv: "SPV-012", yield: "9.6%", tag: "Off-Plan" },
];

// ─── Strategy options ────────────────────────────────────────────────────────
const STRATEGIES = ["Buy-to-Let", "HMO", "Conversion", "Off-Plan", "All Strategies"];

// ─── Newsletter / Invitation Request Section ─────────────────────────────────
export default function NewsletterSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [residency, setResidency] = useState("UK");
  const [strategy, setStrategy] = useState("All Strategies");
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [focused, setFocused] = useState(null);

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

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
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${focused === field ? GOLD_BORD : BORD}`,
    color: WHITE,
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 500,
    padding: "0 16px",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
    borderRadius: "1px",
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        backgroundColor: NAVY_950,
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
      aria-labelledby="invitation-heading"
    >
      {/* ══ CINEMATIC BACKGROUND ════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Blurred UK property background — sets cinematic atmosphere */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1800&q=60&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(3px) brightness(0.16) saturate(0.5)",
            transform: "scale(1.04)",
          }}
        />

        {/* Navy overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              rgba(6,20,47,0.97) 0%,
              rgba(10,31,68,0.88) 50%,
              rgba(6,20,47,0.97) 100%)`,
          }}
        />

        {/* Gold radial glow — top right */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 90% 10%,
              rgba(201,162,74,0.18) 0%,
              transparent 60%)`,
          }}
        />

        {/* Architectural grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Ghost editorial watermark — italic, classy */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none leading-none whitespace-nowrap pointer-events-none"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(80px, 16vw, 220px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(201,162,74,0.05)",
            userSelect: "none",
            bottom: "-3%",
          }}
        >
          Bricks &amp; Wealth
        </div>

        {/* Gold dot grid — top left */}
        <svg
          className="absolute top-0 left-0 opacity-[0.06]"
          width="220"
          height="220"
        >
          <defs>
            <pattern
              id="nl-dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.1" fill={GOLD} />
            </pattern>
          </defs>
          <rect width="220" height="220" fill="url(#nl-dots)" />
        </svg>

        {/* Bricks logomark — bottom right faint */}
        <svg
          className="absolute -bottom-32 -right-32 opacity-[0.04]"
          width="500"
          height="500"
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
      </div>

      {/* ══ TOP GOLD RULE ═══════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD} 30%, ${GOLD} 70%, transparent)`,
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10 pt-24 md:pt-32 pb-24 md:pb-32">
        {/* ══ SCROLLING SPV TICKER ═════════════════════════════════════ */}
        <motion.div
          className="mb-16 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
          style={{
            // Soft fade at edges so ticker doesn't feel hard-cut
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div
            className="flex gap-3"
            style={{
              animation: "bwTickerScroll 32s linear infinite",
              width: "max-content",
            }}
          >
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${BORD}`,
                  borderRadius: "1px",
                }}
              >
                {/* Status pulse + tag */}
                <div className="flex items-center gap-1.5">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#86efac" }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                  <div
                    className="px-2 py-0.5 text-[9px] font-extrabold tracking-[0.18em] uppercase"
                    style={{
                      backgroundColor: GOLD,
                      color: NAVY_900,
                      borderRadius: "1px",
                    }}
                  >
                    {t.tag}
                  </div>
                </div>

                <span
                  className="text-white"
                  style={{
                    fontWeight: 500,
                    fontSize: "16px",
                  }}
                >
                  {t.name}
                </span>

                <span className="text-[12px]" style={{ color: TEXT_MID }}>
                  ·
                </span>
                <span
                  className="text-[11.5px] font-medium"
                  style={{ color: TEXT_MID }}
                >
                  {t.city}
                </span>
                <span className="text-[12px]" style={{ color: TEXT_DIM }}>
                  ·
                </span>
                <span
                  className="text-[10px] font-bold tracking-[0.14em] uppercase"
                  style={{ color: TEXT_DIM }}
                >
                  {t.spv}
                </span>
                <span className="text-[12px]" style={{ color: TEXT_DIM }}>
                  ·
                </span>
                <span
                  className="font-extrabold text-[13px]"
                  style={{ color: GOLD_LIGHT }}
                >
                  {t.yield} target
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ══ MAIN TWO-COLUMN LAYOUT ═══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          {/* LEFT — Copy column */}
          <div>
            {/* Eyebrow with pulsing dot */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: GOLD_LIGHT }}
              />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                Request an Invitation
              </span>
            </motion.div>

            {/* Editorial headline */}
            <motion.h2
              id="invitation-heading"
              className="leading-[0.96] mb-7"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(40px, 6vw, 84px)",
                letterSpacing: "-0.018em",
                color: WHITE,
              }}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Join the{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                quietly
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
                    transition={{
                      duration: 1.4,
                      delay: 0.9,
                      ease: "easeInOut",
                    }}
                  />
                </svg>
              </em>{" "}
              <br />
              <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                ambitious.
              </em>
            </motion.h2>

            {/* Body copy */}
            <motion.p
              className="leading-[1.78] mb-10 max-w-md"
              style={{
                fontSize: "15px",
                fontWeight: 300,
                color: "rgba(255,255,255,0.78)",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              Bricks &amp; Wealth is invitation-only. Tell us a little about
              yourself and we&apos;ll review your details, send you a
              welcome briefing, and notify you when the next opportunity that
              matches your strategy goes live.
            </motion.p>

            {/* Benefits */}
            <motion.ul
              className="flex flex-col gap-3 mb-10"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.32 }}
              role="list"
            >
              {BENEFITS.map((perk, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3 text-[13.5px]"
                  style={{ color: "rgba(255,255,255,0.78)" }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.36 + i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${GOLD_LIGHT}" stroke-width="2" style="flex-shrink:0"><path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/></svg>${perk}`,
                  }}
                />
              ))}
            </motion.ul>

            {/* Social proof / trust signal */}
            <motion.div
              className="flex items-center gap-4 p-5 relative overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: `1px solid ${BORD}`,
                borderLeft: `2px solid ${GOLD}`,
                borderRadius: "1px",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Avatar stack */}
              <div className="flex -space-x-2 flex-shrink-0">
                {["M", "A", "S", "K", "T"].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? GOLD_DIM : "rgba(255,255,255,0.06)",
                      border: `2px solid ${NAVY_950}`,
                      color: GOLD_LIGHT,
                      zIndex: 5 - i,
                      fontWeight: 600,
                    }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-bold text-[13px] leading-tight">
                  240+ on the waitlist
                </p>
                <p
                  className="text-[12px] mt-1"
                  style={{ color: TEXT_MID }}
                >
                  Sophisticated investors trust Bricks &amp; Wealth Briefings
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Form column */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait">
              {state === "success" ? (
                /* ══ SUCCESS STATE ══ */
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center text-center gap-6 py-16 px-8 relative overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${GOLD_BORD}`,
                    borderRadius: "1px",
                    boxShadow: "0 24px 60px -16px rgba(0,0,0,0.4)",
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Soft gold radial */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, rgba(201,162,74,0.12) 0%, transparent 60%)`,
                    }}
                  />

                  <motion.div
                    className="w-16 h-16 grid place-items-center relative"
                    style={{
                      backgroundColor: GOLD_DIM,
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
                    <CheckCircle size={28} style={{ color: GOLD_LIGHT }} />
                  </motion.div>

                  <div className="relative">
                    <p
                      className="text-[11px] font-bold tracking-[0.32em] uppercase mb-2"
                      style={{ color: GOLD_LIGHT }}
                    >
                      Welcome Aboard
                    </p>
                    <h3
                      className="mb-3 leading-tight"
                      style={{
                        fontFamily: "var(--font-cormorant), serif",
                        fontWeight: 500,
                        fontSize: "28px",
                        color: WHITE,
                      }}
                    >
                      You&apos;re on the{" "}
                      <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                        invitation list.
                      </em>
                    </h3>
                    <p
                      className="text-[13.5px] leading-relaxed"
                      style={{ color: TEXT_MID }}
                    >
                      Check your inbox — your welcome briefing is on its way.
                      We&apos;ll review your details and notify you when the
                      next opportunity matching your strategy goes live.
                    </p>
                  </div>

                  <Link
                    href="/opportunities"
                    className="inline-flex items-center gap-2 px-7 py-3 text-[11.5px] font-extrabold tracking-[0.12em] uppercase transition-all duration-200 relative"
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
                    Browse Live Opportunities
                    <ArrowUpRight size={11} />
                  </Link>
                </motion.div>
              ) : (
                /* ══ FORM ══ */
                <motion.div
                  key="form"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.025)",
                    border: `1px solid ${BORD}`,
                    borderTop: `2px solid ${GOLD}`,
                    borderRadius: "1px",
                    boxShadow: "0 24px 60px -16px rgba(0,0,0,0.4)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Form header */}
                  <div
                    className="px-7 pt-7 pb-5"
                    style={{ borderBottom: `1px solid ${BORD}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={11} style={{ color: GOLD_LIGHT }} />
                      <p
                        className="text-[10.5px] font-bold tracking-[0.32em] uppercase"
                        style={{ color: GOLD_LIGHT }}
                      >
                        Investor Waitlist
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
                      Request your{" "}
                      <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                        invitation.
                      </em>
                    </h3>
                    <p
                      className="text-[12.5px] mt-2"
                      style={{ color: TEXT_MID }}
                    >
                      Reviewed manually. We respond within 48 hours · Capital
                      at risk.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="px-7 py-7 flex flex-col gap-5"
                  >
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: TEXT_MID }}
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
                        aria-label="Full name"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: TEXT_MID }}
                      >
                        Email Address{" "}
                        <span style={{ color: GOLD_LIGHT }}>*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={13}
                          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: TEXT_DIM }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.name@email.com"
                          style={{ ...inputStyle("email"), paddingLeft: 40 }}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused(null)}
                          aria-label="Email address"
                          aria-required="true"
                          aria-invalid={state === "error"}
                        />
                        {state === "error" && (
                          <AlertCircle
                            size={13}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
                          />
                        )}
                      </div>
                      {state === "error" && (
                        <p className="text-red-400 text-[12px]" role="alert">
                          Please enter a valid email address.
                        </p>
                      )}
                    </div>

                    {/* Residency selector */}
                    <div className="flex flex-col gap-2.5">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: TEXT_MID }}
                      >
                        I&apos;m Based In
                      </label>
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label="Residency"
                      >
                        {["UK", "Diaspora"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setResidency(opt)}
                            className="px-5 py-2.5 text-[11.5px] font-bold tracking-[0.08em] uppercase transition-all duration-200"
                            style={{
                              backgroundColor:
                                residency === opt ? GOLD : "transparent",
                              color: residency === opt ? NAVY_900 : TEXT_MID,
                              border: `1px solid ${
                                residency === opt ? GOLD : BORD_STRONG
                              }`,
                              borderRadius: "1px",
                              fontFamily: "inherit",
                              cursor: "pointer",
                            }}
                            aria-pressed={residency === opt}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Strategy selector */}
                    <div className="flex flex-col gap-2.5">
                      <label
                        className="text-[10.5px] font-bold tracking-[0.18em] uppercase"
                        style={{ color: TEXT_MID }}
                      >
                        Strategy of Interest
                      </label>
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label="Investment strategy"
                      >
                        {STRATEGIES.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setStrategy(opt)}
                            className="px-4 py-2 text-[11px] font-bold tracking-[0.08em] uppercase transition-all duration-200"
                            style={{
                              backgroundColor:
                                strategy === opt ? GOLD : "transparent",
                              color: strategy === opt ? NAVY_900 : TEXT_MID,
                              border: `1px solid ${
                                strategy === opt ? GOLD : BORD_STRONG
                              }`,
                              borderRadius: "1px",
                              fontFamily: "inherit",
                              cursor: "pointer",
                            }}
                            aria-pressed={strategy === opt}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={state === "loading"}
                      className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-60 mt-2"
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
                          Request Invitation
                          <ArrowUpRight size={13} />
                        </>
                      )}
                    </button>

                    {/* Compliance note */}
                    <p
                      className="text-[11px] text-center leading-relaxed"
                      style={{ color: TEXT_DIM }}
                    >
                      By requesting an invitation you acknowledge that capital
                      is at risk and agree to our{" "}
                      <Link
                        href="/legal/privacy"
                        className="underline transition-colors"
                        style={{ color: GOLD_LIGHT }}
                      >
                        privacy policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/legal/risk"
                        className="underline transition-colors"
                        style={{ color: GOLD_LIGHT }}
                      >
                        risk warning
                      </Link>
                      .
                    </p>
                  </form>

                  {/* Divider */}
                  <div
                    className="mx-7"
                    style={{ borderTop: `1px solid ${BORD}` }}
                  />

                  {/* Alt contact */}
                  <div className="px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <p
                      className="text-[11.5px] font-medium"
                      style={{ color: TEXT_DIM }}
                    >
                      Prefer to talk first?
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href="tel:+442012345678"
                        className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-150"
                        style={{ color: TEXT_MID }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = GOLD_LIGHT)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = TEXT_MID)
                        }
                      >
                        <Phone size={11} style={{ color: GOLD_LIGHT }} />
                        Call Us
                      </a>
                      <div
                        className="w-px h-4"
                        style={{ backgroundColor: BORD_STRONG }}
                      />
                      <a
                        href="https://wa.me/442012345678"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-150"
                        style={{ color: TEXT_MID }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#25D366")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = TEXT_MID)
                        }
                      >
                        <FaWhatsapp size={13} style={{ color: "#25D366" }} />
                        WhatsApp
                      </a>
                      <div
                        className="w-px h-4"
                        style={{ backgroundColor: BORD_STRONG }}
                      />
                      <Link
                        href="/company/contact"
                        className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-150"
                        style={{ color: TEXT_MID }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = GOLD_LIGHT)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = TEXT_MID)
                        }
                      >
                        <MapPin size={11} style={{ color: GOLD_LIGHT }} />
                        Book a Call
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust badges row beneath form */}
            <motion.div
              className="flex items-center justify-center gap-5 mt-5 flex-wrap"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div
                className="flex items-center gap-1.5"
                style={{ color: TEXT_DIM }}
              >
                <ShieldCheck size={11} style={{ color: GOLD_LIGHT }} />
                <span className="text-[10.5px] font-bold tracking-[0.16em] uppercase">
                  FCA-Aligned
                </span>
              </div>
              <div
                className="w-px h-3"
                style={{ backgroundColor: BORD_STRONG }}
              />
              <div
                className="flex items-center gap-1.5"
                style={{ color: TEXT_DIM }}
              >
                <FileCheck size={11} style={{ color: GOLD_LIGHT }} />
                <span className="text-[10.5px] font-bold tracking-[0.16em] uppercase">
                  AML &amp; KYC
                </span>
              </div>
              <div
                className="w-px h-3"
                style={{ backgroundColor: BORD_STRONG }}
              />
              <div
                className="flex items-center gap-1.5"
                style={{ color: TEXT_DIM }}
              >
                <Lock size={11} style={{ color: GOLD_LIGHT }} />
                <span className="text-[10.5px] font-bold tracking-[0.16em] uppercase">
                  GDPR Compliant
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ══ TICKER ANIMATION KEYFRAME ══════════════════════════════════ */}
      <style jsx>{`
        @keyframes bwTickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}