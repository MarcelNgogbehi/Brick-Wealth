"use client";

// app/admin/spvs/[id]/page.jsx
//
// SPV create/edit page with embedded mortgage section.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2,
  Briefcase, Building2, Landmark, Info,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

const GOLD = "#C9A24A";
const BORDER = "#E4E4E7";
const BORDER_STRONG = "#D4D4D8";
const BG_SURFACE = "#FAFAFA";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";

const CURRENCIES = [
  { value: "GBP", label: "£ GBP (British Pound)" },
  { value: "USD", label: "$ USD (US Dollar)" },
  { value: "EUR", label: "€ EUR (Euro)" },
];

const SPV_STATUS = [
  { value: "draft", label: "Draft (not visible)" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

const MORTGAGE_TYPES = [
  { value: "spv_btl", label: "SPV Buy-to-Let" },
  { value: "commercial", label: "Commercial" },
  { value: "bridging", label: "Bridging" },
  { value: "development", label: "Development" },
];

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const EMPTY_SPV = {
  spvName: "",
  companyNumber: "",
  jurisdiction: "UK",
  incorporatedOn: "",
  registeredAddress: "",
  purpose: "",
  propertyId: "",
  currency: "GBP",
  targetRaiseAmount: "",
  unitPrice: "",
  totalUnits: "",
  minimumUnits: "1",
  openDate: "",
  closeDate: "",
  bankAccountReference: "",
  bankAccountName: "",
  status: "draft",
};

const EMPTY_MORTGAGE = {
  lenderName: "",
  mortgageType: "spv_btl",
  currency: "GBP",
  principalAmount: "",
  ltvPct: "",
  interestRate: "",
  termMonths: "",
  monthlyPaymentEst: "",
  startDate: "",
  endDate: "",
  covenantsNotes: "",
};

export default function SpvEditPage() {
  const { confirm } = useDialog();
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [form, setForm] = useState(EMPTY_SPV);
  const [mortgage, setMortgage] = useState(EMPTY_MORTGAGE);
  const [hasMortgage, setHasMortgage] = useState(false);
  const [availableProps, setAvailableProps] = useState([]);
  const [spvData, setSpvData] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [mortgageSaving, setMortgageSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Load available properties (for new SPV)
  useEffect(() => {
    if (!isNew) return;
    async function load() {
      try {
        const res = await fetch("/api/admin/spvs/available-properties", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        setAvailableProps(data.properties || []);
      } catch {}
    }
    load();
  }, [isNew]);

  // Load existing SPV
  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/admin/spvs/${params.id}`, { credentials: "same-origin" });
        if (!res.ok) throw new Error("SPV not found");
        const data = await res.json();
        const s = data.spv;
        setSpvData(s);
        setForm({
          spvName: s.spvName || "",
          companyNumber: s.companyNumber || "",
          jurisdiction: s.jurisdiction || "UK",
          incorporatedOn: s.incorporatedOn ? s.incorporatedOn.split("T")[0] : "",
          registeredAddress: s.registeredAddress || "",
          purpose: s.purpose || "",
          propertyId: s.propertyId,
          currency: s.currency || "GBP",
          targetRaiseAmount: s.targetRaiseAmount || "",
          unitPrice: s.unitPrice || "",
          totalUnits: s.totalUnits ?? "",
          minimumUnits: s.minimumUnits ?? "1",
          openDate: s.openDate ? s.openDate.split("T")[0] : "",
          closeDate: s.closeDate ? s.closeDate.split("T")[0] : "",
          bankAccountReference: s.bankAccountReference || "",
          bankAccountName: s.bankAccountName || "",
          status: s.status || "draft",
        });

        if (s.mortgage) {
          setHasMortgage(true);
          setMortgage({
            lenderName: s.mortgage.lenderName || "",
            mortgageType: s.mortgage.mortgageType || "spv_btl",
            currency: s.mortgage.currency || s.currency || "GBP",
            principalAmount: s.mortgage.principalAmount || "",
            ltvPct: s.mortgage.ltvPct ?? "",
            interestRate: s.mortgage.interestRate ?? "",
            termMonths: s.mortgage.termMonths ?? "",
            monthlyPaymentEst: s.mortgage.monthlyPaymentEst || "",
            startDate: s.mortgage.startDate ? s.mortgage.startDate.split("T")[0] : "",
            endDate: s.mortgage.endDate ? s.mortgage.endDate.split("T")[0] : "",
            covenantsNotes: s.mortgage.covenantsNotes || "",
          });
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    load();
  }, [isNew, params.id]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  }
  function setMortgageField(key, value) {
    setMortgage((m) => ({ ...m, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMsg("");

    const payload = { ...form };
    // propertyId is set at creation only — not in UpdateSpvSchema (strict)
    if (!isNew) delete payload.propertyId;
    ["targetRaiseAmount", "unitPrice"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = undefined;
      else payload[k] = Number(payload[k]);
    });
    ["totalUnits", "minimumUnits"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = undefined;
      else payload[k] = parseInt(payload[k], 10);
    });

    try {
      const endpoint = isNew ? "/api/admin/spvs" : `/api/admin/spvs/${params.id}`;
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
        router.push(`/admin/spvs/${data.spv.id}`);
      } else {
        setSuccessMsg("SPV saved");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleMortgageSave() {
    setMortgageSaving(true);
    setError(null);

    const payload = { ...mortgage };
    ["principalAmount", "ltvPct", "interestRate", "monthlyPaymentEst"].forEach((k) => {
      if (payload[k] === "" || payload[k] == null) payload[k] = k === "monthlyPaymentEst" ? null : undefined;
      else payload[k] = Number(payload[k]);
    });
    if (payload.termMonths === "" || payload.termMonths == null) payload.termMonths = undefined;
    else payload.termMonths = parseInt(payload.termMonths, 10);

    try {
      const res = await fetch(`/api/admin/spvs/${params.id}/mortgage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to save mortgage");
        setMortgageSaving(false);
        return;
      }
      setHasMortgage(true);
      setSuccessMsg("Mortgage saved");
      setTimeout(() => setSuccessMsg(""), 2500);
      setMortgageSaving(false);
    } catch (err) {
      setError(err.message);
      setMortgageSaving(false);
    }
  }

  async function handleMortgageDelete() {
    const ok = await confirm({
      title: "Delete mortgage details?",
      message: "The mortgage information attached to this SPV will be removed.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setMortgageSaving(true);
    try {
      const res = await fetch(`/api/admin/spvs/${params.id}/mortgage`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      if (res.ok) {
        setHasMortgage(false);
        setMortgage(EMPTY_MORTGAGE);
        setSuccessMsg("Mortgage deleted");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch {}
    setMortgageSaving(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this SPV?",
      message: "This permanently removes the SPV and cannot be undone.",
      confirmLabel: "Delete permanently",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/spvs/${params.id}`, {
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
      router.push("/admin/spvs");
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
        href="/admin/spvs"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-5 transition-colors"
        style={{ color: TEXT_MUTED, textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
      >
        <ArrowLeft size={14} /> Back to SPVs
      </Link>

      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold leading-tight mb-1" style={{ color: TEXT_PRIMARY }}>
            {isNew ? "New SPV" : spvData?.spvName || "Edit SPV"}
          </h1>
          {!isNew && spvData?.property && (
            <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
              Property: <Link href={`/admin/properties/${spvData.property.id}`} style={{ color: GOLD, textDecoration: "underline" }}>{spvData.property.title}</Link> · {spvData.property.city}
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || spvData?.status === "active"}
              title={spvData?.status === "active" ? "Cannot delete active SPV" : "Delete SPV"}
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
            {isNew ? "Create SPV" : "Save Changes"}
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

      <div className="space-y-4">
        {/* ─── Company Info ─── */}
        <Section title="Company Details" icon={Briefcase}>
          <Field label="SPV Name" required error={fieldErrors.spvName}>
            <input type="text" value={form.spvName} onChange={(e) => setField("spvName", e.target.value)} placeholder="e.g. Bricks & Wealth SPV 001 Ltd" style={inputStyle} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company Number" required error={fieldErrors.companyNumber}>
              <input type="text" value={form.companyNumber} onChange={(e) => setField("companyNumber", e.target.value)} placeholder="e.g. 14582930" style={inputStyle} />
            </Field>
            <Field label="Jurisdiction">
              <input type="text" value={form.jurisdiction} onChange={(e) => setField("jurisdiction", e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <Field label="Incorporated On">
            <input type="date" value={form.incorporatedOn} onChange={(e) => setField("incorporatedOn", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Registered Address">
            <textarea value={form.registeredAddress} onChange={(e) => setField("registeredAddress", e.target.value)} rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
          </Field>
          <Field label="Purpose">
            <textarea value={form.purpose} onChange={(e) => setField("purpose", e.target.value)} rows={2} placeholder="Purpose statement from incorporation docs" style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
          </Field>
        </Section>

        {/* ─── Linked Property (only when new) ─── */}
        {isNew && (
          <Section title="Linked Property" icon={Building2}>
            <Field label="Property" required error={fieldErrors.propertyId} hint="One SPV can link to one property">
              {availableProps.length === 0 ? (
                <div className="p-3 text-[12px]" style={{ backgroundColor: BG_SURFACE, color: TEXT_SECONDARY, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "6px" }}>
                  No available properties.{" "}
                  <Link href="/admin/properties/new" style={{ color: GOLD, textDecoration: "underline" }}>Create one first</Link>.
                </div>
              ) : (
                <select value={form.propertyId} onChange={(e) => setField("propertyId", e.target.value)} style={inputStyle}>
                  <option value="">Select a property...</option>
                  {availableProps.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} — {p.city}, {p.country}</option>
                  ))}
                </select>
              )}
            </Field>
          </Section>
        )}

        {/* ─── Investment Terms ─── */}
        <Section title="Investment Terms" icon={Info}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Currency" required>
              <select value={form.currency} onChange={(e) => setField("currency", e.target.value)} style={inputStyle}>
                {CURRENCIES.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={inputStyle}>
                {SPV_STATUS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Target Raise" required error={fieldErrors.targetRaiseAmount}>
              <input type="number" min={0} step="0.01" value={form.targetRaiseAmount} onChange={(e) => setField("targetRaiseAmount", e.target.value)} placeholder="500000.00" style={inputStyle} />
            </Field>
            <Field label="Unit Price" required error={fieldErrors.unitPrice}>
              <input type="number" min={0} step="0.01" value={form.unitPrice} onChange={(e) => setField("unitPrice", e.target.value)} placeholder="500.00" style={inputStyle} />
            </Field>
            <Field label="Total Units" required error={fieldErrors.totalUnits}>
              <input type="number" min={1} value={form.totalUnits} onChange={(e) => setField("totalUnits", e.target.value)} placeholder="1000" style={inputStyle} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Min Units / Investor">
              <input type="number" min={1} value={form.minimumUnits} onChange={(e) => setField("minimumUnits", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Open Date">
              <input type="date" value={form.openDate} onChange={(e) => setField("openDate", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Close Date">
              <input type="date" value={form.closeDate} onChange={(e) => setField("closeDate", e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* ─── Banking ─── */}
        <Section title="Banking" icon={Landmark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Bank Account Name">
              <input type="text" value={form.bankAccountName} onChange={(e) => setField("bankAccountName", e.target.value)} placeholder="Account holder name" style={inputStyle} />
            </Field>
            <Field label="Bank Account Reference">
              <input type="text" value={form.bankAccountReference} onChange={(e) => setField("bankAccountReference", e.target.value)} placeholder="Masked identifier for reconciliation" style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* ─── Mortgage (only when SPV exists) ─── */}
        {!isNew && (
          <Section title={hasMortgage ? "Mortgage" : "Mortgage (optional)"} icon={Landmark}>
            {!hasMortgage && (
              <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>
                Add mortgage details if this SPV is leveraged. Leave blank for unleveraged SPVs.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Lender Name" required={hasMortgage}>
                <input type="text" value={mortgage.lenderName} onChange={(e) => setMortgageField("lenderName", e.target.value)} placeholder="e.g. NatWest Commercial" style={inputStyle} />
              </Field>
              <Field label="Mortgage Type">
                <select value={mortgage.mortgageType} onChange={(e) => setMortgageField("mortgageType", e.target.value)} style={inputStyle}>
                  {MORTGAGE_TYPES.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Principal Amount">
                <input type="number" min={0} step="0.01" value={mortgage.principalAmount} onChange={(e) => setMortgageField("principalAmount", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="LTV %" hint="0-100">
                <input type="number" min={0} max={100} step="0.1" value={mortgage.ltvPct} onChange={(e) => setMortgageField("ltvPct", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Interest Rate %" hint="Annual">
                <input type="number" min={0} max={30} step="0.01" value={mortgage.interestRate} onChange={(e) => setMortgageField("interestRate", e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Term (months)">
                <input type="number" min={1} value={mortgage.termMonths} onChange={(e) => setMortgageField("termMonths", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Start Date">
                <input type="date" value={mortgage.startDate} onChange={(e) => setMortgageField("startDate", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="End Date">
                <input type="date" value={mortgage.endDate} onChange={(e) => setMortgageField("endDate", e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Monthly Payment (estimate)">
              <input type="number" min={0} step="0.01" value={mortgage.monthlyPaymentEst} onChange={(e) => setMortgageField("monthlyPaymentEst", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Covenants / Notes">
              <textarea value={mortgage.covenantsNotes} onChange={(e) => setMortgageField("covenantsNotes", e.target.value)} rows={2} style={{ ...inputStyle, height: "auto", padding: "10px 12px" }} />
            </Field>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleMortgageSave}
                disabled={mortgageSaving}
                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold disabled:opacity-50"
                style={{ backgroundColor: GOLD, color: "#FFFFFF", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {mortgageSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {hasMortgage ? "Update Mortgage" : "Add Mortgage"}
              </button>
              {hasMortgage && (
                <button
                  type="button"
                  onClick={handleMortgageDelete}
                  disabled={mortgageSaving}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold"
                  style={{ color: DANGER, backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <Trash2 size={12} /> Remove Mortgage
                </button>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

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