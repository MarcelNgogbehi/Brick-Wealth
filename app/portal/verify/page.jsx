"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { assets } from "@/assets/assets";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Sparkles, Loader2, Mail, Clock, KeyRound, User, MapPin, Phone, Calendar,
  Briefcase, Wallet, ShieldCheck, FileCheck, Camera, Upload, FileText,
  X, CreditCard, Globe, Building2, Info, ExternalLink,
} from "lucide-react";

// ─── Tokens ─────────────────────────────────────────────────────────
const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const NAVY_800 = "#0F2856";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const WHITE = "#FFFFFF";
const RED = "#9B2C2C";
const GREEN = "#0F6E56";

// ─── Helpers ────────────────────────────────────────────────────────
function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function getPasswordStrength(p) {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = [
    { label: "Too short", color: RED }, { label: "Weak", color: RED },
    { label: "Fair", color: "#B8860B" }, { label: "Good", color: GOLD_DARK },
    { label: "Strong", color: GREEN }, { label: "Excellent", color: GREEN },
  ];
  return { score, ...labels[Math.min(score, 5)] };
}

function calcAge(dob) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const US_ZIP = /^\d{5}(-\d{4})?$/;

// ═════════════════════════════════════════════════════════════════════
// LOGO MARK
// ═════════════════════════════════════════════════════════════════════
function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <path d="M22 4 L36 12 L22 20 L8 12 Z" fill="url(#vg)" stroke={GOLD_DARK} strokeWidth="0.5" />
      <path d="M22 14 L36 22 L22 30 L8 22 Z" fill="url(#vg)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.92" />
      <path d="M22 24 L36 32 L22 40 L8 32 Z" fill="url(#vg)" stroke={GOLD_DARK} strokeWidth="0.5" opacity="0.84" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROGRESS RAIL — shows current step in the 4-step wizard
// ═════════════════════════════════════════════════════════════════════
const STEPS = [
  { id: "password", label: "Account",  icon: Lock },
  { id: "profile",  label: "Details",  icon: User },
  { id: "kyc",      label: "Verify",   icon: ShieldCheck },
  { id: "consents", label: "Consents", icon: FileCheck },
];

