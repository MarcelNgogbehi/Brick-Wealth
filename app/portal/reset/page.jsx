"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Loader2, KeyRound, Clock, Mail,
} from "lucide-react";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const GOLD_DARK = "#9A7A2E";
const GOLD_DIM = "rgba(201,162,74,0.10)";
const GOLD_BORD = "rgba(201,162,74,0.28)";
const WHITE = "#FFFFFF";
const RED = "#9B2C2C";
const GREEN = "#0F6E56";

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

function StatusPanel({ icon: Icon, iconBg, iconBorder, iconColor, eyebrow, eyebrowColor, headline, headlineAccent, body, children }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-12 px-6 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px", boxShadow: "0 24px 60px -16px rgba(0,0,0,0.4)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(201,162,74,0.08) 0%, transparent 60%)" }} />
      <div className="w-16 h-16 grid place-items-center relative" style={{ background: iconBg, border: `1px solid ${iconBorder}`, borderRadius: "1px" }}>
        <Icon size={28} style={{ color: iconColor }} />
      </div>
      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: eyebrowColor }}>{eyebrow}</p>
        <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
          {headline} <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>{headlineAccent}</em>
        </h2>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  // States: validating | no-token | expired | form | loading | success | error
  const [state, setState] = useState("validating");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (tokenFromUrl === null) {
      setState("no-token");
      return;
    }
    if (typeof tokenFromUrl !== "string" || tokenFromUrl.length < 32) {
      setState("expired");
      setErrorMsg("This link looks invalid. Please request a fresh one.");
      return;
    }
    setToken(tokenFromUrl);
    setState("form");
  }, [tokenFromUrl]);

  function validate() {
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      errs.password = "Use uppercase + lowercase + at least one number";
    }
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords don't match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) {
      setState("error");
      setErrorMsg("Please correct the errors above");
      setTimeout(() => setState("form"), 3500);
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && data?.message?.toLowerCase().match(/expired|invalid/)) {
          setState("expired");
          setErrorMsg(data.message);
          return;
        }
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setErrorMsg(data?.message || "Reset failed. Please try again.");
        setState("error");
        setTimeout(() => setState("form"), 4500);
        return;
      }
      setState("success");
      setTimeout(() => {
        window.location.href = data?.redirectUrl || "/dashboard";
      }, 1800);
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setState("error");
      setTimeout(() => setState("form"), 4500);
    }
  }

  const inputStyle = (field, hasError) => ({
    width: "100%", height: 52,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "rgba(155,44,44,0.5)" : focused === field ? GOLD_BORD : "rgba(255,255,255,0.1)"}`,
    color: WHITE, fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    padding: "0 16px", paddingLeft: 44, paddingRight: 48, outline: "none",
    transition: "all 0.2s", borderRadius: "1px",
  });

  // ─── Validating ────────────────────────────────────────────────────
  if (state === "validating") {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-20" aria-live="polite">
        <Loader2 size={28} className="animate-spin" style={{ color: GOLD_LIGHT }} />
        <p className="text-[12px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
          Loading...
        </p>
      </div>
    );
  }

  // ─── No token: user landed here directly ───────────────────────────
  if (state === "no-token") {
    return (
      <StatusPanel
        icon={Mail}
        iconBg={GOLD_DIM} iconBorder={GOLD_BORD} iconColor={GOLD_LIGHT}
        eyebrow="Check Your Email"
        eyebrowColor={GOLD_LIGHT}
        headline="Use the link in"
        headlineAccent="your inbox."
        body="This page is for resetting your password from a link we sent to your email. Open your inbox and click the reset link to continue."
      >
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/portal" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200"
            style={{ backgroundColor: GOLD, color: NAVY_900, borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)" }}>
            Request Reset Link <ArrowRight size={12} />
          </Link>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Remembered your password?{" "}
            <Link href="/portal" className="underline" style={{ color: GOLD_LIGHT }}>
              Sign in
            </Link>
          </p>
        </div>
      </StatusPanel>
    );
  }

  // ─── Expired / invalid token ────────────────────────────────────────
  if (state === "expired") {
    return (
      <StatusPanel
        icon={AlertCircle}
        iconBg="rgba(155,44,44,0.12)" iconBorder="rgba(155,44,44,0.3)" iconColor="#FF6B6B"
        eyebrow="Link Expired"
        eyebrowColor="#FF6B6B"
        headline="This reset link has"
        headlineAccent="expired."
        body={errorMsg || "Reset links expire after 4 hours for security. Please request a fresh link."}
      >
        <Link href="/portal" className="inline-flex items-center gap-2 px-6 py-3 text-[11.5px] font-extrabold tracking-[0.14em] uppercase"
          style={{ backgroundColor: GOLD, color: NAVY_900, borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)" }}>
          Request New Link <ArrowRight size={12} />
        </Link>
      </StatusPanel>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center gap-6 py-16 px-6 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-16 h-16 grid place-items-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
          <CheckCircle2 size={28} style={{ color: GOLD_LIGHT }} />
        </motion.div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.32em] uppercase mb-3" style={{ color: GOLD_LIGHT }}>Password Reset</p>
          <h2 className="leading-tight mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "30px", color: WHITE }}>
            All <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>set.</em>
          </h2>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Your password has been updated. Redirecting you...
          </p>
          <Loader2 size={20} className="animate-spin mx-auto mt-4" style={{ color: GOLD_LIGHT }} />
        </div>
      </motion.div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-px" style={{ backgroundColor: GOLD_LIGHT }} />
          <KeyRound size={11} style={{ color: GOLD_LIGHT }} />
          <span className="text-[10.5px] font-bold tracking-[0.32em] uppercase" style={{ color: GOLD_LIGHT }}>Reset Password</span>
        </div>
        <h2 className="leading-[0.96] mb-3" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(36px, 4vw, 48px)", letterSpacing: "-0.018em", color: WHITE }}>
          Choose a new <em style={{ color: GOLD_LIGHT, fontWeight: 400 }}>password.</em>
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          For your security, you&apos;ll be signed out from all devices and need to sign in again with your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            New Password <span style={{ color: GOLD_LIGHT }}>*</span>
          </label>
          <div className="relative">
            <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Choose a strong password" style={inputStyle("password", !!fieldErrors.password)}
              onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.4)", background: "transparent", border: "none", cursor: "pointer" }}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <PasswordStrengthMeter password={password} />
          {fieldErrors.password && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}>
              <AlertCircle size={11} /> {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10.5px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            Confirm Password <span style={{ color: GOLD_LIGHT }}>*</span>
          </label>
          <div className="relative">
            <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input type={showPassword ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter your password" style={inputStyle("confirm", !!fieldErrors.confirm)}
              onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)} autoComplete="new-password" />
          </div>
          {fieldErrors.confirm && (
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#FFB8B8" }}>
              <AlertCircle size={11} /> {fieldErrors.confirm}
            </p>
          )}
        </div>

        <AnimatePresence>
          {state === "error" && errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 px-4 py-3" style={{ background: "rgba(155,44,44,0.10)", border: "1px solid rgba(155,44,44,0.3)", borderRadius: "1px" }} role="alert">
              <AlertCircle size={13} style={{ color: "#FF6B6B", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px] leading-snug" style={{ color: "#FFB8B8" }}>{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 px-4 py-3" style={{ background: "rgba(201,162,74,0.06)", border: `1px solid ${GOLD_BORD}`, borderRadius: "1px" }}>
          <Clock size={11} style={{ color: GOLD_LIGHT }} />
          <p className="text-[11px] font-medium" style={{ color: GOLD_LIGHT }}>
            Single-use link · all sessions will be signed out
          </p>
        </div>

        <button type="submit" disabled={state === "loading"} className="w-full h-[54px] flex items-center justify-center gap-2.5 text-[12px] font-extrabold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-60 mt-2"
          style={{ backgroundColor: GOLD, color: NAVY_900, fontFamily: "inherit", cursor: state === "loading" ? "not-allowed" : "pointer", borderRadius: "1px", boxShadow: "0 12px 28px -10px rgba(201,162,74,0.55)", border: "none" }}>
          {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : (<>Reset Password <ArrowRight size={12} /></>)}
        </button>
      </form>
    </div>
  );
}

function ResetContent() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{ fontFamily: "var(--font-montserrat), sans-serif", backgroundColor: NAVY_950 }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,162,74,0.12) 0%, transparent 60%), linear-gradient(180deg, ${NAVY_900} 0%, ${NAVY_950} 100%)` }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/portal" className="inline-flex items-center gap-2 mb-8 text-[10.5px] font-bold tracking-[0.16em] uppercase transition-colors"
          style={{ color: "rgba(255,255,255,0.6)" }}>
          <ArrowLeft size={11} /> Back to Portal
        </Link>
        <ResetForm />
      </div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: NAVY_950 }} />}>
      <ResetContent />
    </Suspense>
  );
}