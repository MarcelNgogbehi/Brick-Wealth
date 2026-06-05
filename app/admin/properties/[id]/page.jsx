"use client";

// app/admin/properties/[id]/page.jsx
//
// Property create/edit form. The [id] can be "new" (create mode) or a real ID.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2,
  Building2, MapPin, FileText, Info, ImageIcon,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";
import { PropertyImageGallery } from "@/app/admin/_components/MediaUploader";

const GOLD = "#C9A24A";
const GOLD_SOFT = "#D9B560";
const BORDER = "#E4E4E7";
const BG_SURFACE = "#FAFAFA";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "hmo", label: "HMO" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "land", label: "Land / Development" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not visible)" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const EMPTY_PROPERTY = {
  title: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postcode: "",
  country: "GB",
  propertyType: "house",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  yearBuilt: "",
  description: "",
  story: "",
  neighbourhoodHighlights: "",
  status: "draft",
};

export default function PropertyEditPage() {
  const { confirm } = useDialog();
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [form, setForm] = useState(EMPTY_PROPERTY);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Load existing property (also used to refresh after image changes)
  const loadProperty = useCallback(async ({ syncForm = true } = {}) => {
    try {
      const res = await fetch(`/api/admin/properties/${params.id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Property not found");
      const data = await res.json();
      const p = data.property;
      setProperty(p);
      if (syncForm) {
        setForm({
          title: p.title || "",
          addressLine1: p.addressLine1 || "",
          addressLine2: p.addressLine2 || "",
          city: p.city || "",
          region: p.region || "",
          postcode: p.postcode || "",
          country: p.country || "GB",
          propertyType: p.propertyType || "house",
          bedrooms: p.bedrooms ?? "",
          bathrooms: p.bathrooms ?? "",
          sqft: p.sqft ?? "",
          yearBuilt: p.yearBuilt ?? "",
          description: p.description || "",
          story: p.story || "",
          neighbourhoodHighlights: p.neighbourhoodHighlights || "",
          status: p.status || "draft",
        });
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (isNew) return;
    loadProperty();
  }, [isNew, loadProperty]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg("");

    // Convert numeric fields
    const payload = { ...form };
    ["bedrooms", "bathrooms", "sqft", "yearBuilt"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = null;
      else payload[k] = Number(payload[k]);
    });

    try {
      const endpoint = isNew ? "/api/admin/properties" : `/api/admin/properties/${params.id}`;
      const res = await fetch(endpoint, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data?.message || "Failed to save");
        setSaving(false);
        return;
      }

      setSaving(false);
      if (isNew) {
        router.push(`/admin/properties/${data.property.id}`);
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
      title: "Delete this property?",
      message: "This permanently removes the property and cannot be undone.",
      confirmLabel: "Delete permanently",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/properties/${params.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to delete");
        setSaving(false);
        return;
      }
      router.push("/admin/properties");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: GOLD }} />
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-form max-w-3xl mx-auto">
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-5 transition-colors"
        style={{ color: TEXT_MUTED, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
      >
        <ArrowLeft size={14} /> Back to Properties
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold leading-tight mb-1" style={{ color: TEXT_PRIMARY }}>
            {isNew ? "New Property" : property?.title || "Edit Property"}
          </h1>
          {!isNew && property?.spv && (
            <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
              Linked to SPV: <Link href={`/admin/spvs/${property.spv.id}`} style={{ color: GOLD, textDecoration: "underline" }}>{property.spv.spvName}</Link>
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || (property?.spv != null)}
              title={property?.spv ? "Delete the SPV first" : "Delete property"}
              className="flex items-center gap-1.5 h-10 px-4 text-[12.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                color: DANGER,
                backgroundColor: DANGER_BG,
                border: `1px solid ${DANGER}33`,
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-10 px-5 text-[12.5px] font-bold disabled:opacity-50 transition-all"
            style={{
              backgroundColor: GOLD,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              cursor: saving ? "wait" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(201,162,74,0.45), 0 6px 16px rgba(201,162,74,0.24)",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = GOLD_SOFT; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isNew ? "Create Property" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="p-3 mb-4 flex items-center gap-2" style={{ backgroundColor: SUCCESS_BG, border: `1px solid ${SUCCESS}30`, borderRadius: "8px" }}>
          <CheckCircle2 size={15} style={{ color: SUCCESS }} />
          <p className="text-[12.5px] font-semibold" style={{ color: SUCCESS }}>{successMsg}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 mb-4 flex items-start gap-2" style={{ backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "8px" }}>
          <AlertCircle size={15} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[12.5px]" style={{ color: DANGER }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <Section title="Basic Info" icon={Info}>
          <Field label="Property Title" required error={fieldErrors.title}>
            <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. The Wilbraham" style={inputStyle} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Property Type" required error={fieldErrors.propertyType}>
              <select value={form.propertyType} onChange={(e) => setField("propertyType", e.target.value)} style={inputStyle}>
                {PROPERTY_TYPES.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={inputStyle}>
                {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Address" icon={MapPin}>
          <Field label="Address Line 1" required error={fieldErrors.addressLine1}>
            <input type="text" value={form.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} placeholder="Street address" style={inputStyle} />
          </Field>
          <Field label="Address Line 2">
            <input type="text" value={form.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} placeholder="Apartment, suite, etc." style={inputStyle} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="City" required error={fieldErrors.city}>
              <input type="text" value={form.city} onChange={(e) => setField("city", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Region / County">
              <input type="text" value={form.region} onChange={(e) => setField("region", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Postcode" required error={fieldErrors.postcode}>
              <input type="text" value={form.postcode} onChange={(e) => setField("postcode", e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <Field label="Country (ISO code)">
            <input type="text" value={form.country} onChange={(e) => setField("country", e.target.value.toUpperCase())} maxLength={2} style={{ ...inputStyle, maxWidth: 100 }} />
          </Field>
        </Section>

        <Section title="Details" icon={Building2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Bedrooms">
              <input type="number" min={0} value={form.bedrooms} onChange={(e) => setField("bedrooms", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Bathrooms">
              <input type="number" min={0} value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Sq Ft">
              <input type="number" min={0} value={form.sqft} onChange={(e) => setField("sqft", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Year Built">
              <input type="number" min={1500} max={2100} value={form.yearBuilt} onChange={(e) => setField("yearBuilt", e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </Section>

        <Section title="Marketing Content" icon={FileText}>
          <Field label="Description" hint="Short public summary">
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} maxLength={5000} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
          </Field>
          <Field label="Story" hint="Longer narrative — 'why this property?'">
            <textarea value={form.story} onChange={(e) => setField("story", e.target.value)} rows={5} maxLength={5000} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
          </Field>
          <Field label="Neighbourhood Highlights">
            <textarea value={form.neighbourhoodHighlights} onChange={(e) => setField("neighbourhoodHighlights", e.target.value)} rows={3} maxLength={5000} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
          </Field>
        </Section>

        {!isNew && (
          <Section title="Images" icon={ImageIcon}>
            <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>
              Upload photos of this property. The hero image is shown first to investors
              across listings and the property page.
            </p>
            <PropertyImageGallery
              propertyId={params.id}
              images={property?.images || []}
              onReload={() => loadProperty({ syncForm: false })}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────

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