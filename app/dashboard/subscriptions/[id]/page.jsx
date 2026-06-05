"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, Award, Download, AlertCircle,
  Ban, FileText, Copy, Check, Landmark, ShieldCheck, Search, Banknote,
  LayoutDashboard, Clock, TrendingUp, Activity, CreditCard, Lock,
} from "lucide-react";
import ProofOfPaymentUpload from "@/app/dashboard/_components/ProofOfPaymentUpload";
import { useDialog } from "@/components/ConfirmDialog";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:        "#F0F1F5",
  ink:       "#0B1422",
  secondary: "#4B5768",
  muted:     "#8896A8",
  border:    "rgba(11,20,34,0.08)",
  borderMid: "rgba(11,20,34,0.13)",
  surface:   "#FFFFFF",
  gold:      "#C9A44A",
  goldDark:  "#9A7A2E",
  goldDim:   "rgba(201,164,74,0.10)",
  navy:      "#0A1F44",
  wire:      "#0C1A2E",
  green:     "#1C7A52",
  greenDeep: "#0A6E4F",
  greenBg:   "#EAF4EE",
  greenDim:  "rgba(28,122,82,0.10)",
  danger:    "#B4321F",
  dangerBg:  "rgba(180,50,31,0.07)",
  amber:     "#92600E",
  amberBg:   "rgba(146,96,14,0.10)",
  track:     "rgba(11,20,34,0.09)",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE = [0.16, 1, 0.3, 1];