function ProgressRail({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-1 mb-3">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-9 h-9 grid place-items-center transition-all duration-300"
                  style={{
                    background: done ? GOLD : active ? GOLD_DIM : "rgba(255,255,255,0.04)",
                    border: `1px solid ${done || active ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "1px",
                  }}>
                  {done ? (
                    <CheckCircle2 size={15} style={{ color: NAVY_900 }} fill={NAVY_900} />
                  ) : (
                    <Icon size={14} style={{ color: active ? GOLD_LIGHT : "rgba(255,255,255,0.4)" }} />
                  )}
                </div>
                <span className="text-[9.5px] font-bold tracking-[0.18em] uppercase whitespace-nowrap"
                  style={{ color: done ? GOLD_LIGHT : active ? WHITE : "rgba(255,255,255,0.4)" }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 mx-2 mb-6" style={{
                  background: done ? GOLD : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// REUSABLE FORM HELPERS
// ═════════════════════════════════════════════════════════════════════
function inputStyle({ focused = false, error = false, disabled = false }) {
  return {
    width: "100%", height: 52,
    backgroundColor: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${error ? "rgba(155,44,44,0.5)" : focused ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
    color: disabled ? "rgba(255,255,255,0.5)" : WHITE,
    fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    padding: "0 16px", outline: "none",
    transition: "all 0.2s", borderRadius: "1px",
  };
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-[11px] flex items-center gap-1.5 mt-1.5" style={{ color: "#FFB8B8" }}>
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

function Label({ children, required }) {
  return (
    <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-2 block"
      style={{ color: "rgba(255,255,255,0.55)" }}>
      {children} {required && <span style={{ color: GOLD_LIGHT }}>*</span>}
    </label>
  );
}

function PasswordStrengthMeter({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="flex items-center gap-1.5 mt-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-1 flex-1 transition-all duration-300" style={{ backgroundColor: i <= score ? color : "rgba(255,255,255,0.08)", borderRadius: "1px" }} />
        ))}
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase ml-2 whitespace-nowrap" style={{ color }}>{label}</span>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 1 — PASSWORD
// ═════════════════════════════════════════════════════════════════════
function StepPassword({ token, onComplete, onExpired }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [focused, setFocused] = useState(null);

  function validate() {
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))
      errs.password = "Use uppercase + lowercase + at least one number";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords don't match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Token consumed or deleted — show the expired panel with resend form
        if (res.status === 400 && data?.message?.toLowerCase().includes("invalid or has expired")) {
          onExpired?.();
          return;
        }
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMsg(data?.message || "Verification failed. Please try again.");
        setSubmitting(false);
        return;
      }
      // Success — move to next step
      onComplete();
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 1 of 4 · Set Password"
        title="Secure your"
        accent="account."
        body="Choose a strong password to activate your investor account."
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <Label required>New Password</Label>
          <div className="relative">
            <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              style={{ ...inputStyle({ focused: focused === "p", error: !!fieldErrors.password }), paddingLeft: 44, paddingRight: 48 }}
              onFocus={() => setFocused("p")} onBlur={() => setFocused(null)}
              autoComplete="new-password" aria-invalid={!!fieldErrors.password} />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.4)", background: "transparent", border: "none", cursor: "pointer" }}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <PasswordStrengthMeter password={password} />
          <FieldError msg={fieldErrors.password} />
        </div>

        <div>
          <Label required>Confirm Password</Label>
          <div className="relative">
            <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type={showPassword ? "text" : "password"} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password"
              style={{ ...inputStyle({ focused: focused === "c", error: !!fieldErrors.confirm }), paddingLeft: 44 }}
              onFocus={() => setFocused("c")} onBlur={() => setFocused(null)}
              autoComplete="new-password" aria-invalid={!!fieldErrors.confirm} />
          </div>
          <FieldError msg={fieldErrors.confirm} />
        </div>

        <ErrorBanner msg={errorMsg} />

        <PrimaryButton type="submit" loading={submitting}>
          Set Password & Continue <ArrowRight size={12} />
        </PrimaryButton>
      </form>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 2 — PROFILE / ONBOARDING
// ═════════════════════════════════════════════════════════════════════
function StepProfile({ user, onComplete }) {
  // Pre-fill from user data
  const [dob, setDob] = useState(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "");
  const [ageConfirmed, setAgeConfirmed] = useState(user.ageConfirmed || false);
  const [addressLine1, setAddressLine1] = useState(user.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(user.addressLine2 || "");
  const [city, setCity] = useState(user.city || "");
  const [region, setRegion] = useState(user.region || "");
  const [postcode, setPostcode] = useState(user.postcode || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [occupation, setOccupation] = useState(user.occupation || "");
  const [sourceOfFunds, setSourceOfFunds] = useState(user.sourceOfFunds || "");
  const [sourceOfFundsDetail, setSourceOfFundsDetail] = useState(user.sourceOfFundsDetail || "");
  const [estimatedNetWorth, setEstimatedNetWorth] = useState(user.estimatedNetWorth || "");
  const [investorType, setInvestorType] = useState(user.investorType || "");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [focused, setFocused] = useState(null);

  // Postcode format derived from residency + country
  const postcodeFormat = user.residency === "UK" || user.country === "GB" ? "UK" : user.country === "US" ? "US" : "OTHER";
  const postcodePlaceholder = postcodeFormat === "UK" ? "e.g. SW1A 1AA" : postcodeFormat === "US" ? "e.g. 12345 or 12345-6789" : "Postal code";
  const age = calcAge(dob);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    // Client-side validation
    const errs = {};
    if (!dob) errs.dateOfBirth = "Date of birth is required";
    else if (age < 18) errs.dateOfBirth = "You must be 18 or older";
    if (!ageConfirmed) errs.ageConfirmed = "Please confirm you are 18+";
    if (!addressLine1) errs.addressLine1 = "Address is required";
    if (!city) errs.city = "City is required";
    if (!postcode) errs.postcode = "Postcode is required";
    else if (postcodeFormat === "UK" && !UK_POSTCODE.test(postcode)) errs.postcode = "Invalid UK postcode";
    else if (postcodeFormat === "US" && !US_ZIP.test(postcode)) errs.postcode = "Invalid US ZIP code";
    if (!phoneNumber) errs.phoneNumber = "Phone number is required";
    if (!occupation) errs.occupation = "Occupation is required";
    if (!sourceOfFunds) errs.sourceOfFunds = "Please select a source of funds";
    if (sourceOfFunds === "other" && !sourceOfFundsDetail.trim()) errs.sourceOfFundsDetail = "Please describe your source of funds";
    if (!estimatedNetWorth) errs.estimatedNetWorth = "Please select an estimated net worth";
    if (!investorType) errs.investorType = "Please select investor type";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setErrorMsg("Please correct the errors below");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({
          dateOfBirth: dob,
          ageConfirmed,
          addressLine1, addressLine2, city, region,
          postcode: postcode.toUpperCase(),
          postcodeFormat,
          phoneNumber, occupation,
          sourceOfFunds,
          sourceOfFundsDetail: sourceOfFunds === "other" ? sourceOfFundsDetail : "",
          estimatedNetWorth, investorType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMsg(data?.message || "Failed to save profile");
        setSubmitting(false);
        return;
      }
      onComplete();
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 4 · Personal Details"
        title="Tell us about"
        accent="yourself."
        body="We collect this information for FCA-aligned KYC and to ensure you are a qualified investor."
      />

      {/* Pre-filled (read-only) summary */}
      <div className="mb-6 px-5 py-4 flex items-center gap-3" style={{ background: "rgba(201,162,74,0.06)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
        <Sparkles size={13} style={{ color: GOLD_LIGHT, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: GOLD_LIGHT }}>From your registration</p>
          <p className="text-[12.5px] font-semibold mt-0.5 truncate" style={{ color: WHITE }}>
            {user.fullName} · {user.email}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {user.residency === "UK" ? "United Kingdom" : `Diaspora · ${user.country}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* DOB + Age confirmation */}
        <div>
          <Label required>Date of Birth</Label>
          <div className="relative">
            <Calendar size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              style={{ ...inputStyle({ focused: focused === "dob", error: !!fieldErrors.dateOfBirth }), paddingLeft: 44, colorScheme: "dark" }}
              onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)} />
          </div>
          {dob && age >= 18 && (
            <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "#86efac" }}>
              <CheckCircle2 size={11} /> Age: {age}
            </p>
          )}
          {dob && age < 18 && age > 0 && (
            <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "#FFB8B8" }}>
              <AlertCircle size={11} /> You must be 18 or older to register
            </p>
          )}
          <FieldError msg={fieldErrors.dateOfBirth} />
        </div>

        <Checkbox checked={ageConfirmed} onChange={setAgeConfirmed} required>
          I confirm I am 18 years of age or older
        </Checkbox>
        <FieldError msg={fieldErrors.ageConfirmed} />

        {/* Address */}
        <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-4" style={{ color: GOLD_LIGHT }}>
            Address
          </p>
        </div>

        <div>
          <Label required>Address Line 1</Label>
          <div className="relative">
            <MapPin size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address" maxLength={120}
              style={{ ...inputStyle({ focused: focused === "a1", error: !!fieldErrors.addressLine1 }), paddingLeft: 44 }}
              onFocus={() => setFocused("a1")} onBlur={() => setFocused(null)} autoComplete="address-line1" />
          </div>
          <FieldError msg={fieldErrors.addressLine1} />
        </div>

        <div>
          <Label>Address Line 2 (optional)</Label>
          <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment, suite, etc." maxLength={120}
            style={inputStyle({ focused: focused === "a2" })}
            onFocus={() => setFocused("a2")} onBlur={() => setFocused(null)} autoComplete="address-line2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>City</Label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="City" maxLength={80}
              style={inputStyle({ focused: focused === "city", error: !!fieldErrors.city })}
              onFocus={() => setFocused("city")} onBlur={() => setFocused(null)} autoComplete="address-level2" />
            <FieldError msg={fieldErrors.city} />
          </div>
          <div>
            <Label>{postcodeFormat === "US" ? "State" : "County / Region"}</Label>
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
              placeholder={postcodeFormat === "US" ? "State" : "County"} maxLength={80}
              style={inputStyle({ focused: focused === "region" })}
              onFocus={() => setFocused("region")} onBlur={() => setFocused(null)} autoComplete="address-level1" />
          </div>
        </div>

        <div>
          <Label required>{postcodeFormat === "US" ? "ZIP Code" : "Postcode"}</Label>
          <input type="text" value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            placeholder={postcodePlaceholder} maxLength={12}
            style={{ ...inputStyle({ focused: focused === "pc", error: !!fieldErrors.postcode }), textTransform: "uppercase" }}
            onFocus={() => setFocused("pc")} onBlur={() => setFocused(null)} autoComplete="postal-code" />
          <p className="text-[10.5px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {postcodeFormat === "UK" && "UK format: SW1A 1AA"}
            {postcodeFormat === "US" && "US format: 12345 or 12345-6789"}
            {postcodeFormat === "OTHER" && "International postal code"}
          </p>
          <FieldError msg={fieldErrors.postcode} />
        </div>

        <div>
          <Label required>Phone Number</Label>
          <div className="relative">
            <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+44 20 1234 5678" maxLength={20}
              style={{ ...inputStyle({ focused: focused === "ph", error: !!fieldErrors.phoneNumber }), paddingLeft: 44 }}
              onFocus={() => setFocused("ph")} onBlur={() => setFocused(null)} autoComplete="tel" />
          </div>
          <FieldError msg={fieldErrors.phoneNumber} />
        </div>

        {/* Financial details */}
        <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase mb-4" style={{ color: GOLD_LIGHT }}>
            Financial Profile
          </p>
        </div>

        <div>
          <Label required>Occupation</Label>
          <div className="relative">
            <Briefcase size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Software Engineer, Doctor, Teacher" maxLength={80}
              style={{ ...inputStyle({ focused: focused === "occ", error: !!fieldErrors.occupation }), paddingLeft: 44 }}
              onFocus={() => setFocused("occ")} onBlur={() => setFocused(null)} />
          </div>
          <FieldError msg={fieldErrors.occupation} />
        </div>

        <div>
          <Label required>Source of Funds</Label>
          <Select value={sourceOfFunds} onChange={setSourceOfFunds} placeholder="Select source of funds" error={!!fieldErrors.sourceOfFunds}
            options={[
              { value: "salary", label: "Salary / Employment Income" },
              { value: "savings", label: "Personal Savings" },
              { value: "inheritance", label: "Inheritance" },
              { value: "investment", label: "Investment Returns" },
              { value: "business", label: "Business Income" },
              { value: "other", label: "Other (please describe)" },
            ]}
          />
          <FieldError msg={fieldErrors.sourceOfFunds} />
        </div>

        {sourceOfFunds === "other" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <Label required>Describe your source of funds</Label>
            <textarea value={sourceOfFundsDetail} onChange={(e) => setSourceOfFundsDetail(e.target.value)}
              placeholder="Please briefly describe..." maxLength={200} rows={3}
              style={{ ...inputStyle({ focused: focused === "sfd", error: !!fieldErrors.sourceOfFundsDetail }), height: "auto", paddingTop: 12, paddingBottom: 12, resize: "none" }}
              onFocus={() => setFocused("sfd")} onBlur={() => setFocused(null)} />
            <FieldError msg={fieldErrors.sourceOfFundsDetail} />
          </motion.div>
        )}

        <div>
          <Label required>Estimated Net Worth</Label>
          <Select value={estimatedNetWorth} onChange={setEstimatedNetWorth} placeholder="Select bracket" error={!!fieldErrors.estimatedNetWorth}
            options={[
              { value: "under_50k", label: "Under £50,000" },
              { value: "50k_250k", label: "£50,000 – £250,000" },
              { value: "250k_1m", label: "£250,000 – £1,000,000" },
              { value: "over_1m", label: "Over £1,000,000" },
            ]}
          />
          <FieldError msg={fieldErrors.estimatedNetWorth} />
        </div>

        <div>
          <Label required>Investor Classification</Label>
          <Select value={investorType} onChange={setInvestorType} placeholder="Select investor type" error={!!fieldErrors.investorType}
            options={[
              { value: "retail", label: "Retail Investor" },
              { value: "sophisticated", label: "Self-Certified Sophisticated Investor" },
              { value: "hnw", label: "Self-Certified High Net Worth Investor" },
            ]}
          />
          <p className="text-[10.5px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Most investors start as Retail. You can upgrade later by certifying.
          </p>
          <FieldError msg={fieldErrors.investorType} />
        </div>

        <ErrorBanner msg={errorMsg} />

        <PrimaryButton type="submit" loading={submitting}>
          Save & Continue to Verification <ArrowRight size={12} />
        </PrimaryButton>
      </form>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 3 — KYC DOCUMENT UPLOADS
