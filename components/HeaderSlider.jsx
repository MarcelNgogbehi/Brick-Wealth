"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRegisterInterest } from "@/components/RegisterInterestModal";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const WHITE = "#FFFFFF";

// ─── Type tokens ──────────────────────────────────────────────────────────────
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-montserrat), 'Montserrat', sans-serif";

// ─── Trust stats ──────────────────────────────────────────────────────────────
const STATS = [
  { value: "12", label: "Live SPVs", suffix: "" },
  { value: "8.4", label: "Avg Target Yield", suffix: "%" },
  { value: "240", label: "Investors", suffix: "+" },
  { value: "100", label: "Ring-Fenced", suffix: "%" },
];

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ value, suffix = "", duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  const numericValue =
    typeof value === "string" ? parseFloat(value.replace(/[£,]/g, "")) : value;
  const isFloat = numericValue % 1 !== 0;

  useEffect(() => {
    if (!inView) return;
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(numericValue * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, numericValue, duration]);

  const formatted = isFloat
    ? display.toFixed(1)
    : Math.round(display).toLocaleString();

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HERO — editorial, atmospheric, conversion-focused
// ═════════════════════════════════════════════════════════════════════════════
export default function Hero() {
  const heroRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const { open: openRegisterInterest } = useRegisterInterest();

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], ["0%", "15%"]);
  const bgScale = useTransform(scrollY, [0, 600], [1.08, 1.18]);
  const contentY = useTransform(scrollY, [0, 600], ["0%", "-8%"]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: NAVY_950,
        minHeight: "100vh",
      }}
      aria-label="Hero — Brick & Wealth"
    >
      {/* ══ BACKGROUND IMAGE WITH PARALLAX ══════════════════════════════ */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y: bgY, scale: bgScale }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2000&q=85&auto=format&fit=crop"
          alt="UK property investment background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* ══ OVERLAY GRADIENTS ═══════════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to top,
            rgba(6,20,47,0.95) 0%,
            rgba(6,20,47,0.74) 35%,
            rgba(10,31,68,0.46) 65%,
            rgba(10,31,68,0.52) 100%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to right,
            rgba(6,20,47,0.86) 0%,
            rgba(6,20,47,0.42) 50%,
            transparent 85%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 80% 15%,
            rgba(201,162,74,0.22) 0%,
            transparent 60%)`,
        }}
        aria-hidden="true"
      />
      {/* Fine grid texture, masked to centre */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: "84px 84px",
          maskImage:
            "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
        }}
        aria-hidden="true"
      />
      {/* Subtle film grain for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />

      {/* ══ GHOST EDITORIAL WATERMARK ═══════════════════════════════════ */}
      <div
        className="absolute pointer-events-none select-none z-[1] hidden lg:block"
        style={{
          right: "-2%",
          top: "24%",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "clamp(200px, 26vw, 420px)",
          lineHeight: 0.8,
          color: "rgba(255,255,255,0.022)",
        }}
        aria-hidden="true"
      >
        B&amp;W
      </div>

      {/* ══ TOP-RIGHT GEOMETRIC ACCENT ══════════════════════════════════ */}
      <div
        className="absolute top-[100px] right-0 pointer-events-none z-[2]"
        aria-hidden="true"
      >
        <svg
          width="380"
          height="380"
          viewBox="0 0 380 380"
          fill="none"
          opacity="0.07"
        >
          <polygon points="380,0 380,220 160,0" fill={GOLD} />
        </svg>
      </div>

      {/* ══ MAIN CONTENT ═══════════════════════════════════════════════ */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 xl:px-10 flex flex-col min-h-screen"
      >
        {/* Spacer for fixed navbar (44 utility + 84 main = 128px) */}
        <div className="h-[160px] flex-shrink-0" />

        {/* Centered headline + CTAs block */}
        <div className="flex-1 flex flex-col justify-center pb-32">
          {/* Eyebrow */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={loaded ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div
              className="w-10 h-px"
              style={{ background: GOLD_LIGHT }}
              aria-hidden="true"
            />
            <Sparkles size={11} style={{ color: GOLD_LIGHT }} />
            <span
              className="text-[10.5px] font-bold tracking-[0.34em] uppercase"
              style={{ color: GOLD_LIGHT, fontFamily: SANS }}
            >
              Private · Invitation Only · Est. 2026
            </span>
          </motion.div>

          {/* Headline — editorial Cormorant serif display, gold italic accent */}
          <motion.h1
            className="mb-9"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: "clamp(54px, 7.2vw, 120px)",
              lineHeight: 1.06,
              letterSpacing: "0",
              color: WHITE,
              maxWidth: "1120px",
            }}
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {/* Line 1 */}
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={loaded ? { y: "0%" } : {}}
                transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                Own UK Property.
              </motion.span>
            </span>

            {/* Line 2 — "Build [Wealth], Brick by Brick."
                FIX: overflow-hidden is scoped to the INNER text-reveal wrapper
                only. The gold underline lives on a SEPARATE sibling layer in a
                position:relative span (with paddingBottom reserving its room),
                so the clip mask can never crop it. It also draws on via
                pathLength once `loaded` is true — always visible after hydrate. */}
            <span className="block">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={loaded ? { y: "0%" } : {}}
                  transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  Build{" "}
                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      paddingBottom: "0.14em",
                    }}
                  >
                    <em
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontWeight: 500,
                        color: GOLD_LIGHT,
                        letterSpacing: "0.005em",
                        paddingRight: "0.04em",
                      }}
                    >
                      Wealth
                    </em>

                    <motion.svg
                      className="absolute left-0"
                      style={{
                        bottom: "-0.04em",
                        width: "100%",
                        height: "0.22em",
                        overflow: "visible",
                      }}
                      viewBox="0 0 240 16"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="M3 10 Q 60 3, 120 8 T 237 6"
                        stroke={GOLD}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                          loaded
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                        }
                        transition={{
                          duration: 0.9,
                          delay: 1.25,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </motion.svg>
                  </span>
                  ,{" "}
                  <span style={{ display: "inline-block" }}>Brick by Brick.</span>
                </motion.span>
              </span>
            </span>
          </motion.h1>

          {/* Sub copy */}
          <motion.p
            className="mb-11 max-w-2xl"
            style={{
              fontFamily: SANS,
              fontSize: "17px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.7,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            Private, FCA-aligned UK property co-investment through ring-fenced
            SPVs — fully documented, fully transparent, fully on your terms.
          </motion.p>

          {/* CTAs — exactly two, per spec */}
          <motion.div
            className="flex items-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Primary — Register Interest (opens the global modal form) */}
            <button
              type="button"
              onClick={() => openRegisterInterest("hero")}
              className="group inline-flex items-center gap-2.5 h-[60px] px-9 text-[11.5px] font-extrabold tracking-[0.16em] uppercase transition-all duration-300"
              style={{
                fontFamily: SANS,
                backgroundColor: GOLD,
                color: NAVY_900,
                borderRadius: "2px",
                boxShadow: "0 16px 36px -12px rgba(201,162,74,0.65)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = GOLD_LIGHT;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 48px -8px rgba(201,162,74,0.75)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = GOLD;
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 16px 36px -12px rgba(201,162,74,0.65)";
              }}
            >
              Register Interest
              <ArrowUpRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>

            {/* Secondary — Browse Opportunities */}
            <Link
              href="/opportunities"
              className="group inline-flex items-center gap-2.5 h-[60px] px-9 text-[11.5px] font-bold tracking-[0.16em] uppercase border transition-all duration-300"
              style={{
                fontFamily: SANS,
                color: WHITE,
                borderColor: "rgba(255,255,255,0.25)",
                borderRadius: "2px",
                backgroundColor: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = GOLD_LIGHT;
                e.currentTarget.style.color = GOLD_LIGHT;
                e.currentTarget.style.backgroundColor =
                  "rgba(201,162,74,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.25)";
                e.currentTarget.style.color = WHITE;
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.04)";
              }}
            >
              Browse Opportunities (Preview)
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          {/* Quiet trust signal beneath CTAs */}
          <motion.div
            className="flex items-center gap-2.5 mt-8"
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <ShieldCheck size={13} style={{ color: GOLD_LIGHT }} />
            <span
              className="text-[11px] font-medium tracking-[0.01em]"
              style={{ color: "rgba(255,255,255,0.55)", fontFamily: SANS }}
            >
              FCA-aligned · Companies House registered · Independently audited
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══ SCROLL INDICATOR ════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.9, duration: 0.8 }}
        className="absolute bottom-[120px] left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 pointer-events-none z-20"
      >
        <span
          className="text-[9.5px] font-bold tracking-[0.34em] uppercase"
          style={{ color: "rgba(255,255,255,0.4)", fontFamily: SANS }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={13} style={{ color: GOLD_LIGHT }} />
        </motion.div>
      </motion.div>

      {/* ══ STATS STRIP — pinned to bottom (trust signals) ══════════════ */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10 hidden md:block"
        style={{
          backgroundColor: "rgba(6,20,47,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 xl:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map(({ value, label, suffix }, i) => (
              <div
                key={label}
                className="flex items-center gap-3.5 py-5 px-6 first:pl-0 last:pr-0"
                style={{
                  borderRight:
                    i < STATS.length - 1
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "none",
                }}
              >
                <div
                  className="w-[2px] h-10 flex-shrink-0"
                  style={{ backgroundColor: GOLD }}
                  aria-hidden="true"
                />
                <div>
                  <p
                    className="text-white leading-none tracking-[-0.01em] mb-1.5"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: "30px",
                    }}
                  >
                    <Counter value={value} suffix={suffix} />
                  </p>
                  <p
                    className="text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: "rgba(255,255,255,0.5)", fontFamily: SANS }}
                  >
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}