/* ─── Status flow (real) ────────────────────────────────────────── */
const STATUS_FLOW = [
  { key: "SUBMITTED",       label: "Submitted",    Icon: FileText },
  { key: "UNDER_REVIEW",    label: "Under Review", Icon: Search },
  { key: "VERIFIED",        label: "Verified",     Icon: ShieldCheck },
  { key: "FUNDED",          label: "Funded",       Icon: Banknote },
  { key: "FULLY_ALLOCATED", label: "Allocated",    Icon: Award },
];
const NEXT_STEP = {
  SUBMITTED:    "Complete your payment by card or bank transfer, then upload your receipt below.",
  UNDER_REVIEW: "Funds verification by our custodial team (estimated 24–48 hours).",
  VERIFIED:     "Your payment is verified — units will be allocated shortly.",
  FUNDED:       "Allocation of your units is being finalised.",
};

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
function symbolFor(cur) { return cur === "USD" ? "$" : cur === "EUR" ? "€" : "£"; }
function fmt(amount, cur = "GBP") {
  return `${symbolFor(cur)}${parseFloat(amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function titleCase(s) {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Status pill (image-1 header chip) ─────────────────────────── */
function StatusChip({ status }) {
  const map = {
    SUBMITTED:           { label: "Transaction Initiated", tone: "amber" },
    UNDER_REVIEW:        { label: "Under Review",           tone: "amber" },
    VERIFIED:            { label: "Payment Verified",       tone: "green" },
    FUNDED:              { label: "Funded",                 tone: "green" },
    PARTIALLY_ALLOCATED: { label: "Allocated",              tone: "green" },
    FULLY_ALLOCATED:     { label: "Settled",                tone: "green" },
    REJECTED:            { label: "Rejected",               tone: "danger" },
    CANCELLED:           { label: "Cancelled",              tone: "muted" },
  }[status] || { label: titleCase(status), tone: "muted" };
  const tones = {
    green:  { c: C.greenDeep, bg: C.greenBg, Icon: CheckCircle2 },
    amber:  { c: C.amber,     bg: C.amberBg, Icon: Clock },
    danger: { c: C.danger,    bg: C.dangerBg, Icon: XCircle },
    muted:  { c: C.muted,     bg: "rgba(136,150,168,0.12)", Icon: Ban },
  }[map.tone];
  const Icon = tones.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold tracking-[0.1em] uppercase"
      style={{ color: tones.c, backgroundColor: tones.bg }}>
      <Icon size={13} /> {map.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function SubscriptionDetailPage() {
  const { confirm, alert } = useDialog();
  const { id: subscriptionId } = useParams();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payEnabled, setPayEnabled] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [returnFlag, setReturnFlag] = useState(null); // "paid" | "canceled"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/subscriptions/${subscriptionId}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) { setSub(data.subscription); setPayEnabled(!!data.cardPaymentsEnabled); }
      else setError(data.message || "Could not load subscription");
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [subscriptionId]);
  useEffect(() => { load(); }, [load]);

  // Returning from Stripe Checkout: surface a banner, and (since the webhook
  // may land a moment after the redirect) re-fetch shortly to pick up paidAt.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("paid") === "1") {
      setReturnFlag("paid");
      const t = setTimeout(() => load(), 2500);
      return () => clearTimeout(t);
    }
    if (q.get("canceled") === "1") setReturnFlag("canceled");
  }, [load]);

  async function startCardPayment() {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/dashboard/subscriptions/${subscriptionId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success && data.url) { window.location.href = data.url; return; }
      setPayError(data.message || "Could not start card payment.");
    } catch (err) { setPayError(err.message); }
    setPaying(false);
  }

  async function handleCancel() {
    const ok = await confirm({
      title: "Cancel this subscription?",
      message: "This releases your reserved allocation and cannot be undone.",
      confirmLabel: "Yes, cancel it",
      cancelLabel: "Keep subscription",
      tone: "danger",
    });
    if (!ok) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/dashboard/subscriptions/${subscriptionId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin", body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) load(); else await alert(data.message || "Could not cancel");
    } catch (err) { await alert(err.message); }
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
        <p className="text-[12.5px]" style={{ color: C.muted }}>Loading subscription…</p>
      </div>
    );
  }
  if (error || !sub) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={22} style={{ color: C.danger }} />
        <p className="text-[13px]" style={{ color: C.danger }}>{error || "Not found"}</p>
        <a href="/dashboard/subscriptions" className="text-[12.5px] font-semibold" style={{ color: C.goldDark, textDecoration: "none" }}>← Back to subscriptions</a>
      </div>
    );
  }

  const opp = sub.opportunity;
  const spv = opp?.spv;
  const property = spv?.property;
  const cur = sub.currency || spv?.currency || "GBP";
  const sym = symbolFor(cur);
  const isRejected = sub.status === "REJECTED";
  const isCancelled = sub.status === "CANCELLED";
  const isTerminal = isRejected || isCancelled;
  const isAllocated = sub.status === "FULLY_ALLOCATED" || sub.status === "PARTIALLY_ALLOCATED";
  const canCancel = sub.status === "SUBMITTED" || sub.status === "UNDER_REVIEW";
  const needsProof = (sub.status === "SUBMITTED" || sub.status === "UNDER_REVIEW") && !sub.proofOfPaymentUrl;
  const paidByCard = !!sub.paidAt;
  // Always offer the card option in the payment window; the /pay route returns a
  // clean message if Stripe keys aren't set yet, so nothing breaks pre-config.
  const canPayByCard = !paidByCard && (sub.status === "SUBMITTED" || sub.status === "UNDER_REVIEW" || sub.status === "VERIFIED");
  const activeAllocations = (sub.allocations || []).filter((a) => a.status === "ACTIVE");
  const allocatedUnits = activeAllocations.reduce((s, a) => s + (a.unitsAllocated || 0), 0);
  const submittedDate = sub.submittedAt || sub.createdAt;

  const beneficiary = spv?.bankAccountName || spv?.spvName || "—";
  const reference = spv?.bankAccountReference || `BW-${String(sub.id || "").slice(-6).toUpperCase()}`;

  const heading = isRejected ? "Subscription Rejected"
    : isCancelled ? "Subscription Cancelled"
    : isAllocated ? "Investment Settled"
    : sub.status === "FUNDED" ? "Investment Funded"
    : "Finalizing Your Investment";
  const subline = isRejected ? `Your commitment for ${opp?.title || "this investment"} was not approved.`
    : isCancelled ? `Your commitment for ${opp?.title || "this investment"} was cancelled.`
    : isAllocated ? `Your commitment for ${opp?.title || "this investment"} has been allocated — certificates are available below.`
    : `Your commitment for ${opp?.title || "this investment"} is being processed. Follow the steps below to complete your funding.`;

  async function copyWire() {
    try {
      await navigator.clipboard.writeText(`Beneficiary: ${beneficiary}\nReference: ${reference}\nAmount: ${fmt(sub.totalAmount, cur)}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="max-w-[1080px] mx-auto">
      {/* Back link */}
      <a href="/dashboard/subscriptions" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-6 transition-colors"
        style={{ color: C.secondary, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)} onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}>
        <ArrowLeft size={13} strokeWidth={2.25} /> My Subscriptions
      </a>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="mb-8">
        <StatusChip status={sub.status} />
        <h1 className="text-[32px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.025em] mt-3" style={{ color: C.ink }}>{heading}</h1>
        <p className="text-[13.5px] mt-2.5 max-w-2xl leading-relaxed" style={{ color: C.secondary }}>{subline}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="order-2 lg:order-1 space-y-5">
          {/* Terminal banner */}
          {isTerminal && (
            <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ backgroundColor: isRejected ? C.dangerBg : "rgba(11,20,34,0.03)", border: `1px solid ${C.border}` }}>
              {isRejected ? <XCircle size={18} style={{ color: C.danger, flexShrink: 0, marginTop: 1 }} /> : <Ban size={18} style={{ color: C.muted, flexShrink: 0, marginTop: 1 }} />}
              <div>
                <p className="text-[13.5px] font-bold" style={{ color: isRejected ? C.danger : C.secondary }}>{isRejected ? "Subscription rejected" : "Subscription cancelled"}</p>
                {sub.rejectionReason && <p className="text-[12.5px] mt-0.5" style={{ color: C.secondary }}>{sub.rejectionReason}</p>}
              </div>
            </div>
          )}

          {/* Progress tracker */}
          {!isTerminal && (
            <div className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}>
              <StatusProgress status={sub.status} />
              {NEXT_STEP[sub.status] && (
                <p className="text-[12.5px] italic mt-6 text-center" style={{ color: C.secondary }}>
                  <span className="font-semibold not-italic" style={{ color: C.ink }}>Next step:</span> {NEXT_STEP[sub.status]}
                </p>
              )}
            </div>
          )}

          {/* Return-from-Stripe banners */}
          {returnFlag === "paid" && !paidByCard && !isTerminal && (
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: C.amberBg, border: `1px solid ${C.border}` }}>
              <Loader2 size={18} className="animate-spin" style={{ color: C.amber, flexShrink: 0 }} />
              <div>
                <p className="text-[13.5px] font-bold" style={{ color: C.amber }}>Confirming your card payment…</p>
                <p className="text-[12px]" style={{ color: C.secondary }}>This usually takes a few seconds. This page will update automatically.</p>
              </div>
            </div>
          )}
          {returnFlag === "canceled" && needsProof && !paidByCard && (
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.border}` }}>
              <XCircle size={18} style={{ color: C.danger, flexShrink: 0 }} />
              <div>
                <p className="text-[13.5px] font-bold" style={{ color: C.danger }}>Card payment canceled</p>
                <p className="text-[12px]" style={{ color: C.secondary }}>No charge was made. You can try again or pay by bank transfer below.</p>
              </div>
            </div>
          )}

          {/* Card payment received */}
          {paidByCard && !isTerminal && !isAllocated && sub.status !== "FUNDED" && (
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: C.greenBg, border: `1px solid ${C.greenDim}` }}>
              <CheckCircle2 size={18} style={{ color: C.greenDeep, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold" style={{ color: C.greenDeep }}>Card payment received</p>
                <p className="text-[12px]" style={{ color: "rgba(10,110,79,0.78)" }}>
                  We&apos;ve received your {fmt(sub.totalAmount, cur)} payment by card.
                  {needsProof ? " Please upload your receipt below so our team can verify it." : " Our team is verifying your payment."}
                </p>
              </div>
            </div>
          )}

          {/* Pay by card (Stripe) */}
          {needsProof && canPayByCard && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.04 }}
              className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 grid place-items-center flex-shrink-0 rounded-xl" style={{ backgroundColor: C.goldDim }}>
                  <CreditCard size={18} strokeWidth={1.9} style={{ color: C.goldDark }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] sm:text-[18px] font-bold leading-tight" style={{ color: C.ink }}>Pay securely by card</h2>
                  <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: C.secondary }}>
                    Complete your {fmt(sub.totalAmount, cur)} payment instantly with a debit or credit card via Stripe.
                    After paying, upload your receipt below so our team can verify and allocate your units.
                  </p>
                  {payError && (
                    <div className="mt-3 px-3 py-2.5 rounded-lg flex items-start gap-2" style={{ backgroundColor: C.dangerBg }}>
                      <AlertCircle size={13} style={{ color: C.danger, flexShrink: 0, marginTop: 1 }} />
                      <p className="text-[12px]" style={{ color: C.danger }}>{payError}</p>
                    </div>
                  )}
                  <button type="button" onClick={startCardPayment} disabled={paying}
                    className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60"
                    style={{ backgroundColor: C.gold, color: C.ink, border: "none", cursor: paying ? "wait" : "pointer", boxShadow: "0 1px 2px rgba(201,164,74,0.45), 0 6px 16px rgba(201,164,74,0.24)" }}
                    onMouseEnter={(e) => { if (!paying) e.currentTarget.style.backgroundColor = "#D9B560"; }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.gold)}>
                    {paying ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} strokeWidth={2.25} />}
                    {paying ? "Redirecting to secure checkout…" : `Pay ${fmt(sub.totalAmount, cur)} by card`}
                  </button>
                  <p className="flex items-center gap-1.5 text-[11px] mt-3" style={{ color: C.muted }}>
                    <Lock size={11} /> Payments are processed securely by Stripe. We never see your card details.
                  </p>
                </div>
              </div>
              {!paidByCard && (
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
                  <span className="text-[10.5px] font-bold tracking-[0.14em] uppercase" style={{ color: C.muted }}>or pay by bank transfer</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
                </div>
              )}
            </motion.div>
          )}

          {/* Wire transfer instructions (hidden once paid by card) */}
          {needsProof && !paidByCard && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
              className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(160deg, ${C.wire} 0%, #0a1626 100%)`, boxShadow: "0 10px 30px rgba(11,20,34,0.2)" }}>
              <div className="px-6 sm:px-7 py-5 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-bold leading-tight" style={{ color: "#fff" }}>Wire Transfer Instructions</h2>
                  <p className="text-[11.5px] mt-1" style={{ color: "rgba(255,255,255,0.45)", ...NUM }}>Reference Number: {reference}</p>
                </div>
                <button type="button" onClick={copyWire} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12px] font-semibold flex-shrink-0 transition-colors"
                  style={{ background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy All"}
                </button>
              </div>
              <div className="px-6 sm:px-7 py-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <WireField label="Beneficiary Name" value={beneficiary} />
                  <WireField label="Amount" value={fmt(sub.totalAmount, cur)} mono />
                  <WireField label="Reference" value={reference} mono highlight />
                  {spv?.companyNumber && <WireField label="Company No." value={spv.companyNumber} mono />}
                </div>
                <div className="flex items-start gap-2.5 mt-6 px-3.5 py-3 rounded-xl" style={{ backgroundColor: "rgba(180,50,31,0.14)", border: "1px solid rgba(180,50,31,0.25)" }}>
                  <AlertCircle size={15} style={{ color: "#F0A090", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
                    Ensure the reference number is included in the wire memo to avoid processing delays.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Proof of payment upload (bank details handled by wire card above) */}
          {needsProof && (
            <ProofOfPaymentUpload
              subscriptionId={sub.id}
              hideBankDetails
              bankDetails={{ accountName: beneficiary, reference, amount: parseFloat(sub.totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 }), currencySymbol: sym }}
              existingProofUrl={sub.proofOfPaymentUrl}
              existingProofName={sub.proofOfPaymentName}
              onUploaded={() => load()}
            />
          )}

          {/* Proof received */}
          {sub.proofOfPaymentUrl && !needsProof && !isTerminal && (
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: C.greenBg, border: `1px solid ${C.greenDim}` }}>
              <CheckCircle2 size={18} style={{ color: C.greenDeep, flexShrink: 0 }} />
              <div>
                <p className="text-[13.5px] font-bold" style={{ color: C.greenDeep }}>Proof of payment received</p>
                <p className="text-[12px]" style={{ color: "rgba(10,110,79,0.78)" }}>Our team is verifying your payment.</p>
              </div>
            </div>
          )}

          {/* Allocations */}
          {activeAllocations.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}>
              <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: C.muted }}>Your Allocations</p>
              <div className="space-y-3">
                {activeAllocations.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 grid place-items-center flex-shrink-0 rounded-lg" style={{ backgroundColor: C.greenDim }}><Award size={16} strokeWidth={1.75} style={{ color: C.greenDeep }} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>{a.unitsAllocated} units allocated</p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: C.muted }}>{a.certificateNumber ? `Certificate ${a.certificateNumber}` : "Certificate pending"}</p>
                    </div>
                    <a href={`/api/dashboard/allocations/${a.id}/certificate`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-9 px-4 text-[12px] font-bold flex-shrink-0 rounded-lg transition-opacity hover:opacity-90"
                      style={{ backgroundColor: C.ink, color: "#fff", textDecoration: "none" }}>
                      <Download size={12} strokeWidth={2.5} /> Certificate
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription agreement */}
          {sub.subscriptionAgreementUrl && (
            <a href={sub.subscriptionAgreementUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl transition-colors"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, textDecoration: "none", boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderMid)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}>
              <div className="w-9 h-9 grid place-items-center flex-shrink-0 rounded-lg" style={{ backgroundColor: C.goldDim }}><FileText size={15} strokeWidth={1.75} style={{ color: C.goldDark }} /></div>
              <span className="text-[13.5px] font-bold flex-1" style={{ color: C.ink }}>Subscription Agreement</span>
              <Download size={14} strokeWidth={1.75} style={{ color: C.muted }} />
            </a>
          )}

          {/* Recent activity */}
          {sub.auditEvents && sub.auditEvents.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}>
              <p className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.16em] uppercase mb-5" style={{ color: C.muted }}>
                <Activity size={13} /> Recent Activity
              </p>
              <div>
                {sub.auditEvents.slice().reverse().map((e, idx, arr) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: 4 }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: idx === 0 ? C.green : C.gold }} />
                      {idx < arr.length - 1 && <div className="w-px" style={{ height: 34, backgroundColor: C.border }} />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{prettyEvent(e.eventType)}</p>
                      {e.notes && <p className="text-[12px]" style={{ color: C.secondary }}>{e.notes}</p>}
                      <p className="text-[11px] mt-0.5" style={{ color: C.muted, ...NUM }}>
                        {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <div className="px-1">
              <button type="button" onClick={handleCancel} disabled={cancelling}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold disabled:opacity-50"
                style={{ color: C.danger, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} Cancel this subscription
              </button>
              <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>You can cancel while your subscription is still being reviewed. Once verified, please contact support.</p>
            </div>
          )}
        </div>

        {/* ── Summary sidebar ── */}
        <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
          className="order-1 lg:order-2 lg:sticky lg:top-4">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(11,20,34,0.05)" }}>
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-[20px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>Summary</h2>
            </div>
            <div className="px-6 py-4 space-y-3.5">
              <SummaryRow label="Investment Amount" value={fmt(sub.totalAmount, cur)} bold />
              {property?.propertyType && <SummaryRow label="Asset Class" value={titleCase(property.propertyType)} />}
              {opp?.targetYieldPct != null && <SummaryRow label="Target Yield" value={`${opp.targetYieldPct}%`} valueColor={C.greenDeep} />}
              {submittedDate && <SummaryRow label="Submitted" value={new Date(submittedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />}
            </div>
            <div className="px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-bold" style={{ color: C.ink }}>Total Commitment</span>
                <span className="text-[16px] font-bold" style={{ color: C.ink, ...NUM }}>{fmt(sub.totalAmount, cur)}</span>
              </div>
              {allocatedUnits > 0 && (
                <p className="text-[11.5px] mt-1.5 text-right" style={{ color: C.greenDeep, ...NUM }}>{allocatedUnits} of {sub.unitsRequested} units allocated</p>
              )}
            </div>
            <div className="px-6 pb-5 space-y-2.5">
              <Link href="/dashboard" className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[13.5px] font-bold transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: C.ink, color: "#fff", textDecoration: "none" }}>
                <LayoutDashboard size={15} strokeWidth={2} /> Back to Dashboard
              </Link>
              {sub.subscriptionAgreementUrl && (
                <a href={sub.subscriptionAgreementUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[13px] font-bold transition-colors"
                  style={{ border: `1.5px solid ${C.borderMid}`, color: C.ink, textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bg)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Download size={14} strokeWidth={2} /> Download Agreement
                </a>
              )}
            </div>
            {/* Property image */}
            {(opp?.heroImageUrl || property?.city) && (
              <div className="relative" style={{ height: 130, backgroundColor: C.bg }}>
                {opp?.heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opp.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "grayscale(0.15)" }} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center" style={{ background: `linear-gradient(135deg, ${C.navy}, #16243F)` }}><Landmark size={28} style={{ color: "rgba(201,164,74,0.5)" }} /></div>
                )}
                {(property?.city || spv?.spvName) && (
                  <div className="absolute inset-x-0 bottom-0 px-4 py-3" style={{ background: "linear-gradient(to top, rgba(11,20,34,0.85), transparent)" }}>
                    <p className="text-[12px] font-bold text-white truncate">{opp?.title}</p>
                    {property?.city && <p className="text-[10.5px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{[property.city, property.country].filter(Boolean).join(", ")}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

/* ─── Wire field ────────────────────────────────────────────────── */
function WireField({ label, value, mono, highlight }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-bold tracking-[0.14em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.42)" }}>{label}</p>
      <p className="text-[14px] font-semibold break-words" style={{ color: highlight ? C.gold : "#fff", ...(mono ? NUM : {}) }}>{value}</p>
    </div>
  );
}

/* ─── Summary row ───────────────────────────────────────────────── */
function SummaryRow({ label, value, valueColor, bold }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px]" style={{ color: C.secondary }}>{label}</span>
      <span className={`text-[13px] text-right ${bold ? "font-bold" : "font-semibold"}`} style={{ color: valueColor || C.ink, ...NUM }}>{value}</span>
    </div>
  );
}

/* ─── Status progress (image-1 green-check stepper) ─────────────── */
function StatusProgress({ status }) {
  const displayStatus = status === "PARTIALLY_ALLOCATED" ? "FULLY_ALLOCATED" : status;
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === displayStatus);
  const TILE = 44;
  return (
    <>
      <div className="relative flex items-start justify-between">
        <div className="absolute h-[2px]" style={{ top: TILE / 2 - 1, left: TILE / 2, right: TILE / 2, backgroundColor: C.track }} />
        <motion.div className="absolute h-[2px]" style={{ top: TILE / 2 - 1, left: TILE / 2, background: C.green }}
          initial={{ width: 0 }} animate={{ width: `calc((100% - ${TILE}px) * ${currentIdx > 0 ? currentIdx / (STATUS_FLOW.length - 1) : 0})` }}
          transition={{ duration: 0.7, ease: EASE }} />
        {STATUS_FLOW.map((s, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const Icon = s.Icon;
          return (
            <div key={s.key} className="relative flex flex-col items-center" style={{ zIndex: 1, width: 76 }}>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.07, duration: 0.3, ease: EASE }}
                className="grid place-items-center rounded-xl"
                style={{ width: TILE, height: TILE, backgroundColor: done ? C.green : C.bg, border: done ? "none" : `1.5px solid ${C.track}`, boxShadow: isCurrent ? `0 0 0 4px ${C.greenDim}` : "none" }}>
                {done ? <Check size={20} strokeWidth={2.75} style={{ color: "#fff" }} /> : <Icon size={18} strokeWidth={1.9} style={{ color: C.muted }} />}
              </motion.div>
              <p className="text-[10px] font-bold tracking-[0.04em] uppercase text-center mt-2.5 leading-tight" style={{ color: isCurrent ? C.green : done ? C.ink : C.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>
      {status === "PARTIALLY_ALLOCATED" && (
        <p className="text-center text-[11.5px] mt-5" style={{ color: C.goldDark }}>
          <TrendingUp size={11} className="inline mr-1" /> Partially allocated — remaining units are being processed
        </p>
      )}
    </>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function prettyEvent(eventType) {
  const map = {
    SUBSCRIPTION_CREATED: "Subscription submitted",
    PROOF_OF_PAYMENT_UPLOADED: "Proof of payment uploaded",
    CARD_PAYMENT_RECEIVED: "Card payment received",
    CANCELLED_BY_INVESTOR: "Cancelled by you",
    ALLOCATION_CREATED: "Units allocated",
    STATUS_CHANGED: "Status updated",
    VERIFIED: "Payment verified",
    FUNDED: "Marked as funded",
    REJECTED: "Subscription rejected",
  };
  return map[eventType] || eventType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
