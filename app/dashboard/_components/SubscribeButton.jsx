"use client";

// app/dashboard/_components/SubscribeButton.jsx
//
// Drops into the investor opportunity detail page (sidebar or sticky bar).
// Handles eligibility display + opens the SubscribeModal.
//
// Usage:
//   <SubscribeButton
//     opportunity={opp}        // from getOpportunityForInvestor
//     userKycStatus={kyc}      // "approved" | other
//     onSubscribed={() => {}}  // optional callback after success
//   />

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import SubscribeModal from "./SubscribeModal";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const CREAM = "#F8F4EC";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const WARNING_BG = "#FBF5E1";
const WARNING = "#B8860B";

export default function SubscribeButton({
  opportunity,
  userKycStatus,
  existingSubscription = null,  // pass if investor already has one (active)
  onSubscribed,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const spv = opportunity?.spv;
  const remainingUnits = spv
    ? (spv.totalUnits ?? 0) - (spv.unitsAllocated ?? 0)
    : 0;

  const currencySymbol = spv?.currency === "USD" ? "$" : spv?.currency === "EUR" ? "€" : "£";
  const unitPrice = parseFloat(spv?.unitPrice || "0");

  // ─── Determine gate state ──────────────────────────────────────
  let gate = null;

  if (existingSubscription) {
    gate = {
      type: "existing",
      icon: Clock,
      title: "Subscription in progress",
      message: `You have an active subscription (${existingSubscription.status?.replace(/_/g, " ").toLowerCase()}).`,
    };
  } else if (opportunity?.status !== "live") {
    gate = {
      type: "closed",
      icon: Lock,
      title: "Not open",
      message: "This opportunity isn't currently open for subscription.",
    };
  } else if (userKycStatus !== "approved") {
    // KYC approval is required before subscribing to ANY opportunity.
    const kycMessage =
      userKycStatus === "pending_review"
        ? "Your identity verification is under review. You can subscribe once it's approved (typically within 24–72 hours)."
        : userKycStatus === "rejected"
        ? "Your identity verification was not approved. Please re-submit your documents to continue."
        : "Your identity must be verified and approved before you can subscribe.";
    gate = {
      type: "kyc",
      icon: AlertCircle,
      title: "KYC approval required",
      message: kycMessage,
    };
  } else if (remainingUnits <= 0) {
    gate = {
      type: "full",
      icon: CheckCircle2,
      title: "Fully subscribed",
      message: "This opportunity has been fully subscribed.",
    };
  }

  return (
    <>
      <div
        className="p-5"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(10, 31, 68, 0.08)",
          borderRadius: "14px",
          boxShadow: "0 1px 3px rgba(10, 31, 68, 0.04)",
        }}
      >
        {/* Pricing summary */}
        <div className="mb-4">
          <p className="text-[10px] tracking-[0.18em] uppercase font-bold mb-1.5" style={{ color: TEXT_MUTED }}>
            Investment
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[28px] leading-none"
              style={{
                color: INK,
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontWeight: 600,
              }}
            >
              {currencySymbol}{unitPrice.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[12px]" style={{ color: TEXT_MUTED }}>per unit</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span style={{ color: TEXT_SECONDARY }}>Minimum</span>
            <span className="font-semibold" style={{ color: INK }}>
              {spv?.minimumUnits ?? 1} unit{(spv?.minimumUnits ?? 1) === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[12px]">
            <span style={{ color: TEXT_SECONDARY }}>Available</span>
            <span className="font-semibold" style={{ color: remainingUnits > 0 ? INK : WARNING }}>
              {remainingUnits.toLocaleString("en-GB")} of {(spv?.totalUnits ?? 0).toLocaleString("en-GB")}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div
              className="h-1.5 w-full overflow-hidden"
              style={{ backgroundColor: "rgba(10, 31, 68, 0.06)", borderRadius: "999px" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${spv?.totalUnits > 0 ? Math.min(100, (spv.unitsAllocated / spv.totalUnits) * 100) : 0}%`,
                  background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD})`,
                  borderRadius: "999px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px]" style={{ color: TEXT_MUTED }}>
              {spv?.totalUnits > 0 ? Math.round((spv.unitsAllocated / spv.totalUnits) * 100) : 0}% subscribed
            </p>
          </div>
        </div>

        {/* Gate OR subscribe button */}
        {gate ? (
          <div
            className="p-3.5 flex items-start gap-2.5"
            style={{
              backgroundColor: gate.type === "full" ? SUCCESS_BG : WARNING_BG,
              borderRadius: "10px",
            }}
          >
            <gate.icon
              size={15}
              strokeWidth={2}
              style={{ color: gate.type === "full" ? SUCCESS : WARNING, flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <p className="text-[12.5px] font-semibold" style={{ color: gate.type === "full" ? SUCCESS : WARNING }}>
                {gate.title}
              </p>
              <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                {gate.message}
              </p>
              {gate.type === "kyc" && userKycStatus !== "pending_review" && (
                <a
                  href="/dashboard/documents"
                  className="inline-block mt-2 text-[11.5px] font-semibold"
                  style={{ color: GOLD_DARK, textDecoration: "underline" }}
                >
                  {userKycStatus === "rejected" ? "Re-submit documents →" : "Complete verification →"}
                </a>
              )}
              {gate.type === "existing" && (
                <a
                  href="/dashboard/subscriptions"
                  className="inline-block mt-2 text-[11.5px] font-semibold"
                  style={{ color: GOLD_DARK, textDecoration: "underline" }}
                >
                  View my subscriptions →
                </a>
              )}
            </div>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => setModalOpen(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold"
            style={{
              backgroundColor: NAVY_900,
              color: CREAM,
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            Subscribe to this opportunity
            <ArrowRight size={15} />
          </motion.button>
        )}

        {/* Risk note */}
        <p className="mt-3 text-[10px] leading-relaxed text-center" style={{ color: TEXT_MUTED }}>
          Capital is at risk. Property values can fall as well as rise.
          You may get back less than you invest.
        </p>
      </div>

      {modalOpen && (
        <SubscribeModal
          opportunity={opportunity}
          onClose={() => setModalOpen(false)}
          onSubscribed={(sub) => {
            setModalOpen(false);
            if (onSubscribed) onSubscribed(sub);
          }}
        />
      )}
    </>
  );
}