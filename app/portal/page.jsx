"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";
import {
  Mail, Lock, Eye, EyeOff, User, AtSign, ArrowUpRight, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, ShieldCheck, FileCheck, Sparkles, Search,
  Building2, Globe, Loader2, ChevronDown, X, Clock, KeyRound,
} from "lucide-react";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const WHITE = "#FFFFFF";
const RED = "#9B2C2C";
const GREEN = "#0F6E56";

// ═════════════════════════════════════════════════════════════════════════════
// COUNTRIES
// ═════════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
  { code: "NG", name: "Nigeria", popular: true },
  { code: "GH", name: "Ghana", popular: true },
  { code: "KE", name: "Kenya", popular: true },
  { code: "ZA", name: "South Africa", popular: true },
  { code: "IN", name: "India", popular: true },
  { code: "PK", name: "Pakistan", popular: true },
  { code: "BD", name: "Bangladesh", popular: true },
  { code: "AE", name: "United Arab Emirates", popular: true },
  { code: "US", name: "United States", popular: true },
  { code: "CA", name: "Canada", popular: true },
  { code: "AU", name: "Australia", popular: true },
  { code: "SG", name: "Singapore", popular: true },
  { code: "HK", name: "Hong Kong", popular: true },
  { code: "IE", name: "Ireland", popular: true },
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" }, { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" }, { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" }, { code: "BH", name: "Bahrain" },
  { code: "BB", name: "Barbados" }, { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" }, { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" }, { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" }, { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" }, { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" }, { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" }, { code: "CM", name: "Cameroon" },
  { code: "TD", name: "Chad" }, { code: "CL", name: "Chile" },
  { code: "CN", name: "China" }, { code: "CO", name: "Colombia" },
  { code: "CG", name: "Congo" }, { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" }, { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" }, { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" }, { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" }, { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" }, { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" }, { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" }, { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" }, { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" }, { code: "IS", name: "Iceland" },
  { code: "ID", name: "Indonesia" }, { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "CI", name: "Ivory Coast" },
  { code: "JM", name: "Jamaica" }, { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" }, { code: "KZ", name: "Kazakhstan" },
  { code: "KW", name: "Kuwait" }, { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" }, { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" }, { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "MK", name: "North Macedonia" }, { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" }, { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" }, { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" }, { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" }, { code: "MX", name: "Mexico" },
  { code: "MD", name: "Moldova" }, { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" }, { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" }, { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" }, { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" }, { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" }, { code: "NE", name: "Niger" },
  { code: "NO", name: "Norway" }, { code: "OM", name: "Oman" },
  { code: "PA", name: "Panama" }, { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" }, { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" }, { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" }, { code: "SL", name: "Sierra Leone" },
  { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" },
  { code: "SO", name: "Somalia" }, { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" }, { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" },
  { code: "TG", name: "Togo" }, { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" }, { code: "TR", name: "Turkey" },
  { code: "UG", name: "Uganda" }, { code: "UA", name: "Ukraine" },
  { code: "UY", name: "Uruguay" }, { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" }, { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" }, { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,60}$/;

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// Map server error codes to user-friendly messages
function getErrorMessage(status, data) {
  if (data?.message) return data.message;

  switch (status) {
    case 400: return "The information you entered is invalid. Please check and try again.";
    case 401: return "Invalid credentials.";
    case 403: return "Your session has expired. Please refresh the page and try again.";
    case 409: return "An account with this email or username already exists.";
    case 429: return "Too many attempts. Please wait a moment and try again.";
    case 500: return "Our servers are having trouble. Please try again in a moment.";
    case 503: return "Service temporarily unavailable. Please try again shortly.";
    default: return `Something went wrong (error ${status}). Please try again.`;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// LOGO MARK
// ═════════════════════════════════════════════════════════════════════════════
function LogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="auth-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <path d="M22 4 L36 12 L22 20 L8 12 Z" fill="url(#auth-gold)" stroke={GOLD_DARK} strokeWidth="0.5" />
      <path d="M22 14 L36 22 L22 30 L8 22 Z" fill="url(#auth-gold)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.92" />
      <path d="M22 24 L36 32 L22 40 L8 32 Z" fill="url(#auth-gold)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.84" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COUNTRY PICKER
// ═════════════════════════════════════════════════════════════════════════════
function CountryPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(() => COUNTRIES.find((c) => c.code === value), [value]);

  const { popular, others } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = COUNTRIES.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
    return { popular: all.filter((c) => c.popular), others: all.filter((c) => !c.popular) };
  }, [search]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-2 block" style={{ color: "rgba(255,255,255,0.55)" }}>
        Country of Residence <span style={{ color: GOLD_LIGHT }}>*</span>
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full h-[52px] flex items-center justify-between px-4 transition-all"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "rgba(155,44,44,0.5)" : open ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
          color: WHITE, fontSize: 13, fontWeight: 500, fontFamily: "inherit",
          borderRadius: "1px", cursor: "pointer",
        }}
        aria-expanded={open} aria-haspopup="listbox">
        <div className="flex items-center gap-3 min-w-0">
          <Globe size={13} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          {selected ? <span className="truncate">{selected.name}</span> : <span style={{ color: "rgba(255,255,255,0.4)" }}>Select your country...</span>}
        </div>
        <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.5)" }} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 z-50 overflow-hidden"
            style={{ backgroundColor: NAVY_900, border: `1px solid ${GOLD_BORD}`, borderTop: `2px solid ${GOLD}`, borderRadius: "1px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.6)" }}
            role="listbox">
            <div className="relative p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Search size={12} className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..." className="w-full h-9 pl-9 pr-9 text-[12.5px] font-medium outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: WHITE, fontFamily: "inherit", borderRadius: "1px" }}
                aria-label="Search countries" />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }} aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
            <ul className="max-h-[260px] overflow-y-auto py-1" style={{ scrollbarWidth: "thin", scrollbarColor: `${GOLD_BORD} transparent` }}>
              {popular.length === 0 && others.length === 0 && (
                <li className="px-4 py-6 text-[12px] text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  No countries match &quot;{search}&quot;
                </li>
              )}
              {popular.length > 0 && !search && (
                <li className="px-4 py-2 text-[9.5px] font-bold tracking-[0.24em] uppercase" style={{ color: GOLD_LIGHT, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  Popular
                </li>
              )}
              {popular.map((c) => (
                <CountryOption key={c.code} country={c} selected={value === c.code} onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }} />
              ))}
              {others.length > 0 && (
                <li className="px-4 py-2 text-[9.5px] font-bold tracking-[0.24em] uppercase" style={{ color: "rgba(255,255,255,0.4)", borderTop: popular.length > 0 ? "1px solid rgba(255,255,255,0.04)" : "none", borderBottom: "1px solid rgba(255,255,255,0.04)", marginTop: popular.length > 0 ? 4 : 0 }}>
                  All Countries
                </li>
              )}
              {others.map((c) => (
                <CountryOption key={c.code} country={c} selected={value === c.code} onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "#FFB8B8" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function CountryOption({ country, selected, onClick }) {
  return (
    <li role="option" aria-selected={selected}>
      <button type="button" onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] font-medium transition-colors"
        style={{
          background: selected ? GOLD_DIM : "transparent",
          color: selected ? GOLD_LIGHT : "rgba(255,255,255,0.78)",
          border: "none", cursor: "pointer", fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}>
        <span>{country.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.35)" }}>{country.code}</span>
          {selected && <CheckCircle2 size={12} style={{ color: GOLD_LIGHT }} />}
        </div>
      </button>
    </li>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHOWCASE PANEL
// ═════════════════════════════════════════════════════════════════════════════
const SHOWCASE = [
  { image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=85&auto=format&fit=crop", name: "The Wilbraham", location: "Manchester · M14", spv: "SPV-008", yield: "8.4%", quote: "I never thought I'd own a piece of UK property at my age — let alone four of them.", investor: "K. Adesanya · Investor since 2026" },
  { image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1800&q=85&auto=format&fit=crop", name: "Holloway Court", location: "London · N7", spv: "SPV-010", yield: "11.2%", quote: "The transparency is what convinced me. Every document, every figure — there for review.", investor: "M. Patel · Investor since 2026" },
  { image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1800&q=85&auto=format&fit=crop", name: "Roundhay Gardens", location: "Leeds · LS8", spv: "SPV-011", yield: "7.9%", quote: "From the diaspora, owning UK property felt impossible. Bricks & Wealth made it considered.", investor: "S. Okonkwo · Investor since 2026" },
];

function ShowcasePanel() {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % SHOWCASE.length), 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full overflow-hidden hidden lg:flex flex-col justify-between" style={{ backgroundColor: NAVY_950 }}>
      <AnimatePresence mode="wait">
        <motion.div key={activeIdx} className="absolute inset-0" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHOWCASE[activeIdx].image} alt={SHOWCASE[activeIdx].name} className="absolute inset-0 w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(6,20,47,0.78) 0%, rgba(10,31,68,0.55) 100%), radial-gradient(ellipse 80% 60% at 30% 30%, rgba(201,162,74,0.18) 0%, transparent 60%)` }} />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)" }} />

      <div className="absolute -left-12 bottom-0 select-none leading-none pointer-events-none" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontStyle: "italic", fontSize: "clamp(220px, 30vw, 420px)", color: "transparent", WebkitTextStroke: "1px rgba(201,162,74,0.06)", userSelect: "none" }}>
        B&W
      </div>

      <div className="relative z-10 p-10 flex items-start justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Bricks & Wealth — home">
          <LogoMark size={40} />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-[16px] tracking-[0.04em] uppercase text-white">
              Bricks<span className="mx-0.5" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 500, fontSize: "20px", color: GOLD_LIGHT }}>&amp;</span>Wealth
            </span>
            <span className="font-semibold text-[14px] tracking-[0.04em] uppercase text-white" style={{ marginTop: "2px" }}>
              Holdings
            </span>
            <span className="mt-1" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 400, fontSize: "11px", letterSpacing: "0.06em", color: GOLD_LIGHT }}>
              Building Wealth, Brick by Brick
            </span>
          </div>
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-[10.5px] font-bold tracking-[0.16em] uppercase transition-all duration-200 group" style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1px" }}>
          <ArrowLeft size={11} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Site
        </Link>
      </div>

      <div className="relative z-10 px-10 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={`mid-${activeIdx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-5">
              <motion.span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#86efac" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-[10px] font-bold tracking-[0.28em] uppercase" style={{ color: GOLD_LIGHT }}>
                Live Now · {SHOWCASE[activeIdx].spv}
              </span>
            </div>
            <h1 className="leading-[0.95] mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(40px, 4vw, 56px)", letterSpacing: "-0.018em", color: WHITE }}>
              {SHOWCASE[activeIdx].name}
            </h1>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[13.5px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{SHOWCASE[activeIdx].location}</span>
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <span className="text-[13px] font-bold tracking-[0.04em]" style={{ color: GOLD_LIGHT }}>{SHOWCASE[activeIdx].yield} target yield</span>
            </div>
            <div className="max-w-md">
              <p className="leading-snug mb-4" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: "rgba(255,255,255,0.92)", letterSpacing: "-0.005em" }}>
                &ldquo;{SHOWCASE[activeIdx].quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
                <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: GOLD_LIGHT }}>{SHOWCASE[activeIdx].investor}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 p-10">
        <div className="grid grid-cols-3 gap-0 mb-8 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1px" }}>
          {[{ v: "12", l: "Live SPVs" }, { v: "240+", l: "Investors" }, { v: "£8.4M+", l: "Raised" }].map((s, i) => (
            <div key={s.l} className="px-5 py-4" style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <p className="leading-none mb-1" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "26px", color: WHITE }}>{s.v}</p>
              <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SHOWCASE.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} className="h-px transition-all duration-500" style={{ width: i === activeIdx ? 48 : 24, background: i === activeIdx ? GOLD : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer" }} aria-label={`Show ${SHOWCASE[i].name}`} />
            ))}
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
            {String(activeIdx + 1).padStart(2, "0")} / {String(SHOWCASE.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH FORM
// ═════════════════════════════════════════════════════════════════════════════
function AuthForm() {
  const [mode, setMode] = useState("login");
  const [state, setState] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // NOTE: We keep the state variable name `email` for register/forgot modes
  // where it really is an email. For login mode, this field accepts BOTH
  // email and username — the server auto-detects via presence of "@".
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [residency, setResidency] = useState("UK");
  const [country, setCountry] = useState("GB");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [focused, setFocused] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      setMode("register");
    }
  }, []);

  // ──────── Real-time username availability agent (debounced 400ms) ───────
  useEffect(() => {
    if (mode !== "register" || !username) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.toLowerCase())}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) {
          setUsernameStatus("idle");
          return;
        }
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch (err) {
        if (err.name !== "AbortError") setUsernameStatus("idle");
      }
    }, 400);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [username, mode]);

  function switchMode(newMode) {
    setMode(newMode);
    setState("idle");
    setErrorMsg("");
    setFieldErrors({});
    setPassword("");
    setShowPassword(false);
  }

  function validate() {
    const errs = {};

    if (mode === "login") {
      // ═══ PATCH 1: Login accepts EITHER email or username ═══════
      // Just check it's at least 3 chars — server validates further
      if (!email) errs.email = "Email or username is required";
      else if (email.trim().length < 3) errs.email = "Too short — please enter your email or username";
      if (!password) errs.password = "Password is required";
    }

    if (mode === "forgot") {
      // Forgot password STILL requires valid email format
      if (!email) errs.email = "Email is required";
      else if (!EMAIL_REGEX.test(email)) errs.email = "Please enter a valid email address";
    }

    if (mode === "register") {
      if (!fullName.trim()) errs.fullName = "Full name is required";
      else if (!NAME_REGEX.test(fullName.trim())) errs.fullName = "Use letters, spaces, hyphens or apostrophes (2–60 chars)";
      if (!username) errs.username = "Username is required";
      else if (!USERNAME_REGEX.test(username)) errs.username = "3–20 characters, letters/numbers/underscore only";
      else if (usernameStatus === "taken") errs.username = "This username is already taken";
      else if (usernameStatus === "checking") errs.username = "Still checking availability...";
      // Register STILL requires valid email format
      if (!email) errs.email = "Email is required";
      else if (!EMAIL_REGEX.test(email)) errs.email = "Please enter a valid email address";
      if (!country) errs.country = "Please select your country";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) {
      setState("error");
      setErrorMsg("Please correct the errors above");
      setTimeout(() => setState("idle"), 4000);
      return;
    }
    setState("loading");

    try {
      let endpoint, payload;
      if (mode === "login") {
        // ═══ PATCH 2: Send "identifier" not "email" ════════════
        // The unified login route accepts both email and username
        endpoint = "/api/auth/login";
        payload = { identifier: email.trim().toLowerCase(), password };
      } else if (mode === "forgot") {
        endpoint = "/api/auth/forgot-password";
        payload = { email: email.trim().toLowerCase() };
      } else {
        endpoint = "/api/auth/register";
        payload = {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          residency,
          country,
          ...(referralCode ? { referralCode } : {}),
        };
      }

      let res;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        console.error("[portal] Network error:", networkErr);
        setErrorMsg("Can't reach our servers. Check your internet connection and try again.");
        setState("error");
        setTimeout(() => setState("idle"), 6000);
        return;
      }

      let data = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          // JSON parse failed
        }
      }

      if (!res.ok) {
        if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setFieldErrors(data.fieldErrors);
        }

        setErrorMsg(getErrorMessage(res.status, data));
        setState("error");
        setTimeout(() => setState("idle"), 6000);
        return;
      }

      setSuccessMessage(data?.message || "");
      setState("success");

      if (mode === "login") {
        // Server returns redirectUrl based on user role:
        // - investor    → /dashboard
        // - admin       → /admin
        // - super_admin → /admin
        //
        // Stamp the inactivity timer so the dashboard doesn't immediately
        // see a stale/missing timestamp and boot the user back out.
        try { localStorage.setItem("bw_last_active", String(Date.now())); } catch {}
        setTimeout(() => {
          window.location.href = data?.redirectUrl || "/dashboard";
        }, 1200);
      }
    } catch (err) {
      console.error("[portal] Unexpected error:", err);
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
      setTimeout(() => setState("idle"), 6000);
    }
  }

  const inputStyle = (field, hasError) => ({
    width: "100%", height: 52,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "rgba(155,44,44,0.5)" : focused === field ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
    color: WHITE, fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    padding: "0 16px", paddingLeft: 44, outline: "none",
    transition: "all 0.2s", borderRadius: "1px",
  });

  // ──────── Success views ────────
  function renderSuccess() {
    if (mode === "register") {
      return (
        <motion.div key="success-register" className="flex flex-col items-center text-center gap-6 py-12 px-6 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px", boxShadow: "0 24px 60px -16px rgba(0,0,0,0.4)" }}
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(201,162,74,0.12) 0%, transparent 60%)" }} />
          <motion.div className="w-16 h-16 grid place-items-center relative" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}>
            <ShieldCheck size={28} style={{ color: GOLD_LIGHT }} />
          </motion.div>
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Application Received</p>
            <h2 className="leading-tight mb-4" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
              Under <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>review.</em>
            </h2>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              {successMessage || "Thank you. Our team will review your request and email you a link to continue once approved."}
            </p>
            <div className="flex items-center justify-center gap-2 px-4 py-3 mt-4" style={{ background: "rgba(201,162,74,0.08)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
              <Clock size={12} style={{ color: GOLD_LIGHT }} />
              <p className="text-[11.5px] font-medium" style={{ color: GOLD_LIGHT }}>
                We&apos;ll email <strong>{email}</strong> once approved
              </p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase mt-2" style={{ color: GOLD_LIGHT }}>
            Return to Homepage <ArrowUpRight size={11} />
          </Link>
        </motion.div>
      );
    }

    if (mode === "forgot") {
      return (
        <motion.div key="success-forgot" className="flex flex-col items-center text-center gap-6 py-12 px-6 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px", boxShadow: "0 24px 60px -16px rgba(0,0,0,0.4)" }}
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <motion.div className="w-16 h-16 grid place-items-center relative" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}>
            <KeyRound size={28} style={{ color: GOLD_LIGHT }} />
          </motion.div>
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Reset Link Sent</p>
            <h2 className="leading-tight mb-4" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
              Check your <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>inbox.</em>
            </h2>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              If an account exists for <span className="font-bold" style={{ color: WHITE }}>{email}</span>, we&apos;ve sent a password reset link to that address.
            </p>
            <div className="flex items-center justify-center gap-2 px-4 py-3 mt-4" style={{ background: "rgba(201,162,74,0.08)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
              <Clock size={12} style={{ color: GOLD_LIGHT }} />
              <p className="text-[11.5px] font-medium" style={{ color: GOLD_LIGHT }}>
                Link expires in <strong>4 hours</strong>
              </p>
            </div>
          </div>
          <button type="button" onClick={() => switchMode("login")} className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase mt-2"
            style={{ color: GOLD_LIGHT, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <ArrowLeft size={11} /> Back to Sign In
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div key="success-login" className="flex flex-col items-center text-center gap-6 py-16 px-6 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-16 h-16 grid place-items-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
          <CheckCircle2 size={28} style={{ color: GOLD_LIGHT }} />
        </motion.div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Welcome Back</p>
          <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
            Signing you in<em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>...</em>
          </h2>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>One moment...</p>
          <Loader2 size={20} className="animate-spin mx-auto mt-4" style={{ color: GOLD_LIGHT }} />
        </div>
      </motion.div>
    );
  }

  const headerByMode = {
    login: { eyebrow: "Sign In", h1: "Welcome", h1Accent: "back.", body: "Sign in to view live opportunities, manage your portfolio, and access your document vault." },
    register: { eyebrow: "Request Account", h1: "Begin your", h1Accent: "journey.", body: "Request access to the platform. Our team will review your application and email you a secure link to continue once approved." },
    forgot: { eyebrow: "Reset Password", h1: "Forgot your", h1Accent: "password?", body: "Enter your email and we'll send you a secure link to reset your password — valid for 4 hours." },
  };

  return (
    <div className="relative h-full overflow-y-auto flex flex-col" style={{ backgroundColor: NAVY_950 }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 80% 0%, rgba(201,162,74,0.12) 0%, transparent 60%), linear-gradient(180deg, ${NAVY_900} 0%, ${NAVY_950} 100%)` }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="lg:hidden relative z-10 p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Bricks & Wealth — home">
          <LogoMark size={32} />
          <span className="font-extrabold text-[14px] tracking-[0.04em] uppercase text-white">
            Bricks<span className="mx-0.5" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 500, fontSize: "16px", color: GOLD_LIGHT }}>&amp;</span>Wealth
          </span>
        </Link>
        <Link href="/" className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>← Back</Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">

          <AnimatePresence mode="wait">
            {state === "success" ? renderSuccess() : (
              <motion.div key={`form-${mode}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <div className="mb-7">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
                    <Sparkles size={11} style={{ color: GOLD_LIGHT }} />
                    <span className="text-[10.5px] font-bold tracking-[0.32em] uppercase" style={{ color: GOLD_LIGHT }}>{headerByMode[mode].eyebrow}</span>
                  </div>
                  <h2 className="leading-[0.96] mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(36px, 4vw, 48px)", letterSpacing: "-0.018em", color: WHITE }}>
                    {headerByMode[mode].h1} <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>{headerByMode[mode].h1Accent}</em>
                  </h2>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{headerByMode[mode].body}</p>
                </div>

                {mode !== "forgot" && (
                  <div className="grid grid-cols-2 mb-6 p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1px" }}>
                    {[{ id: "login", label: "Sign In" }, { id: "register", label: "Create Account" }].map((tab) => {
                      const active = mode === tab.id;
                      return (
                        <button key={tab.id} type="button" onClick={() => switchMode(tab.id)} className="relative py-2.5 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-colors duration-200" style={{ color: active ? NAVY_900 : "rgba(255,255,255,0.7)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", zIndex: 1 }}>
                          {active && (<motion.div layoutId="auth-tab-bg" className="absolute inset-0" style={{ background: GOLD_LIGHT, borderRadius: "1px", zIndex: -1 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />)}
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {mode === "forgot" && (
                  <button type="button" onClick={() => switchMode("login")} className="inline-flex items-center gap-2 mb-6 text-[10.5px] font-bold tracking-[0.16em] uppercase transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>
                    <ArrowLeft size={11} /> Back to Sign In
                  </button>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  {mode === "register" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Full Name <span style={{ color: GOLD_LIGHT }}>*</span>
                      </label>
                      <div className="relative">
                        <User size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle("fullName", !!fieldErrors.fullName)} onFocus={() => setFocused("fullName")} onBlur={() => setFocused(null)} autoComplete="name" maxLength={60} aria-invalid={!!fieldErrors.fullName} />
                      </div>
                      {fieldErrors.fullName && (<p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> {fieldErrors.fullName}</p>)}
                    </div>
                  )}

                  {mode === "register" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Username <span style={{ color: GOLD_LIGHT }}>*</span>
                      </label>
                      <div className="relative">
                        <AtSign size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="your_username" style={{ ...inputStyle("username", !!fieldErrors.username || usernameStatus === "taken"), paddingRight: 44 }} onFocus={() => setFocused("username")} onBlur={() => setFocused(null)} autoComplete="username" maxLength={20} aria-invalid={!!fieldErrors.username || usernameStatus === "taken"} aria-describedby="username-status" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2" id="username-status" aria-live="polite">
                          {usernameStatus === "checking" && <Loader2 size={13} className="animate-spin" style={{ color: GOLD_LIGHT }} />}
                          {usernameStatus === "available" && <CheckCircle2 size={13} style={{ color: "#86efac" }} />}
                          {usernameStatus === "taken" && <AlertCircle size={13} style={{ color: "#FF6B6B" }} />}
                        </div>
                      </div>
                      {fieldErrors.username ? (
                        <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> {fieldErrors.username}</p>
                      ) : usernameStatus === "checking" ? (
                        <p className="text-[11px] flex items-center gap-1.5" style={{ color: GOLD_LIGHT }}><Loader2 size={11} className="animate-spin" /> Checking availability...</p>
                      ) : usernameStatus === "available" ? (
                        <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#86efac" }}><CheckCircle2 size={11} /> Username is available</p>
                      ) : usernameStatus === "taken" ? (
                        <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> Username already exists. Try another.</p>
                      ) : (
                        <p className="text-[10.5px]" style={{ color: "rgba(255,255,255,0.4)" }}>3–20 characters · letters, numbers, underscore</p>
                      )}
                    </div>
                  )}

                  {/* ═══ PATCH 3: Identifier field (email or username for login) ═══ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {mode === "login" ? "Email or Username" : "Email Address"} <span style={{ color: GOLD_LIGHT }}>*</span>
                    </label>
                    <div className="relative">
                      {mode === "login" ? (
                        <AtSign size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
                      ) : (
                        <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
                      )}
                      <input
                        type={mode === "login" ? "text" : "email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={mode === "login" ? "your.email@example.com or username" : "your.name@email.com"}
                        style={inputStyle("email", !!fieldErrors.email)}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                        autoComplete={mode === "login" ? "username" : "email"}
                        aria-required="true"
                        aria-invalid={!!fieldErrors.email}
                      />
                    </div>
                    {fieldErrors.email && (<p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> {fieldErrors.email}</p>)}
                  </div>

                  {mode === "login" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                          Password <span style={{ color: GOLD_LIGHT }}>*</span>
                        </label>
                        <button type="button" onClick={() => switchMode("forgot")} className="text-[10.5px] font-bold tracking-[0.1em] transition-colors"
                          style={{ color: GOLD_LIGHT, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = GOLD_LIGHT)}>
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" style={{ ...inputStyle("password", !!fieldErrors.password), paddingRight: 48 }} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} autoComplete="current-password" aria-required="true" aria-invalid={!!fieldErrors.password} />
                        <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "rgba(255,255,255,0.4)", background: "transparent", border: "none", cursor: "pointer" }} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {fieldErrors.password && (<p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> {fieldErrors.password}</p>)}
                    </div>
                  )}

                  {mode === "register" && (
                    <div className="flex flex-col gap-2.5">
                      <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Location <span style={{ color: GOLD_LIGHT }}>*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["UK", "Diaspora"].map((opt) => (
                          <button key={opt} type="button" onClick={() => { setResidency(opt); setCountry(opt === "UK" ? "GB" : ""); }} className="flex items-center justify-center gap-2 h-11 text-[11.5px] font-bold tracking-[0.08em] uppercase transition-all duration-200" style={{ backgroundColor: residency === opt ? GOLD : "transparent", color: residency === opt ? NAVY_900 : "rgba(255,255,255,0.7)", border: `1px solid ${residency === opt ? GOLD : "rgba(255,255,255,0.14)"}`, borderRadius: "1px", cursor: "pointer", fontFamily: "inherit" }} aria-pressed={residency === opt}>
                            {opt === "UK" ? <Building2 size={11} /> : <Globe size={11} />}
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {mode === "register" && residency === "Diaspora" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <CountryPicker value={country} onChange={setCountry} error={fieldErrors.country} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {state === "error" && errorMsg && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 px-4 py-3" style={{ background: "rgba(155,44,44,0.10)", border: "1px solid rgba(155,44,44,0.3)", borderRadius: "1px" }} role="alert">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={13} style={{ color: "#FF6B6B", flexShrink: 0, marginTop: 1 }} />
                          <p className="text-[12px] leading-snug" style={{ color: "#FFB8B8" }}>{errorMsg}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={state === "loading" || (mode === "register" && usernameStatus === "checking")} className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-60 mt-2" style={{ backgroundColor: GOLD, color: NAVY_900, fontFamily: "inherit", cursor: state === "loading" ? "not-allowed" : "pointer", borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)", border: "none" }}
                    onMouseEnter={(e) => { if (state !== "loading") { e.currentTarget.style.backgroundColor = GOLD_LIGHT; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.transform = ""; }}>
                    {state === "loading" ? <Loader2 size={16} className="animate-spin" style={{ color: NAVY_900 }} /> : (
                      <>
                        {mode === "login" && "Sign In"}
                        {mode === "register" && "Create Account"}
                        {mode === "forgot" && "Send Reset Link"}
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>

                  {mode !== "forgot" && (
                    <p className="text-[12px] text-center mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {mode === "login" ? (<>New to Bricks &amp; Wealth?{" "}<button type="button" onClick={() => switchMode("register")} className="font-bold tracking-[0.04em] transition-colors" style={{ color: GOLD_LIGHT, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "12px" }}>Create an account</button></>) : (<>Already have an account?{" "}<button type="button" onClick={() => switchMode("login")} className="font-bold tracking-[0.04em] transition-colors" style={{ color: GOLD_LIGHT, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "12px" }}>Sign in</button></>)}
                    </p>
                  )}
                </form>

                {mode === "register" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 pt-6 flex items-center justify-center gap-5 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    {[{ Icon: ShieldCheck, label: "FCA-Aligned" }, { Icon: FileCheck, label: "AML & KYC" }, { Icon: Lock, label: "GDPR Compliant" }].map(({ Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <Icon size={11} style={{ color: GOLD_LIGHT }} />
                        <span className="text-[10.5px] font-bold tracking-[0.16em] uppercase">{label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function PortalAuthPage() {
  return (
    <main style={{ fontFamily: "var(--font-montserrat), sans-serif", backgroundColor: NAVY_950, minHeight: "100vh" }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <ShowcasePanel />
        <AuthForm />
      </div>
    </main>
  );
}