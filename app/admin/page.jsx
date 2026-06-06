"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, animate } from "framer-motion";
import {
  Users, ShieldCheck, AlertTriangle, UserPlus, Inbox,
  CheckCircle2, FileX, ArrowUpRight, ArrowRight, Check,
  Wallet, Briefcase, Building2, Megaphone, Sparkles, BarChart3,
  Landmark, TrendingUp, Layers, MapPin, Activity as ActivityIcon,
  Banknote, Clock,
} from "lucide-react";

// ── Brand system ──────────────────────────────────────────────────────────────
// Disciplined palette: obsidian + navy + gold + warm neutrals.
// Red is reserved strictly for genuine compliance alerts; green for confirmed-good.
const C = {
  obsidian: "#070C18",
  navy:     "#0A1F44",
  navySoft: "#2A4A7F",
  gold:     "#B8923C",
  goldDeep: "#8F6E26",
  goldWash: "#F4ECD8",

  ink:   "#0B1220",
  ink2:  "#3C4456",
  ink3:  "#7B8497",
  hair:  "#ECEBE6",
  hair2: "#F3F2EE",
  paper: "#FFFFFF",
  canvas:"#F5F5F2",

  slate:    "#AEB4C0",
  slateSoft:"#EEF0F3",

  pos:     "#1C7A5E",
  posSoft: "#E7F1EC",
  alert:   "#9B2C2C",
  alertSoft:"#F7EAEA",
  amber:   "#9A6B12",
  amberSoft:"#F6EEDD",
};

const EASE = [0.16, 1, 0.3, 1];
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(n, currency = "GBP") {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e9) return sym + (v / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return sym + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return sym + Math.round(v / 1e3) + "K";
  return sym + Math.round(v).toLocaleString();
}
function ago(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function CountUp({ value = 0, format }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 0.9, ease: EASE, onUpdate: setN });
    return () => c.stop();
  }, [value]);
  return <span style={NUM}>{format ? format(n) : Math.round(n).toLocaleString()}</span>;
}

// ── Masthead ──────────────────────────────────────────────────────────────────

