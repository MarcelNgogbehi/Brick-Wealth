"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RegisterInterestForm
//
// The shared "Register Interest" / "Request Invitation" form (Name, Email,
// Location + optional message). Posts to the public POST /api/leads endpoint,
// which stores a Lead (triaged in /admin/leads) and notifies the investor team.
//
// Used in two places:
//   • RegisterInterestModal   — the global popup opened by CTA buttons
//   • /register-interest page  — full-page fallback for direct links / SEO
//
// It owns its own submit + success state so it has no external dependencies
// beyond the CSRF cookie minted by the proxy on every request.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const INK = "#0B1220";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-montserrat), 'Montserrat', sans-serif";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,60}$/;

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function Field({ label, children, error }) {
  return (
    <div>
      <label
        className="block mb-1.5 text-[11px] font-bold tracking-[0.12em] uppercase"
        style={{ color: NAVY_900, fontFamily: SANS }}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px]" style={{ color: "#B42318", fontFamily: SANS }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Segmented chip selector for the brief's qualifier fields.
function Segmented({ options, value, onChange, columns = 2 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="h-11 px-3 text-[12.5px] font-semibold transition-all duration-150"
            style={{
              fontFamily: SANS,
              borderRadius: 10,
              cursor: "pointer",
              color: active ? NAVY_900 : "#4A5468",
              backgroundColor: active ? "rgba(201,162,74,0.14)" : "#FFFFFF",
              border: `1px solid ${active ? GOLD : "#E4E4E7"}`,
              boxShadow: active ? "0 0 0 3px rgba(201,162,74,0.14)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const inputBase = {
  width: "100%",
  height: 48,
  padding: "0 14px",
  fontSize: 14.5,
  color: INK,
  fontFamily: SANS,
  backgroundColor: "#FFFFFF",
  border: "1px solid #E4E4E7",
  borderRadius: 10,
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

// Multi-step "Register Interest" qualifiers (developer brief).
const INVESTOR_TYPES = [
  { value: "uk", label: "UK-based" },
  { value: "diaspora", label: "Diaspora" },
];
const BUDGET_RANGES = [
  { value: "under_25k", label: "Under £25k" },
  { value: "25k_100k", label: "£25k–£100k" },
  { value: "100k_500k", label: "£100k–£500k" },
  { value: "over_500k", label: "£500k+" },
];
const INTEREST_TYPES = [
  { value: "co_ownership", label: "Co-ownership" },
  { value: "buy_to_let", label: "Buy-to-let" },
  { value: "buy_to_own", label: "Buy-to-own" },
];

export default function RegisterInterestForm({ source = "website", onSuccess, compact = false }) {
  const [values, setValues] = useState({
    name: "", email: "", location: "", message: "",
    investorType: "", budgetRange: "", interestType: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError("");
  }

  function validate() {
    const e = {};
    if (!NAME_REGEX.test(values.name.trim())) e.name = "Please enter your full name";
    if (!EMAIL_REGEX.test(values.email.trim())) e.email = "Please enter a valid email address";
    if (values.location.trim().length < 2) e.location = "Please enter your city or country";
    if (!values.investorType) e.investorType = "Please select one";
    if (!values.budgetRange) e.budgetRange = "Please select a budget range";
    if (!values.interestType) e.interestType = "Please select what interests you";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          location: values.location.trim(),
          message: values.message.trim() || undefined,
          investorType: values.investorType || undefined,
          budgetRange: values.budgetRange || undefined,
          interestType: values.interestType || undefined,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors);
        setServerError(data?.message || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setSubmitting(false);
      onSuccess?.();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6 px-2">
        <div
          className="mx-auto mb-5 flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            background: "rgba(201,162,74,0.14)",
            border: "1px solid rgba(201,162,74,0.4)",
          }}
        >
          <CheckCircle2 size={28} style={{ color: GOLD }} />
        </div>
        <h3
          className="mb-2"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: NAVY_900 }}
        >
          Thank you
        </h3>
        <p
          className="mx-auto max-w-sm"
          style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.65, color: "#4A5468" }}
        >
          Our investor team will review your details and be in touch shortly with next
          steps. Membership is by invitation only — we review every request personally.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={compact ? "space-y-4" : "space-y-5"}>
      <Field label="Full name" error={errors.name}>
        <input
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Jane Adeyemi"
          style={inputBase}
          onFocus={(e) => {
            e.target.style.borderColor = GOLD;
            e.target.style.boxShadow = "0 0 0 3px rgba(201,162,74,0.16)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.name ? "#B42318" : "#E4E4E7";
            e.target.style.boxShadow = "none";
          }}
        />
      </Field>

      <Field label="Email address" error={errors.email}>
        <input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@email.com"
          style={inputBase}
          onFocus={(e) => {
            e.target.style.borderColor = GOLD;
            e.target.style.boxShadow = "0 0 0 3px rgba(201,162,74,0.16)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.email ? "#B42318" : "#E4E4E7";
            e.target.style.boxShadow = "none";
          }}
        />
      </Field>

      <Field label="Location (city / country)" error={errors.location}>
        <input
          type="text"
          autoComplete="address-level2"
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="London, United Kingdom"
          style={inputBase}
          onFocus={(e) => {
            e.target.style.borderColor = GOLD;
            e.target.style.boxShadow = "0 0 0 3px rgba(201,162,74,0.16)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.location ? "#B42318" : "#E4E4E7";
            e.target.style.boxShadow = "none";
          }}
        />
      </Field>

      <Field label="Are you investing from the UK or diaspora?" error={errors.investorType}>
        <Segmented
          options={INVESTOR_TYPES}
          value={values.investorType}
          onChange={(v) => set("investorType", v)}
          columns={2}
        />
      </Field>

      <Field label="Budget range" error={errors.budgetRange}>
        <Segmented
          options={BUDGET_RANGES}
          value={values.budgetRange}
          onChange={(v) => set("budgetRange", v)}
          columns={2}
        />
      </Field>

      <Field label="What interests you?" error={errors.interestType}>
        <Segmented
          options={INTEREST_TYPES}
          value={values.interestType}
          onChange={(v) => set("interestType", v)}
          columns={3}
        />
      </Field>

      {!compact && (
        <Field label="Anything you'd like us to know? (optional)">
          <textarea
            rows={3}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Your goals, the opportunity that caught your eye, or how you heard about us…"
            style={{ ...inputBase, height: "auto", padding: "12px 14px", lineHeight: 1.6, resize: "vertical" }}
            onFocus={(e) => {
              e.target.style.borderColor = GOLD;
              e.target.style.boxShadow = "0 0 0 3px rgba(201,162,74,0.16)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E4E4E7";
              e.target.style.boxShadow = "none";
            }}
          />
        </Field>
      )}

      {serverError ? (
        <div
          className="px-3.5 py-2.5 text-[13px]"
          style={{
            fontFamily: SANS,
            color: "#B42318",
            background: "rgba(180,35,24,0.06)",
            border: "1px solid rgba(180,35,24,0.25)",
            borderRadius: 8,
          }}
        >
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="group inline-flex w-full items-center justify-center gap-2.5 h-[52px] text-[11.5px] font-extrabold tracking-[0.16em] uppercase transition-all duration-300"
        style={{
          fontFamily: SANS,
          backgroundColor: GOLD,
          color: NAVY_900,
          borderRadius: 2,
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
          boxShadow: "0 16px 36px -12px rgba(201,162,74,0.6)",
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            Register Interest
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p
        className="text-center text-[11.5px]"
        style={{ fontFamily: SANS, color: "#8A93A6", lineHeight: 1.5 }}
      >
        By submitting, you agree to be contacted by our investor team. We never share your
        details. By invitation only.
      </p>
    </form>
  );
}