// ═════════════════════════════════════════════════════════════════════
const KYC_DOCUMENTS = [
  {
    type: "id_front",
    label: "Government-Issued ID — Front",
    description: "Passport, driving licence, or national ID card. Front side must be clear and fully visible.",
    icon: CreditCard,
    accept: "image/*,application/pdf",
    endpoint: "kycDocument",
  },
  {
    type: "id_back",
    label: "Government-Issued ID — Back",
    description: "Back side of the same ID document. If using a passport, upload the photo page again.",
    icon: CreditCard,
    accept: "image/*,application/pdf",
    endpoint: "kycDocument",
  },
  {
    type: "proof_of_address",
    label: "Proof of Address",
    description: "Utility bill, bank statement, or council tax document — dated within the last 3 months.",
    icon: FileText,
    accept: "image/*,application/pdf",
    endpoint: "kycDocument",
  },
  {
    type: "selfie",
    label: "Selfie Photo",
    description: "Clear photo of your face, holding your ID next to it. No filters or sunglasses.",
    icon: Camera,
    accept: "image/*",
    endpoint: "kycSelfie",
  },
  {
    type: "source_of_funds",
    label: "Source of Funds Evidence",
    description: "Recent payslip, savings statement, or other proof matching the source you declared.",
    icon: Wallet,
    accept: "image/*,application/pdf",
    endpoint: "kycDocument",
  },
];

