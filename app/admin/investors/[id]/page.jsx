"use client";

// app/admin/investors/[id]/page.jsx
//
// Single investor profile with tabs.
// Tabs: Overview, KYC, Notes, Activity

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, AlertCircle, CheckCircle2, Clock, XCircle, Flag, FlagOff,
  Loader2, ShieldCheck, FileText, MessageSquare, Activity, Send,
  Tag, X, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign,
  Eye, Check, AlertTriangle, ExternalLink, Users, Link2, Trash2,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const NAVY = "#0A1F44";
const BORDER = "#E4E4E7";
const BORDER_STRONG = "#D4D4D8";
const BG_SURFACE = "#FAFAFA";
const BG_HOVER = "#F4F4F5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const WARNING = "#B8860B";
const WARNING_BG = "#FBF5E1";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "kyc", label: "KYC Documents", icon: ShieldCheck },
  { id: "notes", label: "Notes", icon: MessageSquare },
  { id: "activity", label: "Activity", icon: Activity },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function InvestorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInvestor = async () => {
    try {
      const res = await fetch(`/api/admin/investors/${userId}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load investor");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: GOLD }} />
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin/investors"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-4"
          style={{ color: TEXT_SECONDARY, textDecoration: "none" }}
        >
          <ArrowLeft size={13} /> Back to Investors
        </Link>
        <div
          className="p-6 flex items-start gap-3"
          style={{ backgroundColor: DANGER_BG, border: `1px solid ${DANGER}40`, borderRadius: "8px" }}
        >
          <AlertCircle size={18} style={{ color: DANGER, flexShrink: 0 }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: DANGER }}>Couldn&apos;t load investor</p>
            <p className="text-[12px] mt-1" style={{ color: TEXT_SECONDARY }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const investor = data.investor;
  const notes = data.notes || [];
  const referralContext = data.referralContext || null;
  const financialFootprint = data.financialFootprint || null;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/admin/investors"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-4 transition-colors"
        style={{ color: TEXT_SECONDARY, textDecoration: "none" }}
      >
        <ArrowLeft size={13} /> Back to Investors
      </Link>

      {/* Profile header */}
      <ProfileHeader investor={investor} footprint={financialFootprint} onReload={loadInvestor} />

      {/* Tabs */}
      <div
        className="flex gap-1 mt-6 mb-5 overflow-x-auto"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-semibold transition-colors whitespace-nowrap relative"
              style={{
                color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: "-1px",
                borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
              }}
            >
              <Icon size={13} />
              {tab.label}
              {tab.id === "notes" && notes.length > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold ml-1"
                  style={{
                    backgroundColor: GOLD_LIGHT,
                    color: GOLD,
                    borderRadius: "8px",
                  }}
                >
                  {notes.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab investor={investor} referralContext={referralContext} />}
      {activeTab === "kyc" && <KycTab investor={investor} onReload={loadInvestor} />}
      {activeTab === "notes" && <NotesTab investor={investor} notes={notes} onReload={loadInvestor} />}
      {activeTab === "activity" && <ActivityTab investor={investor} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE HEADER
// ═══════════════════════════════════════════════════════════════════
function ProfileHeader({ investor, footprint, onReload }) {
  const { prompt } = useDialog();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(null);

  // Two-step delete flow: null → "warn" → "confirm"
  const [deleteStage, setDeleteStage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const canDelete = investor.role === "investor";

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/investors/${investor.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Failed to delete account");
      }
      // Account is gone — return to the investor list.
      router.replace("/admin/investors");
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  async function handleFlag() {
    if (investor.flaggedForReview) {
      // Unflag
      setActionLoading("flag");
      try {
        await fetch(`/api/admin/investors/${investor.id}/flag`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
          credentials: "same-origin",
          body: JSON.stringify({ action: "unflag" }),
        });
        await onReload();
      } catch {}
      setActionLoading(null);
    } else {
      // Flag
      const reason = await prompt({
        title: "Flag this investor?",
        message: "Add a clear reason (at least 3 characters) for the audit trail.",
        placeholder: "e.g. Suspicious activity / failed verification",
        confirmLabel: "Flag investor",
        cancelLabel: "Cancel",
        tone: "warning",
        required: true,
        multiline: true,
      });
      if (!reason || reason.trim().length < 3) return;
      setActionLoading("flag");
      try {
        await fetch(`/api/admin/investors/${investor.id}/flag`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
          credentials: "same-origin",
          body: JSON.stringify({ action: "flag", reason: reason.trim() }),
        });
        await onReload();
      } catch {}
      setActionLoading(null);
    }
  }

  const initials = getInitials(investor.fullName);

  return (
    <div
      className="p-5"
      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px" }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {investor.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={investor.avatarUrl}
            alt=""
            className="w-14 h-14 object-cover flex-shrink-0"
            style={{ backgroundColor: NAVY, borderRadius: "50%" }}
          />
        ) : (
          <div
            className="w-14 h-14 grid place-items-center text-[16px] font-bold flex-shrink-0"
            style={{ backgroundColor: NAVY, color: "#FFFFFF", borderRadius: "50%" }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-[22px] font-bold leading-none" style={{ color: TEXT_PRIMARY }}>
              {investor.fullName}
            </h1>
            {investor.accountActivated && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase"
                style={{ backgroundColor: SUCCESS_BG, color: SUCCESS, borderRadius: "4px" }}
              >
                <CheckCircle2 size={10} /> Active
              </span>
            )}
            {investor.flaggedForReview && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase"
                style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "4px" }}
              >
                <Flag size={10} /> Flagged
              </span>
            )}
            {investor.role !== "investor" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase"
                style={{ backgroundColor: GOLD_LIGHT, color: GOLD, borderRadius: "4px" }}
              >
                {investor.role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            )}
            {(investor.tags || []).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase"
                style={{
                  backgroundColor: "#F4F4F5",
                  color: TEXT_SECONDARY,
                  borderRadius: "4px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            <span>{investor.email}</span>
            <span style={{ color: TEXT_MUTED }}>·</span>
            <span>@{investor.username}</span>
            <span style={{ color: TEXT_MUTED }}>·</span>
            <span>{investor.country}</span>
          </div>
          {investor.flaggedForReview && investor.flagReason && (
            <p
              className="mt-2 px-2.5 py-1.5 text-[11.5px]"
              style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "4px" }}
            >
              <strong>Flag reason:</strong> {investor.flagReason}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 self-start">
          <button
            type="button"
            onClick={handleFlag}
            disabled={actionLoading === "flag"}
            className="flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-semibold transition-colors disabled:opacity-50"
            style={{
              color: investor.flaggedForReview ? SUCCESS : DANGER,
              backgroundColor: investor.flaggedForReview ? SUCCESS_BG : DANGER_BG,
              border: `1px solid ${investor.flaggedForReview ? SUCCESS : DANGER}30`,
              borderRadius: "6px",
              cursor: actionLoading ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {actionLoading === "flag" ? (
              <Loader2 size={11} className="animate-spin" />
            ) : investor.flaggedForReview ? (
              <FlagOff size={11} />
            ) : (
              <Flag size={11} />
            )}
            {investor.flaggedForReview ? "Unflag" : "Flag"}
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteStage("warn");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-semibold transition-colors"
              style={{
                color: "#FFFFFF",
                backgroundColor: DANGER,
                border: `1px solid ${DANGER}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Trash2 size={11} />
              Delete
            </button>
          )}
        </div>
      </div>

      {deleteStage && (
        <DeleteAccountModal
          stage={deleteStage}
          investor={investor}
          footprint={footprint}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setDeleteStage(null);
            setDeleteError(null);
          }}
          onContinue={() => setDeleteStage("confirm")}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELETE ACCOUNT — two-step confirmation modal (with active-position guard)
// ═══════════════════════════════════════════════════════════════════
function DeleteAccountModal({ stage, investor, footprint, deleting, error, onCancel, onContinue, onConfirm }) {
  const isFinal = stage === "confirm";
  const blocked = !!footprint?.hasActivePositions;

  const positionRows = [
    ["Active subscriptions", footprint?.activeSubscriptions || 0],
    ["Active allocations", footprint?.activeAllocations || 0],
    ["Holdings", footprint?.holdings || 0],
    ["Pending sale requests", footprint?.activeSaleRequests || 0],
  ].filter(([, n]) => n > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(11, 18, 32, 0.55)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-6"
        style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 grid place-items-center flex-shrink-0"
            style={{ backgroundColor: blocked ? WARNING_BG : DANGER_BG, borderRadius: "50%" }}
          >
            <AlertTriangle size={20} style={{ color: blocked ? WARNING : DANGER }} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
              {blocked
                ? "Deletion blocked"
                : isFinal
                ? "Confirm permanent deletion"
                : "Delete this investor account?"}
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>
              {investor.fullName} · {investor.email}
            </p>
          </div>
        </div>

        {blocked ? (
          <div className="mb-5">
            <div className="text-[13px] leading-relaxed mb-3" style={{ color: TEXT_SECONDARY }}>
              This investor still has active financial records. Deleting the account now would
              orphan live investment data. Cancel or settle the following first:
            </div>
            <div
              className="divide-y"
              style={{ border: `1px solid ${BORDER}`, borderRadius: "8px", overflow: "hidden" }}
            >
              {positionRows.map(([label, n]) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2 text-[12.5px]"
                  style={{ borderColor: BORDER }}
                >
                  <span style={{ color: TEXT_SECONDARY }}>{label}</span>
                  <span
                    className="px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: WARNING_BG, color: WARNING, borderRadius: "4px" }}
                  >
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : isFinal ? (
          <div
            className="p-3 mb-5 text-[12.5px] leading-relaxed"
            style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "8px" }}
          >
            <strong>This action cannot be undone.</strong> The account, KYC documents,
            consents, notes and notifications will be permanently erased. Click
            “Delete permanently” to finish.
          </div>
        ) : (
          <div className="mb-5 text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
            <p className="mb-2">
              You are about to permanently delete this investor’s account. This will remove
              their profile, KYC documents, consents and internal notes.
            </p>
            <p className="mb-2">
              This is a destructive action and you will be asked to confirm once more before
              anything is deleted.
            </p>
            <p className="inline-flex items-center gap-1.5 font-semibold" style={{ color: SUCCESS }}>
              <CheckCircle2 size={13} /> No active investments — safe to delete.
            </p>
          </div>
        )}

        {error && (
          <div
            className="p-2.5 mb-4 flex items-start gap-2 text-[12px]"
            style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "6px" }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-50"
            style={{
              color: TEXT_SECONDARY,
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: "6px",
              cursor: deleting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {blocked ? "Close" : "Cancel"}
          </button>
          {!blocked && (isFinal ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-60"
              style={{
                color: "#FFFFFF",
                backgroundColor: DANGER,
                border: `1px solid ${DANGER}`,
                borderRadius: "6px",
                cursor: deleting ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete permanently
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold transition-colors"
              style={{
                color: "#FFFFFF",
                backgroundColor: DANGER,
                border: `1px solid ${DANGER}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Trash2 size={13} />
              Continue
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════
function OverviewTab({ investor, referralContext }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Referral card — shown whenever there is something to display */}
      {(referralContext?.referredBy || referralContext?.directReferralCount > 0) && (
        <div
          className="md:col-span-2 p-4"
          style={{ backgroundColor: "#FFFBF0", border: `1px solid rgba(201,162,74,0.35)`, borderRadius: "10px" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={14} style={{ color: GOLD }} />
            <span className="text-[11.5px] font-bold tracking-[0.1em] uppercase" style={{ color: GOLD }}>
              Referral Activity
            </span>
          </div>
          <div className="flex flex-wrap gap-6">
            {referralContext.referredBy && (
              <div>
                <p className="text-[10.5px] font-bold tracking-[0.08em] uppercase mb-1" style={{ color: TEXT_MUTED }}>
                  Introduced by
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 grid place-items-center text-[11px] font-bold flex-shrink-0"
                    style={{ backgroundColor: NAVY, color: "#fff", borderRadius: "50%" }}
                  >
                    {(referralContext.referredBy.fullName || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/admin/investors/${referralContext.referredBy.id}`}
                      className="text-[13px] font-bold hover:underline"
                      style={{ color: NAVY, textDecoration: "none" }}
                    >
                      {referralContext.referredBy.fullName}
                    </Link>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      {referralContext.referredBy.email}
                      {referralContext.referredBy.code && (
                        <span className="ml-1.5 px-1.5 py-0.5 font-mono text-[10px] font-bold" style={{ backgroundColor: GOLD_LIGHT, color: "#9A7A2E", borderRadius: "4px" }}>
                          {referralContext.referredBy.code}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {referralContext.referredBy.status && (
                  <p className="text-[10.5px] mt-1.5 font-semibold" style={{ color: TEXT_SECONDARY }}>
                    Edge status: <span style={{ color: referralContext.referredBy.status === "ACTIVATED" ? SUCCESS : TEXT_SECONDARY }}>{referralContext.referredBy.status}</span>
                  </p>
                )}
              </div>
            )}
            {referralContext.directReferralCount > 0 && (
              <div>
                <p className="text-[10.5px] font-bold tracking-[0.08em] uppercase mb-1" style={{ color: TEXT_MUTED }}>
                  Has Referred
                </p>
                <div className="flex items-center gap-2">
                  <Users size={16} style={{ color: GOLD }} />
                  <span className="text-[20px] font-bold" style={{ color: NAVY }}>
                    {referralContext.directReferralCount}
                  </span>
                  <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
                    {referralContext.directReferralCount === 1 ? "person" : "people"}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>
                  Recognition count: {referralContext.recognitionCount ?? 0}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Card title="Profile">
        <Row label="Full Name" value={investor.fullName} />
        <Row label="Email" value={investor.email} icon={Mail} />
        <Row label="Phone" value={investor.phoneNumber} icon={Phone} />
        <Row label="Date of Birth" value={formatDate(investor.dateOfBirth)} icon={Calendar} />
        <Row label="Country" value={investor.country} icon={MapPin} />
        <Row label="Residency" value={investor.residency} />
        <Row
          label="Address"
          value={
            [investor.addressLine1, investor.addressLine2, investor.city, investor.region, investor.postcode]
              .filter(Boolean)
              .join(", ") || null
          }
        />
      </Card>

      <Card title="Financial Profile">
        <Row label="Occupation" value={investor.occupation} icon={Briefcase} />
        <Row label="Source of Funds" value={investor.sourceOfFunds} icon={DollarSign} />
        {investor.sourceOfFundsDetail && (
          <Row label="SoF Detail" value={investor.sourceOfFundsDetail} />
        )}
        <Row label="Net Worth" value={formatNetWorth(investor.estimatedNetWorth)} />
        <Row label="Investor Type" value={formatInvestorType(investor.investorType)} />
      </Card>

      <Card title="Status">
        <StatusRow label="Email Verified" passed={investor.emailVerified} />
        <StatusRow label="Onboarding Complete" passed={investor.onboardingComplete} />
        <StatusRow label="KYC Status" status={investor.kycStatus} />
        <StatusRow label="Consents Complete" passed={investor.consentsComplete} />
        <StatusRow label="Account Activated" passed={investor.accountActivated} />
      </Card>

      <Card title="Activity">
        <Row label="Joined" value={formatDate(investor.createdAt)} />
        <Row label="Last Seen" value={formatDate(investor.lastSeenAt)} />
        <Row label="Account Role" value={formatRole(investor.role)} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KYC TAB
// ═══════════════════════════════════════════════════════════════════
function KycTab({ investor, onReload }) {
  const documents = investor.kycDocuments || [];

  const REQUIRED = [
    { type: "id_front", label: "ID — Front" },
    { type: "id_back", label: "ID — Back" },
    { type: "proof_of_address", label: "Proof of Address" },
    { type: "selfie", label: "Selfie" },
    { type: "source_of_funds", label: "Source of Funds" },
  ];

  // Index by type for quick lookup
  const docsByType = Object.fromEntries(documents.map((d) => [d.documentType, d]));

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <KycStatusBadge status={investor.kycStatus} />
        <span className="text-[12px]" style={{ color: TEXT_MUTED }}>
          {documents.filter((d) => d.reviewStatus === "approved").length} of {REQUIRED.length} approved
        </span>
      </div>

      <div className="space-y-3">
        {REQUIRED.map((req) => (
          <KycDocCard
            key={req.type}
            req={req}
            doc={docsByType[req.type]}
            onReload={onReload}
          />
        ))}
      </div>
    </div>
  );
}

function KycDocCard({ req, doc, onReload }) {
  const { prompt } = useDialog();
  const [action, setAction] = useState(null);

  async function handleApprove() {
    setAction("approve");
    try {
      await fetch(`/api/admin/kyc/${doc.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      await onReload();
    } catch {}
    setAction(null);
  }

  async function handleReject() {
    const reason = await prompt({
      title: `Reject ${req.label}?`,
      message: "Give the investor a clear reason (at least 3 characters). They'll see this.",
      placeholder: "e.g. Document is blurry / expired",
      confirmLabel: "Reject document",
      cancelLabel: "Cancel",
      tone: "danger",
      required: true,
      multiline: true,
    });
    if (!reason || reason.trim().length < 3) return;
    setAction("reject");
    try {
      await fetch(`/api/admin/kyc/${doc.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      await onReload();
    } catch {}
    setAction(null);
  }

  if (!doc) {
    return (
      <div
        className="p-3.5 flex items-center justify-between"
        style={{
          backgroundColor: BG_SURFACE,
          border: `1px dashed ${BORDER_STRONG}`,
          borderRadius: "8px",
        }}
      >
        <div>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_MUTED }}>{req.label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>Not yet uploaded</p>
        </div>
        <span
          className="text-[10px] font-bold tracking-[0.06em] uppercase"
          style={{ color: TEXT_MUTED }}
        >
          Missing
        </span>
      </div>
    );
  }

  const config = {
    pending: { color: WARNING, bg: WARNING_BG, label: "Pending Review", icon: Clock },
    approved: { color: SUCCESS, bg: SUCCESS_BG, label: "Approved", icon: CheckCircle2 },
    rejected: { color: DANGER, bg: DANGER_BG, label: "Rejected", icon: XCircle },
  }[doc.reviewStatus] || { color: TEXT_MUTED, bg: "#F4F4F5", label: doc.reviewStatus, icon: Clock };

  const StatusIcon = config.icon;

  return (
    <div
      className="p-3.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        borderRadius: "8px",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              {req.label}
            </p>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] uppercase"
              style={{ backgroundColor: config.bg, color: config.color, borderRadius: "4px" }}
            >
              <StatusIcon size={9} /> {config.label}
            </span>
          </div>
          <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
            {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB · uploaded {formatDate(doc.uploadedAt)}
          </p>
          {doc.rejectionReason && (
            <p
              className="mt-2 px-2 py-1 text-[11px]"
              style={{ backgroundColor: DANGER_BG, color: DANGER, borderRadius: "4px" }}
            >
              <strong>Reason:</strong> {doc.rejectionReason}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              color: TEXT_SECONDARY,
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            <Eye size={11} /> View
          </a>

          {doc.reviewStatus !== "approved" && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={action !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
              style={{
                color: SUCCESS,
                backgroundColor: SUCCESS_BG,
                border: `1px solid ${SUCCESS}30`,
                borderRadius: "6px",
                cursor: action ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {action === "approve" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Approve
            </button>
          )}

          {doc.reviewStatus !== "rejected" && (
            <button
              type="button"
              onClick={handleReject}
              disabled={action !== null}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
              style={{
                color: DANGER,
                backgroundColor: DANGER_BG,
                border: `1px solid ${DANGER}30`,
                borderRadius: "6px",
                cursor: action ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {action === "reject" ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════════════════════════
function NotesTab({ investor, notes, onReload }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/investors/${investor.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        await onReload();
      }
    } catch {}
    setSubmitting(false);
  }

  return (
    <div>
      {/* Add new note */}
      <div
        className="p-4 mb-4"
        style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px" }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note about this investor..."
          rows={3}
          className="w-full p-2.5 text-[13px] outline-none resize-y"
          style={{
            border: `1px solid ${BORDER_STRONG}`,
            borderRadius: "6px",
            color: TEXT_PRIMARY,
            fontFamily: "inherit",
            backgroundColor: "#FFFFFF",
          }}
          maxLength={5000}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
            Internal — not visible to the investor. {content.length}/5000
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!content.trim() || submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: GOLD,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              cursor: submitting || !content.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Post Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div
          className="text-center py-10 px-4"
          style={{
            backgroundColor: BG_SURFACE,
            border: `1px dashed ${BORDER_STRONG}`,
            borderRadius: "10px",
          }}
        >
          <MessageSquare size={28} className="mx-auto mb-2" style={{ color: TEXT_MUTED }} strokeWidth={1.5} />
          <p className="text-[13px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>No notes yet</p>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Add internal notes to track follow-ups, observations, or decisions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3.5"
              style={{
                backgroundColor: "#FFFFFF",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 grid place-items-center text-[9px] font-bold"
                    style={{ backgroundColor: NAVY, color: "#FFFFFF", borderRadius: "50%" }}
                  >
                    {getInitials(note.author?.fullName)}
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                    {note.author?.fullName || "Unknown"}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {formatRelative(note.createdAt)}
                </span>
              </div>
              <p className="text-[13px] whitespace-pre-wrap" style={{ color: TEXT_PRIMARY }}>
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════════════
function ActivityTab({ investor }) {
  return (
    <div
      className="text-center py-12 px-4"
      style={{
        backgroundColor: BG_SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
      }}
    >
      <Activity size={32} className="mx-auto mb-3" style={{ color: TEXT_MUTED }} strokeWidth={1.5} />
      <p className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
        Activity log
      </p>
      <p className="text-[12px] max-w-sm mx-auto" style={{ color: TEXT_MUTED }}>
        Audit trail of admin actions on this investor will appear here.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Card({ title, children }) {
  return (
    <div
      className="p-4"
      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "10px" }}
    >
      <h3
        className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-3 pb-2"
        style={{ color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}
      >
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px]">
      {Icon && <Icon size={12} style={{ color: TEXT_MUTED, marginTop: 3, flexShrink: 0 }} />}
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span style={{ color: TEXT_MUTED, fontWeight: 500, minWidth: "100px" }}>{label}</span>
        <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }} className="break-words">
          {value || <em style={{ color: TEXT_MUTED, fontStyle: "normal" }}>—</em>}
        </span>
      </div>
    </div>
  );
}

function StatusRow({ label, passed, status }) {
  if (status) {
    return (
      <div className="flex items-center justify-between text-[12.5px]">
        <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>{label}</span>
        <KycStatusBadge status={status} small />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>{label}</span>
      {passed ? (
        <span className="inline-flex items-center gap-1" style={{ color: SUCCESS }}>
          <CheckCircle2 size={13} />
          <span className="text-[11px] font-semibold">Yes</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}>
          <Clock size={13} />
          <span className="text-[11px] font-semibold">Pending</span>
        </span>
      )}
    </div>
  );
}

function KycStatusBadge({ status, small }) {
  const config = {
    not_started: { label: "Not Started", color: TEXT_MUTED, bg: "#F4F4F5" },
    pending_review: { label: "Pending Review", color: WARNING, bg: WARNING_BG, icon: Clock },
    approved: { label: "Approved", color: SUCCESS, bg: SUCCESS_BG, icon: CheckCircle2 },
    rejected: { label: "Rejected", color: DANGER, bg: DANGER_BG, icon: XCircle },
  }[status] || { label: status, color: TEXT_MUTED, bg: "#F4F4F5" };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[10.5px]"} font-bold tracking-[0.06em] uppercase`}
      style={{ backgroundColor: config.bg, color: config.color, borderRadius: "4px" }}
    >
      {Icon && <Icon size={small ? 9 : 11} />}
      {config.label}
    </span>
  );
}

// ─── Formatting helpers ────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatRelative(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

function formatNetWorth(v) {
  return {
    under_50k: "Under £50,000",
    "50k_250k": "£50,000 – £250,000",
    "250k_1m": "£250,000 – £1M",
    over_1m: "Over £1M",
  }[v] || v;
}

function formatInvestorType(v) {
  return {
    retail: "Retail",
    sophisticated: "Sophisticated",
    hnw: "High Net Worth",
  }[v] || v;
}

function formatRole(v) {
  return {
    investor: "Investor",
    admin: "Admin",
    super_admin: "Super Admin",
  }[v] || v;
}