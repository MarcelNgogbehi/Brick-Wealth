"use client";

// app/dashboard/_components/BuyMoreButton.jsx
//
// Trigger button for the Buy More modal. Drop onto each holding card on
// the Holdings page (pass the holding's opportunityId).

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import BuyMoreModal from "./BuyMoreModal";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_DARK = "#9A7A2E";
const CREAM = "#F8F4EC";

export default function BuyMoreButton({
  opportunityId,
  variant = "solid",       // "solid" | "ghost"
  onSuccess,
  children,
}) {
  const [open, setOpen] = useState(false);

  const baseStyle =
    variant === "ghost"
      ? {
          backgroundColor: "transparent",
          color: GOLD_DARK,
          border: `1px solid ${GOLD}`,
        }
      : {
          backgroundColor: NAVY_900,
          color: CREAM,
          border: "none",
        };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-bold tracking-[0.04em] uppercase transition-all"
        style={{
          ...baseStyle,
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        <TrendingUp size={13} />
        {children || "Buy more"}
      </button>

      <BuyMoreModal
        opportunityId={opportunityId}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(sub) => {
          if (onSuccess) onSuccess(sub);
        }}
      />
    </>
  );
}