function Masthead({ greeting, summary, attention, syncedLabel, pendingKyc, pendingRegs, loading }) {
  return (
    <motion.header variants={rise} className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(135deg, #070C18 0%, #0a1322 60%, #0c1830 100%)" }}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldDeep} 40%, transparent 85%)` }} />
      <span aria-hidden className="absolute -right-4 -bottom-16 select-none pointer-events-none"
        style={{ fontSize: 220, lineHeight: 1, fontWeight: 800, color: C.gold, opacity: 0.05, fontStyle: "italic" }}>&amp;</span>

      <div className="relative px-6 sm:px-8 py-7 sm:py-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold tracking-[0.24em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            Brick<span style={{ color: C.gold }}>&amp;</span>Wealth · Admin Console
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-bold leading-[1.05] tracking-[-0.02em]" style={{ color: "#fff" }}>
            {greeting}.
          </h1>
          <p className="text-[13.5px] mt-2 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.66)" }}>
            {!loading && <span className="inline-flex w-1.5 h-1.5 rounded-full" style={{ backgroundColor: attention > 0 ? C.gold : C.pos }} />}
            {summary}
          </p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
          <span className="text-[11px] tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>{syncedLabel}</span>
          <div className="flex items-center gap-2.5">
            <DarkButton href="/admin/registrations" label="Registrations" count={pendingRegs} />
            <DarkButton href="/admin/kyc-queue" label="KYC Queue" count={pendingKyc} primary icon={ShieldCheck} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
function DarkButton({ href, label, count, primary, icon: Icon }) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12.5px] font-semibold transition-all"
      style={{
        textDecoration: "none",
        color: primary ? C.obsidian : "rgba(255,255,255,0.92)",
        background: primary ? (h ? "#C9A24A" : C.gold) : (h ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"),
        border: primary ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
      }}>
      {Icon && <Icon size={15} strokeWidth={2} />}
      {label}
      {count > 0 && (
        <span className="grid place-items-center min-w-[20px] h-5 px-1 text-[10.5px] font-bold rounded-full"
          style={{ ...NUM, backgroundColor: primary ? C.obsidian : C.gold, color: primary ? "#fff" : C.obsidian }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

// ── Featured financial metric (dark hero card) ────────────────────────────────

function HeroMetric({ loading, label, value, sub, icon: Icon }) {
  return (
    <motion.div variants={rise} className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[148px]"
      style={{ background: `linear-gradient(150deg, ${C.navy} 0%, #0c2752 100%)` }}>
      <span aria-hidden className="absolute -top-10 -right-8 w-32 h-32 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(184,146,60,0.22), transparent 70%)" }} />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.13em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span className="w-8 h-8 grid place-items-center rounded-lg" style={{ background: "rgba(184,146,60,0.18)", border: "1px solid rgba(184,146,60,0.3)" }}>
          <Icon size={15} strokeWidth={2} style={{ color: C.gold }} />
        </span>
      </div>
      <div className="relative">
        {loading ? (
          <div className="h-9 w-28 rounded-md animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        ) : (
          <div className="text-[32px] font-bold leading-none tracking-[-0.025em]" style={{ color: "#fff", ...NUM }}>{value}</div>
        )}
        {sub && <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Light financial / operational KPI ─────────────────────────────────────────

function Kpi({ loading, label, value, icon: Icon, hint, href, meter, meterColor, attention }) {
  const [h, setH] = useState(false);
  const inner = (
    <motion.div variants={rise} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}
      onHoverStart={() => setH(true)} onHoverEnd={() => setH(false)}
      className="relative h-full p-5 rounded-2xl flex flex-col min-h-[148px]"
      style={{
        backgroundColor: C.paper,
        border: `1px solid ${h ? (attention ? C.gold + "66" : C.hair) : C.hair}`,
        boxShadow: h ? "0 10px 26px rgba(11,18,32,0.07)" : "0 1px 2px rgba(11,18,32,0.03)",
        transition: "box-shadow .25s ease, border-color .2s ease",
      }}>
      {attention ? <span className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full" style={{ backgroundColor: C.gold }} /> : null}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-bold tracking-[0.13em] uppercase" style={{ color: C.ink3 }}>{label}</span>
        <span className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: attention ? C.goldWash : C.hair2 }}>
          <Icon size={15} strokeWidth={2} style={{ color: attention ? C.goldDeep : C.ink2 }} />
        </span>
      </div>
      <div className="flex-1">
        {loading ? <div className="h-9 w-24 rounded-md animate-pulse" style={{ backgroundColor: C.hair2 }} />
          : <div className="text-[32px] font-bold leading-none tracking-[-0.025em]" style={{ color: C.ink, ...NUM }}>{typeof value === "number" ? <CountUp value={value} /> : value}</div>}
      </div>
      {meter != null && !loading && (
        <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: C.hair2 }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: meterColor || C.navy }}
            initial={{ width: 0 }} whileInView={{ width: `${Math.min(meter, 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }} />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px]" style={{ color: C.ink3 }}>{hint}</span>
        {href && <ArrowUpRight size={15} style={{ color: h ? (attention ? C.gold : C.ink2) : C.slate, transition: "color .2s" }} />}
      </div>
    </motion.div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

// ── Panel shell ───────────────────────────────────────────────────────────────

function Panel({ title, subtitle, eyebrow, action, children, bodyClass = "p-5 sm:p-6", className = "" }) {
  return (
    <motion.section variants={rise} className={`rounded-2xl flex flex-col ${className}`}
      style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.hair2}` }}>
          <div className="min-w-0">
            {eyebrow && <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: C.gold }}>{eyebrow}</div>}
            <h2 className="text-[15px] font-bold leading-tight tracking-[-0.01em] truncate" style={{ color: C.ink }}>{title}</h2>
            {subtitle && <p className="text-[12px] mt-0.5 truncate" style={{ color: C.ink3 }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </motion.section>
  );
}

// ── Donut ─────────────────────────────────────────────────────────────────────

function Donut({ segments, total, label = "Total", size = 168, stroke = 18 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const r = (size - stroke) / 2;
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div ref={ref} className="relative grid place-items-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.hair2} strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const frac = seg.value / sum; const offset = acc; acc += frac;
          if (seg.value <= 0) return null;
          return (
            <motion.circle key={seg.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: offset }}
              animate={inView ? { pathLength: Math.max(frac - 0.014, 0), pathOffset: offset } : { pathLength: 0, pathOffset: offset }}
              transition={{ duration: 1.0, ease: EASE, delay: 0.15 + i * 0.12 }} />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[26px] font-bold leading-none tracking-[-0.02em]" style={{ color: C.ink, ...NUM }}>
            {typeof total === "number" ? <CountUp value={total} /> : total}
          </div>
          <div className="text-[9.5px] font-bold tracking-[0.18em] uppercase mt-1.5" style={{ color: C.ink3 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}
function LegendRow({ label, value, total, color, delay, meta }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold min-w-0" style={{ color: C.ink }}>
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="truncate">{label}</span>
        </span>
        <span className="text-[13px] font-bold flex-shrink-0" style={{ color: C.ink2, ...NUM }}>
          {meta != null ? meta : value.toLocaleString()}<span className="ml-1.5 font-semibold" style={{ color: C.ink3 }}>{pct}%</span>
        </span>
      </div>
      <div className="h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: C.hair2 }}>
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.85, ease: EASE, delay }} />
      </div>
    </div>
  );
}

// ── Gauge ─────────────────────────────────────────────────────────────────────

function Gauge({ value = 0, suffix = "%", caption = "activated", size = 196 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const frac = Math.min(Math.max(value / 100, 0), 1);
  const color = value >= 70 ? C.pos : value >= 40 ? C.gold : value > 0 ? C.amber : C.slate;
  return (
    <div ref={ref} className="relative mx-auto" style={{ width: size, height: size / 2 + 14 }}>
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        <path d={d} fill="none" stroke={C.hair2} strokeWidth={stroke} strokeLinecap="round" />
        <motion.path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: frac } : { pathLength: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 grid place-items-center text-center">
        <div>
          <div className="text-[30px] font-bold leading-none tracking-[-0.02em]" style={{ color, ...NUM }}>
            <CountUp value={value} format={(v) => `${Math.round(v)}${suffix}`} />
          </div>
          <div className="text-[9.5px] font-bold tracking-[0.18em] uppercase mt-1" style={{ color: C.ink3 }}>{caption}</div>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline table ────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  draft:  { label: "Underwriting", c: C.amber, bg: C.amberSoft },
  live:   { label: "Live",         c: C.pos,   bg: C.posSoft },
  funded: { label: "Funded",       c: C.navy,  bg: C.slateSoft },
};
function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { label: status || "—", c: C.ink3, bg: C.hair2 };
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ color: s.c, backgroundColor: s.bg }}>{s.label}</span>;
}
function AssetThumb({ url }) {
  return url
    ? <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${C.hair}` }} />
    : <span className="w-10 h-10 rounded-lg grid place-items-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navySoft})` }}>
        <Building2 size={16} style={{ color: C.gold }} />
      </span>;
}
function PipelineSection({ rows, loading }) {
  return (
    <Panel eyebrow="Underwriting" title="Assets in the Pipeline" subtitle="Live & draft opportunities moving through review" bodyClass="p-0"
      action={<Link href="/admin/opportunities" className="text-[12px] font-semibold" style={{ color: C.gold, textDecoration: "none" }}>All opportunities →</Link>}>
      {loading ? (
        <div className="p-5 sm:p-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ backgroundColor: C.hair2 }} />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 px-6">
          <span className="w-12 h-12 grid place-items-center rounded-full mb-3" style={{ backgroundColor: C.hair2 }}><Layers size={22} style={{ color: C.ink3 }} /></span>
          <p className="text-[14px] font-bold" style={{ color: C.ink }}>No assets in the pipeline</p>
          <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Draft or publish an opportunity to see it here.</p>
          <Link href="/admin/opportunities" className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-[12.5px] font-semibold"
            style={{ backgroundColor: C.navy, color: "#fff", textDecoration: "none" }}>Create opportunity <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.hair2}` }}>
                  {["Asset", "Location", "Valuation", "Yield", "Term", "Raise", "Status"].map((h, i) => (
                    <th key={h} className={`text-[10.5px] font-bold tracking-[0.1em] uppercase py-3 px-5 sm:px-6 ${i >= 2 && i <= 5 ? "text-right" : ""}`} style={{ color: C.ink3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.hair2}` }}>
                    <td className="py-3.5 px-5 sm:px-6">
                      <div className="flex items-center gap-3 min-w-0">
                        <AssetThumb url={r.heroImageUrl} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{r.title || "Untitled"}</div>
                          <div className="text-[11px] truncate" style={{ color: C.ink3 }}>{r.companyNumber || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap" style={{ color: C.ink2 }}>
                        <MapPin size={12} style={{ color: C.slate }} />{[r.city, r.country].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 sm:px-6 text-right text-[13px] font-bold whitespace-nowrap" style={{ color: C.ink, ...NUM }}>{money(r.valuation, r.currency)}</td>
                    <td className="py-3.5 px-5 sm:px-6 text-right text-[13px] font-semibold whitespace-nowrap" style={{ color: r.yieldPct != null ? C.pos : C.ink3, ...NUM }}>{r.yieldPct != null ? `${r.yieldPct}%` : "—"}</td>
                    <td className="py-3.5 px-5 sm:px-6 text-right text-[12.5px] whitespace-nowrap" style={{ color: C.ink2, ...NUM }}>{r.termMonths ? `${r.termMonths}mo` : "—"}</td>
                    <td className="py-3.5 px-5 sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.hair2 }}>
                          <div className="h-full rounded-full" style={{ width: `${r.raiseProgress}%`, backgroundColor: C.gold }} />
                        </div>
                        <span className="text-[11.5px] font-semibold w-8 text-right" style={{ color: C.ink2, ...NUM }}>{r.raiseProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 sm:px-6"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y" style={{ borderColor: C.hair2 }}>
            {rows.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-center gap-3">
                  <AssetThumb url={r.heroImageUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold truncate" style={{ color: C.ink }}>{r.title || "Untitled"}</div>
                    <div className="text-[11.5px] truncate" style={{ color: C.ink3 }}>{[r.city, r.country].filter(Boolean).join(", ") || "—"}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[["Valuation", money(r.valuation, r.currency)], ["Yield", r.yieldPct != null ? `${r.yieldPct}%` : "—"], ["Raise", `${r.raiseProgress}%`]].map(([k, v]) => (
                    <div key={k} className="rounded-lg px-2.5 py-2" style={{ backgroundColor: C.canvas }}>
                      <div className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: C.ink3 }}>{k}</div>
                      <div className="text-[13px] font-bold mt-0.5" style={{ color: C.ink, ...NUM }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

// ── Activity feed ─────────────────────────────────────────────────────────────

const ENTITY_ICON = { user: Users, kyc: ShieldCheck, subscription: Wallet, opportunity: Sparkles, spv: Briefcase, property: Building2, distribution: Banknote, announcement: Megaphone, registration: UserPlus };
function humanAction(a) {
  const raw = (a || "").replace(/[._]/g, " ").trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Activity";
}
function ActivityFeed({ items, loading }) {
  return (
    <Panel title="Recent Activity" subtitle="Latest actions across the console" bodyClass="p-2 sm:p-3" action={<Link href="/admin/activity" className="text-[12px] font-semibold" style={{ color: C.gold, textDecoration: "none" }}>View all →</Link>}>
      {loading ? (
        <div className="p-3 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: C.hair2 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10">
          <span className="w-11 h-11 grid place-items-center rounded-full mb-3" style={{ backgroundColor: C.hair2 }}><Clock size={20} style={{ color: C.ink3 }} /></span>
          <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>No activity yet</p>
          <p className="text-[12px] mt-1" style={{ color: C.ink3 }}>Admin actions will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {items.map((it) => {
            const Icon = ENTITY_ICON[it.entityType] || ActivityIcon;
            return (
              <li key={it.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#F5F5F2]">
                <span className="w-8 h-8 grid place-items-center rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: C.hair2 }}>
                  <Icon size={14} strokeWidth={2} style={{ color: C.ink2 }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] leading-snug" style={{ color: C.ink }}>
                    <span className="font-semibold">{it.actorName}</span>
                    <span style={{ color: C.ink2 }}> · {humanAction(it.action)}</span>
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.ink3 }}>{it.entityType}{it.entityId ? ` #${String(it.entityId).slice(0, 8)}` : ""}</p>
                </div>
                <span className="text-[11px] flex-shrink-0 whitespace-nowrap mt-0.5" style={{ color: C.ink3 }}>{ago(it.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// ── Attention list ────────────────────────────────────────────────────────────

function AttentionRow({ href, icon: Icon, title, meta, count, tone, last }) {
  const [h, setH] = useState(false);
  const map = { gold: { c: C.gold, bg: C.goldWash }, amber: { c: C.amber, bg: C.amberSoft }, alert: { c: C.alert, bg: C.alertSoft } };
  const t = map[tone] || map.gold;
  return (
    <Link href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="flex items-center gap-3.5 py-3.5 px-2 transition-colors"
      style={{ textDecoration: "none", borderBottom: last ? "none" : `1px solid ${C.hair2}`, backgroundColor: h ? C.hair2 : "transparent", borderRadius: 8 }}>
      <span className="w-9 h-9 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: t.bg }}>
        <Icon size={16} strokeWidth={2} style={{ color: t.c }} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{title}</div>
        <div className="text-[12px] truncate mt-0.5" style={{ color: C.ink3 }}>{meta}</div>
      </div>
      <span className="text-[15px] font-bold flex-shrink-0" style={{ color: t.c, ...NUM }}>{count}</span>
      <motion.span animate={{ x: h ? 3 : 0 }} transition={{ duration: 0.2 }}><ArrowRight size={15} style={{ color: h ? t.c : C.slate }} /></motion.span>
    </Link>
  );
}

// ── Action tile (vertical — no truncation) ────────────────────────────────────

function Action({ href, label, desc, icon: Icon, badge, primary }) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="relative flex flex-col gap-2.5 p-4 rounded-xl transition-all h-full"
      style={{
        textDecoration: "none",
        backgroundColor: primary ? C.goldWash + "70" : C.paper,
        border: `1px solid ${primary ? C.gold + "55" : h ? C.hair : C.hair2}`,
        boxShadow: h ? "0 6px 16px rgba(11,18,32,0.06)" : "none",
      }}>
      <div className="flex items-center justify-between">
        <span className="w-9 h-9 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: primary ? C.gold : C.hair2 }}>
          <Icon size={16} strokeWidth={2} style={{ color: primary ? "#fff" : C.ink2 }} />
        </span>
        <div className="flex items-center gap-1.5">
          {badge != null && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none" style={{ backgroundColor: C.gold, color: "#fff", ...NUM }}>{badge}</span>}
          <motion.span animate={{ x: h ? 2 : 0, y: h ? -2 : 0 }} transition={{ duration: 0.2 }}><ArrowUpRight size={15} style={{ color: primary || h ? C.gold : C.slate }} /></motion.span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold leading-tight" style={{ color: C.ink }}>{label}</div>
        <div className="text-[11.5px] mt-1 leading-snug" style={{ color: C.ink3 }}>{desc}</div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);

  useEffect(() => {
    let dead = false;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => { if (!dead) { setStats(d.stats); setInsights(d.insights || null); setSyncedAt(new Date()); setLoading(false); } })
      .catch((e) => { if (!dead) { setError(e.message); setLoading(false); } });
    return () => { dead = true; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const total = stats?.totalInvestors ?? 0;
  const activated = stats?.activatedInvestors ?? 0;
  const pendingKyc = stats?.pendingKyc ?? 0;
  const notVerified = stats?.notVerified ?? 0;
  const flagged = stats?.flaggedInvestors ?? 0;
  const rejectedKyc = stats?.rejectedKyc ?? 0;
  const newSignups7d = stats?.newSignups7d ?? 0;
  const pendingRegs = stats?.pendingRegistrations ?? 0;
  const pendingDocs = stats?.pendingKycDocs ?? 0;
  const activationRate = total > 0 ? Math.round((activated / total) * 100) : 0;

  const aum = insights?.aum ?? 0;
  const capitalInPipeline = insights?.capitalInPipeline ?? 0;
  const pipelineCount = insights?.pipelineCount ?? 0;
  const targetRaiseTotal = insights?.targetRaiseTotal ?? 0;
  const occupancyPct = insights?.occupancyPct ?? 0;
  const assetClasses = insights?.assetClasses ?? [];
  const pipeline = insights?.pipeline ?? [];
  const activity = insights?.activity ?? [];

  const attention = pendingKyc + pendingRegs + flagged + rejectedKyc;
  const summary = loading ? "Bringing your console up to date…"
    : attention === 0 ? "You're all caught up — nothing needs review right now."
    : `${attention} item${attention === 1 ? "" : "s"} need your attention today.`;
  const syncedLabel = syncedAt ? `Synced ${syncedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "";

  const awaiting = Math.max(total - activated - pendingKyc, 0);
  const baseDonut = [
    { label: "Activated", value: activated, color: C.navy },
    { label: "KYC in review", value: pendingKyc, color: C.gold },
    { label: "Awaiting activation", value: awaiting, color: C.slate },
  ];
  const fundPalette = [C.navy, C.gold, C.navySoft, C.slate];
  const fundTotal = assetClasses.reduce((s, a) => s + (a.value || 0), 0);
  const fundDonut = assetClasses.map((a, i) => ({ label: a.type, value: a.value || 0, color: fundPalette[i % fundPalette.length], avgYield: a.avgYield }));

  const tasks = [
    pendingKyc > 0 && { href: "/admin/kyc-queue", icon: ShieldCheck, title: "KYC submissions to review", meta: `${pendingDocs} document${pendingDocs === 1 ? "" : "s"} in the queue`, count: pendingKyc, tone: "amber" },
    pendingRegs > 0 && { href: "/admin/registrations", icon: UserPlus, title: "Registrations awaiting approval", meta: `${pendingRegs} applicant${pendingRegs === 1 ? "" : "s"} ready to onboard`, count: pendingRegs, tone: "gold" },
    flagged > 0 && { href: "/admin/investors?flagged=true", icon: AlertTriangle, title: "Investors flagged for review", meta: "AML / compliance check required", count: flagged, tone: "alert" },
    rejectedKyc > 0 && { href: "/admin/investors?kycStatus=rejected", icon: FileX, title: "Rejected KYC follow-ups", meta: "Failed verifications to resolve", count: rejectedKyc, tone: "alert" },
  ].filter(Boolean);

  const actions = [
    { href: "/admin/registrations", label: "Registrations", icon: UserPlus, badge: pendingRegs > 0 ? pendingRegs : null, primary: pendingRegs > 0, desc: pendingRegs > 0 ? `${pendingRegs} awaiting approval` : "Onboard new applicants" },
    { href: "/admin/kyc-queue", label: "KYC Queue", icon: ShieldCheck, badge: pendingKyc > 0 ? pendingKyc : null, primary: pendingKyc > 0, desc: pendingKyc > 0 ? `${pendingKyc} awaiting review` : "Identity & compliance" },
    { href: "/admin/investors", label: "Investors", icon: Users, desc: "Search, filter & manage" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Wallet, desc: "Commitments & funding" },
    { href: "/admin/opportunities", label: "Opportunities", icon: Sparkles, desc: "Live & draft offerings" },
    { href: "/admin/spvs", label: "SPVs", icon: Briefcase, desc: "Vehicles & cap tables" },
    { href: "/admin/properties", label: "Properties", icon: Building2, desc: "Underlying assets" },
    { href: "/admin/distributions", label: "Distributions", icon: Banknote, desc: "Dividends & payouts" },
  ];

  const health = [
    { label: "Activation", value: `${activationRate}%`, good: activationRate >= 60 },
    { label: "Occupancy", value: `${occupancyPct}%`, good: occupancyPct >= 80 },
    { label: "KYC pending", value: pendingKyc, good: pendingKyc <= 5 },
    { label: "Flagged", value: flagged, good: flagged === 0 },
    { label: "Pipeline deals", value: pipelineCount, good: true },
    { label: "New · 7 days", value: newSignups7d, good: true },
  ];

  return (
    <motion.div className="max-w-7xl mx-auto space-y-6" variants={stagger} initial="hidden" animate="show">

      <Masthead greeting={greeting} summary={summary} attention={attention} syncedLabel={syncedLabel} pendingKyc={pendingKyc} pendingRegs={pendingRegs} loading={loading} />

      {error && (
        <motion.div variants={rise} className="px-4 py-3 rounded-xl text-[13px]" style={{ backgroundColor: C.alertSoft, color: C.alert, border: `1px solid ${C.alert}22` }}>
          <strong>Couldn’t load live stats.</strong> {error}
        </motion.div>
      )}

      {/* Financial hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroMetric loading={loading} label="Assets Under Mgmt" value={money(aum)} icon={Landmark} sub={`${occupancyPct}% portfolio occupancy`} />
        <Kpi loading={loading} label="Capital in Pipeline" value={money(capitalInPipeline)} icon={TrendingUp} hint={`${pipelineCount} active subscription${pipelineCount === 1 ? "" : "s"}`} href="/admin/subscriptions" />
        <Kpi loading={loading} label="Target Raise" value={money(targetRaiseTotal)} icon={Layers} hint="Across live & funded SPVs" href="/admin/spvs" />
        <Kpi loading={loading} label="Occupancy" value={`${occupancyPct}%`} icon={Building2} hint="Units allocated vs. issued" meter={occupancyPct} meterColor={C.gold} />
      </div>

      {/* Operational metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi loading={loading} label="Total Investors" value={total} icon={Users} hint={`${newSignups7d} joined this week`} href="/admin/investors" />
        <Kpi loading={loading} label="Activated" value={activated} icon={CheckCircle2} hint={`${activationRate}% of the base`} meter={activationRate} meterColor={C.pos} />
        <Kpi loading={loading} label="KYC in Review" value={pendingKyc} icon={ShieldCheck} hint={`${pendingDocs} documents queued`} href="/admin/kyc-queue" attention={pendingKyc > 0} />
        <Kpi loading={loading} label="Needs Approval" value={pendingRegs} icon={Inbox} hint={flagged > 0 ? `+ ${flagged} flagged` : "Registrations pending"} href="/admin/registrations" attention={pendingRegs > 0 || flagged > 0} />
      </div>

      {/* Fund distribution + Activation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel eyebrow="Allocation" title="Fund Distribution" subtitle="Capital weighting by asset class">
            {fundDonut.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <Donut segments={baseDonut} total={total} label="Investors" />
                <div className="flex-1 w-full space-y-5">
                  <p className="text-[12.5px]" style={{ color: C.ink3 }}>No live asset classes yet — showing investor composition instead.</p>
                  {baseDonut.map((s, i) => <LegendRow key={s.label} label={s.label} value={s.value} total={total} color={s.color} delay={0.25 + i * 0.1} />)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <Donut segments={fundDonut} total={money(fundTotal)} label="Total value" />
                <div className="flex-1 w-full space-y-5">
                  {fundDonut.map((s, i) => (
                    <LegendRow key={s.label} label={s.label} value={s.value} total={fundTotal} color={s.color}
                      meta={`${money(s.value)}${s.avgYield != null ? ` · ${s.avgYield.toFixed(1)}% yield` : ""}`} delay={0.25 + i * 0.1} />
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <Panel eyebrow="Conversion" title="Activation" subtitle="Signup → funded account" action={<BarChart3 size={16} style={{ color: C.ink3 }} />}>
          <Gauge value={activationRate} />
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Mini label="Activated" value={activated} color={C.pos} />
            <Mini label="Not verified" value={notVerified} color={C.slate} />
          </div>
        </Panel>
      </div>

      {/* Pipeline table */}
      <PipelineSection rows={pipeline} loading={loading} />

      {/* Attention + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Needs Attention" subtitle="Your live backlog, most urgent first"
          action={<Link href="/admin/investors" className="text-[12px] font-semibold" style={{ color: C.gold, textDecoration: "none" }}>Investors →</Link>}>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: C.hair2 }} />)}</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <span className="w-12 h-12 grid place-items-center rounded-full mb-3" style={{ backgroundColor: C.posSoft }}><Check size={22} style={{ color: C.pos }} strokeWidth={2.5} /></span>
              <p className="text-[14px] font-bold" style={{ color: C.ink }}>All caught up</p>
              <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>No reviews, approvals or flags pending.</p>
            </div>
          ) : (
            <div>{tasks.map((t, i) => <AttentionRow key={t.title} {...t} last={i === tasks.length - 1} />)}</div>
          )}
        </Panel>

        <ActivityFeed items={activity} loading={loading} />
      </div>

      {/* Jump To */}
      <Panel title="Jump To" subtitle="Every console workflow, one tap away">
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {actions.map((a) => <motion.div key={a.href} variants={rise}><Action {...a} /></motion.div>)}
        </motion.div>
      </Panel>

      {/* Health strip */}
      {!loading && stats && (
        <Panel bodyClass="px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-y-4 gap-x-6">
            <div className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: C.ink3 }}>Platform Health</div>
            <div className="flex items-stretch flex-wrap gap-y-3">
              {health.map((m, i) => (
                <div key={m.label} className="px-4 sm:px-5" style={{ borderLeft: i === 0 ? "none" : `1px solid ${C.hair2}` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.good ? C.pos : C.amber }} />
                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase whitespace-nowrap" style={{ color: C.ink3 }}>{m.label}</span>
                  </div>
                  <div className="text-[20px] font-bold mt-1 leading-none" style={{ color: m.good ? C.ink : C.amber, ...NUM }}>
                    {typeof m.value === "number" ? <CountUp value={m.value} /> : m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div className="text-center text-[11px] pt-1 pb-2" style={{ color: C.slate }}>
        Brick<span style={{ color: C.gold }}>&amp;</span>Wealth Admin Console · figures update on each visit
      </div>
    </motion.div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div className="rounded-xl px-3 py-3 text-center" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hair2}` }}>
      <div className="text-[20px] font-bold leading-none" style={{ color, ...NUM }}><CountUp value={value} /></div>
      <div className="text-[10.5px] font-semibold mt-1.5" style={{ color: C.ink3 }}>{label}</div>
    </div>
  );
}