function StepKyc({ kycDocuments, onComplete, onSkip, onBack }) {
  const [uploaded, setUploaded] = useState(() => {
    // Pre-fill from existing uploads
    const map = {};
    for (const doc of kycDocuments) {
      map[doc.documentType] = {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
      };
    }
    return map;
  });
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const allUploaded = KYC_DOCUMENTS.every((d) => uploaded[d.type]);
  const anyUploaded = KYC_DOCUMENTS.some((d) => uploaded[d.type]);

  async function handleSkip() {
    setSkipping(true);
    setErrorMsg("");
    try {
      await onSkip?.();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSkipping(false);
    }
  }

  async function handleUpload(doc, file) {
    if (!file) return;
    setErrors((e) => ({ ...e, [doc.type]: null }));
    setUploading((u) => ({ ...u, [doc.type]: true }));

    try {
      // Use UploadThing client SDK
      const { uploadFiles } = await import("@/lib/uploadthing-client");
      const inputArg = doc.endpoint === "kycDocument"
        ? { documentType: doc.type }
        : undefined;

      const res = await uploadFiles(doc.endpoint, {
        files: [file],
        ...(inputArg ? { input: inputArg } : {}),
      });

      if (!res || !res[0]) throw new Error("Upload failed");

      setUploaded((u) => ({
        ...u,
        [doc.type]: {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        },
      }));
    } catch (err) {
      setErrors((e) => ({ ...e, [doc.type]: err?.message || "Upload failed. Please try again." }));
    } finally {
      setUploading((u) => ({ ...u, [doc.type]: false }));
    }
  }

  async function handleSubmit() {
    if (!allUploaded) {
      setErrorMsg("Please upload all required documents");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/onboarding/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.message || "Failed to submit KYC");
        setSubmitting(false);
        return;
      }
      onComplete();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 of 4 · Identity Verification"
        title="Upload your"
        accent="documents."
        body="We need to verify your identity for FCA-aligned KYC. Your documents are encrypted and reviewed by our team within 24–72 hours."
      />

      <div className="mb-6 px-5 py-4 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1px" }}>
        <Info size={13} style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-[12px] font-semibold mb-1" style={{ color: WHITE }}>Privacy & Security</p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Documents are encrypted in transit (TLS 1.3) and at rest. Only authorised compliance staff can review them.
            Files: JPG, PNG, or PDF · max 8MB per document.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {KYC_DOCUMENTS.map((doc) => (
          <DocumentUploader
            key={doc.type}
            doc={doc}
            uploaded={uploaded[doc.type]}
            uploading={uploading[doc.type]}
            error={errors[doc.type]}
            onUpload={(file) => handleUpload(doc, file)}
            onClear={() => setUploaded((u) => { const n = { ...u }; delete n[doc.type]; return n; })}
          />
        ))}
      </div>

      <ErrorBanner msg={errorMsg} className="mt-6" />

      <div className="mt-6 flex items-center justify-between gap-2">
        <p className="text-[11.5px]" style={{ color: allUploaded ? "#86efac" : "rgba(255,255,255,0.5)" }}>
          {allUploaded ? "✓ All documents uploaded" : `${Object.keys(uploaded).length} of ${KYC_DOCUMENTS.length} uploaded`}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <PrimaryButton type="button" loading={submitting} disabled={!allUploaded || skipping} onClick={handleSubmit}>
          Submit for Review <ArrowRight size={12} />
        </PrimaryButton>

        {/* ─── Defer KYC ───────────────────────────────────────────────
            Investors may finish onboarding now and verify later. Until
            their documents are submitted and approved, subscriptions stay
            locked — so this never weakens compliance. */}
        {onSkip && (
          <button type="button" onClick={handleSkip} disabled={submitting || skipping}
            className="w-full h-11 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase transition-all disabled:opacity-50"
            style={{ background: "transparent", color: GOLD_LIGHT, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px", cursor: submitting || skipping ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => { if (!submitting && !skipping) e.currentTarget.style.background = GOLD_DIM; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            {skipping ? <Loader2 size={14} className="animate-spin" /> : <><Clock size={12} /> {anyUploaded ? "Finish later — skip for now" : "Skip for now — verify later"}</>}
          </button>
        )}

        {onSkip && (
          <p className="text-[10.5px] leading-relaxed text-center px-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            You can explore your dashboard right away. You&apos;ll need to upload and
            pass verification before you can subscribe to an opportunity.
          </p>
        )}

        {onBack && (
          <button type="button" onClick={onBack} disabled={submitting || skipping}
            className="w-full h-11 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase transition-all disabled:opacity-50"
            style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1px", cursor: submitting || skipping ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => { if (!submitting && !skipping) { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <ArrowLeft size={11} /> Back to Details
          </button>
        )}
      </div>
    </div>
  );
}

