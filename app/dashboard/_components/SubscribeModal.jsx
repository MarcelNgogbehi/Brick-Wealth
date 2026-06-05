"use client";

// app/dashboard/_components/SubscribeModal.jsx
//
// Multi-step subscription flow:
//   Step 1 — Units (with live total calculation)
//   Step 2 — Suitability questions (only if opportunity requires)
//   Step 3 — Terms, self-certification, risk acknowledgement
//   Step 4 — Review & confirm
//
// On submit: POST /api/dashboard/subscriptions
// On success: shows the bank transfer instructions + next steps.

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Check, Loader2, AlertCircle,
  ShieldCheck, FileText, Landmark, CheckCircle2, Info, CreditCard, Lock,
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
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function SubscribeModal({ opportunity, onClose, onSubscribed }) {
  const spv = opportunity?.spv;
  const currencySymbol = spv?.currency === "USD" ? "$" : spv?.currency === "EUR" ? "€" : "£";
  const unitPrice = parseFloat(spv?.unitPrice || "0");
  const minimumUnits = spv?.minimumUnits ?? 1;
  const remainingUnits = (spv?.totalUnits ?? 0) - (spv?.unitsAllocated ?? 0);

  // Suitability questions (array of { id, question, options? } or similar)
  const suitabilityQuestions = useMemo(() => {
    const q = opportunity?.suitabilityQuestions;
    if (Array.isArray(q)) return q;
    if (q && typeof q === "object" && Array.isArray(q.questions)) return q.questions;
    return [];
  }, [opportunity]);

  const requiresSuitability = opportunity?.requiresSuitabilityCheck && suitabilityQuestions.length > 0;

  // Build step list dynamically
  const steps = useMemo(() => {
    const s = ["units"];
    if (requiresSuitability) s.push("suitability");
    s.push("terms", "review");
    return s;
  }, [requiresSuitability]);

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = steps[stepIdx];

  // Form state
  const [units, setUnits] = useState(minimumUnits);
  const [suitabilityAnswers, setSuitabilityAnswers] = useState({});
  const [selfCertified, setSelfCertified] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [cardEnabled, setCardEnabled] = useState(false);

  const totalAmount = units * unitPrice;
  const oversized = totalAmount > 10_000;

  // ─── Validation per step ───────────────────────────────────────
  function canProceed() {
    if (currentStep === "units") {
      return units >= minimumUnits && units <= remainingUnits && Number.isInteger(units);
    }
    if (currentStep === "suitability") {
      return suitabilityQuestions.every((q) => {
        const key = q.id || q.key || q.question;
        return suitabilityAnswers[key] !== undefined && suitabilityAnswers[key] !== "";
      });
    }
    if (currentStep === "terms") {
      return selfCertified && riskAcknowledged;
    }
    return true;
  }

  function next() {
    setError(null);
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    setError(null);
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({
          opportunityId: opportunity.id,
          unitsRequested: units,
          selfCertifiedAtSubmit: true,
          riskAcknowledgedAtSubmit: true,
          suitabilityAnswers: requiresSuitability ? suitabilityAnswers : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCardEnabled(!!data.cardPaymentsEnabled);
        setSuccessData(data.subscription);
      } else {
        setError(data.message || "Could not submit subscription");
      }
    } catch (err) {
      setError(err.message || "Network error");
    }
    setSubmitting(false);
  }

  // ─── Success view ──────────────────────────────────────────────
  if (successData) {
    return (
      <Overlay onClose={onClose}>
        <SuccessView
          subscription={successData}
          opportunity={opportunity}
          spv={spv}
          currencySymbol={currencySymbol}
          totalAmount={totalAmount}
          units={units}
          cardEnabled={cardEnabled}
          onClose={() => { onSubscribed?.(successData); }}
        />
      </Overlay>
    );
  }

  const stepNumber = stepIdx + 1;
  const totalSteps = steps.length;

  return (
    <Overlay onClose={submitting ? undefined : onClose}>
      <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 50px)" }}>
        {/* Header */}
        <div
          className="px-6 py-5 flex items-start justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(10,31,68,0.08)" }}
        >
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase font-bold mb-1" style={{ color: GOLD_DARK }}>
              Subscribe · Step {stepNumber} of {totalSteps}
            </p>
            <h2
              className="text-[20px] leading-tight"
              style={{
                color: INK,
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontWeight: 600,
                }}
            >
              {opportunity.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            className="w-8 h-8 grid place-items-center flex-shrink-0"
            style={{ background: "transparent", border: "none", cursor: submitting ? "not-allowed" : "pointer", color: TEXT_MUTED }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-6 pt-4 flex items-center gap-1.5 flex-shrink-0">
          {steps.map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{
                backgroundColor: i <= stepIdx ? GOLD : "rgba(10,31,68,0.1)",
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === "units" && (
                <UnitsStep
                  units={units}
                  setUnits={setUnits}
                  minimumUnits={minimumUnits}
                  remainingUnits={remainingUnits}
                  unitPrice={unitPrice}
                  currencySymbol={currencySymbol}
                  totalAmount={totalAmount}
                  oversized={oversized}
                />
              )}
              {currentStep === "suitability" && (
                <SuitabilityStep
                  questions={suitabilityQuestions}
                  answers={suitabilityAnswers}
                  setAnswers={setSuitabilityAnswers}
                />
              )}
              {currentStep === "terms" && (
                <TermsStep
                  selfCertified={selfCertified}
                  setSelfCertified={setSelfCertified}
                  riskAcknowledged={riskAcknowledged}
                  setRiskAcknowledged={setRiskAcknowledged}
                  riskWarning={opportunity?.riskWarning}
                />
              )}
              {currentStep === "review" && (
                <ReviewStep
                  opportunity={opportunity}
                  spv={spv}
                  units={units}
                  unitPrice={unitPrice}
                  currencySymbol={currencySymbol}
                  totalAmount={totalAmount}
                  oversized={oversized}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div
              className="mt-4 p-3 flex items-start gap-2"
              style={{ backgroundColor: DANGER_BG, borderRadius: "8px" }}
            >
              <AlertCircle size={14} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12.5px]" style={{ color: DANGER }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "1px solid rgba(10,31,68,0.08)", backgroundColor: "#FAFAFA" }}
        >
          <button
            type="button"
            onClick={stepIdx === 0 ? onClose : back}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-semibold"
            style={{
              color: TEXT_SECONDARY,
              background: "transparent",
              border: "1px solid rgba(10,31,68,0.12)",
              borderRadius: "8px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {stepIdx === 0 ? "Cancel" : (<><ArrowLeft size={13} /> Back</>)}
          </button>

          {currentStep === "review" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[12.5px] font-semibold disabled:opacity-60"
              style={{
                backgroundColor: NAVY_900,
                color: CREAM,
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {submitting ? "Submitting..." : "Confirm subscription"}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[12.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: NAVY_900,
                color: CREAM,
                border: "none",
                borderRadius: "8px",
                cursor: canProceed() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Continue <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Overlay wrapper ─────────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto"
      style={{ backgroundColor: "rgba(6, 20, 47, 0.55)", backdropFilter: "blur(4px)", paddingTop: 30, paddingBottom: 20, paddingLeft: 16, paddingRight: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg"
        style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Step 1: Units ───────────────────────────────────────────────

function UnitsStep({ units, setUnits, minimumUnits, remainingUnits, unitPrice, currencySymbol, totalAmount, oversized }) {
  function clamp(v) {
    if (isNaN(v)) return minimumUnits;
    return Math.max(minimumUnits, Math.min(remainingUnits, Math.floor(v)));
  }

  return (
    <div>
      <h3 className="text-[15px] font-bold mb-1" style={{ color: INK }}>How many units?</h3>
      <p className="text-[12.5px] mb-5" style={{ color: TEXT_SECONDARY }}>
        Each unit represents a share in the SPV that owns this property.
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setUnits(clamp(units - 1))}
          className="w-11 h-11 grid place-items-center text-[20px] font-light flex-shrink-0"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(10,31,68,0.15)",
            borderRadius: "10px",
            cursor: "pointer",
            color: INK,
          }}
        >
          −
        </button>
        <input
          type="number"
          value={units}
          min={minimumUnits}
          max={remainingUnits}
          onChange={(e) => setUnits(clamp(parseInt(e.target.value, 10)))}
          className="flex-1 text-center text-[24px] font-bold outline-none"
          style={{
            padding: "10px",
            border: `1px solid ${GOLD}`,
            borderRadius: "10px",
            color: INK,
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => setUnits(clamp(units + 1))}
          className="w-11 h-11 grid place-items-center text-[20px] font-light flex-shrink-0"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(10,31,68,0.15)",
            borderRadius: "10px",
            cursor: "pointer",
            color: INK,
          }}
        >
          +
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex gap-2 mb-5">
        {[minimumUnits, minimumUnits * 5, minimumUnits * 10, minimumUnits * 20]
          .filter((v, i, arr) => v <= remainingUnits && arr.indexOf(v) === i)
          .map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setUnits(v)}
              className="flex-1 py-2 text-[11.5px] font-semibold"
              style={{
                backgroundColor: units === v ? GOLD_LIGHT : "#FFFFFF",
                border: `1px solid ${units === v ? GOLD : "rgba(10,31,68,0.12)"}`,
                borderRadius: "8px",
                cursor: "pointer",
                color: units === v ? GOLD_DARK : TEXT_SECONDARY,
                fontFamily: "inherit",
              }}
            >
              {v}
            </button>
          ))}
      </div>

      {/* Total */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ backgroundColor: NAVY_900, borderRadius: "12px" }}
      >
        <div>
          <p className="text-[10px] tracking-[0.14em] uppercase font-bold" style={{ color: GOLD }}>
            Total commitment
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(248,244,236,0.6)" }}>
            {units} × {currencySymbol}{unitPrice.toLocaleString("en-GB")}
          </p>
        </div>
        <span
          className="text-[26px]"
          style={{
            color: CREAM,
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontWeight: 600,
          }}
        >
          {currencySymbol}{totalAmount.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: TEXT_MUTED }}>
        Minimum {minimumUnits} · {remainingUnits.toLocaleString("en-GB")} units available
      </p>

      {oversized && (
        <div
          className="mt-3 p-3 flex items-start gap-2"
          style={{ backgroundColor: GOLD_LIGHT, borderRadius: "8px" }}
        >
          <Info size={13} style={{ color: GOLD_DARK, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[11.5px] leading-relaxed" style={{ color: GOLD_DARK }}>
            Subscriptions over {currencySymbol}10,000 require additional anti-money-laundering
            checks. Our team may request further documentation before allocation.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Suitability ─────────────────────────────────────────

function SuitabilityStep({ questions, answers, setAnswers }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={16} style={{ color: GOLD_DARK }} />
        <h3 className="text-[15px] font-bold" style={{ color: INK }}>A few questions</h3>
      </div>
      <p className="text-[12.5px] mb-5" style={{ color: TEXT_SECONDARY }}>
        These help us confirm this investment is suitable for you.
      </p>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const key = q.id || q.key || q.question;
          const options = q.options || ["Yes", "No"];
          return (
            <div key={key}>
              <p className="text-[13px] font-semibold mb-2" style={{ color: INK }}>
                {idx + 1}. {q.question || q.label || q.text}
              </p>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const optValue = typeof opt === "string" ? opt : opt.value;
                  const optLabel = typeof opt === "string" ? opt : opt.label;
                  const selected = answers[key] === optValue;
                  return (
                    <button
                      key={optValue}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [key]: optValue })}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px]"
                      style={{
                        backgroundColor: selected ? GOLD_LIGHT : "#FFFFFF",
                        border: `1px solid ${selected ? GOLD : "rgba(10,31,68,0.12)"}`,
                        borderRadius: "9px",
                        cursor: "pointer",
                        color: selected ? GOLD_DARK : TEXT_SECONDARY,
                        fontFamily: "inherit",
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      <span
                        className="w-4 h-4 grid place-items-center flex-shrink-0"
                        style={{
                          border: `1.5px solid ${selected ? GOLD_DARK : "rgba(10,31,68,0.25)"}`,
                          borderRadius: "999px",
                        }}
                      >
                        {selected && (
                          <span className="w-2 h-2" style={{ backgroundColor: GOLD_DARK, borderRadius: "999px" }} />
                        )}
                      </span>
                      {optLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Terms ───────────────────────────────────────────────

function TermsStep({ selfCertified, setSelfCertified, riskAcknowledged, setRiskAcknowledged, riskWarning }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} style={{ color: GOLD_DARK }} />
        <h3 className="text-[15px] font-bold" style={{ color: INK }}>Confirm & acknowledge</h3>
      </div>
      <p className="text-[12.5px] mb-5" style={{ color: TEXT_SECONDARY }}>
        Please read and confirm the following before proceeding.
      </p>

      {/* Risk warning box */}
      {riskWarning && (
        <div
          className="p-4 mb-4"
          style={{ backgroundColor: "#FBF8F1", border: "1px solid rgba(201,162,74,0.3)", borderRadius: "10px" }}
        >
          <p className="text-[10px] tracking-[0.14em] uppercase font-bold mb-2" style={{ color: GOLD_DARK }}>
            Risk warning
          </p>
          <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_SECONDARY }}>
            {riskWarning}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <CheckboxRow
          checked={selfCertified}
          onChange={setSelfCertified}
          label="Self-certification"
          text="I confirm I am eligible to invest in this opportunity and the information in my profile is accurate and up to date."
        />
        <CheckboxRow
          checked={riskAcknowledged}
          onChange={setRiskAcknowledged}
          label="Risk acknowledgement"
          text="I understand my capital is at risk, that returns are not guaranteed, and that I may get back less than I invest. Property is illiquid and my investment may be difficult to sell."
        />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
        By proceeding you agree to the Subscription Agreement, which will be generated
        for your records. Bricks &amp; Wealth Holdings Ltd does not provide investment advice.
      </p>
    </div>
  );
}

function CheckboxRow({ checked, onChange, label, text }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3.5 text-left"
      style={{
        backgroundColor: checked ? SUCCESS_BG : "#FFFFFF",
        border: `1px solid ${checked ? SUCCESS + "40" : "rgba(10,31,68,0.12)"}`,
        borderRadius: "10px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span
        className="w-5 h-5 grid place-items-center flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: checked ? SUCCESS : "#FFFFFF",
          border: `1.5px solid ${checked ? SUCCESS : "rgba(10,31,68,0.25)"}`,
          borderRadius: "6px",
          transition: "all 0.15s",
        }}
      >
        {checked && <Check size={12} strokeWidth={3} style={{ color: "#FFFFFF" }} />}
      </span>
      <div>
        <p className="text-[12.5px] font-semibold mb-0.5" style={{ color: INK }}>{label}</p>
        <p className="text-[11.5px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{text}</p>
      </div>
    </button>
  );
}

// ─── Step 4: Review ──────────────────────────────────────────────

function ReviewStep({ opportunity, spv, units, unitPrice, currencySymbol, totalAmount, oversized }) {
  return (
    <div>
      <h3 className="text-[15px] font-bold mb-1" style={{ color: INK }}>Review your subscription</h3>
      <p className="text-[12.5px] mb-5" style={{ color: TEXT_SECONDARY }}>
        Please confirm the details below are correct.
      </p>

      <div
        className="divide-y"
        style={{ borderColor: "rgba(10,31,68,0.06)" }}
      >
        <ReviewRow label="Opportunity" value={opportunity.title} />
        <ReviewRow label="SPV" value={spv?.spvName || "—"} />
        <ReviewRow label="Units" value={units.toLocaleString("en-GB")} />
        <ReviewRow label="Price per unit" value={`${currencySymbol}${unitPrice.toLocaleString("en-GB")}`} />
        <ReviewRow
          label="Total commitment"
          value={`${currencySymbol}${totalAmount.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          emphasize
        />
        <ReviewRow label="Payment method" value="Bank transfer" />
      </div>

      <div
        className="mt-4 p-3.5 flex items-start gap-2.5"
        style={{ backgroundColor: GOLD_LIGHT, borderRadius: "10px" }}
      >
        <Landmark size={15} style={{ color: GOLD_DARK, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[11.5px] leading-relaxed" style={{ color: GOLD_DARK }}>
          After confirming, you'll receive bank transfer instructions. Upload your proof of
          payment and our team will verify it before allocating your units and issuing your
          share certificate.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, emphasize }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>{label}</span>
      <span
        className={emphasize ? "text-[15px]" : "text-[12.5px]"}
        style={{
          color: emphasize ? GOLD_DARK : INK,
          fontWeight: emphasize ? 700 : 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Success view ────────────────────────────────────────────────

function SuccessView({ subscription, opportunity, spv, currencySymbol, totalAmount, units, cardEnabled, onClose }) {
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState(null);

  const amountLabel = `${currencySymbol}${totalAmount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  async function startCardPayment() {
    setPaying(true);
    setPayErr(null);
    try {
      const res = await fetch(`/api/dashboard/subscriptions/${subscription.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success && data.url) { window.location.href = data.url; return; } // → Stripe Checkout
      setPayErr(data.message || "Could not start card payment. You can pay by bank transfer below.");
    } catch (err) {
      setPayErr(err.message || "Network error. You can pay by bank transfer below.");
    }
    setPaying(false);
  }

  return (
    <div className="flex flex-col" style={{ maxHeight: "calc(100vh - 50px)" }}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-12 h-12 grid place-items-center mx-auto mb-3"
          style={{ backgroundColor: SUCCESS_BG, borderRadius: "999px" }}
        >
          <CheckCircle2 size={22} strokeWidth={2} style={{ color: SUCCESS }} />
        </motion.div>
        <h2
          className="text-[22px] mb-1"
          style={{
            color: INK,
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontWeight: 600,
            }}
        >
          Subscription submitted
        </h2>
        <p className="text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
          {units} units · {currencySymbol}{totalAmount.toLocaleString("en-GB")} committed
        </p>
      </div>

      {/* Pay by card (Stripe) — always offered; /pay returns a clean message
          if keys aren't configured yet, so nothing breaks pre-config. */}
      <div className="mb-3.5">
          <motion.button
            type="button"
            onClick={startCardPayment}
            disabled={paying}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-bold disabled:opacity-70"
            style={{
              backgroundColor: GOLD,
              color: INK,
              border: "none",
              borderRadius: "12px",
              cursor: paying ? "wait" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(201,162,74,0.45), 0 8px 20px rgba(201,162,74,0.26)",
            }}
          >
            {paying ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} strokeWidth={2.25} />}
            {paying ? "Redirecting to secure checkout…" : `Pay ${amountLabel} by card`}
          </motion.button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] mt-2.5 text-center" style={{ color: TEXT_MUTED }}>
            <Lock size={11} /> Secure checkout by Stripe · after paying you’ll upload your receipt to confirm.
          </p>

          {payErr && (
            <div className="mt-3 p-2.5 flex items-start gap-2" style={{ backgroundColor: DANGER_BG, borderRadius: "8px" }}>
              <AlertCircle size={13} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px]" style={{ color: DANGER }}>{payErr}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(10,31,68,0.1)" }} />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: TEXT_MUTED }}>or pay by bank transfer</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(10,31,68,0.1)" }} />
          </div>
      </div>

      {/* Bank transfer instructions */}
      <div
        className="p-3.5 mb-3.5"
        style={{ backgroundColor: "#FBF8F1", border: "1px solid rgba(201,162,74,0.3)", borderRadius: "12px" }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Landmark size={15} style={{ color: GOLD_DARK }} />
          <p className="text-[12px] font-bold" style={{ color: GOLD_DARK }}>Bank transfer instructions</p>
        </div>
        <div className="space-y-1.5 text-[12px]">
          <BankRow label="Account name" value={spv?.bankAccountName || spv?.spvName || "—"} />
          <BankRow label="Reference" value={spv?.bankAccountReference || `BW-${subscription.id?.slice(-6).toUpperCase()}`} />
          <BankRow label="Amount" value={amountLabel} />
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>
          Full bank details will also be available on your subscription page. Please use the
          reference shown so we can match your payment.
        </p>
      </div>

      {/* Next steps */}
      <div>
        <p className="text-[11px] tracking-[0.1em] uppercase font-bold mb-2" style={{ color: TEXT_MUTED }}>
          What happens next
        </p>
        <ol className="space-y-1.5">
          <NextStep n={1} text="Pay by card above, or make a bank transfer using the reference" />
          <NextStep n={2} text="Upload your proof of payment on the subscription page" />
          <NextStep n={3} text="Our team verifies and allocates your units" />
          <NextStep n={4} text="Your share certificate is issued and ready to download" />
        </ol>
      </div>

      </div>

      {/* Sticky footer — always reachable, even when the body scrolls */}
      <div
        className="px-6 py-4 flex gap-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(10,31,68,0.08)", backgroundColor: "#FFFFFF" }}
      >
        <a
          href={`/dashboard/subscriptions/${subscription.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold"
          style={{
            backgroundColor: NAVY_900,
            color: CREAM,
            borderRadius: "10px",
            textDecoration: "none",
          }}
        >
          Upload proof of payment <ArrowRight size={14} />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 text-[12.5px] font-semibold"
          style={{
            backgroundColor: "transparent",
            color: TEXT_SECONDARY,
            border: "1px solid rgba(10,31,68,0.12)",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

function BankRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: TEXT_SECONDARY }}>{label}</span>
      <span className="font-semibold" style={{ color: INK }}>{value}</span>
    </div>
  );
}

function NextStep({ n, text }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="w-5 h-5 grid place-items-center text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: GOLD_LIGHT, color: GOLD_DARK, borderRadius: "999px" }}
      >
        {n}
      </span>
      <span className="text-[12px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{text}</span>
    </li>
  );
}