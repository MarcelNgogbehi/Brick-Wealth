"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import BuyMoreModal from "../_components/BuyMoreModal";

export default function BuyMoreButton({ opportunityId, variant = "default", onSuccess }) {
  const [open, setOpen] = useState(false);

  const isGhost = variant === "ghost";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold whitespace-nowrap rounded-lg border transition-colors"
        style={{
          backgroundColor: "rgba(10,110,79,0.08)",
          color: "#0A6E4F",
          borderColor: "rgba(10,110,79,0.25)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Plus size={11} strokeWidth={2.5} />
        Buy more
      </button>

      <BuyMoreModal
        opportunityId={opportunityId}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
}
