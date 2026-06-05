"use client";

// app/dashboard/_components/SellSharesModal.jsx  +  SellSharesButton
//
// Investor offers units in an SPV back to the company. Compliance-safe:
// the copy makes clear sales are manual, discretionary, and not guaranteed.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, ArrowRight, CheckCircle2, AlertCircle, Info, TrendingDown,
} from "lucide-react";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
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
const BORDER = "#E4E4E7";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function SellSharesModal({ spvId, open, onClose, onSuccess }) {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("units"); // units | note | confirm | done
  const [units, setUnits] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/sales?spvId=${spvId}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setCtx(data);
      else setError(data.message);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [spvId]);

  useEffect(() => {
    if (open) {
      setStep("units"); setUnits(""); setNote(""); setError(null);
      load();
    }
  }, [open, load]);

  if (!open) return null;

  const unitPrice = ctx ? parseFloat(ctx.spv?.unitPrice || "0") : 0;
  const currencySymbol = ctx?.spv?.currency === "USD" ? "$" : ctx?.spv?.currency === "EUR" ? "€" : "£";
  const unitsNum = parseInt(units, 10) || 0;
  const indicative = unitsNum * unitPrice;
  const sellable = ctx?.sellableUnits || 0;
  const unitsValid = unitsNum >= 1 && unitsNum <= sellable;

  async function submit() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/dashboard/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ spvId, unitsOffered: unitsNum, investorNote: note || undefined }),
      });
      const data = await res.json();
      if (data.success) { setStep("done"); if (onSuccess) onSuccess(data.saleRequest); }
      else setError(data.message || "Failed");
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ backgroundColor: "rgba(6,20,47,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[480px] overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: "#FFFFFF", borderRadius: "16px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ background: `linear-gradient(135deg, ${NAVY_900}, ${NAVY_950})` }}>
            <div className="flex items-center gap-2.5">
              <TrendingDown size={16} style={{ color: GOLD }} />
              <span className="text-[13px] font-bold" style={{ color: CREAM, fontFamily: "var(--font-montserrat), sans-serif" }}>
                Sell Shares
              </span>
            </div>
            <button onClick={onClose} style={{ color: "rgba(248,244,236,0.7)", cursor: "pointer", background: "none", border: "none" }}>
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 grid place-items-center"><Loader2 size={20} className="animate-spin" style={{ color: GOLD }} /></div>
          ) : error && !ctx ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle size={22} className="mx-auto mb-2" style={{ color: DANGER }} />
              <p className="text-[13px]" style={{ color: DANGER }}>{error}</p>
            </div>
          ) : sellable <= 0 && step !== "done" ? (
            <div className="px-6 py-12 text-center">
              <Info size={22} className="mx-auto mb-2" style={{ color: WARNING }} />
              <p className="text-[14px] font-semibold mb-1" style={{ color: INK }}>No units available to sell</p>
              <p className="text-[12.5px]" style={{ color: TEXT_MUTED }}>
                You either hold no units here, or all your units are already tied up in a pending sale request.
              </p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {step === "units" && (
                <>
                  <p className="text-[10px] tracking-[0.1em] uppercase font-bold mb-1" style={{ color: GOLD_DARK }}>
                    {ctx.spv.spvName}
                  </p>
                  <p className="text-[13px] mb-4" style={{ color: TEXT_SECONDARY }}>
                    You can offer up to <strong style={{ color: INK }}>{sellable.toLocaleString()} unit{sellable === 1 ? "" : "s"}</strong> back to the company.
                  </p>

                  <label className="text-[11px] font-bold tracking-[0.06em] uppercase block mb-1.5" style={{ color: TEXT_MUTED }}>Units to sell</label>
                  <input
                    type="number" value={units} onChange={(e) => setUnits(e.target.value)}
                    min={1} max={sellable} placeholder={`Max ${sellable.toLocaleString()}`}
                    className="w-full text-[15px] outline-none mb-1.5"
                    style={{ padding: "11px 13px", border: `1px solid ${BORDER}`, borderRadius: "9px", color: INK, fontFamily: "inherit" }}
                  />
                  <p className="text-[11px] mb-4" style={{ color: TEXT_MUTED }}>
                    Indicative {currencySymbol}{unitPrice.toLocaleString("en-GB", { minimumFractionDigits: 2 })}/unit
                  </p>

                  {unitsNum > 0 && (
                    <div className="p-3.5 mb-4" style={{ backgroundColor: WARNING_BG, borderRadius: "10px" }}>
                      <div className="flex justify-between text-[12.5px]">
                        <span style={{ color: WARNING }}>Indicative proceeds</span>
                        <span className="font-bold" style={{ color: INK }}>
                          {currencySymbol}{indicative.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <button type="button" disabled={!unitsValid} onClick={() => setStep("note")}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase disabled:opacity-40"
                    style={{ backgroundColor: NAVY_900, color: CREAM, border: "none", borderRadius: "9px", cursor: unitsValid ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    Continue <ArrowRight size={14} />
                  </button>
                </>
              )}

              {step === "note" && (
                <>
                  <p className="text-[14px] font-semibold mb-3" style={{ color: INK }}>Anything we should know? (optional)</p>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                    placeholder="e.g. preferred timeline, reason for selling"
                    className="w-full text-[13px] outline-none mb-4"
                    style={{ padding: "11px 13px", border: `1px solid ${BORDER}`, borderRadius: "9px", color: INK, fontFamily: "inherit", resize: "vertical" }}
                  />
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setStep("units")} className="px-4 py-3 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>Back</button>
                    <button type="button" onClick={() => setStep("confirm")} className="flex-1 flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase"
                      style={{ backgroundColor: NAVY_900, color: CREAM, border: "none", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>
                      Review <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}

              {step === "confirm" && (
                <>
                  <p className="text-[14px] font-semibold mb-4" style={{ color: INK }}>Confirm your sale request</p>
                  <div className="space-y-2.5 mb-4">
                    <Row label="SPV" value={ctx.spv.spvName} />
                    <Row label="Units to sell" value={unitsNum.toLocaleString()} />
                    <Row label="Indicative proceeds" value={`${currencySymbol}${indicative.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} bold />
                  </div>

                  <div className="flex items-start gap-2 p-3 mb-4" style={{ backgroundColor: WARNING_BG, borderRadius: "9px" }}>
                    <Info size={14} style={{ color: WARNING, marginTop: 1, flexShrink: 0 }} />
                    <p className="text-[11.5px]" style={{ color: WARNING, lineHeight: 1.5 }}>
                      Share sales are processed manually at our discretion and are <strong>not guaranteed</strong>. There is no public market for these shares. Our team will contact you about timing and the final price, which may differ from the indicative figure.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 mb-3" style={{ backgroundColor: DANGER_BG, borderRadius: "9px" }}>
                      <AlertCircle size={14} style={{ color: DANGER }} />
                      <p className="text-[12px]" style={{ color: DANGER }}>{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => setStep("note")} disabled={busy} className="px-4 py-3 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>Back</button>
                    <button type="button" onClick={submit} disabled={busy} className="flex-1 flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold tracking-[0.04em] uppercase disabled:opacity-50"
                      style={{ backgroundColor: GOLD, color: NAVY_900, border: "none", borderRadius: "9px", cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Submit request
                    </button>
                  </div>
                </>
              )}

              {step === "done" && (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-4" style={{ backgroundColor: SUCCESS_BG }}>
                    <CheckCircle2 size={24} style={{ color: SUCCESS }} />
                  </div>
                  <p className="text-[16px] font-bold mb-1.5" style={{ color: INK }}>Request submitted</p>
                  <p className="text-[13px] mb-6 max-w-[320px] mx-auto" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    Your request to sell {unitsNum.toLocaleString()} units is now with our team. We'll be in touch about next steps.
                  </p>
                  <div className="flex gap-2.5 justify-center">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFF", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "9px", cursor: "pointer", fontFamily: "inherit" }}>Close</button>
                    <a href="/dashboard/sales" className="px-5 py-2.5 text-[12px] font-bold tracking-[0.04em] uppercase"
                      style={{ backgroundColor: NAVY_900, color: CREAM, borderRadius: "9px", textDecoration: "none", fontFamily: "inherit" }}>My sale requests</a>
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

export default function SellSharesButton({ spvId, onSuccess, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-bold tracking-[0.04em] uppercase transition-all"
        style={{ backgroundColor: "transparent", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif" }}>
        <TrendingDown size={13} />
        {children || "Sell"}
      </button>
      <SellSharesModal spvId={spvId} open={open} onClose={() => setOpen(false)} onSuccess={onSuccess} />
    </>
  );
}

export { SellSharesModal };