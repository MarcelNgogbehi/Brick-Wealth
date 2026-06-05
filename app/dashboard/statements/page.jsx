"use client";

// app/dashboard/statements/page.jsx
//
// Investor: Annual Statement of Activity — an "Account Statements" experience.
// Pick a period, review the summary KPIs and a unified transaction ledger,
// then export the formal PDF. Record-and-report only — figures are cost basis,
// not market appraisal, and disclosures say so honestly.

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Download, AlertCircle, Inbox, ChevronDown, TrendingUp, TrendingDown,
  ArrowDownLeft, ArrowUpRight, Wallet, Filter, Coins, ArrowLeftRight, Receipt,
  ChevronLeft, ChevronRight, HelpCircle, ArrowRight,
} from "lucide-react";
import { CountUp, NUM, fadeUp, stagger } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";

/* ─── Design tokens (aligned with the investor dashboard) ─────────── */
const C = {
  bg:          "#F0F1F5",
  surface:     "#FFFFFF",
  dark:        "#060E1C",
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
  goldLight:   "#F7F0E2",
  goldDim:     "rgba(201,164,74,0.10)",
  ink:         "#060E1C",
  secondary:   "#4B5768",
  muted:       "#8896A8",
  faint:       "#AEB7C4",
  border:      "rgba(6,14,28,0.07)",
  borderMid:   "rgba(6,14,28,0.12)",
  track:       "#EDEFF3",
  success:     "#0A6E4F",
  successDim:  "rgba(10,110,79,0.09)",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.08)",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const CS = { GBP: "£", USD: "$", EUR: "€" };
const PAGE_SIZE = 8;

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const TYPE_META = {
  dividend:     { label: "Dividend",       tone: "success", Icon: Coins },
  subscription: { label: "New Investment", tone: "dark",    Icon: ArrowUpRight },
  disposal:     { label: "Distribution",   tone: "gold",    Icon: ArrowLeftRight },
  acquisition:  { label: "Acquisition",    tone: "neutral", Icon: ArrowDownLeft },
};

function periodBounds(taxYear, system) {
  if (!taxYear) return { start: null, end: null };
  if (system === "CALENDAR") {
    const y = parseInt(taxYear, 10);
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
  }
  const m = String(taxYear).match(/(\d{4})/);
  const y = m ? parseInt(m[1], 10) : null;
  if (!y) return { start: null, end: null };
  return { start: new Date(y, 3, 6), end: new Date(y + 1, 3, 5) };
}
function shortDate(d) { return d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }

export default function StatementsPage() {
  const [years, setYears] = useState({ uk: [], calendar: [] });
  const [system, setSystem] = useState("UK_SA");
  const [taxYear, setTaxYear] = useState("");
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/statements?action=years", { credentials: "same-origin" });
        const data = await res.json();
        if (data.success) {
          setYears(data.years || { uk: [], calendar: [] });
          const ukList = data.years?.uk || [];
          if (ukList.length > 0) setTaxYear(ukList[0]);
        }
      } catch (err) { setError(err.message); }
      setLoading(false);
    })();
  }, []);

  const switchSystem = useCallback((newSystem) => {
    setSystem(newSystem);
    const list = newSystem === "UK_SA" ? years.uk : years.calendar;
    setTaxYear(list[0] || "");
    setStatement(null);
  }, [years]);

  useEffect(() => {
    if (!taxYear) return;
    (async () => {
      setError(null); setStatement(null); setLoadingStatement(true);
      try {
        const res = await fetch(`/api/dashboard/statements?taxYear=${encodeURIComponent(taxYear)}&system=${system}`, { credentials: "same-origin" });
        const data = await res.json();
        if (data.success) setStatement(data.statement);
        else setError(data.message || "Failed to load statement");
      } catch (err) { setError(err.message); }
      setLoadingStatement(false);
    })();
  }, [taxYear, system]);

  async function downloadPdf() {
    if (!taxYear) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/dashboard/statements", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin", body: JSON.stringify({ taxYear, system }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || "Failed to generate PDF"); }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `brick-and-wealth-annual-statement-${String(taxYear).replace("/", "-")}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    } catch (err) { setError(err.message); }
    setDownloading(false);
  }

  const yearList = system === "UK_SA" ? years.uk : years.calendar;
  const cs = CS[statement?.summary?.currency] || "£";

  if (loading) {
    return <div className="grid place-items-center py-32"><Loader2 size={22} className="animate-spin" style={{ color: C.gold }} /></div>;
  }

  const hasNoData = years.uk.length === 0 && years.calendar.length === 0;

  return (
    <div className="space-y-6">

      {/* ── Title + controls ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Investor Reporting</p>
          <h1 className="text-[34px] sm:text-[44px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em" }}>Account Statements</h1>
          <p className="text-[13.5px] mt-2.5 max-w-xl leading-relaxed" style={{ color: C.secondary }}>
            Review your portfolio activity and transactional history — dividends, subscriptions and transfers — by period.
          </p>
        </div>
        {!hasNoData && (
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="inline-flex p-0.5 rounded-xl" style={{ border: `1px solid ${C.borderMid}`, backgroundColor: C.bg }}>
              {[{ value: "UK_SA", label: "UK SA" }, { value: "CALENDAR", label: "Calendar" }].map((opt) => {
                const active = system === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => switchSystem(opt.value)} className="px-3.5 py-2 text-[12px] font-semibold rounded-lg transition-all"
                    style={{ backgroundColor: active ? C.dark : "transparent", color: active ? "#fff" : C.secondary, border: "none", cursor: "pointer" }}>{opt.label}</button>
                );
              })}
            </div>
            <div className="relative">
              <select value={taxYear} onChange={(e) => { setTaxYear(e.target.value); setStatement(null); }} disabled={yearList.length === 0}
                className="appearance-none pl-3.5 pr-9 h-10 text-[13px] font-semibold rounded-xl disabled:opacity-50"
                style={{ border: `1px solid ${C.borderMid}`, outline: "none", color: C.ink, backgroundColor: C.surface, minWidth: 160, cursor: "pointer" }}>
                {yearList.length === 0 ? <option>No periods</option> : yearList.map((y) => <option key={y} value={y}>{system === "UK_SA" ? `Tax Year ${y}` : `Annual ${y}`}</option>)}
              </select>
              <ChevronDown size={15} style={{ color: C.muted, position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button type="button" onClick={downloadPdf} disabled={!statement || downloading}
              className="inline-flex items-center gap-2 px-4 h-10 text-[12.5px] font-bold rounded-xl disabled:opacity-50 transition-transform active:scale-[0.98]"
              style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: downloading ? "wait" : "pointer" }}>
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export
            </button>
          </div>
        )}
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ backgroundColor: C.dangerDim, border: `1px solid rgba(155,44,44,0.18)` }}>
          <AlertCircle size={15} style={{ color: C.danger, flexShrink: 0 }} /><p className="text-[12.5px]" style={{ color: C.danger }}>{error}</p>
        </div>
      )}

      {hasNoData ? (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="py-20 text-center rounded-2xl" style={{ border: `1px dashed ${C.borderMid}`, backgroundColor: C.surface }}>
          <div className="w-14 h-14 grid place-items-center mx-auto mb-4 rounded-2xl" style={{ background: C.goldLight }}><Inbox size={24} strokeWidth={1.6} style={{ color: C.goldDark }} /></div>
          <p className="text-[16px] font-semibold" style={{ color: C.ink }}>No activity to report yet</p>
          <p className="text-[13px] mt-1.5 max-w-md mx-auto leading-relaxed" style={{ color: C.muted }}>Once you have subscriptions, dividend distributions or transfers, your account statements will appear here.</p>
        </motion.div>
      ) : loadingStatement || !statement ? (
        <div className="py-24 text-center"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: C.gold }} /><p className="text-[12.5px] mt-3" style={{ color: C.muted }}>Compiling your statement…</p></div>
      ) : (
        <Statement statement={statement} cs={cs} filter={filter} setFilter={setFilter} />
      )}
    </div>
  );
}

// ── Statement body ───────────────────────────────────────────────────────
function Statement({ statement, cs, filter, setFilter }) {
  const s = statement.summary;
  const [page, setPage] = useState(1);
  const { start, end } = periodBounds(statement.taxYear, statement.system);
  const fmt = (n) => `${cs}${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = (n) => Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cashIn = (s.dividendNet || 0) + (s.disposalsTotal || 0);
  const netCashFlow = cashIn - (s.subscriptionsCommitted || 0);

  const ledger = useMemo(() => {
    const rows = [];
    for (const d of statement.dividends || []) rows.push({ id: `div-${d.id}`, type: "dividend", date: d.paymentDate, name: d.spv?.spvName || d.opportunity?.title || "—", desc: d.label || "Operating Distribution", amount: d.netAmount, meta: d.grossAmount ? `Gross ${fmt(d.grossAmount)}` : null });
    for (const sub of statement.subscriptions || []) rows.push({ id: `sub-${sub.id}`, type: "subscription", date: sub.submittedAt, name: sub.opportunity?.title || sub.spv?.spvName || "—", desc: "Initial Subscription Agreement", amount: -Math.abs(sub.totalAmount), meta: `${Number(sub.units).toLocaleString("en-GB")} unit${sub.units === 1 ? "" : "s"}` });
    for (const t of statement.transfers || []) { const isOut = t.direction === "out"; rows.push({ id: `txf-${t.id}`, type: isOut ? "disposal" : "acquisition", date: t.date, name: t.spv?.spvName || t.opportunity?.title || "—", desc: isOut ? `Liquidity event — ${t.counterpartyName || "buyer"}` : "Title acquisition", amount: isOut ? Math.abs(t.amount) : -Math.abs(t.amount), meta: `${Number(t.units).toLocaleString("en-GB")} unit${t.units === 1 ? "" : "s"}` }); }
    rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    return rows;
  }, [statement, cs]);

  const counts = useMemo(() => {
    const c = { all: ledger.length, dividend: 0, subscription: 0, transfer: 0 };
    for (const r of ledger) { if (r.type === "dividend") c.dividend++; else if (r.type === "subscription") c.subscription++; else c.transfer++; }
    return c;
  }, [ledger]);

  const { query } = useDashboardSearch();   // scoped from the topbar
  const visible = useMemo(() => {
    let rows = ledger;
    if (filter === "transfer") rows = ledger.filter((r) => r.type === "disposal" || r.type === "acquisition");
    else if (filter !== "all") rows = ledger.filter((r) => r.type === filter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((r) => `${r.name || ""} ${r.desc || ""}`.toLowerCase().includes(q));
    return rows;
  }, [ledger, filter, query]);

  useEffect(() => { setPage(1); }, [filter, query]);
  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = visible.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── KPI cards ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ArrowUpRight} label="Net Contributions" badge="Capital Deployment"
          value={<><span style={{ color: C.muted }}>{cs}</span><CountUp value={s.subscriptionsCommitted || 0} format={fmtNum} /></>}
          sub={start ? `As of ${shortDate(start)}` : "This period"} />
        <KpiCard icon={Coins} label="Distribution Income" valueColor={C.success}
          value={<><span style={{ color: C.success, opacity: 0.7 }}>+{cs}</span><CountUp value={s.dividendNet || 0} format={fmtNum} /></>}
          sub={`Gross ${fmt(s.dividendGross)} received`} />
        <KpiCard icon={netCashFlow >= 0 ? TrendingUp : TrendingDown} label="Net Cash Flow" valueColor={netCashFlow >= 0 ? C.success : C.ink}
          value={<CountUp value={Math.abs(netCashFlow)} format={(v) => `${netCashFlow < 0 ? "−" : "+"}${cs}${fmtNum(v)}`} />}
          sub="Received less capital deployed" />
        <KpiCard icon={Wallet} label="Holdings Value" accent
          value={<><span style={{ color: C.goldDark }}>{cs}</span><CountUp value={s.holdingsValue || 0} format={fmtNum} /></>}
          sub={`${end ? `As of ${shortDate(end)} · ` : ""}cost basis · ${Number(s.holdingsUnits || 0).toLocaleString("en-GB")} unit${s.holdingsUnits === 1 ? "" : "s"}`} />
      </motion.div>

      {/* ── Transaction ledger ── */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.05)" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 grid place-items-center rounded-xl" style={{ background: C.goldLight }}><Receipt size={16} style={{ color: C.goldDark }} /></div>
            <div>
              <h2 className="text-[16px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Transaction Ledger</h2>
              <p className="text-[11.5px]" style={{ color: C.muted }}>{ledger.length} record{ledger.length === 1 ? "" : "s"} this period</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} style={{ color: C.muted }} className="mr-0.5" />
            {[{ key: "all", label: "All", n: counts.all }, { key: "dividend", label: "Dividends", n: counts.dividend }, { key: "subscription", label: "Investments", n: counts.subscription }, { key: "transfer", label: "Transfers", n: counts.transfer }].map((c) => {
              const active = filter === c.key;
              return (
                <button key={c.key} type="button" onClick={() => setFilter(c.key)} className="px-2.5 py-1 text-[11.5px] font-semibold rounded-lg transition-colors"
                  style={{ border: `1px solid ${active ? C.dark : C.borderMid}`, backgroundColor: active ? C.dark : C.surface, color: active ? "#fff" : C.secondary, cursor: "pointer" }}>
                  {c.label} <span style={{ opacity: 0.6 }}>{c.n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:grid items-center px-5 py-2.5" style={{ gridTemplateColumns: "120px 150px 1fr 1fr 150px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAFB" }}>
          {["Date", "Transaction Type", "Property / Fund", "Description", "Amount"].map((h, i) => (
            <span key={h} className={`text-[10px] tracking-[0.1em] uppercase font-bold ${i === 4 ? "text-right" : ""}`} style={{ color: C.muted }}>{h}</span>
          ))}
        </div>

        {pageRows.length === 0 ? (
          <div className="py-16 text-center"><p className="text-[13px]" style={{ color: C.muted }}>No records in this view.</p></div>
        ) : (
          pageRows.map((r, i) => <LedgerRow key={r.id} r={r} cs={cs} index={i} last={i === pageRows.length - 1} />)
        )}

        {visible.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: "#FAFAFB" }}>
            <p className="text-[11.5px]" style={{ color: C.muted }}>Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visible.length)} of {visible.length} transaction{visible.length === 1 ? "" : "s"}</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <PageBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={14} /></PageBtn>
                <span className="px-2 text-[12.5px] font-bold" style={{ color: C.ink, ...NUM }}>{page}</span>
                <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={14} /></PageBtn>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Disclosures + advisor ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pt-2">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: C.muted }}>Important Disclosures</p>
          <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
            This statement is a record of activity, not tax or investment advice. Past performance is no guarantee of future results.
            Property investments are illiquid and carry a high degree of risk; figures reflect your original investment (cost basis) as at the
            statement date and not current market valuation. Use this document as a reference for your Self Assessment or accountant — we are
            not authorised to provide tax advice.
          </p>
          <p className="text-[11.5px] mt-3" style={{ color: C.faint }}>
            Generated {new Date(statement.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {statement.taxYear} · {statement.system === "CALENDAR" ? "Calendar year" : "UK Self Assessment"} · © {new Date().getFullYear()} Bricks &amp; Wealth Holdings Ltd.
          </p>
        </div>
        <div className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
          <div className="w-9 h-9 grid place-items-center rounded-xl mb-3" style={{ backgroundColor: C.dark }}><HelpCircle size={17} style={{ color: C.gold }} /></div>
          <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>Need help with this statement?</p>
          <p className="text-[12px] mt-1 leading-relaxed flex-1" style={{ color: C.muted }}>Our investor team is available to review these figures with you.</p>
          <Link href="/dashboard/notifications" className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-bold transition-transform hover:scale-[1.02]" style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
            Speak with our team <ArrowRight size={13} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, valueColor = C.ink, sub, badge, accent }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ backgroundColor: accent ? "rgba(201,164,74,0.05)" : C.surface, border: `1px solid ${accent ? "rgba(201,164,74,0.3)" : C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)", containerType: "inline-size" }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: C.muted }}>{label}</span>
        <span className="w-7 h-7 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: accent ? C.goldLight : C.bg }}>
          <Icon size={14} strokeWidth={2} style={{ color: accent ? C.goldDark : C.secondary }} />
        </span>
      </div>
      <div className="font-bold leading-none whitespace-nowrap" style={{ color: valueColor, letterSpacing: "-0.02em", fontSize: "clamp(15px, 9.2cqi, 28px)", ...NUM }}>{value}</div>
      {badge && <span className="inline-block mt-2.5 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase rounded" style={{ backgroundColor: C.goldDim, color: C.goldDark }}>{badge}</span>}
      {sub && <p className="text-[11px] mt-2.5" style={{ color: C.muted }}>{sub}</p>}
    </div>
  );
}

// ── Ledger row ──────────────────────────────────────────────────────────
function LedgerRow({ r, cs, index, last }) {
  const meta = TYPE_META[r.type] || TYPE_META.dividend;
  const positive = r.amount >= 0;
  const amountStr = `${positive ? "+" : "−"}${cs}${Math.abs(Number(r.amount || 0)).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dateStr = r.date ? new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group grid grid-cols-[1fr_auto] md:grid-cols-[120px_150px_1fr_1fr_150px] items-center gap-x-3 gap-y-1 px-5 py-3.5 transition-colors"
      style={{ borderBottom: last ? "none" : `1px solid ${C.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFB")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      <div className="order-1 md:order-none text-[12.5px] font-medium" style={{ color: C.secondary }}>{dateStr}</div>
      <div className="order-3 md:order-none col-span-2 md:col-span-1"><TypeBadge meta={meta} /></div>
      <div className="order-2 md:order-none text-right md:text-left min-w-0">
        <div className="text-[13.5px] font-bold truncate" style={{ color: C.ink }}>{r.name}</div>
        <div className="md:hidden text-[11.5px] mt-0.5" style={{ color: C.muted }}>{r.desc}</div>
      </div>
      <div className="hidden md:block min-w-0">
        <div className="text-[12.5px] truncate" style={{ color: C.secondary }}>{r.desc}</div>
        {r.meta && <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{r.meta}</div>}
      </div>
      <div className="order-4 md:order-none col-span-2 md:col-span-1 text-right">
        <span className="text-[14px] font-bold" style={{ color: positive ? C.success : C.ink, ...NUM }}>{amountStr}</span>
      </div>
    </motion.div>
  );
}

function TypeBadge({ meta }) {
  const TONES = {
    success: { bg: C.successDim, fg: C.success, br: "rgba(10,110,79,0.18)" },
    dark:    { bg: C.dark,       fg: "#fff",     br: C.dark },
    gold:    { bg: C.goldLight,  fg: C.goldDark, br: "rgba(201,164,74,0.28)" },
    neutral: { bg: "#F2F3F5",    fg: C.secondary, br: C.borderMid },
  };
  const t = TONES[meta.tone] || TONES.neutral;
  const Icon = meta.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full whitespace-nowrap" style={{ backgroundColor: t.bg, color: t.fg, border: `1px solid ${t.br}` }}>
      <Icon size={11} strokeWidth={2.4} /> {meta.label}
    </span>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="h-8 w-8 grid place-items-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.borderMid}`, color: C.secondary, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}
