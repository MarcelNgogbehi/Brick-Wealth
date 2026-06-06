"use client";

// ═══════════════════════════════════════════════════════════════════════════
// LegalShell — premium, reusable presentation layer for every legal document.
//
// Each /legal/* page provides a declarative `doc` object; this shell renders a
// branded hero, a sticky table of contents (auto-highlighting on scroll), the
// document body, cross-links to sibling policies, and a regulated-entity
// footer. Keeping the chrome here means the individual policy pages stay pure
// content — easy to read, review, and version.
// ═══════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, ShieldCheck, Printer, FileText, ChevronRight,
  Mail, Sparkles, CheckCircle2,
} from "lucide-react";

// ─── Tokens ──────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const WHITE = "#FFFFFF";

// Every legal document in the suite — used for the cross-link footer.
export const LEGAL_DOCS = [
  { slug: "terms", title: "Terms of Service", blurb: "The agreement governing your use of the platform." },
  { slug: "privacy", title: "Privacy Policy", blurb: "How we collect, use, and protect your personal data." },
  { slug: "risk", title: "Risk Warning", blurb: "The risks of property investment you must understand." },
  { slug: "data-processing", title: "KYC Data Processing", blurb: "How we handle your identity-verification data." },
  { slug: "cookies", title: "Cookie Policy", blurb: "The cookies we use and how to control them." },
];

function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="legal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <path d="M22 4 L36 12 L22 20 L8 12 Z" fill="url(#legal-gold)" stroke={GOLD_DARK} strokeWidth="0.5" />
      <path d="M22 14 L36 22 L22 30 L8 22 Z" fill="url(#legal-gold)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.92" />
      <path d="M22 24 L36 32 L22 40 L8 32 Z" fill="url(#legal-gold)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.84" />
    </svg>
  );
}

