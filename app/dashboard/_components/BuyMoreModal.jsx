"use client";

// app/dashboard/_components/BuyMoreModal.jsx
//
// "Buy More" — an existing holder increases their position in an SPV.
// Multi-step: units → acknowledge → review → submit.
// Reuses the subscription pipeline via /api/dashboard/opportunities/[id]/top-up

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Plus, Check, ShieldAlert, ArrowRight, TrendingUp,
  AlertCircle, CheckCircle2,
} from "lucide-react";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const CREAM = "#F8F4EC";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";
const WARNING = "#B8860B";
const WARNING_BG = "#FBF5E1";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function BuyMoreModal({ opportunityId, open, onClose, onSuccess }) {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("units"); // units | ack | review | done
  const [units, setUnits] = useState("");
  const [selfCert, setSelfCert] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opportunityId}/top-up`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) setCtx(data);
      else setError(data.message);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [opportunityId]);

  useEffect(() => {
    if (open) {
      setStep("units");
      setUnits("");
      setSelfCert(false);
      setRiskAck(false);
      setError(null);
      load();
    }
  }, [open, load]);

  if (!open) return null;

  const unitPrice = ctx ? parseFloat(ctx.spv?.unitPrice || "0") : 0;
  const currencySymbol =
    ctx?.spv?.currency === "USD" ? "$" : ctx?.spv?.currency === "EUR" ? "€" : "£";
  const unitsNum = parseInt(units, 10) || 0;
  const cost = unitsNum * unitPrice;
  const currentUnits = ctx?.currentHolding?.totalUnits || 0;
  const newTotal = currentUnits + unitsNum;
  const minUnits = ctx?.spv?.minimumUnits || 1;
  const maxUnits = ctx?.remainingUnits || 0;

  const unitsValid = unitsNum >= 1 && unitsNum <= maxUnits;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opportunityId}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({
          unitsRequested: unitsNum,
          selfCertified: true,
          riskAcknowledged: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("done");
        if (onSuccess) onSuccess(data.subscription);
      } else {
        setError(data.message || "Submission failed");
      }
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ backgroundColor: "rgba(6,20,47,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[480px] overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: "#FFFFFF", borderRadius: "16px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: `linear-gradient(135deg, ${NAVY_900}, ${NAVY_950})` }}
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp size={16} style={{ color: GOLD }} />
              <span
                className="text-[13px] font-bold tracking-[0.02em]"
                style={{ color: CREAM, fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                Buy More Shares
              </span>
            </div>
            <button onClick={onClose} style={{ color: "rgba(248,244,236,0.7)", cursor: "pointer", background: "none", border: "none" }}>
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 grid place-items-center">
              <Loader2 size={20} className="animate-spin" style={{ color: GOLD }} />
            </div>
          ) : error && !ctx ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle size={22} className="mx-auto mb-2" style={{ color: DANGER }} />
              <p className="text-[13px]" style={{ color: DANGER }}>{error}</p>
            </div>
          ) : !ctx?.canTopUp && step !== "done" ? (
            <div className="px-6 py-12 text-center">
              <ShieldAlert size={22} className="mx-auto mb-2" style={{ color: WARNING }} />
              <p className="text-[14px] font-semibold mb-1" style={{ color: INK }}>
                Can't buy more right now
              </p>
              <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {ctx?.opportunity?.status !== "live"
                  ? "This opportunity is no longer open for investment."
                  : ctx?.remainingUnits <= 0
                  ? "This opportunity is fully subscribed."
                  : ctx?.reasons?.length
                  ? `Not eligible: ${ctx.reasons.join(", ")}`
                  : "Top-ups aren't available for this opportunity."}
              </p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {/* STEP: units */}
              {step === "units" && (
                <>
                  <p className="text-[10px] tracking-[0.1em] uppercase font-bold mb-1" style={{ color: GOLD_DARK }}>
                    {ctx.opportunity.title}
                  </p>
                  <p className="text-[13px] mb-4" style={{ color: TEXT_SECONDARY }}>
                    You currently hold <strong style={{ color: INK }}>{currentUnits.toLocaleString()} units</strong> in {ctx.spv.spvName}.
                  </p>

                  <label className="text-[11px] font-bold tracking-[0.06em] uppercase block mb-1.5" style={{ color: TEXT_MUTED }}>
                    Additional units
                  </label>
                  <input
                    type="number"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    min={1}
                    max={maxUnits}
                    placeholder={`Min ${minUnits} · Max ${maxUnits.toLocaleString()}`}
                    className="w-full text-[15px] outline-none mb-1.5"
                    style={{ padding: "11px 13px", border: `1px solid #E4E4E7`, borderRadius: "9px", color: INK, fontFamily: "inherit" }}
                  />
                  <p className="text-[11px] mb-4" style={{ color: TEXT_MUTED }}>
                    {currencySymbol}{unitPrice.toLocaleString("en-GB", { minimumFractionDigits: 2 })} per unit · {maxUnits.toLocaleString()} available
                  </p>

                  {/* Live summary */}
                  {unitsNum > 0 && (
                    <div className="p-3.5 mb-4" style={{ backgroundColor: GOLD_LIGHT, borderRadius: "10px" }}>
                      <div className="flex justify-between text-[12.5px] mb-1.5">
                        <span style={{ color: GOLD_DARK }}>Cost of this purchase</span>
                        <span className="font-bold" style={{ color: INK }}>
                          {currencySymbol}{cost.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-[12.5px]" style={{ borderTop: `1px solid rgba(154,122,46,0.2)`, paddingTop: 6 }}>
                        <span style={{ color: GOLD_DARK }}>New total holding</span>
                        <span className="font-bold" style={{ color: INK }}>
                          {newTotal.toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!unitsValid}
                    onClick={() => setStep("ack")}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase disabled:opacity-40"
                    style={{ backgroundColor: NAVY_900, color: CREAM, border: "none", borderRadius: "9px", cursor: unitsValid ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                </>
              )}

              {/* STEP: acknowledge */}
              {step === "ack" && (
                <>
                  <p className="text-[14px] font-semibold mb-4" style={{ color: INK }}>
                    Before you continue
                  </p>
                  <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
                    <input type="checkbox" checked={selfCert} onChange={(e) => setSelfCert(e.target.checked)} style={{ accentColor: GOLD, marginTop: 2 }} />
                    <span className="text-[12.5px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                      I confirm my investor details remain accurate and I am eligible to invest in this opportunity.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                    <input type="checkbox" checked={riskAck} onChange={(e) => setRiskAck(e.target.checked)} style={{ accentColor: GOLD, marginTop: 2 }} />
                    <span className="text-[12.5px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                      I understand my capital is at risk, returns are not guaranteed, and this investment is illiquid.
                    </span>
                  </label>

                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setStep("units")}
                      className="px-4 py-3 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid #E4E4E7`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>
                      Back
                    </button>
                    <button type="button" disabled={!selfCert || !riskAck} onClick={() => setStep("review")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase disabled:opacity-40"
                      style={{ backgroundColor: NAVY_900, color: CREAM, border: "none", borderRadius: "9px", cursor: (selfCert && riskAck) ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                      Review <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}

              {/* STEP: review */}
              {step === "review" && (
                <>
                  <p className="text-[14px] font-semibold mb-4" style={{ color: INK }}>
                    Confirm your purchase
                  </p>
                  <div className="space-y-2.5 mb-5">
                    <Row label="Opportunity" value={ctx.opportunity.title} />
                    <Row label="Additional units" value={unitsNum.toLocaleString()} />
                    <Row label="Price per unit" value={`${currencySymbol}${unitPrice.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} />
                    <Row label="Amount due" value={`${currencySymbol}${cost.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} bold />
                    <Row label="New total holding" value={`${newTotal.toLocaleString()} units`} />
                  </div>

                  {cost > 10000 && (
                    <div className="flex items-start gap-2 p-3 mb-4" style={{ backgroundColor: WARNING_BG, borderRadius: "9px" }}>
                      <ShieldAlert size={14} style={{ color: WARNING, marginTop: 1, flexShrink: 0 }} />
                      <p className="text-[11.5px]" style={{ color: WARNING, lineHeight: 1.5 }}>
                        Purchases over {currencySymbol}10,000 require additional AML verification before allocation.
                      </p>
                    </div>
                  )}

                  <p className="text-[11.5px] mb-4" style={{ color: TEXT_MUTED, lineHeight: 1.5 }}>
                    After submitting, you'll receive bank transfer details. Upload your proof of payment and our team will verify, fund, and allocate your additional units — with a new share certificate issued.
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 p-3 mb-3" style={{ backgroundColor: DANGER_BG, borderRadius: "9px" }}>
                      <AlertCircle size={14} style={{ color: DANGER }} />
                      <p className="text-[12px]" style={{ color: DANGER }}>{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setStep("ack")} disabled={busy}
                      className="px-4 py-3 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid #E4E4E7`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>
                      Back
                    </button>
                    <button type="button" onClick={submit} disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase disabled:opacity-50"
                      style={{ backgroundColor: GOLD, color: NAVY_900, border: "none", borderRadius: "9px", cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Submit purchase
                    </button>
                  </div>
                </>
              )}

              {/* STEP: done */}
              {step === "done" && (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-4" style={{ backgroundColor: SUCCESS_BG }}>
                    <CheckCircle2 size={24} style={{ color: SUCCESS }} />
                  </div>
                  <p className="text-[16px] font-bold mb-1.5" style={{ color: INK }}>Purchase submitted</p>
                  <p className="text-[13px] mb-6 max-w-[320px] mx-auto" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    Your top-up of {unitsNum.toLocaleString()} units is now awaiting payment. Check your subscriptions to upload proof of payment.
                  </p>
                  <div className="flex gap-2.5 justify-center">
                    <button type="button" onClick={onClose}
                      className="px-5 py-2.5 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid #E4E4E7`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>
                      Close
                    </button>
                    <a href="/dashboard/subscriptions"
                      className="px-5 py-2.5 text-[12px] font-bold tracking-[0.04em] uppercase"
                      style={{ backgroundColor: NAVY_900, color: CREAM, borderRadius: "9px", textDecoration: "none", fontFamily: "inherit" }}>
                      My subscriptions
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span style={{ color: TEXT_MUTED }}>{label}</span>
      <span style={{ color: INK, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}