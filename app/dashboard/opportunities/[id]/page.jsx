"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Loader2, AlertCircle, MapPin, TrendingUp,
  FileText, Shield, Building2, Sparkles, ImageIcon, Download,
  ExternalLink, ChevronLeft, ChevronRight, Eye, Calendar,
  BarChart3, Info, CheckCircle2, Play,
} from "lucide-react";
import SubscribeButton from "@/app/dashboard/_components/SubscribeButton";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:          "#F0F1F5",
  ink:         "#060E1C",
  secondary:   "#4B5768",
  muted:       "#8896A8",
  border:      "rgba(6,14,28,0.08)",
  borderMid:   "rgba(6,14,28,0.13)",
  surface:     "#FFFFFF",
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
  goldLight:   "#F7F0E2",
  goldDim:     "rgba(201,164,74,0.10)",
  green:       "#0A6E4F",
  greenDim:    "rgba(10,110,79,0.10)",
  greenBright: "#15835F",
  greenLight:  "#F0FDF4",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.08)",
  warning:     "#92400E",
  warningDim:  "rgba(146,64,14,0.07)",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SYM   = { GBP: "£", USD: "$", EUR: "€" };

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function OpportunityDetailPage() {
  const params = useParams();
  const [data,                  setData]                  = useState(null);
  const [viewedDocIds,          setViewedDocIds]          = useState([]);
  const [userKycStatus,         setUserKycStatus]         = useState(null);
  const [existingSubscription,  setExistingSubscription]  = useState(null);
  const [loading,               setLoading]               = useState(true);
  const [error,                 setError]                 = useState(null);
  const [suggestions,           setSuggestions]           = useState([]);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const sRes = await fetch(`/api/dashboard/opportunities?pageSize=3&sortBy=newest`, { credentials: "same-origin" });
        if (sRes.ok) { const sd = await sRes.json(); setSuggestions(sd.opportunities || []); }
      } catch { /* recovery is best-effort */ }
    }
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/opportunities/${params.id}`, { credentials: "same-origin" });
        if (res.status === 404) { setError("This opportunity is no longer available."); await loadSuggestions(); setLoading(false); return; }
        if (!res.ok) throw new Error("We couldn't load this opportunity.");
        const json = await res.json();
        setData(json.opportunity);
        setViewedDocIds(json.viewedDocumentIds || []);
        setUserKycStatus(json.userKycStatus || null);
        setExistingSubscription(json.existingSubscription || null);
      } catch (err) { setError(err.message); await loadSuggestions(); }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error || "Opportunity not found"} suggestions={suggestions} />;

  const spv        = data.spv;
  const property   = spv?.property;
  const symbol     = SYM[spv?.currency] || "£";
  const unitPrice  = Number(spv?.unitPrice || 0);
  const minUnits   = spv?.minimumUnits || 1;
  const minInvest  = unitPrice * minUnits;
  const target     = Number(spv?.targetRaiseAmount || 0);
  const allocated  = spv?.unitsAllocated || 0;
  const raised     = allocated * unitPrice;
  const pct        = target > 0 ? Math.min(100, (raised / target) * 100) : 0;

  const address = [property?.addressLine1, property?.city, property?.region, property?.country]
    .filter(Boolean).join(", ");

  const termLabel = data.termMonths
    ? (data.termMonths % 12 === 0 ? `${data.termMonths / 12} Years` : `${data.termMonths} months`)
    : "—";

  const assetLabel = property?.propertyType
    ? property.propertyType.charAt(0) + property.propertyType.slice(1).toLowerCase().replace(/_/g, " ")
    : "—";

  return (
    <div>
      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 text-[12.5px] mb-5"
        style={{ color: C.muted }}
      >
        <Link href="/dashboard/opportunities" className="transition-colors" style={{ color: C.secondary, textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = C.secondary)}>
          Opportunities
        </Link>
        <ChevronRight size={12} strokeWidth={2} />
        <span style={{ color: C.ink, fontWeight: 600 }}>{data.title}</span>
      </motion.div>

      {/* ── Title row ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4 mb-3"
      >
        <div>
          <h1
            className="text-[28px] sm:text-[34px] leading-tight mb-1.5"
            style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}
          >
            {data.title}
          </h1>
          {address && (
            <p className="flex items-center gap-1.5 text-[13px]" style={{ color: C.secondary }}>
              <MapPin size={13} strokeWidth={1.75} style={{ color: C.gold }} />
              {address}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 hidden sm:block">
          <SubscribeButton
            opportunity={data}
            userKycStatus={userKycStatus}
            existingSubscription={existingSubscription}
            onSubscribed={sub => setExistingSubscription(sub)}
            compact
          />
        </div>
      </motion.div>

      {/* ── Hero image with stat overlay ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="relative mb-6"
        style={{ borderRadius: "16px", overflow: "hidden" }}
      >
        <HeroGallery
          images={property?.images || []}
          heroImageUrl={data.heroImageUrl}
          title={data.title}
        />

        {/* Stat bar overlaid at bottom of hero */}
        <div
          className="absolute bottom-0 left-0 right-0 grid grid-cols-3"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <OverlayStat
            label="Target IRR"
            value={data.projectedReturnPct ? `${data.projectedReturnPct}%` : data.targetYieldPct ? `${data.targetYieldPct}%` : "—"}
          />
          <OverlayStat
            label="Min. Investment"
            value={minInvest > 0 ? `${symbol}${minInvest >= 1000 ? (minInvest / 1000).toFixed(0) + "k" : minInvest.toLocaleString()}` : "—"}
            center
          />
          <OverlayStat
            label="Funding Progress"
            value={target > 0 ? `${pct.toFixed(0)}%` : "—"}
            highlight
          />
        </div>
      </motion.div>

      {/* ── Two column layout ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr,340px] gap-6 lg:gap-8 items-start">

        {/* LEFT ──────────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          {/* 4 metric cards */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <MetricCard label="Est. Annual Yield" value={data.targetYieldPct ? `${data.targetYieldPct}%` : "—"} />
            <MetricCard label="Hold Period" value={termLabel} />
            <MetricCard label="Distribution" value={data.distributionFrequency || "Quarterly"} />
            <MetricCard label="Asset Class"  value={assetLabel} />
          </motion.div>

          {/* Property Overview */}
          {(data.summary || data.fullDescription || property?.story) && (
            <ContentCard>
              <CardTitle>Property Overview</CardTitle>
              <Divider />
              {data.summary && (
                <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.secondary }}>
                  {data.summary}
                </p>
              )}
              {data.fullDescription && (
                <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.secondary, whiteSpace: "pre-wrap" }}>
                  {data.fullDescription}
                </p>
              )}
              {property?.story && (
                <p className="text-[14px] leading-relaxed" style={{ color: C.secondary, whiteSpace: "pre-wrap" }}>
                  {property.story}
                </p>
              )}
            </ContentCard>
          )}

          {/* Walkthrough video */}
          {data.walkthroughVideoUrl && (
            <ContentCard>
              <CardTitle>Property Walkthrough</CardTitle>
              <Divider />
              <div
                className="mt-1 overflow-hidden"
                style={{ borderRadius: "10px", backgroundColor: "#000" }}
              >
                <video
                  src={data.walkthroughVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full"
                  style={{ aspectRatio: "16 / 9", display: "block" }}
                />
              </div>
            </ContentCard>
          )}

          {/* Projected Cash Flows + Documents (side by side) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ContentCard>
              <CardTitle>Projected Cash Flows</CardTitle>
              <CashFlowChart
                termMonths={data.termMonths}
                yieldPct={parseFloat(data.targetYieldPct || 0)}
                returnPct={parseFloat(data.projectedReturnPct || 0)}
                symbol={symbol}
              />
            </ContentCard>

            <ContentCard>
              <CardTitle>Investment Documents</CardTitle>
              {data.documents && data.documents.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {data.documents.slice(0, 4).map(doc => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      opportunityId={params.id}
                      viewed={viewedDocIds.includes(doc.id)}
                      onViewed={docId => setViewedDocIds(p => p.includes(docId) ? p : [...p, docId])}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 py-8 text-center">
                  <FileText size={22} strokeWidth={1.5} style={{ color: C.muted, margin: "0 auto 8px" }} />
                  <p className="text-[12.5px]" style={{ color: C.muted }}>Documents will be added soon.</p>
                </div>
              )}
            </ContentCard>
          </div>

          {/* Location Strategy */}
          {property && (
            <ContentCard>
              <CardTitle>Location Strategy</CardTitle>
              <div
                className="mt-3 aspect-video w-full grid place-items-center relative overflow-hidden"
                style={{
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0D3349 0%, #145A6A 40%, #1A7A7A 100%)",
                }}
              >
                {/* Stylised grid map */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 400 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`v${i}`} x1={i * 22} y1="0" x2={i * 22} y2="200" stroke="#7ECAC8" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 18} x2="400" y2={i * 18} stroke="#7ECAC8" strokeWidth="0.5" />
                  ))}
                  <rect x="80" y="40" width="60" height="28" fill="#1E9999" rx="2" opacity="0.6" />
                  <rect x="160" y="60" width="80" height="20" fill="#1E9999" rx="2" opacity="0.5" />
                  <rect x="260" y="30" width="50" height="40" fill="#1E9999" rx="2" opacity="0.5" />
                  <rect x="120" y="110" width="100" height="30" fill="#1E9999" rx="2" opacity="0.4" />
                </svg>
                {/* Pin */}
                <div className="relative flex flex-col items-center gap-2">
                  <div
                    className="w-8 h-8 grid place-items-center rounded-full"
                    style={{ backgroundColor: C.ink, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                  >
                    <MapPin size={14} strokeWidth={2} style={{ color: "#fff" }} />
                  </div>
                  <div
                    className="px-3 py-1.5 text-[12px] font-semibold"
                    style={{ backgroundColor: "#fff", borderRadius: "6px", color: C.ink, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
                  >
                    {data.title}
                  </div>
                </div>
              </div>
              {property.neighbourhoodHighlights && (
                <p className="text-[12.5px] mt-3 leading-relaxed" style={{ color: C.secondary }}>
                  {property.neighbourhoodHighlights}
                </p>
              )}
              {address && !property.neighbourhoodHighlights && (
                <p className="text-[12.5px] mt-3" style={{ color: C.muted }}>
                  {address}
                </p>
              )}
            </ContentCard>
          )}

          {/* Financials detail */}
          <FinancialsSection data={data} symbol={symbol} />

          {/* SPV */}
          {spv && <SpvSection spv={spv} />}

          {/* Risk */}
          {(data.riskWarning || data.exitStrategy) && <RiskSection data={data} />}

        </div>

        {/* RIGHT ─────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <InvestmentSummaryCard
            data={data}
            symbol={symbol}
            raised={raised}
            target={target}
            pct={pct}
            minInvest={minInvest}
            unitPrice={unitPrice}
            minUnits={minUnits}
            userKycStatus={userKycStatus}
            existingSubscription={existingSubscription}
            onSubscribed={sub => setExistingSubscription(sub)}
          />
          {/* Urgency card */}
          {data.recentInvestorCount > 0 && (
            <div
              className="flex items-start gap-3 p-4"
              style={{ backgroundColor: C.greenLight, border: `1px solid rgba(22,163,74,0.25)`, borderRadius: "12px" }}
            >
              <Info size={16} strokeWidth={1.75} style={{ color: C.greenBright, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12.5px] font-medium leading-snug" style={{ color: C.green }}>
                {data.recentInvestorCount} investor{data.recentInvestorCount !== 1 ? "s" : ""} have committed in the last 24 hours. Round closing soon.
              </p>
            </div>
          )}
          {/* Key dates */}
          {(data.openDate || data.closeDate) && (
            <div
              className="p-4 space-y-2.5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}
            >
              {data.openDate && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span style={{ color: C.muted }}>Opens</span>
                  <span className="font-semibold" style={{ color: C.ink }}>{formatDate(data.openDate)}</span>
                </div>
              )}
              {data.closeDate && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span style={{ color: C.muted }}>Closes</span>
                  <span className="font-semibold" style={{ color: C.ink }}>{formatDate(data.closeDate)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO GALLERY
═══════════════════════════════════════════════════════════════════ */
function HeroGallery({ images, heroImageUrl, title }) {
  const all = images.length > 0
    ? images
    : heroImageUrl ? [{ id: "hero", fileUrl: heroImageUrl, altText: title }] : [];
  const [current, setCurrent] = useState(0);

  if (all.length === 0) {
    return (
      <div
        className="aspect-[16/7] w-full grid place-items-center"
        style={{ backgroundColor: C.goldLight, minHeight: 280 }}
      >
        <ImageIcon size={48} strokeWidth={1.25} style={{ color: C.gold }} />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/7]" style={{ backgroundColor: "#030A14", minHeight: 280 }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={all[current].id}
          src={all[current].fileUrl}
          alt={all[current].altText || title}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {all.length > 1 && (
        <>
          <button type="button" onClick={() => setCurrent(c => (c - 1 + all.length) % all.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center"
            style={{ backgroundColor: "rgba(6,14,28,0.65)", border: "none", borderRadius: "50%", cursor: "pointer", color: "#fff", backdropFilter: "blur(6px)" }}>
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <button type="button" onClick={() => setCurrent(c => (c + 1) % all.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center"
            style={{ backgroundColor: "rgba(6,14,28,0.65)", border: "none", borderRadius: "50%", cursor: "pointer", color: "#fff", backdropFilter: "blur(6px)" }}>
            <ChevronRight size={15} strokeWidth={2} />
          </button>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {all.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrent(i)} style={{
                width: i === current ? 22 : 6, height: 6,
                backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                borderRadius: "999px", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Overlay stat ─────────────────────────────────────────────── */
function OverlayStat({ label, value, center, highlight }) {
  return (
    <div
      className={`py-4 px-5 flex flex-col gap-1 ${center ? "items-center border-x" : ""}`}
      style={{
        borderColor: "rgba(6,14,28,0.07)",
        borderRightWidth: !center ? 1 : 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderStyle: "solid",
      }}
    >
      <p className="text-[9.5px] font-bold tracking-[0.2em] uppercase" style={{ color: C.muted }}>
        {label}
      </p>
      <p
        className="text-[26px] font-bold leading-none"
        style={{ color: highlight ? C.greenBright : C.ink, letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
    </div>
  );
}

/* ── Metric card (4-up row) ───────────────────────────────────── */
function MetricCard({ label, value }) {
  return (
    <div
      className="p-4 flex flex-col gap-2"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(6,14,28,0.04)",
      }}
    >
      <p className="text-[10.5px]" style={{ color: C.muted }}>{label}</p>
      <p className="text-[16px] font-bold leading-tight" style={{ color: C.ink }}>{value}</p>
    </div>
  );
}

/* ── Investment Summary sidebar card ─────────────────────────── */
function InvestmentSummaryCard({
  data, symbol, raised, target, pct, minInvest, unitPrice, minUnits,
  userKycStatus, existingSubscription, onSubscribed,
}) {
  const isOpen = data.status === "OPEN" || !data.status;

  return (
    <div
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(6,14,28,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <p className="text-[20px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>
          Investment<br />Summary
        </p>
        {isOpen && (
          <span
            className="text-[10px] font-bold px-2.5 py-1.5 leading-none"
            style={{ backgroundColor: C.greenLight, color: C.greenBright, borderRadius: "6px", border: `1px solid rgba(21,131,95,0.25)`, whiteSpace: "nowrap" }}
          >
            Open for Funding
          </span>
        )}
      </div>

      {/* Progress */}
      {target > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between text-[11.5px] mb-2">
            <span style={{ color: C.secondary }}>Total Raised: {symbol}{(raised / 1_000_000).toFixed(1)}M</span>
            <span style={{ color: C.secondary }}>Target: {symbol}{(target / 1_000_000).toFixed(1)}M</span>
          </div>
          <div className="h-2 overflow-hidden" style={{ backgroundColor: "rgba(6,14,28,0.07)", borderRadius: "999px" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, pct)}%` }}
              transition={{ duration: 1, ease: [0.2, 0.65, 0.3, 0.9], delay: 0.3 }}
              className="h-full"
              style={{ background: `linear-gradient(90deg, #0A6E4F, #15835F)`, borderRadius: "999px" }}
            />
          </div>
        </div>
      )}

      {/* Key stats */}
      <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <SummaryRow label="Min. Commit" value={`${symbol}${minInvest.toLocaleString()}`} bold />
        <SummaryRow
          label="Management Fee"
          value={data.managementFeePct ? `${data.managementFeePct}% Annually` : "1.5% Annually"}
          bold
        />
        <SummaryRow
          label="Capital Structure"
          value={data.capitalStructure || data.investmentType || "Equity"}
          bold
        />
      </div>

      {/* CTA */}
      <div className="px-5 py-5 space-y-3">
        <SubscribeButton
          opportunity={data}
          userKycStatus={userKycStatus}
          existingSubscription={existingSubscription}
          onSubscribed={onSubscribed}
        />
        <p className="text-center text-[11px]" style={{ color: C.muted }}>
          SEC Regulation D | 506(c) Offering
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: C.secondary }}>{label}</span>
      <span className="text-[13px]" style={{ color: C.ink, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

/* ── Cash Flow Chart ──────────────────────────────────────────── */
function CashFlowChart({ termMonths, yieldPct, returnPct, symbol }) {
  const years = termMonths ? [
    { label: "Year 1", h: 35, color: "#86EFAC" },
    { label: `Year ${Math.max(2, Math.floor((termMonths / 12) / 2))}`, h: 58, color: "#4ADE80" },
    { label: `Year ${Math.round(termMonths / 12)} (Exit)`, h: 92, color: "#15803D" },
  ] : [
    { label: "Year 1", h: 35, color: "#86EFAC" },
    { label: "Year 3",  h: 58, color: "#4ADE80" },
    { label: "Year 5 (Exit)", h: 92, color: "#15803D" },
  ];

  return (
    <div className="mt-3">
      <div className="flex items-end gap-3 h-[120px] px-2">
        {years.map((y, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col justify-end"
            initial={{ height: 0 }}
            animate={{ height: `${y.h}%` }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: y.color,
                borderRadius: "4px 4px 0 0",
              }}
            />
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3 px-2 mt-2">
        {years.map((y, i) => (
          <p key={i} className="flex-1 text-center text-[10px]" style={{ color: C.muted }}>
            {y.label}
          </p>
        ))}
      </div>
      {(yieldPct > 0 || returnPct > 0) && (
        <p className="text-[11.5px] mt-3" style={{ color: C.secondary }}>
          {yieldPct > 0 && `Target yield: ${yieldPct}%`}
          {yieldPct > 0 && returnPct > 0 && " · "}
          {returnPct > 0 && `Projected total return: ${returnPct}%`}
        </p>
      )}
    </div>
  );
}

/* ── Financials section ───────────────────────────────────────── */
function FinancialsSection({ data, symbol }) {
  const spv = data.spv;
  const property = spv?.property;
  const rows = [
    property?.propertyValue && { label: "Property valuation", value: `${symbol}${Number(property.propertyValue).toLocaleString()}` },
    spv?.targetRaiseAmount  && { label: "Target raise",       value: `${symbol}${Number(spv.targetRaiseAmount).toLocaleString()}` },
    spv?.unitPrice          && { label: "Unit price",         value: `${symbol}${Number(spv.unitPrice).toLocaleString()}` },
    spv?.minimumUnits && spv?.unitPrice && { label: "Minimum investment",
      value: `${symbol}${(Number(spv.unitPrice) * spv.minimumUnits).toLocaleString()} (${spv.minimumUnits} unit${spv.minimumUnits === 1 ? "" : "s"})` },
    spv?.totalUnits         && { label: "Total units issued", value: spv.totalUnits.toLocaleString() },
    data.targetYieldPct     && { label: "Target annual yield",   value: `${data.targetYieldPct}%` },
    data.projectedReturnPct && { label: "Projected total return", value: `${data.projectedReturnPct}%` },
    data.termMonths         && { label: "Investment term",       value: `${data.termMonths} months` },
    data.rentalStrategy     && { label: "Rental strategy",       value: data.rentalStrategy },
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <ContentCard>
      <CardTitle>Financial Details</CardTitle>
      <div className="mt-3 overflow-hidden" style={{ border: `1px solid ${C.border}`, borderRadius: "10px" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}
          >
            <span className="text-[13px]" style={{ color: C.secondary }}>{row.label}</span>
            <span className="text-[13px] font-semibold text-right max-w-[55%]" style={{ color: C.ink }}>{row.value}</span>
          </div>
        ))}
      </div>
    </ContentCard>
  );
}

/* ── SPV section ──────────────────────────────────────────────── */
function SpvSection({ spv }) {
  if (!spv.spvName && !spv.companyNumber) return null;
  return (
    <ContentCard>
      <CardTitle>SPV Details</CardTitle>
      <p className="text-[13px] leading-relaxed mt-2 mb-4" style={{ color: C.secondary }}>
        This investment is held within a dedicated Special Purpose Vehicle (SPV) — a separate UK limited
        company established solely for this property.
      </p>
      <div className="overflow-hidden" style={{ border: `1px solid ${C.border}`, borderRadius: "10px" }}>
        <SpvRow label="Company name"        value={spv.spvName}      />
        <SpvRow label="Companies House No." value={spv.companyNumber} />
        <SpvRow label="Jurisdiction"        value={spv.jurisdiction || "UK"} last />
      </div>
      {spv.companyNumber && (
        <a
          href={`https://find-and-update.company-information.service.gov.uk/company/${spv.companyNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold mt-4"
          style={{ color: C.ink, textDecoration: "underline" }}
        >
          Verify on Companies House <ExternalLink size={11} strokeWidth={2} />
        </a>
      )}
    </ContentCard>
  );
}

function SpvRow({ label, value, last }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: last ? "none" : `1px solid ${C.border}` }}
    >
      <span className="text-[13px]" style={{ color: C.secondary }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{value || "—"}</span>
    </div>
  );
}

/* ── Risk section ─────────────────────────────────────────────── */
function RiskSection({ data }) {
  return (
    <ContentCard>
      <CardTitle>Risk &amp; Exit</CardTitle>
      {data.riskWarning && (
        <div
          className="mt-3 p-4 flex items-start gap-3"
          style={{ backgroundColor: "rgba(146,64,14,0.06)", border: "1px solid rgba(146,64,14,0.15)", borderRadius: "10px" }}
        >
          <AlertCircle size={15} strokeWidth={2} style={{ color: C.warning, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[13px] leading-relaxed" style={{ color: C.ink, whiteSpace: "pre-wrap" }}>
            {data.riskWarning}
          </p>
        </div>
      )}
      {data.exitStrategy && (
        <div className="mt-4">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: C.muted }}>Exit Strategy</p>
          <p className="text-[13.5px] leading-relaxed" style={{ color: C.secondary, whiteSpace: "pre-wrap" }}>
            {data.exitStrategy}
          </p>
        </div>
      )}
    </ContentCard>
  );
}

/* ── Document row ─────────────────────────────────────────────── */
function DocumentRow({ doc, opportunityId, viewed, onViewed }) {
  async function handleClick() {
    try {
      await fetch(`/api/dashboard/opportunities/${opportunityId}/doc-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ documentId: doc.id }),
      });
      onViewed(doc.id);
    } catch {}
  }

  return (
    <a
      href={doc.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center gap-3 p-3 transition-colors"
      style={{
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: "9px",
        textDecoration: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderMid; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
    >
      <div className="w-8 h-8 grid place-items-center flex-shrink-0" style={{ backgroundColor: C.goldLight, borderRadius: "7px" }}>
        <FileText size={13} strokeWidth={1.75} style={{ color: C.goldDark }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold truncate" style={{ color: C.ink }}>
          {doc.title || doc.fileName}
        </p>
        {viewed && (
          <p className="text-[10.5px] flex items-center gap-0.5 mt-0.5" style={{ color: C.green }}>
            <Eye size={9} strokeWidth={2.25} /> Viewed
          </p>
        )}
      </div>
      <Download size={13} strokeWidth={1.75} style={{ color: C.muted, flexShrink: 0 }} />
    </a>
  );
}

/* ── Shared card components ───────────────────────────────────── */
function ContentCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="p-5"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(6,14,28,0.04)",
      }}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ children }) {
  return (
    <p className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>{children}</p>
  );
}

