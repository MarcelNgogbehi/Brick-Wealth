"use client";

// app/admin/opportunities/[id]/page.jsx
//
// Opportunity editor — create + edit with 4 tabs:
// Content | Eligibility | Documents | Status

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2,
  Sparkles, ShieldCheck, FileText, Send, Eye, EyeOff,
  Plus, X, Upload, Image as ImageIcon, FileIcon, ExternalLink, Film,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";
import { SingleMediaUpload, PropertyImageGallery } from "@/app/admin/_components/MediaUploader";
import { uploadFiles } from "@/lib/uploadthing-client";

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

const INVESTOR_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "sophisticated", label: "Sophisticated" },
  { value: "hnw", label: "High Net Worth" },
];

const DOC_CATEGORIES = [
  { value: "prospectus", label: "Prospectus" },
  { value: "im", label: "Information Memorandum" },
  { value: "aml", label: "AML Policy" },
  { value: "valuation", label: "Valuation Report" },
  { value: "certificate", label: "Certificate" },
  { value: "legal", label: "Legal Document" },
  { value: "other", label: "Other" },
];

const TABS = [
  { id: "content", label: "Content", icon: FileText },
  { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
  { id: "documents", label: "Documents", icon: FileIcon },
  { id: "status", label: "Status", icon: Send },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const EMPTY_FORM = {
  spvId: "",
  title: "",
  subtitle: "",
  summary: "",
  fullDescription: "",
  riskWarning: "",
  targetYieldPct: "",
  termMonths: "",
  projectedReturnPct: "",
  heroImageUrl: "",
  walkthroughVideoUrl: "",
  requiresKyc: false,
  eligibleInvestorTypes: ["retail", "sophisticated", "hnw"],
  requiresSuitabilityCheck: false,
  openDate: "",
  closeDate: "",
};

export default function OpportunityEditorPage() {
  const { confirm } = useDialog();
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [activeTab, setActiveTab] = useState("content");
  const [form, setForm] = useState(EMPTY_FORM);
  const [data, setData] = useState(null);
  const [availableSpvs, setAvailableSpvs] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Load available SPVs (for new opportunity)
  useEffect(() => {
    if (!isNew) return;
    async function load() {
      try {
        const res = await fetch("/api/admin/opportunities/available-spvs", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const json = await res.json();
        setAvailableSpvs(json.spvs || []);
      } catch {}
    }
    load();
  }, [isNew]);

  // Load existing opportunity
  const loadOpportunity = async () => {
    try {
      const res = await fetch(`/api/admin/opportunities/${params.id}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Opportunity not found");
      const json = await res.json();
      const o = json.opportunity;
      setData(o);
      setForm({
        spvId: o.spvId,
        title: o.title || "",
        subtitle: o.subtitle || "",
        summary: o.summary || "",
        fullDescription: o.fullDescription || "",
        riskWarning: o.riskWarning || "",
        targetYieldPct: o.targetYieldPct ?? "",
        termMonths: o.termMonths ?? "",
        projectedReturnPct: o.projectedReturnPct ?? "",
        heroImageUrl: o.heroImageUrl || "",
        walkthroughVideoUrl: o.walkthroughVideoUrl || "",
        requiresKyc: !!o.requiresKyc,
        eligibleInvestorTypes: o.eligibleInvestorTypes || ["retail", "sophisticated", "hnw"],
        requiresSuitabilityCheck: !!o.requiresSuitabilityCheck,
        openDate: o.openDate ? o.openDate.split("T")[0] : "",
        closeDate: o.closeDate ? o.closeDate.split("T")[0] : "",
      });
      setLoading(false);
      return o;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  // After the photo gallery changes, keep the opportunity's stored hero image
  // in sync with the property's currently-selected hero, so investor cards and
  // listings always show the lead photo the admin picked.
  const reloadAndSyncHero = async () => {
    const o = await loadOpportunity();
    if (!o) return;
    const imgs = o.spv?.property?.images || [];
    const heroUrl = (imgs.find((i) => i.isHero) || imgs[0])?.fileUrl || "";
    if (heroUrl && heroUrl !== (o.heroImageUrl || "")) {
      try {
        await fetch(`/api/admin/opportunities/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
          credentials: "same-origin",
          body: JSON.stringify({ heroImageUrl: heroUrl }),
        });
        await loadOpportunity();
      } catch {}
    }
  };

  useEffect(() => {
    if (isNew) return;
    loadOpportunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, params.id]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  }

  function toggleInvestorType(type) {
    setForm((f) => {
      const exists = f.eligibleInvestorTypes.includes(type);
      const next = exists
        ? f.eligibleInvestorTypes.filter((t) => t !== type)
        : [...f.eligibleInvestorTypes, type];
      // Don't allow empty
      if (next.length === 0) return f;
      return { ...f, eligibleInvestorTypes: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg("");

    const payload = { ...form };
    // heroImageUrl / walkthroughVideoUrl not in CreateSchema; spvId not in UpdateSchema (strict)
    if (isNew) { delete payload.heroImageUrl; delete payload.walkthroughVideoUrl; }
    if (!isNew) delete payload.spvId;
    ["targetYieldPct", "projectedReturnPct"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = isNew ? undefined : null;
      else payload[k] = Number(payload[k]);
    });
    if (payload.termMonths === "" || payload.termMonths == null) {
      payload.termMonths = isNew ? undefined : null;
    } else payload.termMonths = parseInt(payload.termMonths, 10);

    try {
      const endpoint = isNew ? "/api/admin/opportunities" : `/api/admin/opportunities/${params.id}`;
      const res = await fetch(endpoint, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json?.fieldErrors) setFieldErrors(json.fieldErrors);
        setError(json?.message || "Failed to save");
        setSaving(false);
        return;
      }

      setSaving(false);
      if (isNew) {
        router.push(`/admin/opportunities/${json.opportunity.id}`);
      } else {
        setSuccessMsg("Saved");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this opportunity?",
      message: "This permanently removes the opportunity and all of its documents. This cannot be undone.",
      confirmLabel: "Delete permanently",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${params.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.message || "Failed to delete");
        setSaving(false);
        return;
      }
      router.push("/admin/opportunities");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: GOLD }} />
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Loading...</p>
      </div>
    );
  }

  // Status pill for header
  const statusConfig = {
    draft: { color: TEXT_MUTED, bg: "#F4F4F5", label: "Draft" },
    live: { color: SUCCESS, bg: SUCCESS_BG, label: "Live" },
    closed: { color: TEXT_MUTED, bg: "#F4F4F5", label: "Closed" },
    funded: { color: NAVY, bg: GOLD_LIGHT, label: "Funded" },
    archived: { color: TEXT_MUTED, bg: "#F4F4F5", label: "Archived" },
  }[data?.status] || { color: TEXT_MUTED, bg: "#F4F4F5", label: "—" };

  return (
    <div className="admin-form max-w-4xl mx-auto">
      <Link
        href="/admin/opportunities"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-5 transition-colors"
        style={{ color: TEXT_MUTED, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
      >
        <ArrowLeft size={14} /> Back to Opportunities
      </Link>

      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[24px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "New Opportunity" : (data?.title || "Edit Opportunity")}
            </h1>
            {!isNew && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, borderRadius: "4px" }}
              >
                {statusConfig.label}
              </span>
            )}
          </div>
          {!isNew && data?.spv?.spvName && (
            <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
              SPV: <Link href={`/admin/spvs/${data.spvId}`} style={{ color: GOLD, textDecoration: "underline" }}>{data.spv.spvName}</Link>
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || data?.status === "funded"}
              title={data?.status === "funded" ? "Funded opportunities can't be deleted" : "Delete"}
              className="flex items-center gap-1.5 h-10 px-4 text-[12.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ color: DANGER, backgroundColor: DANGER_BG, border: `1px solid ${DANGER}33`, borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-10 px-5 text-[12.5px] font-bold disabled:opacity-50 transition-all"
            style={{ backgroundColor: GOLD, color: "#FFFFFF", border: "none", borderRadius: "10px", cursor: saving ? "wait" : "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(201,162,74,0.45), 0 6px 16px rgba(201,162,74,0.24)" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = "#D9B560"; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isNew ? "Create Opportunity" : "Save Changes"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 mb-4 flex items-center gap-2" style={{ backgroundColor: SUCCESS_BG, border: `1px solid ${SUCCESS}30`, borderRadius: "8px" }}>
          <CheckCircle2 size={15} style={{ color: SUCCESS }} />
          <p className="text-[12.5px] font-semibold" style={{ color: SUCCESS }}>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 flex items-start gap-2" style={{ backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "8px" }}>
          <AlertCircle size={15} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[12.5px]" style={{ color: DANGER }}>{error}</p>
        </div>
      )}

      {/* Tabs (only for existing opportunities) */}
      {!isNew && (
        <div className="flex gap-1 mb-5 overflow-x-auto" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-semibold transition-colors whitespace-nowrap"
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
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* New: SPV selector */}
      {isNew && (
        <Section title="Linked SPV" icon={Sparkles}>
          <Field label="SPV" required hint="One SPV ↔ one opportunity" error={fieldErrors.spvId}>
            {availableSpvs.length === 0 ? (
              <div className="p-3 text-[12px]" style={{ backgroundColor: BG_SURFACE, color: TEXT_SECONDARY, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "6px" }}>
                No SPVs available. <Link href="/admin/spvs/new" style={{ color: GOLD, textDecoration: "underline" }}>Create one</Link> first.
              </div>
            ) : (
              <select value={form.spvId} onChange={(e) => setField("spvId", e.target.value)} style={inputStyle}>
                <option value="">Select an SPV...</option>
                {availableSpvs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.spvName} — {s.property?.title || "no property"} ({s.companyNumber})
                  </option>
                ))}
              </select>
            )}
          </Field>
        </Section>
      )}

      {/* Tab content */}
      {(isNew || activeTab === "content") && (
        <ContentTab form={form} setField={setField} fieldErrors={fieldErrors} isNew={isNew} property={data?.spv?.property} onGalleryReload={reloadAndSyncHero} />
      )}
      {!isNew && activeTab === "eligibility" && (
        <EligibilityTab
          form={form}
          setField={setField}
          toggleInvestorType={toggleInvestorType}
        />
      )}
      {!isNew && activeTab === "documents" && (
        <DocumentsTab opportunityId={params.id} documents={data?.documents || []} onReload={loadOpportunity} />
      )}
      {!isNew && activeTab === "status" && (
        <StatusTab opportunity={data} onReload={loadOpportunity} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT TAB
// ═══════════════════════════════════════════════════════════════════
function ContentTab({ form, setField, fieldErrors, isNew, property, onGalleryReload }) {
  return (
    <div className="space-y-4">
      <Section title="Marketing Content" icon={FileText}>
        <Field label="Title" required error={fieldErrors.title}>
          <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. The Wilbraham — Manchester HMO" style={inputStyle} maxLength={200} />
        </Field>
        <Field label="Subtitle / Tagline">
          <input type="text" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} placeholder="e.g. Premium 6-bed HMO in M14 with established tenancies" style={inputStyle} maxLength={300} />
        </Field>
        <Field label="Summary" hint="1-2 sentences shown on cards (max 1000 chars)">
          <textarea value={form.summary} onChange={(e) => setField("summary", e.target.value)} rows={3} maxLength={1000} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
        </Field>
        <Field label="Full Description" hint="Long-form content (markdown supported, max 20,000 chars)">
          <textarea value={form.fullDescription} onChange={(e) => setField("fullDescription", e.target.value)} rows={8} maxLength={20000} style={{ ...inputStyle, height: "auto", padding: "10px 12px", fontFamily: "monospace, ui-monospace", fontSize: 12 }} placeholder="## Overview&#10;&#10;Investment highlights, location rationale, market context..." />
        </Field>
        <Field label="Risk Warning" hint="FCA-required disclosures. Will display prominently to investors.">
          <textarea value={form.riskWarning} onChange={(e) => setField("riskWarning", e.target.value)} rows={4} maxLength={5000} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} placeholder="Investments in property carry risk. Past performance is not indicative of future results..." />
        </Field>
      </Section>

      <Section title="Headline Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Target Yield %" hint="Annual">
            <input type="number" min={0} max={100} step="0.1" value={form.targetYieldPct} onChange={(e) => setField("targetYieldPct", e.target.value)} placeholder="8.4" style={inputStyle} />
          </Field>
          <Field label="Term (months)">
            <input type="number" min={0} max={600} value={form.termMonths} onChange={(e) => setField("termMonths", e.target.value)} placeholder="60" style={inputStyle} />
          </Field>
          <Field label="Projected Total Return %" hint="Over term">
            <input type="number" min={0} max={1000} step="0.1" value={form.projectedReturnPct} onChange={(e) => setField("projectedReturnPct", e.target.value)} placeholder="42.0" style={inputStyle} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Open Date" hint="When investors can subscribe">
            <input type="date" value={form.openDate} onChange={(e) => setField("openDate", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Close Date" hint="Last day to subscribe">
            <input type="date" value={form.closeDate} onChange={(e) => setField("closeDate", e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </Section>

      <Section title="Photos" icon={ImageIcon}>
        {isNew ? (
          <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
            Save this opportunity first, then upload photos here.
          </p>
        ) : property ? (
          <>
            <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>
              Upload at least 3 photos of the property. The image marked{" "}
              <strong style={{ color: TEXT_PRIMARY }}>Hero</strong> is shown first to investors
              at the top of the opportunity.
            </p>
            <PropertyImageGallery
              propertyId={property.id}
              images={property.images || []}
              onReload={onGalleryReload}
            />
            {(property.images?.length || 0) < 3 && (
              <p className="mt-2 text-[11.5px] flex items-center gap-1" style={{ color: WARNING }}>
                <AlertCircle size={11} /> Add {3 - (property.images?.length || 0)} more photo
                {3 - (property.images?.length || 0) === 1 ? "" : "s"} — minimum 3 recommended.
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
            No linked property found for this opportunity.
          </p>
        )}
      </Section>

      {!isNew && (
        <Section title="Walkthrough Video" icon={Film}>
          <Field label="Walkthrough Video" hint="Optional property tour shown on the opportunity page. Upload an MP4 / MOV / WebM file.">
            <SingleMediaUpload
              endpoint="opportunityVideo"
              kind="video"
              value={form.walkthroughVideoUrl}
              onChange={(url) => setField("walkthroughVideoUrl", url)}
            />
          </Field>
        </Section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ELIGIBILITY TAB
// ═══════════════════════════════════════════════════════════════════
function EligibilityTab({ form, setField, toggleInvestorType }) {
  return (
    <div className="space-y-4">
      <Section title="Who Can View This Opportunity" icon={ShieldCheck}>
        <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>
          Anyone logged in can browse opportunities by default. Use these settings to restrict who sees this one.
        </p>

        <Toggle
          label="Require approved KYC to view"
          description="Only investors with completed KYC will see this opportunity in listings"
          checked={form.requiresKyc}
          onChange={(v) => setField("requiresKyc", v)}
        />

        <Field label="Eligible Investor Types" hint="At least one required">
          <div className="flex flex-wrap gap-2">
            {INVESTOR_TYPES.map((t) => {
              const active = form.eligibleInvestorTypes.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleInvestorType(t.value)}
                  className="px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? GOLD : "#FFFFFF",
                    color: active ? "#FFFFFF" : TEXT_SECONDARY,
                    border: `1px solid ${active ? GOLD : BORDER_STRONG}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {active ? <CheckCircle2 size={11} className="inline mr-1" /> : null}
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Toggle
          label="Require suitability check"
          description="Investor must complete suitability questions before viewing details (Phase 5+ feature)"
          checked={form.requiresSuitabilityCheck}
          onChange={(v) => setField("requiresSuitabilityCheck", v)}
        />
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ═══════════════════════════════════════════════════════════════════
function DocumentsTab({ opportunityId, documents, onReload }) {
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
          {documents.length} document{documents.length === 1 ? "" : "s"} attached
        </p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
          style={{ backgroundColor: GOLD, color: "#FFFFFF", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
        >
          {showAddForm ? <X size={12} /> : <Plus size={12} />}
          {showAddForm ? "Cancel" : "Add Document"}
        </button>
      </div>

      {showAddForm && (
        <AddDocumentForm
          opportunityId={opportunityId}
          onAdded={() => {
            setShowAddForm(false);
            onReload();
          }}
        />
      )}

      {documents.length === 0 ? (
        <div
          className="text-center py-10 px-4"
          style={{ backgroundColor: BG_SURFACE, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "10px" }}
        >
          <FileIcon size={28} className="mx-auto mb-2" style={{ color: TEXT_MUTED }} strokeWidth={1.5} />
          <p className="text-[13px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>No documents yet</p>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Add prospectus, IM, AML policy, and other supporting docs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <DocumentRow key={d.id} doc={d} opportunityId={opportunityId} onReload={onReload} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddDocumentForm({ opportunityId, onAdded }) {
  const inputRef = useRef(null);
  const [uploaded, setUploaded] = useState(null); // { fileUrl, fileName, fileSize, mimeType }
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("prospectus");
  const [title, setTitle] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const res = await uploadFiles("opportunityDocument", { files: [file] });
      const item = Array.isArray(res) ? res[0] : res;
      const url = item?.ufsUrl || item?.url || item?.serverData?.fileUrl || null;
      if (!url) throw new Error("Upload did not return a URL");
      setUploaded({ fileUrl: url, fileName: file.name, fileSize: file.size, mimeType: file.type });
    } catch (e) {
      setErr(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!uploaded) {
      setErr("Upload a document file first");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunityId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({
          ...uploaded,
          category,
          title: title || undefined,
          isRequired,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.message || "Failed");
        setSubmitting(false);
        return;
      }
      onAdded();
    } catch (e) {
      setErr(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 mb-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${GOLD}40`, borderRadius: "10px" }}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Field label="Document file" required hint="PDF / DOC / DOCX · up to 16MB">
        {uploaded ? (
          <div className="flex items-center gap-3 p-3" style={{ backgroundColor: BG_SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
            <span className="w-9 h-9 grid place-items-center flex-shrink-0" style={{ backgroundColor: GOLD_LIGHT, borderRadius: "6px" }}>
              <FileIcon size={16} style={{ color: GOLD }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{uploaded.fileName}</p>
              <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{uploaded.fileSize ? `${(uploaded.fileSize / 1024).toFixed(0)} KB` : "Uploaded"}</p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
              style={{ color: TEXT_SECONDARY, backgroundColor: "#FFFFFF", border: `1px solid ${BORDER_STRONG}`, borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 px-4 transition-colors disabled:opacity-60"
            style={{ backgroundColor: BG_SURFACE, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "10px", cursor: uploading ? "wait" : "pointer", fontFamily: "inherit" }}
          >
            {uploading ? <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} /> : <Upload size={22} style={{ color: TEXT_MUTED }} strokeWidth={1.6} />}
            <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{uploading ? "Uploading…" : "Upload a document"}</span>
            <span className="text-[11px]" style={{ color: TEXT_MUTED }}>PDF / DOC / DOCX · up to 16MB</span>
          </button>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {DOC_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </select>
        </Field>
        <Field label="Display Title">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="(optional — defaults to filename)" style={inputStyle} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[12px] mt-2" style={{ color: TEXT_SECONDARY }}>
        <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
        Required reading (investor must view before subscribing)
      </label>
      {err && <p className="text-[11px] mt-2" style={{ color: DANGER }}>{err}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || uploading || !uploaded}
        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: GOLD, color: "#FFFFFF", border: "none", borderRadius: "6px", cursor: submitting ? "wait" : "pointer", fontFamily: "inherit" }}
      >
        {submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add Document
      </button>
    </div>
  );
}

function DocumentRow({ doc, opportunityId, onReload }) {
  const { confirm } = useDialog();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete document?",
      message: `“${doc.title || doc.fileName}” will be permanently removed from this opportunity.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/opportunities/${opportunityId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ documentId: doc.id }),
      });
      onReload();
    } catch {}
    setDeleting(false);
  }

  const category = DOC_CATEGORIES.find((c) => c.value === doc.category);

  return (
    <div
      className="p-3 flex items-center gap-3"
      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
    >
      <div
        className="w-9 h-9 grid place-items-center flex-shrink-0"
        style={{ backgroundColor: GOLD_LIGHT, borderRadius: "6px" }}
      >
        <FileIcon size={16} style={{ color: GOLD }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
            {doc.title || doc.fileName}
          </p>
          {doc.isRequired && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] uppercase flex-shrink-0"
              style={{ backgroundColor: WARNING_BG, color: WARNING, borderRadius: "3px" }}
            >
              Required
            </span>
          )}
        </div>
        <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
          {category?.label || doc.category} · {doc.fileName} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ""}
        </p>
      </div>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold"
        style={{ color: TEXT_SECONDARY, backgroundColor: "#FFFFFF", border: `1px solid ${BORDER_STRONG}`, borderRadius: "6px", textDecoration: "none" }}
      >
        <ExternalLink size={10} /> View
      </a>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="p-1.5 disabled:opacity-50"
        style={{ color: DANGER, backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "6px", cursor: "pointer" }}
        title="Delete document"
      >
        {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STATUS TAB
// ═══════════════════════════════════════════════════════════════════
function StatusTab({ opportunity: o, onReload }) {
  const { confirm } = useDialog();
  const [action, setAction] = useState(null);
  const [err, setErr] = useState(null);

  // Determine which transitions are available
  const transitions = {
    draft: [
      { action: "publish", label: "Publish (Go Live)", icon: Send, color: SUCCESS, primary: true, confirm: "Publish this opportunity? It will become visible to investors." },
      { action: "archive", label: "Archive", icon: EyeOff, color: TEXT_MUTED, confirm: "Archive this draft? You can revert later." },
    ],
    live: [
      { action: "close", label: "Close Subscriptions", icon: EyeOff, color: WARNING, primary: true, confirm: "Close subscriptions? No new investors can subscribe." },
      { action: "funded", label: "Mark as Funded", icon: CheckCircle2, color: NAVY, confirm: "Mark as fully funded? This is irreversible from public view." },
      { action: "revert_draft", label: "Revert to Draft", icon: ArrowLeft, color: TEXT_MUTED, confirm: "Revert to draft? Opportunity will be removed from listings." },
      { action: "archive", label: "Archive", icon: EyeOff, color: TEXT_MUTED },
    ],
    closed: [
      { action: "funded", label: "Mark as Funded", icon: CheckCircle2, color: NAVY, primary: true },
      { action: "revert_draft", label: "Revert to Draft", icon: ArrowLeft, color: TEXT_MUTED },
      { action: "archive", label: "Archive", icon: EyeOff, color: TEXT_MUTED },
    ],
    funded: [
      { action: "archive", label: "Archive", icon: EyeOff, color: TEXT_MUTED, primary: true },
    ],
    archived: [
      { action: "revert_draft", label: "Restore to Draft", icon: ArrowLeft, color: GOLD, primary: true },
    ],
  }[o?.status] || [];

  async function perform(transition) {
    if (transition.confirm) {
      const ok = await confirm({
        title: "Please confirm",
        message: transition.confirm,
        confirmLabel: transition.label || "Confirm",
        cancelLabel: "Cancel",
        tone: "warning",
      });
      if (!ok) return;
    }
    setAction(transition.action);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/opportunities/${o.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ action: transition.action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.message || "Failed");
        setAction(null);
        return;
      }
      onReload();
      setAction(null);
    } catch (e) {
      setErr(e.message);
      setAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <Section title="Current Status" icon={Sparkles}>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="px-3 py-1 text-[12px] font-bold tracking-[0.06em] uppercase"
            style={{
              backgroundColor: o?.status === "live" ? SUCCESS_BG : "#F4F4F5",
              color: o?.status === "live" ? SUCCESS : TEXT_MUTED,
              borderRadius: "4px",
            }}
          >
            {o?.status}
          </span>
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {o?.publishedAt && (<>Published {new Date(o.publishedAt).toLocaleDateString("en-GB")}</>)}
            {o?.closedAt && (<> · Closed {new Date(o.closedAt).toLocaleDateString("en-GB")}</>)}
          </div>
        </div>
        {err && <p className="text-[12px] mb-2" style={{ color: DANGER }}>{err}</p>}
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.action}
                type="button"
                onClick={() => perform(t)}
                disabled={action !== null}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: t.primary ? t.color : "#FFFFFF",
                  color: t.primary ? "#FFFFFF" : t.color,
                  border: `1px solid ${t.color}40`,
                  borderRadius: "6px",
                  cursor: action ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {action === t.action ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                {t.label}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="p-4" style={{ backgroundColor: BG_SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px" }}>
        <p className="text-[11px] mb-2 font-bold tracking-[0.06em] uppercase" style={{ color: TEXT_MUTED }}>
          Publishing Checklist
        </p>
        <ul className="space-y-1.5 text-[12px]" style={{ color: TEXT_SECONDARY }}>
          <li className="flex items-center gap-2">
            {o?.title?.length >= 3 ? <CheckCircle2 size={13} style={{ color: SUCCESS }} /> : <X size={13} style={{ color: DANGER }} />}
            Title set
          </li>
          <li className="flex items-center gap-2">
            {o?.summary || o?.fullDescription ? <CheckCircle2 size={13} style={{ color: SUCCESS }} /> : <X size={13} style={{ color: DANGER }} />}
            Summary or full description
          </li>
          <li className="flex items-center gap-2">
            {o?.heroImageUrl ? <CheckCircle2 size={13} style={{ color: SUCCESS }} /> : <AlertCircle size={13} style={{ color: WARNING }} />}
            Hero image (recommended)
          </li>
          <li className="flex items-center gap-2">
            {o?.documents?.length > 0 ? <CheckCircle2 size={13} style={{ color: SUCCESS }} /> : <AlertCircle size={13} style={{ color: WARNING }} />}
            At least one document (recommended)
          </li>
          <li className="flex items-center gap-2">
            {o?.riskWarning ? <CheckCircle2 size={13} style={{ color: SUCCESS }} /> : <AlertCircle size={13} style={{ color: WARNING }} />}
            Risk warning (FCA-recommended)
          </li>
        </ul>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════

// Inputs inherit their look from the global `.admin-form` CSS so the gold
// focus ring (a CSS :focus rule) isn't overridden by inline styles. Keep minimal.
const inputStyle = {};

function Section({ title, icon: Icon, children }) {
  return (
    <div
      className="mb-5"
      style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "16px", boxShadow: "0 1px 3px rgba(6,14,28,0.04)", overflow: "hidden" }}
    >
      <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {Icon && (
          <span className="grid place-items-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(201,162,74,0.10)", color: GOLD }}>
            <Icon size={16} strokeWidth={1.9} />
          </span>
        )}
        <h2 className="text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color: TEXT_PRIMARY }}>{title}</h2>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-2" style={{ color: TEXT_SECONDARY }}>
        {label}
        {required && <span style={{ color: DANGER, marginLeft: 3 }}>*</span>}
        {hint && <span className="ml-2 font-normal" style={{ color: TEXT_MUTED }}>· {hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[11.5px] flex items-center gap-1" style={{ color: DANGER }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 mt-0.5"
        style={{
          width: 36,
          height: 20,
          backgroundColor: checked ? GOLD : "#D4D4D8",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background-color 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: "50%",
            transition: "left 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{label}</p>
        {description && (
          <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>{description}</p>
        )}
      </div>
    </div>
  );
}