"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RegisterInterestProvider + useRegisterInterest()
//
// A single global "Register Interest" modal mounted once at the app root. Any
// CTA across the marketing site opens it with:
//
//   const { open } = useRegisterInterest();
//   <button onClick={() => open("hero")}>Register Interest</button>
//
// The `source` string is stored on the Lead so the team can see which surface
// converted. Falls back gracefully — components can also link to the full-page
// /register-interest route if they're outside the provider.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import RegisterInterestForm from "@/components/RegisterInterestForm";

const NAVY_950 = "#06142F";
const GOLD_LIGHT = "#D9B560";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-montserrat), 'Montserrat', sans-serif";

const RegisterInterestContext = createContext(null);

export function useRegisterInterest() {
  const ctx = useContext(RegisterInterestContext);
  // Safe no-op fallback so a stray caller never crashes the page.
  if (!ctx) return { open: () => {}, close: () => {} };
  return ctx;
}

export function RegisterInterestProvider({ children }) {
  const [state, setState] = useState({ open: false, source: "website" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const open = useCallback((source = "website") => {
    setState({ open: true, source: typeof source === "string" ? source : "website" });
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!state.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open, close]);

  return (
    <RegisterInterestContext.Provider value={{ open, close }}>
      {children}
      {mounted && state.open
        ? createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Register your interest"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0"
                style={{ background: "rgba(6,20,47,0.62)", backdropFilter: "blur(6px)" }}
                onClick={close}
                aria-hidden="true"
              />

              {/* Card */}
              <div
                className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto no-scrollbar"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  boxShadow: "0 40px 80px -20px rgba(6,20,47,0.55)",
                  border: "1px solid rgba(201,162,74,0.25)",
                }}
              >
                {/* Navy header */}
                <div
                  className="relative px-7 pt-7 pb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NAVY_950} 0%, #0A1F44 100%)`,
                    borderBottom: "2px solid #C9A24A",
                  }}
                >
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute top-4 right-4 flex items-center justify-center transition-colors"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    <X size={17} />
                  </button>

                  <span
                    className="block mb-2 text-[10.5px] font-bold tracking-[0.28em] uppercase"
                    style={{ color: GOLD_LIGHT, fontFamily: SANS }}
                  >
                    Private · Invitation Only
                  </span>
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: 30,
                      lineHeight: 1.1,
                      color: "#fff",
                    }}
                  >
                    Register Your Interest
                  </h2>
                  <p
                    className="mt-2 max-w-sm"
                    style={{
                      fontFamily: SANS,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Tell us where to reach you and our investor team will be in touch with
                    next steps.
                  </p>
                </div>

                {/* Form body */}
                <div className="px-7 py-7">
                  <RegisterInterestForm source={state.source} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </RegisterInterestContext.Provider>
  );
}
