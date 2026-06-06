"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRegisterInterest } from "@/components/RegisterInterestModal";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
} from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const NAVY_700 = "#15326B";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const TEXT_MID = "rgba(255,255,255,0.62)";
const WHITE = "#FFFFFF";

// ─── Stats (4 trust signals) ─────────────────────────────────────────────────
const STATS = [
  { icon: Building2, value: "12", label: "Live UK SPVs" },
  { icon: TrendingUp, value: "8.4%", label: "Avg Target Yield" },
  { icon: Users, value: "240+", label: "Approved Investors" },
  { icon: ShieldCheck, value: "100%", label: "Ring-Fenced & Audited" },
];

// ═════════════════════════════════════════════════════════════════════════════
// TRUST BAND — slim, conversion-focused
// ═════════════════════════════════════════════════════════════════════════════
export default function TrustBand() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { open: openRegisterInterest } = useRegisterInterest();

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        backgroundColor: NAVY_950,
        fontFamily: "var(--font-montserrat), sans-serif",
        padding: "100px 0",
      }}
      aria-labelledby="trust-band-heading"
    >
      {/* ══ DECORATIVE BACKGROUND ══════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Subtle grid */}
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

        {/* Gold radial glow — top right */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[400px] opacity-[0.08]"
          style={{
            background: `radial-gradient(ellipse at top right, ${GOLD} 0%, transparent 60%)`,
          }}
        />

        {/* Italic ghost numeral — chapter mark */}
        <div
          className="absolute -left-8 top-1/2 -translate-y-1/2 select-none leading-none pointer-events-none"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(180px, 26vw, 360px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(201,162,74,0.07)",
            userSelect: "none",
          }}
        >
          III
        </div>
      </div>

      {/* ══ TOP GOLD RULE ═══════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD} 70%, transparent 100%)`,
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1300px] mx-auto px-5 sm:px-8 xl:px-10">
        {/* ══ HEADER ROW ═════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-end mb-16">
          {/* LEFT — eyebrow + headline + body */}
          <div>
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div
                className="w-8 h-px"
                style={{ backgroundColor: GOLD_LIGHT }}
              />
              <span
                className="text-[11px] font-bold tracking-[0.32em] uppercase"
                style={{ color: GOLD_LIGHT }}
              >
                Why Brick &amp; Wealth
              </span>
            </motion.div>

            <motion.h2
              id="trust-band-heading"
              className="leading-[0.96] mb-6"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontWeight: 500,
                fontSize: "clamp(40px, 5.5vw, 72px)",
                letterSpacing: "-0.018em",
                color: WHITE,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.75,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Property investment,{" "}
              <em
                style={{
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                done quietly.
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
                      delay: 0.7,
                      ease: "easeInOut",
                    }}
                  />
                </svg>
              </em>
            </motion.h2>

            <motion.p
              className="leading-[1.7] max-w-xl"
              style={{
                fontSize: "15px",
                fontWeight: 300,
                color: "rgba(255,255,255,0.78)",
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              We give carefully selected investors structured access to UK
              property opportunities through ring-fenced SPVs — each one
              registered at Companies House, fully documented, and
              independently reviewed before it ever reaches your dashboard.
            </motion.p>
          </div>

          {/* RIGHT — quick CTA pair */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link
              href="/company"
              className="group flex items-center justify-between gap-3 px-5 py-4 transition-all duration-200"
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
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.24em] uppercase mb-1"
                  style={{ color: GOLD_LIGHT }}
                >
                  Our Story
                </p>
                <p
                  className="text-[13.5px] font-semibold"
                  style={{ color: WHITE }}
                >
                  Read about Brick &amp; Wealth
                </p>
              </div>
              <ArrowRight
                size={14}
                style={{ color: GOLD_LIGHT }}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/education"
              className="group flex items-center justify-between gap-3 px-5 py-4 transition-all duration-200"
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
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.24em] uppercase mb-1"
                  style={{ color: GOLD_LIGHT }}
                >
                  Learn First
                </p>
                <p
                  className="text-[13.5px] font-semibold"
                  style={{ color: WHITE }}
                >
                  Explore the investor library
                </p>
              </div>
              <ArrowRight
                size={14}
                style={{ color: GOLD_LIGHT }}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>

        {/* ══ STATS STRIP ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex items-center gap-4 p-5 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: "2px",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.4 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                borderColor: GOLD_BORD,
                background: "rgba(201,162,74,0.04)",
              }}
            >
              {/* Gold corner accents */}
              <div
                className="absolute top-0 left-0 w-6 h-px"
                style={{ background: GOLD, opacity: 0.6 }}
                aria-hidden="true"
              />
              <div
                className="absolute top-0 left-0 w-px h-6"
                style={{ background: GOLD, opacity: 0.6 }}
                aria-hidden="true"
              />

              <div
                className="w-11 h-11 grid place-items-center flex-shrink-0"
                style={{
                  background: GOLD_DIM,
                  border: `1px solid ${GOLD_BORD}`,
                  borderRadius: "1px",
                }}
              >
                <stat.icon size={16} style={{ color: GOLD_LIGHT }} />
              </div>
              <div>
                <p
                  className="leading-none tracking-[-0.01em] mb-1.5"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontWeight: 500,
                    fontSize: "32px",
                    color: WHITE,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[11px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: TEXT_MID }}
                >
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ══ FINAL CTA BAND ═════════════════════════════════════════════ */}
        <motion.div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${NAVY_900} 0%, ${NAVY_700} 100%)`,
            border: `1px solid ${GOLD_BORD}`,
            borderLeft: `3px solid ${GOLD}`,
            borderRadius: "1px",
          }}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.7,
            delay: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Decorative grid */}
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

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 md:p-12">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: GOLD_LIGHT }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <p
                  className="text-[11px] font-bold tracking-[0.28em] uppercase"
                  style={{ color: GOLD_LIGHT }}
                >
                  Ready to begin?
                </p>
              </div>
              <h3
                className="leading-[1.05] mb-3"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontWeight: 500,
                  fontSize: "clamp(26px, 3.5vw, 40px)",
                  color: WHITE,
                  letterSpacing: "-0.01em",
                }}
              >
                Two ways to{" "}
                <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>
                  start.
                </em>
              </h3>
              <p
                className="text-[14px] leading-relaxed max-w-2xl"
                style={{ color: TEXT_MID }}
              >
                Register your interest and join the waitlist for invitation
                review, or explore live opportunities to see exactly what
                we&apos;re building.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => openRegisterInterest("home-trustband")}
                className="group inline-flex items-center gap-2 px-7 py-4 text-[11.5px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: GOLD,
                  color: NAVY_900,
                  borderRadius: "2px",
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
                Register Interest
                <ArrowUpRight
                  size={12}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-7 py-4 text-[11.5px] font-bold tracking-[0.12em] uppercase whitespace-nowrap border transition-all duration-200"
                style={{
                  color: WHITE,
                  borderColor: "rgba(255,255,255,0.22)",
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD_LIGHT;
                  e.currentTarget.style.background = GOLD_DIM;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.22)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Browse Opportunities
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══ BOTTOM GOLD RULE ═══════════════════════════════════════════ */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD} 70%, transparent 100%)`,
          opacity: 0.3,
        }}
        aria-hidden="true"
      />
    </section>
  );
}