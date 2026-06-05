"use client";

// app/admin/subscriptions/[id]/page.jsx
// Reads :id from the route and renders the full subscription detail + workflow.

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2, ArrowLeft, CheckCircle2, Banknote, XCircle, Award,
  ShieldAlert, ExternalLink, AlertCircle, User, MapPin, Wallet,
  FileCheck, Clock, TrendingUp, Plus,
} from "lucide-react";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const BORDER = "#E4E4E7";
const SIDEBAR_GRAY = "#F4F4F5";
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

export default function AdminSubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = params.id;

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allocUnits, setAllocUnits] = useState("");
  const [allocNotes, setAllocNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setSub(data.subscription);
      else setError(data.message);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [subscriptionId]);

  useEffect(() => { load(); }, [load]);

  function flash(msg, isError) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  }

  async function doAction(action, extra = {}) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.success) { flash(data.message); setShowReject(false); load(); }
      else flash(data.message || "Action failed", true);
    } catch (err) { flash(err.message, true); }
    setBusy(false);
  }

  async function doAllocate() {
    const units = parseInt(allocUnits, 10);
    if (!units || units < 1) { flash("Enter a valid unit count", true); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ unitsAllocated: units, notes: allocNotes || undefined }),
      });
      const data = await res.json();
      if (data.success) { flash(data.message); setAllocUnits(""); setAllocNotes(""); load(); }
      else flash(data.message || "Allocation failed", true);
    } catch (err) { flash(err.message, true); }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={20} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }
  if (!sub) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <AlertCircle size={22} className="mx-auto mb-2" style={{ color: DANGER }} />
          <p className="text-[13px] mb-3" style={{ color: DANGER }}>{error || "Not found"}</p>
          <a href="/admin/subscriptions" className="text-[12.5px] font-semibold" style={{ color: GOLD_DARK }}>
            ← Back to queue
          </a>
        </div>
      </div>
    );
  }

  const inv = sub.investor;
  const spv = sub.opportunity?.spv;
  const currencySymbol = sub.currency === "USD" ? "$" : sub.currency === "EUR" ? "€" : "£";
  const remaining = sub.remainingToAllocate;

  const canVerify = ["SUBMITTED", "UNDER_REVIEW"].includes(sub.status);
  const canFund = sub.status === "VERIFIED";
  const canAllocate = ["FUNDED", "PARTIALLY_ALLOCATED"].includes(sub.status) && remaining > 0;
  const canReject = !["REJECTED", "CANCELLED", "FULLY_ALLOCATED"].includes(sub.status)
    && sub.allocatedUnits === 0;

  return (
    <div className="max-w-5xl mx-auto">
      <a
        href="/admin/subscriptions"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-4"
        style={{ color: TEXT_SECONDARY, textDecoration: "none" }}
      >
        <ArrowLeft size={13} /> Queue
      </a>

      {success && (
        <div className="mb-4 p-3 flex items-center gap-2" style={{ backgroundColor: SUCCESS_BG, borderRadius: "8px" }}>
          <CheckCircle2 size={14} style={{ color: SUCCESS }} />
          <p className="text-[13px] font-semibold" style={{ color: SUCCESS }}>{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 flex items-center gap-2" style={{ backgroundColor: DANGER_BG, borderRadius: "8px" }}>
          <AlertCircle size={14} style={{ color: DANGER }} />
          <p className="text-[13px]" style={{ color: DANGER }}>{error}</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: INK }}>
              {sub.opportunity?.title || "Subscription"}
            </h1>
            {sub.oversizedFlag && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "4px" }}>
                <ShieldAlert size={10} /> AML
              </span>
            )}
          </div>
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
            {sub.unitsRequested} units · {currencySymbol}{parseFloat(sub.totalAmount).toLocaleString("en-GB")}
            {" · "}{currencySymbol}{parseFloat(sub.unitPriceAtSub).toLocaleString("en-GB")}/unit
          </p>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Investor" icon={User}>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Name" value={inv?.fullName} />
              <Field label="Email" value={inv?.email} />
              <Field label="Phone" value={inv?.phoneNumber || "—"} />
              <Field label="Investor type" value={inv?.investorType || "—"} capitalize />
              <Field label="KYC status" value={inv?.kycStatus} badge={inv?.kycStatus === "approved" ? SUCCESS : WARNING} />
              <Field label="Net worth band" value={prettyNetWorth(inv?.estimatedNetWorth)} />
              <Field label="Source of funds" value={inv?.sourceOfFunds || "—"} capitalize />
              <Field label="Self-certified" value={inv?.selfCertifiedAt ? new Date(inv.selfCertifiedAt).toLocaleDateString("en-GB") : "No"} />
            </div>
            <div className="mt-3 pt-3 flex items-start gap-1.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <MapPin size={12} style={{ color: TEXT_MUTED, marginTop: 2, flexShrink: 0 }} />
              <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
                {[inv?.addressLine1, inv?.addressLine2, inv?.city, inv?.region, inv?.postcode, inv?.country]
                  .filter(Boolean).join(", ") || "No address on file"}
              </p>
            </div>
            {inv?.flaggedForReview && (
              <div className="mt-3 p-2.5 flex items-center gap-2" style={{ backgroundColor: WARNING_BG, borderRadius: "8px" }}>
                <AlertCircle size={13} style={{ color: WARNING }} />
                <p className="text-[11.5px]" style={{ color: WARNING }}>This investor is flagged for review.</p>
              </div>
            )}
          </Panel>

          <Panel title="Payment" icon={Wallet}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Amount due</p>
                <p className="text-[18px] font-bold" style={{ color: INK }}>
                  {currencySymbol}{parseFloat(sub.totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Reference</p>
                <p className="text-[13px] font-semibold" style={{ color: INK }}>
                  {spv?.bankAccountReference || `BW-${sub.id?.slice(-6).toUpperCase()}`}
                </p>
              </div>
            </div>
            {sub.proofOfPaymentUrl ? (
              <a href={sub.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3"
                style={{ backgroundColor: SUCCESS_BG, borderRadius: "8px", textDecoration: "none" }}>
                <FileCheck size={16} style={{ color: SUCCESS }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold" style={{ color: SUCCESS }}>Proof of payment</p>
                  <p className="text-[11px] truncate" style={{ color: TEXT_SECONDARY }}>
                    {sub.proofOfPaymentName || "View uploaded file"}
                    {sub.proofUploadedAt ? ` · ${new Date(sub.proofUploadedAt).toLocaleDateString("en-GB")}` : ""}
                  </p>
                </div>
                <ExternalLink size={13} style={{ color: SUCCESS }} />
              </a>
            ) : (
              <div className="p-3 flex items-center gap-2" style={{ backgroundColor: WARNING_BG, borderRadius: "8px" }}>
                <Clock size={14} style={{ color: WARNING }} />
                <p className="text-[12px]" style={{ color: WARNING }}>Awaiting proof of payment from investor</p>
              </div>
            )}
          </Panel>

          {sub.allocations?.length > 0 && (
            <Panel title="Allocations" icon={Award}>
              <div className="space-y-2">
                {sub.allocations.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3"
                    style={{ border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
                    <Award size={15} style={{ color: a.status === "ACTIVE" ? SUCCESS : TEXT_MUTED }} />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: INK }}>
                        {a.unitsAllocated} units · {currencySymbol}{parseFloat(a.amountReceived).toLocaleString("en-GB")}
                      </p>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        {a.certificateNumber || "Cert pending"} · {new Date(a.confirmedAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    {a.certificateUrl ? (
                      <a href={a.certificateUrl} target="_blank" rel="noopener noreferrer"
                         className="text-[11px] font-semibold" style={{ color: GOLD_DARK }}>Certificate</a>
                    ) : (
                      <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {sub.auditEvents?.length > 0 && (
            <Panel title="History" icon={Clock}>
              <div className="space-y-2.5">
                {sub.auditEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: GOLD }} />
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: INK }}>
                        {prettyEvent(e.eventType)}
                        <span className="font-normal" style={{ color: TEXT_MUTED }}> · {e.actorRole}</span>
                      </p>
                      {e.notes && <p className="text-[11.5px]" style={{ color: TEXT_SECONDARY }}>{e.notes}</p>}
                      <p className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                        {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 sticky top-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <p className="text-[10px] tracking-[0.1em] uppercase font-bold mb-3" style={{ color: TEXT_MUTED }}>Workflow</p>
            <div className="mb-4 p-3" style={{ backgroundColor: SIDEBAR_GRAY, borderRadius: "8px" }}>
              <p className="text-[11px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                {nextStepHint(sub.status, remaining)}
              </p>
            </div>

            {canVerify && (
              <ActionButton onClick={() => doAction("verify")} disabled={busy}
                icon={CheckCircle2} label="Verify subscription" hint="Confirm details + proof look right" primary />
            )}
            {canFund && (
              <ActionButton onClick={() => doAction("fund")} disabled={busy}
                icon={Banknote} label="Mark as funded" hint="Bank transfer has landed" primary />
            )}

            {canAllocate && (
              <div className="mb-3 p-3" style={{ border: `1px solid ${GOLD}`, borderRadius: "10px", backgroundColor: GOLD_LIGHT }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: GOLD_DARK }}>Allocate units</p>
                <p className="text-[11px] mb-2.5" style={{ color: GOLD_DARK }}>{remaining} of {sub.unitsRequested} remaining</p>
                <input type="number" value={allocUnits} onChange={(e) => setAllocUnits(e.target.value)}
                  placeholder={`Units (max ${remaining})`} min={1} max={remaining}
                  className="w-full text-[13px] outline-none mb-2"
                  style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", color: INK, backgroundColor: "#FFFFFF", fontFamily: "inherit" }} />
                <input type="text" value={allocNotes} onChange={(e) => setAllocNotes(e.target.value)}
                  placeholder="Notes (optional)" className="w-full text-[12px] outline-none mb-2.5"
                  style={{ padding: "7px 10px", border: `1px solid ${BORDER}`, borderRadius: "7px", color: INK, backgroundColor: "#FFFFFF", fontFamily: "inherit" }} />
                <button type="button" onClick={() => setAllocUnits(String(remaining))}
                  className="w-full py-1.5 text-[11px] font-semibold mb-2"
                  style={{ backgroundColor: "#FFFFFF", border: `1px solid ${GOLD}`, borderRadius: "6px", color: GOLD_DARK, cursor: "pointer", fontFamily: "inherit" }}>
                  All {remaining}
                </button>
                <button type="button" onClick={doAllocate} disabled={busy || !allocUnits}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-semibold disabled:opacity-50"
                  style={{ backgroundColor: NAVY_900, color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Allocate + issue certificate
                </button>
              </div>
            )}

            {canReject && (
              !showReject ? (
                <button type="button" onClick={() => setShowReject(true)} disabled={busy}
                  className="w-full py-2.5 text-[12px] font-semibold mt-1"
                  style={{ backgroundColor: "transparent", color: DANGER, border: `1px solid ${DANGER}30`, borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
                  Reject subscription
                </button>
              ) : (
                <div className="mt-1 p-3" style={{ border: `1px solid ${DANGER}30`, borderRadius: "10px", backgroundColor: DANGER_BG }}>
                  <p className="text-[12px] font-bold mb-2" style={{ color: DANGER }}>Reject — reason required</p>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                    placeholder="Explain why (shared with investor)"
                    className="w-full text-[12px] outline-none mb-2"
                    style={{ padding: "8px", border: `1px solid ${BORDER}`, borderRadius: "7px", color: INK, backgroundColor: "#FFFFFF", fontFamily: "inherit", resize: "vertical" }} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => doAction("reject", { reason: rejectReason })}
                      disabled={busy || !rejectReason.trim()}
                      className="flex-1 py-2 text-[12px] font-semibold disabled:opacity-50"
                      style={{ backgroundColor: DANGER, color: "#FFFFFF", border: "none", borderRadius: "7px", cursor: "pointer", fontFamily: "inherit" }}>
                      Confirm reject
                    </button>
                    <button type="button" onClick={() => { setShowReject(false); setRejectReason(""); }}
                      className="px-3 py-2 text-[12px] font-semibold"
                      style={{ backgroundColor: "#FFFFFF", color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, borderRadius: "7px", cursor: "pointer", fontFamily: "inherit" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )
            )}

            {["REJECTED", "CANCELLED", "FULLY_ALLOCATED"].includes(sub.status) && (
              <p className="text-[11.5px] text-center py-2" style={{ color: TEXT_MUTED }}>
                {sub.status === "FULLY_ALLOCATED" ? "Fully allocated — complete." : `This subscription is ${sub.status.toLowerCase()}.`}
              </p>
            )}

            {spv?.id && (
              <a href={`/admin/spvs/${spv.id}`}
                className="block text-center text-[11.5px] font-semibold mt-4 pt-3"
                style={{ color: GOLD_DARK, textDecoration: "none", borderTop: `1px solid ${BORDER}` }}>
                View SPV →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="p-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
      <div className="flex items-center gap-2 mb-3.5">
        <Icon size={14} style={{ color: GOLD_DARK }} />
        <p className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: TEXT_MUTED }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, badge, capitalize }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.06em] uppercase font-bold mb-0.5" style={{ color: TEXT_MUTED }}>{label}</p>
      {badge ? (
        <span className="inline-block px-1.5 py-0.5 text-[10.5px] font-bold uppercase"
          style={{ backgroundColor: badge + "18", color: badge, borderRadius: "4px" }}>
          {value}
        </span>
      ) : (
        <p className="text-[12.5px] font-semibold" style={{ color: INK, textTransform: capitalize ? "capitalize" : "none" }}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function ActionButton({ onClick, disabled, icon: Icon, label, hint, primary }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="w-full mb-3 p-3 text-left disabled:opacity-50"
      style={{ backgroundColor: primary ? NAVY_900 : "#FFFFFF", border: primary ? "none" : `1px solid ${BORDER}`, borderRadius: "10px", cursor: disabled ? "wait" : "pointer", fontFamily: "inherit" }}>
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: primary ? GOLD : INK }} />
        <span className="text-[13px] font-semibold" style={{ color: primary ? "#FFFFFF" : INK }}>{label}</span>
      </div>
      {hint && <p className="text-[11px] mt-1" style={{ color: primary ? "rgba(248,244,236,0.6)" : TEXT_MUTED }}>{hint}</p>}
    </button>
  );
}

function StatusBadge({ status }) {
  const META = {
    SUBMITTED: { l: "Submitted", bg: SIDEBAR_GRAY, fg: TEXT_SECONDARY },
    UNDER_REVIEW: { l: "Under review", bg: WARNING_BG, fg: WARNING },
    VERIFIED: { l: "Verified", bg: "#E8EEF7", fg: "#3A5874" },
    FUNDED: { l: "Funded", bg: "#E8EEF7", fg: "#3A5874" },
    PARTIALLY_ALLOCATED: { l: "Partially allocated", bg: GOLD_LIGHT, fg: GOLD_DARK },
    FULLY_ALLOCATED: { l: "Fully allocated", bg: SUCCESS_BG, fg: SUCCESS },
    REJECTED: { l: "Rejected", bg: DANGER_BG, fg: DANGER },
    CANCELLED: { l: "Cancelled", bg: SIDEBAR_GRAY, fg: TEXT_MUTED },
  }[status] || { l: status, bg: SIDEBAR_GRAY, fg: TEXT_SECONDARY };
  return (
    <span className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold tracking-[0.04em] uppercase"
      style={{ backgroundColor: META.bg, color: META.fg, borderRadius: "6px" }}>
      {META.l}
    </span>
  );
}

function nextStepHint(status, remaining) {
  switch (status) {
    case "SUBMITTED": return "Investor has submitted. Once proof of payment is in, verify the details.";
    case "UNDER_REVIEW": return "Proof of payment received. Review the investor details, then verify.";
    case "VERIFIED": return "Verified. Confirm the bank transfer has landed, then mark as funded.";
    case "FUNDED": return `Funded. Allocate up to ${remaining} units to issue the share certificate.`;
    case "PARTIALLY_ALLOCATED": return `${remaining} units still to allocate. Allocate the rest to complete.`;
    case "FULLY_ALLOCATED": return "All units allocated. This subscription is complete.";
    case "REJECTED": return "This subscription was rejected.";
    case "CANCELLED": return "This subscription was cancelled.";
    default: return "";
  }
}

function prettyEvent(t) {
  const m = {
    SUBSCRIPTION_CREATED: "Submitted", PROOF_OF_PAYMENT_UPLOADED: "Proof uploaded",
    CANCELLED_BY_INVESTOR: "Cancelled by investor", ALLOCATION_CREATED: "Units allocated",
    VERIFIED: "Verified", FUNDED: "Marked funded", REJECTED: "Rejected",
  };
  return m[t] || t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function prettyNetWorth(v) {
  return { under_50k: "Under £50k", "50k_250k": "£50k–250k", "250k_1m": "£250k–1m", over_1m: "Over £1m" }[v] || "—";
}