function DocumentUploader({ doc, uploaded, uploading, error, onUpload, onClear }) {
  const inputRef = useRef(null);
  const Icon = doc.icon;

  return (
    <div className="relative overflow-hidden" style={{
      background: uploaded ? "rgba(15,110,86,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${uploaded ? "rgba(134,239,172,0.3)" : error ? "rgba(155,44,44,0.4)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "1px",
    }}>
      <input ref={inputRef} type="file" accept={doc.accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />

      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 grid place-items-center flex-shrink-0" style={{
          background: uploaded ? "rgba(134,239,172,0.1)" : GOLD_DIM,
          border: `1px solid ${uploaded ? "rgba(134,239,172,0.3)" : GOLD_BORD}`,
          borderRadius: "1px",
        }}>
          {uploaded ? <CheckCircle2 size={16} style={{ color: "#86efac" }} /> : <Icon size={16} style={{ color: GOLD_LIGHT }} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold tracking-[0.02em]" style={{ color: WHITE }}>{doc.label}</p>
          {!uploaded ? (
            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{doc.description}</p>
          ) : (
            <p className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: "rgba(134,239,172,0.85)" }}>
              <span className="truncate max-w-[200px]">{uploaded.fileName}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{Math.round((uploaded.fileSize || 0) / 1024)} KB</span>
            </p>
          )}
          {error && <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "#FFB8B8" }}><AlertCircle size={11} /> {error}</p>}
        </div>

        <div className="flex-shrink-0">
          {uploading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: GOLD_LIGHT }} />
          ) : uploaded ? (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="text-[10.5px] font-bold tracking-[0.14em] uppercase px-3 py-1.5 transition-colors"
              style={{ background: "transparent", color: GOLD_LIGHT, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px", cursor: "pointer", fontFamily: "inherit" }}>
              Replace
            </button>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.14em] uppercase px-3 py-2 transition-all"
              style={{ background: GOLD, color: NAVY_900, border: "none", borderRadius: "1px", cursor: "pointer", fontFamily: "inherit" }}>
              <Upload size={11} /> Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// STEP 4 — CONSENTS
// ═════════════════════════════════════════════════════════════════════
const CONSENT_ITEMS = [
  {
    key: "terms_of_service",
    required: true,
    label: "I accept the Terms of Service",
    description: "The agreement governing your use of the Bricks & Wealth platform.",
    href: "/legal/terms",
  },
  {
    key: "privacy_policy",
    required: true,
    label: "I accept the Privacy Policy",
    description: "How we collect, store, and process your personal data under GDPR.",
    href: "/legal/privacy",
  },
  {
    key: "risk_warning",
    required: true,
    label: "I understand the Risk Warning",
    description: "Property investment carries risk. Capital is at risk and past performance does not predict future returns.",
    href: "/legal/risk",
  },
  {
    key: "data_processing",
    required: true,
    label: "I consent to KYC data processing",
    description: "We process your identity documents for FCA-aligned anti-money laundering checks.",
    href: "/legal/data-processing",
  },
  {
    key: "cookie_policy",
    required: false,
    label: "I accept cookies for site analytics",
    description: "Helps us improve the platform. You can change this any time in settings.",
    href: "/legal/cookies",
  },
  {
    key: "marketing_emails",
    required: false,
    label: "I'd like to receive investor updates",
    description: "Monthly market briefings, new SPV announcements, and investor events. Unsubscribe any time.",
    href: null,
  },
];

function StepConsents({ existingConsents, onComplete, onBack }) {
  // Pre-fill from existing
  const initial = {};
  for (const item of CONSENT_ITEMS) {
    const existing = existingConsents.find((c) => c.type === item.key);
    initial[item.key] = existing?.granted || false;
  }
  const [consents, setConsents] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const allRequiredAccepted = CONSENT_ITEMS.filter((i) => i.required).every((i) => consents[i.key]);

  async function handleSubmit() {
    setErrorMsg("");
    if (!allRequiredAccepted) {
      setErrorMsg("Please accept all required consents to continue");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify(consents),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.message || "Failed to save consents");
        setSubmitting(false);
        return;
      }
      onComplete(data);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 4 of 4 · Final Consents"
        title="Almost"
        accent="done."
        body="Review and accept the agreements that govern your investor relationship with Bricks & Wealth."
      />

      <div className="flex flex-col gap-3 mb-6">
        {CONSENT_ITEMS.map((item) => (
          <ConsentItem key={item.key} item={item} checked={consents[item.key]}
            onChange={(v) => setConsents((c) => ({ ...c, [item.key]: v }))} />
        ))}
      </div>

      <ErrorBanner msg={errorMsg} />

      <div className="mt-6 px-5 py-4 flex items-start gap-3" style={{ background: "rgba(201,162,74,0.06)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
        <ShieldCheck size={13} style={{ color: GOLD_LIGHT, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          By clicking <strong>Activate Account</strong>, your consents are recorded with timestamp and IP for our regulatory audit trail. You can withdraw non-essential consents at any time from your account settings.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <PrimaryButton type="button" loading={submitting} disabled={!allRequiredAccepted} onClick={handleSubmit}>
          Activate Account <ArrowRight size={12} />
        </PrimaryButton>
        {onBack && (
          <button type="button" onClick={onBack}
            className="w-full h-11 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase transition-all"
            style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1px", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <ArrowLeft size={11} /> Back to Verification
          </button>
        )}
      </div>
    </div>
  );
}

function ConsentItem({ item, checked, onChange }) {
  return (
    <label className="block cursor-pointer" style={{
      background: checked ? "rgba(201,162,74,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${checked ? GOLD_BORD : "rgba(255,255,255,0.08)"}`,
      borderRadius: "1px",
      transition: "all 0.2s",
    }}>
      <div className="p-4 flex items-start gap-3">
        <div className="w-5 h-5 grid place-items-center flex-shrink-0 mt-0.5" style={{
          background: checked ? GOLD : "transparent",
          border: `1.5px solid ${checked ? GOLD : "rgba(255,255,255,0.3)"}`,
          borderRadius: "1px",
          transition: "all 0.2s",
        }}>
          {checked && <CheckCircle2 size={11} style={{ color: NAVY_900 }} fill={NAVY_900} />}
        </div>

        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold flex items-center gap-2 flex-wrap" style={{ color: WHITE }}>
            {item.label}
            {item.required && (
              <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-1.5 py-0.5"
                style={{ color: GOLD_LIGHT, background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
                Required
              </span>
            )}
          </p>
          <p className="text-[11px] leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            {item.description}{" "}
            {item.href && (
              <Link href={item.href} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                className="underline inline-flex items-center gap-1" style={{ color: GOLD_LIGHT }}>
                Read <ExternalLink size={10} />
              </Link>
            )}
          </p>
        </div>
      </div>
    </label>
  );
}

// ═════════════════════════════════════════════════════════════════════
// REUSABLE UI BITS
// ═════════════════════════════════════════════════════════════════════
function StepHeader({ eyebrow, title, accent, body }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
        <Sparkles size={11} style={{ color: GOLD_LIGHT }} />
        <span className="text-[10.5px] font-bold tracking-[0.32em] uppercase" style={{ color: GOLD_LIGHT }}>
          {eyebrow}
        </span>
      </div>
      <h2 className="leading-[0.96] mb-3" style={{
        fontFamily: "var(--font-cormorant), serif", fontWeight: 500,
        fontSize: "clamp(32px, 4vw, 44px)", letterSpacing: "-0.018em", color: WHITE,
      }}>
        {title} <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>{accent}</em>
      </h2>
      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{body}</p>
    </div>
  );
}

function PrimaryButton({ children, loading, disabled, onClick, type = "button" }) {
  return (
    <button type={type} disabled={loading || disabled} onClick={onClick}
      className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-40 mt-2"
      style={{
        backgroundColor: GOLD, color: NAVY_900, fontFamily: "inherit",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)", border: "none",
      }}>
      {loading ? <Loader2 size={16} className="animate-spin" style={{ color: NAVY_900 }} /> : children}
    </button>
  );
}

function ErrorBanner({ msg, className = "" }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          className={`flex items-start gap-2.5 px-4 py-3 ${className}`}
          style={{ background: "rgba(155,44,44,0.10)", border: "1px solid rgba(155,44,44,0.3)", borderRadius: "1px" }} role="alert">
          <AlertCircle size={13} style={{ color: "#FF6B6B", flexShrink: 0, marginTop: 1 }} />
          <p className="text-[12px] leading-snug" style={{ color: "#FFB8B8" }}>{msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Checkbox({ checked, onChange, required, children }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer" style={{ color: "rgba(255,255,255,0.78)" }}>
      <div className="w-5 h-5 grid place-items-center flex-shrink-0 mt-0.5" style={{
        background: checked ? GOLD : "transparent",
        border: `1.5px solid ${checked ? GOLD : "rgba(255,255,255,0.3)"}`,
        borderRadius: "1px",
      }}>
        {checked && <CheckCircle2 size={11} style={{ color: NAVY_900 }} fill={NAVY_900} />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-[12.5px] leading-snug">
        {children} {required && <span style={{ color: GOLD_LIGHT }}>*</span>}
      </span>
    </label>
  );
}

function Select({ value, onChange, options, placeholder, error }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle({ error }),
          appearance: "none", paddingRight: 40, cursor: "pointer",
          color: value ? WHITE : "rgba(255,255,255,0.4)",
        }}>
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: NAVY_900, color: WHITE }}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN PAGE — orchestrates the wizard
// ═════════════════════════════════════════════════════════════════════
function VerifyContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  // Top-level state machine:
  // initialising | no-token | expired | step-password | step-profile | step-kyc | step-consents | done
  const [state, setState] = useState("initialising");
  const [user, setUser] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [consents, setConsents] = useState([]);
  const [kycDeferred, setKycDeferred] = useState(false);

  // ─── Bootstrap: figure out where we are ─────────────────────────
  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/onboarding/status", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setKycDocs(data.kycDocuments || []);
      setConsents(data.consents || []);
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    async function init() {
      // A URL token always belongs to a specific registrant.
      // Prioritise it over any existing browser session so that a previous
      // user's lingering session never hijacks a new user's registration link.
      if (tokenFromUrl !== null) {
        if (typeof tokenFromUrl !== "string" || tokenFromUrl.length < 32) {
          setState("expired");
        } else {
          setState("step-password");
        }
        return;
      }

      // No token in the URL — resume whichever onboarding step the
      // current session user is at.
      const status = await refreshStatus();
      if (status?.user) {
        if (!status.user.onboardingComplete) {
          setState("step-profile");
        } else if (!status.user.kycComplete || status.user.kycStatus === "rejected") {
          // A rejected KYC keeps kycComplete=true, so check the status too —
          // otherwise the "Resubmit" CTA would skip straight past this step.
          setState("step-kyc");
        } else if (!status.user.consentsComplete) {
          setState("step-consents");
        } else {
          window.location.href = "/dashboard";
        }
        return;
      }

      setState("no-token");
    }
    init();
  }, [tokenFromUrl, refreshStatus]);

  // ─── Step transitions ───────────────────────────────────────────
  async function handlePasswordComplete() {
    await refreshStatus();
    setState("step-profile");
  }

  async function handleProfileComplete() {
    await refreshStatus();
    setState("step-kyc");
  }

  async function handleKycComplete() {
    setKycDeferred(false);
    const status = await refreshStatus();
    // If consents are already on file (the investor deferred KYC during
    // onboarding and has now come back just to upload), there's nothing left
    // to do — drop them straight into the dashboard.
    if (status?.user?.consentsComplete) {
      window.location.href = "/dashboard";
      return;
    }
    setState("step-consents");
  }

  // Defer the document upload: record the skip server-side, then continue.
  async function handleKycSkip() {
    const res = await fetch("/api/onboarding/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
      credentials: "same-origin",
      body: JSON.stringify({ skip: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || "Failed to skip verification");
    }
    setKycDeferred(true);
    const status = await refreshStatus();
    if (status?.user?.consentsComplete) {
      window.location.href = "/dashboard";
      return;
    }
    setState("step-consents");
  }

  // ─── Back navigation ────────────────────────────────────────────
  // Refresh user data so the profile form always shows the latest saved values.
  async function handleBackToProfile() {
    await refreshStatus();
    setState("step-profile");
  }

  function handleConsentsComplete(data) {
    setState("done");
    setTimeout(() => {
      window.location.href = data?.redirectUrl || "/dashboard";
    }, 1800);
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen"
      style={{ fontFamily: "var(--font-montserrat), sans-serif", backgroundColor: NAVY_950 }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,162,74,0.10) 0%, transparent 60%), linear-gradient(180deg, ${NAVY_900} 0%, ${NAVY_950} 100%)` }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 py-12 lg:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoMark size={36} />
            <span className="font-extrabold text-[14px] tracking-[0.04em] uppercase text-white">
              Bricks<span className="mx-0.5" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 500, fontSize: "16px", color: GOLD_LIGHT }}>&amp;</span>Wealth
            </span>
          </Link>
        </div>

        {/* Initialising */}
        {state === "initialising" && (
          <div className="flex flex-col items-center text-center gap-4 py-32">
            <Loader2 size={28} className="animate-spin" style={{ color: GOLD_LIGHT }} />
            <p className="text-[12px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Loading your account...</p>
          </div>
        )}

        {/* No token */}
        {state === "no-token" && <NoTokenPanel />}

        {/* Expired */}
        {state === "expired" && <ExpiredPanel />}

        {/* Wizard steps */}
        {(state === "step-password" || state === "step-profile" || state === "step-kyc" || state === "step-consents") && (
          <>
            <ProgressRail currentStep={
              state === "step-password" ? "password" :
              state === "step-profile" ? "profile" :
              state === "step-kyc" ? "kyc" :
              "consents"
            } />

            <AnimatePresence mode="wait">
              <motion.div key={state}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}>
                {state === "step-password" && (
                  <StepPassword
                    token={tokenFromUrl}
                    onComplete={handlePasswordComplete}
                    onExpired={() => setState("expired")}
                  />
                )}
                {state === "step-profile" && user && (
                  <StepProfile user={user} onComplete={handleProfileComplete} />
                )}
                {state === "step-kyc" && (
                  <StepKyc
                    kycDocuments={kycDocs}
                    onComplete={handleKycComplete}
                    onSkip={handleKycSkip}
                    onBack={handleBackToProfile}
                  />
                )}
                {state === "step-consents" && (
                  <StepConsents
                    existingConsents={consents}
                    onComplete={handleConsentsComplete}
                    onBack={() => setState("step-kyc")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Done */}
        {state === "done" && <DonePanel kycDeferred={kycDeferred} />}
      </div>
    </main>
  );
}

function NoTokenPanel() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-12 px-6 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
      <div className="w-16 h-16 grid place-items-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
        <Mail size={28} style={{ color: GOLD_LIGHT }} />
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Check Your Email</p>
        <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
          Almost <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>there.</em>
        </h2>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          This page is for completing your registration from a link we sent to your email.
        </p>
      </div>
      <Link href="/portal" className="inline-flex items-center gap-2 px-6 py-3 text-[11.5px] font-extrabold tracking-[0.14em] uppercase"
        style={{ backgroundColor: GOLD, color: NAVY_900, borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)" }}>
        Back to Portal <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function ExpiredPanel() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState(false);

  async function handleResend(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setErrorMsg("");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12 px-6"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
      <div className="w-16 h-16 grid place-items-center" style={{ background: "rgba(155,44,44,0.12)", border: "1px solid rgba(155,44,44,0.3)", borderRadius: "1px" }}>
        <AlertCircle size={28} style={{ color: "#FF6B6B" }} />
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: "#FF6B6B" }}>Link Expired</p>
        <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
          This link is no longer <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>valid.</em>
        </h2>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          Registration links expire after 4 hours and can only be used once. Enter your email below to get a fresh link.
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleResend} className="w-full flex flex-col gap-3" noValidate>
          <div className="text-left">
            <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-2 block" style={{ color: "rgba(255,255,255,0.55)" }}>
              Your Email Address <span style={{ color: GOLD_LIGHT }}>*</span>
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email you registered with"
                style={{
                  width: "100%", height: 52,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${focused ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
                  color: WHITE, fontSize: 13, fontFamily: "inherit", fontWeight: 500,
                  padding: "0 16px 0 44px", outline: "none", borderRadius: "1px",
                }}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                autoComplete="email" required
              />
            </div>
          </div>
          {errorMsg && (
            <div className="flex items-start gap-2 px-4 py-3 text-left" style={{ background: "rgba(155,44,44,0.10)", border: "1px solid rgba(155,44,44,0.3)", borderRadius: "1px" }}>
              <AlertCircle size={13} style={{ color: "#FF6B6B", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px]" style={{ color: "#FFB8B8" }}>{errorMsg}</p>
            </div>
          )}
          <button type="submit" disabled={sending || !email.trim()}
            className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase disabled:opacity-40"
            style={{ backgroundColor: GOLD, color: NAVY_900, fontFamily: "inherit", cursor: sending || !email.trim() ? "not-allowed" : "pointer", borderRadius: "1px", border: "none", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)" }}>
            {sending ? <Loader2 size={16} className="animate-spin" style={{ color: NAVY_900 }} /> : <><Mail size={13} /> Send New Link</>}
          </button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="w-full px-5 py-4 flex items-start gap-3"
          style={{ background: "rgba(15,110,86,0.08)", border: "1px solid rgba(134,239,172,0.25)", borderRadius: "1px" }}>
          <CheckCircle2 size={16} style={{ color: "#86efac", flexShrink: 0, marginTop: 1 }} />
          <p className="text-[13px] text-left leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            If that email has a pending registration, we&apos;ve sent a fresh link. Check your inbox (and spam folder).
          </p>
        </motion.div>
      )}

      <Link href="/portal" className="text-[11px] font-bold tracking-[0.16em] uppercase"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        ← Back to Portal
      </Link>
    </div>
  );
}

function DonePanel({ kycDeferred }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-6 py-16 px-6"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="w-20 h-20 grid place-items-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
        <CheckCircle2 size={36} style={{ color: GOLD_LIGHT }} />
      </motion.div>
      <div>
        <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Account Activated</p>
        <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "36px", color: WHITE }}>
          Welcome to <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>Bricks &amp; Wealth.</em>
        </h2>
        {kycDeferred ? (
          <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Your account is live — explore your dashboard and browse opportunities now.
            When you&apos;re ready to invest, finish identity verification from the
            dashboard to unlock subscriptions.
          </p>
        ) : (
          <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Your KYC documents are under review. You can access your dashboard now while we verify them — typically within 24–72 hours.
          </p>
        )}
        <Loader2 size={20} className="animate-spin mx-auto mt-5" style={{ color: GOLD_LIGHT }} />
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: NAVY_950 }} />}>
      <VerifyContent />
    </Suspense>
  );
}