function Divider() {
  return <div className="my-4 h-px" style={{ backgroundColor: C.border }} />;
}

/* ── Loading / Error ──────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="min-h-[55vh] grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: C.gold }} />
        <p className="text-[12.5px]" style={{ color: C.muted }}>Loading opportunity…</p>
      </div>
    </div>
  );
}

/* A closed/missing opportunity is a recovery moment, not a dead end:
   a clear notice, then the opportunities that are actually open now. */
function ErrorState({ message, suggestions = [] }) {
  const hasSuggestions = suggestions.length > 0;
  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/dashboard/opportunities" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-5 transition-colors"
        style={{ color: C.secondary, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}>
        <ArrowLeft size={14} strokeWidth={2.2} /> All opportunities
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl px-5 py-6 sm:px-7 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="w-12 h-12 rounded-xl grid place-items-center flex-shrink-0" style={{ backgroundColor: C.warningDim }}>
          <AlertCircle size={22} strokeWidth={1.9} style={{ color: C.warning }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] sm:text-[21px] font-bold leading-tight" style={{ color: C.ink, letterSpacing: "-0.01em" }}>{message}</h1>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: C.secondary }}>
            It may have closed, fully funded, or stopped accepting subscriptions.{hasSuggestions ? " Here's what's open right now." : " Browse the full catalog to find your next investment."}
          </p>
        </div>
        <Link href="/dashboard/opportunities"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-[12.5px] font-bold flex-shrink-0 w-full sm:w-auto transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: C.ink, color: "#fff", textDecoration: "none" }}>
          View all <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </motion.div>

      {hasSuggestions && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="mt-7">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} strokeWidth={2} style={{ color: C.goldDark }} />
            <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted }}>Open Opportunities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {suggestions.map((o) => <SuggestionCard key={o.id} o={o} />)}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SuggestionCard({ o }) {
  const prop = o.spv?.property;
  const heroUrl = o.heroImageUrl || prop?.images?.[0]?.fileUrl;
  const sym = SYM[o.spv?.currency] || "£";
  return (
    <Link href={`/dashboard/opportunities/${o.id}`} className="block rounded-2xl overflow-hidden group"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, textDecoration: "none", transition: "box-shadow .2s, border-color .2s, transform .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(6,14,28,0.10)"; e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
      <div className="relative overflow-hidden" style={{ height: 132, backgroundColor: C.goldLight }}>
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt={o.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : <div className="absolute inset-0 grid place-items-center" style={{ color: C.gold }}><ImageIcon size={26} strokeWidth={1} /></div>}
        {o.targetYieldPct && (
          <span className="absolute top-2.5 left-2.5 px-2 py-1 text-[10px] font-bold rounded-md" style={{ backgroundColor: "rgba(6,14,28,0.82)", color: "#fff", backdropFilter: "blur(4px)" }}>{o.targetYieldPct}% target</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[14.5px] font-bold leading-snug truncate" style={{ color: C.ink }}>{o.title}</p>
        <p className="flex items-center gap-1 text-[11.5px] mt-1 truncate" style={{ color: C.muted }}>
          <MapPin size={10} strokeWidth={1.9} />{[prop?.city, prop?.country].filter(Boolean).join(", ") || "—"}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="text-[12px]" style={{ color: C.muted }}>From <span className="font-bold" style={{ color: C.ink }}>{sym}{Number(o.spv?.unitPrice || 0).toLocaleString()}</span></span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.goldDark }}>Review <ChevronRight size={13} /></span>
        </div>
      </div>
    </Link>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