// ─── Content block renderer ──────────────────────────────────────────
// A section's `body` is an array of blocks. A plain string is a paragraph;
// objects unlock sub-headings, lists, callouts, and tables.
function Block({ block }) {
  if (typeof block === "string") {
    return <p className="leading-[1.85] text-[14.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>{block}</p>;
  }
  if (block.h3) {
    return (
      <h3 className="text-[16px] font-bold tracking-[0.01em] mt-2" style={{ color: WHITE }}>
        {block.h3}
      </h3>
    );
  }
  if (block.note) {
    return (
      <div className="flex items-start gap-3 px-5 py-4" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "2px" }}>
        <Sparkles size={15} style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 2 }} />
        <p className="leading-[1.75] text-[13.5px]" style={{ color: "rgba(255,255,255,0.82)" }}>{block.note}</p>
      </div>
    );
  }
  if (block.list) {
    return (
      <ul className="flex flex-col gap-2.5">
        {block.list.map((item, i) => (
          <li key={i} className="flex items-start gap-3 leading-[1.75] text-[14px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            <CheckCircle2 size={14} style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 4 }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.ol) {
    return (
      <ol className="flex flex-col gap-2.5">
        {block.ol.map((item, i) => (
          <li key={i} className="flex items-start gap-3 leading-[1.75] text-[14px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            <span className="grid place-items-center text-[10.5px] font-bold flex-shrink-0 mt-0.5"
              style={{ width: 20, height: 20, color: NAVY_900, background: GOLD_LIGHT, borderRadius: "2px" }}>
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.table) {
    return (
      <div className="overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {block.table.head.map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: GOLD_LIGHT, background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="px-4 py-3 align-top text-[13px] leading-[1.6]"
                    style={{ color: "rgba(255,255,255,0.72)", borderBottom: r < block.table.rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", borderRight: c < row.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

// ─── Main shell ──────────────────────────────────────────────────────
export default function LegalShell({ doc }) {
  const { eyebrow, title, summary, version, updated, keyPoints, sections, contactEmail } = doc;
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const sectionRefs = useRef({});

  // Highlight the TOC entry for whichever section is currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const siblings = useMemo(
    () => LEGAL_DOCS.filter((d) => d.slug !== doc.slug),
    [doc.slug]
  );

  return (
    <main className="min-h-screen relative" style={{ fontFamily: "var(--font-montserrat), sans-serif", backgroundColor: NAVY_950 }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,162,74,0.10) 0%, transparent 60%), linear-gradient(180deg, ${NAVY_900} 0%, ${NAVY_950} 100%)` }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Brick & Wealth — home">
            <LogoMark size={34} />
            <span className="font-extrabold text-[14px] tracking-[0.04em] uppercase text-white hidden sm:block">
              Brick<span className="mx-0.5" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 500, fontSize: "16px", color: GOLD_LIGHT }}>&amp;</span>Wealth
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => typeof window !== "undefined" && window.print()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-[10.5px] font-bold tracking-[0.16em] uppercase transition-all"
              style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "2px", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
              <Printer size={12} /> Print
            </button>
            <Link href="/portal" className="inline-flex items-center gap-2 px-4 py-2 text-[10.5px] font-bold tracking-[0.16em] uppercase transition-all group"
              style={{ color: NAVY_900, background: GOLD, borderRadius: "2px" }}>
              <ArrowLeft size={11} className="transition-transform group-hover:-translate-x-0.5" /> Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
            <ShieldCheck size={12} style={{ color: GOLD_LIGHT }} />
            <span className="text-[10.5px] font-bold tracking-[0.32em] uppercase" style={{ color: GOLD_LIGHT }}>{eyebrow || "Legal"}</span>
          </div>
          <h1 className="leading-[0.98] mb-5" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(40px, 6vw, 68px)", letterSpacing: "-0.02em", color: WHITE }}>
            {title}
          </h1>
          {summary && (
            <p className="max-w-2xl text-[15px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.62)" }}>{summary}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6">
            {version && (
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                Version <span style={{ color: GOLD_LIGHT }}>{version}</span>
              </span>
            )}
            {updated && (
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                Last updated <span style={{ color: WHITE }}>{updated}</span>
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Body grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pb-24 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 lg:gap-14">

        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-4" style={{ color: GOLD_LIGHT }}>On this page</p>
            <nav className="flex flex-col gap-0.5">
              {sections.map((s, i) => {
                const active = activeId === s.id;
                return (
                  <a key={s.id} href={`#${s.id}`}
                    className="group flex items-center gap-2.5 py-2 pl-3 text-[12.5px] transition-all"
                    style={{ color: active ? WHITE : "rgba(255,255,255,0.5)", borderLeft: `2px solid ${active ? GOLD : "rgba(255,255,255,0.1)"}`, fontWeight: active ? 600 : 500 }}>
                    <span className="tabular-nums text-[10px] font-bold" style={{ color: active ? GOLD_LIGHT : "rgba(255,255,255,0.3)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.heading}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Key points */}
          {keyPoints?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-12 p-6 sm:p-7" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderTop: `2px solid ${GOLD}`, borderRadius: "2px" }}>
              <p className="text-[10.5px] font-bold tracking-[0.24em] uppercase mb-4" style={{ color: GOLD_LIGHT }}>At a glance</p>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                {keyPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.78)" }}>
                    <CheckCircle2 size={14} style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 3 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Sections */}
          <div className="flex flex-col gap-14">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id}
                ref={(el) => (sectionRefs.current[section.id] = el)}
                className="scroll-mt-24">
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="tabular-nums text-[12px] font-bold tracking-[0.1em]" style={{ color: GOLD_LIGHT }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-[24px] sm:text-[28px] leading-tight" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, color: WHITE, letterSpacing: "-0.01em" }}>
                    {section.heading}
                  </h2>
                </div>
                <div className="flex flex-col gap-4 sm:pl-7">
                  {section.body.map((block, b) => <Block key={b} block={block} />)}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 justify-between"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 grid place-items-center flex-shrink-0" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "2px" }}>
                <Mail size={18} style={{ color: GOLD_LIGHT }} />
              </div>
              <div>
                <p className="text-[14px] font-bold mb-1" style={{ color: WHITE }}>Questions about this document?</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Our team is happy to help clarify anything here.
                </p>
              </div>
            </div>
            <a href={`mailto:${contactEmail || "legal@brickandwealth.com"}`}
              className="inline-flex items-center gap-2 px-5 py-3 text-[11.5px] font-bold tracking-[0.12em] uppercase flex-shrink-0"
              style={{ color: NAVY_900, background: GOLD, borderRadius: "2px", textDecoration: "none" }}>
              {contactEmail || "legal@brickandwealth.com"} <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Sibling docs */}
          <div className="mt-12">
            <p className="text-[10.5px] font-bold tracking-[0.24em] uppercase mb-5" style={{ color: GOLD_LIGHT }}>Related documents</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/legal/${s.slug}`}
                  className="group flex items-center gap-4 p-4 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", textDecoration: "none" }}>
                  <div className="w-9 h-9 grid place-items-center flex-shrink-0" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "2px" }}>
                    <FileText size={15} style={{ color: GOLD_LIGHT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold truncate" style={{ color: WHITE }}>{s.title}</p>
                    <p className="text-[11.5px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{s.blurb}</p>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "rgba(255,255,255,0.4)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5 mb-3">
                <LogoMark size={28} />
                <span className="font-extrabold text-[13px] tracking-[0.04em] uppercase text-white">Brick &amp; Wealth Holdings</span>
              </div>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Brick &amp; Wealth Holdings Ltd is registered in England &amp; Wales (Company No. 14582930).
                Registered office: London EC2M, United Kingdom. Property investment puts your capital at risk.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: GOLD_LIGHT }}>Legal</p>
              {LEGAL_DOCS.map((d) => (
                <Link key={d.slug} href={`/legal/${d.slug}`} className="text-[12px] transition-colors"
                  style={{ color: doc.slug === d.slug ? GOLD_LIGHT : "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                  {d.title}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-[10.5px] mt-8 pt-6 border-t" style={{ color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.06)" }}>
            © {new Date().getFullYear()} Brick &amp; Wealth Holdings Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
