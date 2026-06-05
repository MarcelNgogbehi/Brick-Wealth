"use client";

// app/admin/distributions/[id]/page.jsx
//
// Distribution detail page — shows full summary, allocation table,
// and inline Record / Cancel actions.

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Banknote, Loader2, AlertCircle, CheckCircle2,
  Clock, XCircle, Users, Calendar, Play, Trash2, Building2,
  Hash, Percent, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const NAVY        = "#0A1F44";
const GOLD        = "#C9A24A";
const GOLD_DARK   = "#9A7A2E";
const INK         = "#0B1220";
const T2          = "#4A5468";
const TMUTED      = "#8A93A6";
const SUCCESS     = "#0F6E56";
const SUCCESS_BG  = "#E8F4F0";
const DANGER      = "#9B2C2C";
const DANGER_BG   = "#FBEAEA";
const WARNING     = "#B8860B";
const WARNING_BG  = "#FBF5E1";
const BORDER      = "#E4E4E7";
const SURFACE     = "#FFFFFF";
const PAGE_BG     = "#F7F8FA";
const MUTED_BG    = "#F4F4F5";

const CS = { GBP: "£", USD: "$", EUR: "€" };

const STATUS_META = {
  DRAFT:     { label: "Draft",     bg: MUTED_BG,   fg: T2,      Icon: Clock        },
  RECORDED:  { label: "Recorded",  bg: "#E8EEF7",  fg: NAVY,    Icon: CheckCircle2 },
  PAID:      { label: "Paid",      bg: SUCCESS_BG, fg: SUCCESS, Icon: Banknote     },
  CANCELLED: { label: "Cancelled", bg: DANGER_BG,  fg: DANGER,  Icon: XCircle      },
};

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function money(val, symbol = "£") {
  if (val == null) return "—";
  return `${symbol}${Number(val).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DistributionDetailPage() {
  const { confirm } = useDialog();
  const { id }  = useParams();
  const router  = useRouter();

  const [dist,    setDist]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);
  const [toast,   setToast]   = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(false);
  const [showAllocs,    setShowAllocs]    = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const res  = await fetch(`/api/admin/distributions/${id}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setDist(data.distribution);
      else setErr(data.message || "Failed to load");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function flash(msg, kind = "success") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleRecord() {
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/distributions/${id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ action: "record" }),
      });
      const data = await res.json();
      if (data.success) {
        flash(data.message || `Recorded. ${data.allocationCount} holders notified.`);
        setConfirmRecord(false);
        load();
      } else {
        flash(data.message || "Failed to record", "error");
      }
    } catch (e) { flash(e.message, "error"); }
    setBusy(false);
  }

  async function handleCancel() {
    const ok = await confirm({
      title: "Cancel this distribution?",
      message: "Drafts are deleted; recorded ones are marked cancelled.",
      confirmLabel: "Cancel distribution",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/distributions/${id}`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        flash(data.message || "Cancelled", "neutral");
        setTimeout(() => router.push("/admin/distributions"), 1200);
      } else {
        flash(data.message || "Failed", "error");
      }
    } catch (e) { flash(e.message, "error"); }
    setBusy(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (err || !dist) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12 text-center">
        <AlertCircle size={28} className="mx-auto mb-3" style={{ color: DANGER }} />
        <p className="text-[14px] font-semibold" style={{ color: DANGER }}>{err || "Distribution not found"}</p>
        <button
          type="button"
          onClick={() => router.push("/admin/distributions")}
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: T2, background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={13} /> Back to Distributions
        </button>
      </div>
    );
  }

  const meta   = STATUS_META[dist.status] ?? STATUS_META.DRAFT;
  const cs     = CS[dist.currency] ?? "£";
  const allocs = dist.allocations ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: "100%" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-16">

        {/* ── Back + title ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/distributions")}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-3"
              style={{ color: TMUTED, background: "none", border: "none", cursor: "pointer" }}
            >
              <ArrowLeft size={13} /> Back to Distributions
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] uppercase rounded-[5px]"
                style={{ backgroundColor: meta.bg, color: meta.fg }}
              >
                <meta.Icon size={11} /> {meta.label}
              </span>
              <h1 className="text-[22px] font-bold" style={{ color: INK }}>
                {dist.declarationLabel}
              </h1>
            </div>
            {dist.spv && (
              <p className="text-[13px] mt-1" style={{ color: T2 }}>
                {dist.spv.spvName}
                {dist.spv.opportunity?.title && ` · ${dist.spv.opportunity.title}`}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {dist.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => setConfirmRecord(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold tracking-[0.04em] uppercase disabled:opacity-50"
                style={{ backgroundColor: SUCCESS, color: SURFACE, border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                Record
              </button>
            )}
            {dist.status !== "CANCELLED" && dist.status !== "PAID" && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold disabled:opacity-50"
                style={{ backgroundColor: SURFACE, color: DANGER, border: `1px solid ${DANGER}44`, borderRadius: "8px", cursor: "pointer" }}
              >
                <Trash2 size={13} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Toast ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-[9px]"
              style={{
                backgroundColor: toast.kind === "error" ? DANGER_BG : toast.kind === "success" ? SUCCESS_BG : MUTED_BG,
                border: `1px solid ${toast.kind === "error" ? "#f5c6c6" : toast.kind === "success" ? "#a3d9c9" : BORDER}`,
              }}
            >
              {toast.kind === "error"
                ? <AlertCircle size={14} style={{ color: DANGER }} />
                : <CheckCircle2 size={14} style={{ color: toast.kind === "success" ? SUCCESS : T2 }} />
              }
              <p className="text-[12.5px]" style={{ color: toast.kind === "error" ? DANGER : toast.kind === "success" ? SUCCESS : T2 }}>
                {toast.msg}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Confirm Record banner ──────────────────────────────── */}
        <AnimatePresence>
          {confirmRecord && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="p-4 rounded-[10px]" style={{ backgroundColor: WARNING_BG, border: `1px solid ${WARNING}44` }}>
                <p className="text-[13px] font-bold mb-1" style={{ color: WARNING }}>
                  Confirm: Record this distribution?
                </p>
                <p className="text-[12.5px] mb-3" style={{ color: T2, lineHeight: 1.6 }}>
                  This will snapshot all current holders, attribute {money(dist.totalAmount, cs)} pro-rata,
                  and notify every holder. The distribution can&apos;t be edited afterwards — only cancelled.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRecord}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold tracking-[0.04em] uppercase disabled:opacity-50"
                    style={{ backgroundColor: SUCCESS, color: SURFACE, border: "none", borderRadius: "8px", cursor: "pointer" }}
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Confirm & record
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRecord(false)}
                    className="px-4 py-2 text-[12px] font-semibold"
                    style={{ backgroundColor: SURFACE, color: T2, border: `1px solid ${BORDER}`, borderRadius: "8px", cursor: "pointer" }}
                  >
                    Go back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            Summary grid
        ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          {/* Total amount */}
          <SummaryCard icon={<Banknote size={15} style={{ color: GOLD_DARK }} />} label="Total Amount">
            <span className="text-[26px] font-bold" style={{ color: INK }}>
              {money(dist.totalAmount, cs)}
            </span>
            {dist.amountPerUnit && dist.amountPerUnit !== "0" && (
              <p className="text-[11.5px] mt-0.5" style={{ color: TMUTED }}>
                {money(dist.amountPerUnit, cs)} per unit
              </p>
            )}
          </SummaryCard>

          {/* Dates */}
          <SummaryCard icon={<Calendar size={15} style={{ color: GOLD_DARK }} />} label="Dates">
            <p className="text-[13px] font-semibold" style={{ color: INK }}>
              Record: {fmt(dist.recordDate)}
            </p>
            <p className="text-[13px] font-semibold mt-0.5" style={{ color: INK }}>
              Payment: {fmt(dist.paymentDate)}
            </p>
            <p className="text-[11px] mt-1" style={{ color: TMUTED }}>
              Tax year: {dist.taxYearUk || "—"}
            </p>
          </SummaryCard>

          {/* SPV */}
          <SummaryCard icon={<Building2 size={15} style={{ color: GOLD_DARK }} />} label="SPV">
            <p className="text-[13px] font-semibold" style={{ color: INK }}>
              {dist.spv?.spvName || "—"}
            </p>
            {dist.spv?.companyNumber && (
              <p className="text-[11.5px] mt-0.5" style={{ color: TMUTED }}>
                Co. {dist.spv.companyNumber}
              </p>
            )}
          </SummaryCard>

          {/* Holders (only after recording) */}
          {dist.status !== "DRAFT" && (
            <SummaryCard icon={<Users size={15} style={{ color: GOLD_DARK }} />} label="Holders at Record">
              <span className="text-[26px] font-bold" style={{ color: INK }}>
                {dist.holdersAtRecord ?? allocs.length}
              </span>
              {dist.totalUnitsAtRecord && (
                <p className="text-[11.5px] mt-0.5" style={{ color: TMUTED }}>
                  {dist.totalUnitsAtRecord} total units
                </p>
              )}
            </SummaryCard>
          )}

          {/* Withholding */}
          {dist.withholdingPct != null && (
            <SummaryCard icon={<Percent size={15} style={{ color: GOLD_DARK }} />} label="Withholding">
              <span className="text-[26px] font-bold" style={{ color: INK }}>
                {dist.withholdingPct}%
              </span>
              {dist.withholdingNote && (
                <p className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: TMUTED }}>
                  {dist.withholdingNote}
                </p>
              )}
            </SummaryCard>
          )}

          {/* Bank reference */}
          {dist.bankReference && (
            <SummaryCard icon={<Hash size={15} style={{ color: GOLD_DARK }} />} label="Bank Reference">
              <p className="text-[13px] font-semibold break-all" style={{ color: INK }}>
                {dist.bankReference}
              </p>
            </SummaryCard>
          )}

          {/* Description */}
          {dist.description && (
            <SummaryCard icon={<FileText size={15} style={{ color: GOLD_DARK }} />} label="Description" wide>
              <p className="text-[13px] leading-relaxed" style={{ color: T2 }}>
                {dist.description}
              </p>
            </SummaryCard>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            Allocations table
        ════════════════════════════════════════════════════════════ */}
        <div
          className="overflow-hidden"
          style={{ backgroundColor: SURFACE, borderRadius: "14px", border: `1px solid ${BORDER}` }}
        >
          {/* Table header bar */}
          <button
            type="button"
            onClick={() => setShowAllocs((v) => !v)}
            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <div className="flex items-center gap-2.5">
              <Users size={15} style={{ color: GOLD_DARK }} />
              <p className="text-[14px] font-bold" style={{ color: INK }}>
                Allocations
              </p>
              {allocs.length > 0 && (
                <span
                  className="px-2 py-0.5 text-[10.5px] font-bold rounded-full"
                  style={{ backgroundColor: "#E8EEF7", color: NAVY }}
                >
                  {allocs.length} holders
                </span>
              )}
            </div>
            {showAllocs
              ? <ChevronUp size={15} style={{ color: TMUTED }} />
              : <ChevronDown size={15} style={{ color: TMUTED }} />
            }
          </button>

          <AnimatePresence>
            {showAllocs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {allocs.length === 0 ? (
                  <div
                    className="py-12 text-center"
                    style={{ borderTop: `1px solid ${BORDER}` }}
                  >
                    <Users size={22} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: TMUTED }} />
                    <p className="text-[13px]" style={{ color: TMUTED }}>
                      {dist.status === "DRAFT"
                        ? "Allocations are computed when you record the distribution."
                        : "No allocations found."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ borderTop: `1px solid ${BORDER}` }}>
                    {/* Column headers */}
                    <div
                      className="hidden sm:grid px-5 sm:px-6 py-2.5"
                      style={{
                        gridTemplateColumns: "1fr 100px 120px 120px 120px",
                        backgroundColor: "#FAFAFA",
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      {["Investor", "Units", "Gross", "Withholding", "Net"].map((h) => (
                        <span
                          key={h}
                          className="text-[10px] font-bold tracking-[0.14em] uppercase"
                          style={{ color: TMUTED }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {allocs.map((a, i) => (
                      <div
                        key={a.id}
                        className="flex sm:grid items-center gap-3 px-5 sm:px-6 py-3.5 flex-wrap"
                        style={{
                          gridTemplateColumns: "1fr 100px 120px 120px 120px",
                          borderBottom: i < allocs.length - 1 ? `1px solid ${BORDER}` : "none",
                        }}
                      >
                        {/* Investor */}
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: INK }}>
                            {a.user?.fullName || "—"}
                          </p>
                          {a.user?.email && (
                            <p className="text-[11px] truncate" style={{ color: TMUTED }}>
                              {a.user.email}
                            </p>
                          )}
                        </div>
                        {/* Units */}
                        <p className="text-[13px] font-semibold" style={{ color: T2 }}>
                          {a.units}
                        </p>
                        {/* Gross */}
                        <p className="text-[13px] font-semibold" style={{ color: INK }}>
                          {money(a.grossAmount, cs)}
                        </p>
                        {/* Withholding */}
                        <p className="text-[13px]" style={{ color: TMUTED }}>
                          {a.withholdingAmount && a.withholdingAmount !== "0"
                            ? money(a.withholdingAmount, cs)
                            : "—"}
                        </p>
                        {/* Net */}
                        <p className="text-[13px] font-bold" style={{ color: SUCCESS }}>
                          {money(a.netAmount, cs)}
                        </p>
                      </div>
                    ))}

                    {/* Totals footer */}
                    <div
                      className="hidden sm:grid px-5 sm:px-6 py-3"
                      style={{
                        gridTemplateColumns: "1fr 100px 120px 120px 120px",
                        borderTop: `1px solid ${BORDER}`,
                        backgroundColor: "#FAFAFA",
                      }}
                    >
                      <p className="text-[11px] font-bold tracking-[0.06em] uppercase" style={{ color: TMUTED }}>
                        Total
                      </p>
                      <p className="text-[12px] font-bold" style={{ color: T2 }}>
                        {allocs.reduce((s, a) => s + (Number(a.units) || 0), 0)}
                      </p>
                      <p className="text-[12px] font-bold" style={{ color: INK }}>
                        {money(dist.totalAmount, cs)}
                      </p>
                      <p className="text-[12px] font-bold" style={{ color: TMUTED }}>
                        {money(
                          allocs.reduce((s, a) => s + (Number(a.withholdingAmount) || 0), 0),
                          cs
                        )}
                      </p>
                      <p className="text-[12px] font-bold" style={{ color: SUCCESS }}>
                        {money(
                          allocs.reduce((s, a) => s + (Number(a.netAmount) || 0), 0),
                          cs
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

// ─── Small helper card ────────────────────────────────────────────────────────
function SummaryCard({ icon, label, children, wide }) {
  return (
    <div
      className={`p-4 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: `1px solid #E4E4E7`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span
          className="text-[10.5px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "#8A93A6" }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
