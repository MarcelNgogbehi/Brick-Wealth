"use client";

// components/ConfirmDialog.jsx
//
// A single, app-wide replacement for the ugly native window.confirm() /
// window.alert() browser dialogs. Renders a premium, centered, navy+gold
// modal and resolves a Promise — so call sites stay almost identical:
//
//   const { confirm, alert } = useDialog();
//   if (!(await confirm("Cancel this subscription? This cannot be undone."))) return;
//   await alert("Export failed");
//
// You can also pass an options object for full control:
//
//   const ok = await confirm({
//     title: "Cancel subscription",
//     message: "This releases your reserved allocation and cannot be undone.",
//     confirmLabel: "Yes, cancel it",
//     cancelLabel: "Keep it",
//     tone: "danger",            // danger | warning | info | success
//   });
//
// Mounted once at the root (see app/layout.js) so it's available everywhere.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, CheckCircle2, Trash2 } from "lucide-react";

// ─── Design tokens (match the platform's navy + gold system) ──────────────────
const NAVY = "#0A1F44";
const INK = "#0B1422";
const SECONDARY = "#4B5768";
const SURFACE = "#FFFFFF";

const TONES = {
  danger: {
    accent: "#9B2C2C",
    accentDeep: "#7A2222",
    soft: "rgba(155,44,44,0.10)",
    ring: "rgba(155,44,44,0.22)",
    Icon: AlertTriangle,
    confirmText: "#FFFFFF",
  },
  warning: {
    accent: "#B8860B",
    accentDeep: "#8A6608",
    soft: "rgba(184,134,11,0.12)",
    ring: "rgba(184,134,11,0.24)",
    Icon: AlertTriangle,
    confirmText: "#0B1422",
  },
  success: {
    accent: "#0F6E56",
    accentDeep: "#0A5742",
    soft: "rgba(15,110,86,0.10)",
    ring: "rgba(15,110,86,0.22)",
    Icon: CheckCircle2,
    confirmText: "#FFFFFF",
  },
  info: {
    accent: "#0A1F44",
    accentDeep: "#06142F",
    soft: "rgba(10,31,68,0.08)",
    ring: "rgba(10,31,68,0.18)",
    Icon: Info,
    confirmText: "#FFFFFF",
  },
};

const DialogContext = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog() must be used inside <DialogProvider>");
  }
  return ctx;
}

// Accept either a plain string ("are you sure?") or a full options object.
function normalize(input) {
  if (typeof input === "string") return { message: input };
  return input || {};
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [mounted, setMounted] = useState(false);
  const resolverRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const settle = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback((input) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = normalize(input);
      setDialog({
        kind: "confirm",
        tone: opts.tone || "danger",
        title: opts.title || "Are you sure?",
        message: opts.message || "",
        confirmLabel: opts.confirmLabel || "Confirm",
        cancelLabel: opts.cancelLabel || "Cancel",
      });
    });
  }, []);

  const alert = useCallback((input) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = normalize(input);
      setDialog({
        kind: "alert",
        tone: opts.tone || "info",
        title: opts.title || "Notice",
        message: opts.message || "",
        confirmLabel: opts.confirmLabel || "OK",
      });
    });
  }, []);

  // Resolves to the entered string, or null if cancelled.
  const prompt = useCallback((input) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const opts = normalize(input);
      setDialog({
        kind: "prompt",
        tone: opts.tone || "info",
        title: opts.title || "Enter a value",
        message: opts.message || "",
        confirmLabel: opts.confirmLabel || "Submit",
        cancelLabel: opts.cancelLabel || "Cancel",
        placeholder: opts.placeholder || "",
        defaultValue: opts.defaultValue || "",
        required: !!opts.required,
        multiline: !!opts.multiline,
      });
    });
  }, []);

  const onConfirm = useCallback(
    (value) => {
      if (dialog?.kind === "confirm") settle(true);
      else if (dialog?.kind === "prompt") settle(value ?? "");
      else settle(undefined);
    },
    [dialog, settle]
  );

  const onCancel = useCallback(() => {
    if (dialog?.kind === "confirm") settle(false);
    else if (dialog?.kind === "prompt") settle(null);
    else settle(undefined);
  }, [dialog, settle]);

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {mounted &&
        createPortal(
          <DialogRoot dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />,
          document.body
        )}
    </DialogContext.Provider>
  );
}

function DialogRoot({ dialog, onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const inputRef = useRef(null);
  const isConfirm = dialog?.kind === "confirm";
  const isPrompt = dialog?.kind === "prompt";
  const hasCancel = isConfirm || isPrompt;
  const tone = TONES[dialog?.tone] || TONES.info;
  const ToneIcon = dialog?.tone === "danger" && isConfirm ? Trash2 : tone.Icon;

  // Local state for the prompt's text input. Re-initialised whenever a new
  // dialog opens (keyed on the dialog object identity).
  const [value, setValue] = useState("");
  useEffect(() => {
    if (dialog?.kind === "prompt") setValue(dialog.defaultValue || "");
  }, [dialog]);

  const submitDisabled = isPrompt && dialog?.required && !value.trim();
  const doConfirm = () => {
    if (submitDisabled) return;
    onConfirm(isPrompt ? value : undefined);
  };

  // Lock background scroll while open.
  useEffect(() => {
    if (!dialog) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dialog]);

  // On open, focus the input (prompt) or the safest button (Cancel for
  // destructive confirms, Confirm otherwise).
  useEffect(() => {
    if (!dialog) return;
    const t = setTimeout(() => {
      if (isPrompt) {
        inputRef.current?.focus();
        inputRef.current?.select?.();
        return;
      }
      const target =
        isConfirm && dialog.tone === "danger"
          ? cancelBtnRef.current
          : confirmBtnRef.current;
      target?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [dialog, isConfirm, isPrompt]);

  useEffect(() => {
    if (!dialog) return;
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        // In a multiline prompt, Enter inserts a newline — don't submit.
        if (isPrompt && dialog.multiline) return;
        e.preventDefault();
        doConfirm();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, onCancel, isPrompt, value, submitDisabled]);

  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            background: "rgba(6,16,34,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
          role="presentation"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bw-dialog-title"
            aria-describedby="bw-dialog-message"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-[420px] overflow-hidden"
            style={{
              background: SURFACE,
              borderRadius: "4px",
              border: "1px solid rgba(11,20,34,0.08)",
              boxShadow:
                "0 30px 70px -20px rgba(6,16,34,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Top accent bar in the tone colour */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${tone.accent}, ${tone.accentDeep})`,
              }}
            />

            <div className="px-7 pt-7 pb-6 flex flex-col items-center text-center">
              {/* Icon badge */}
              <motion.div
                initial={{ scale: 0, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.05 }}
                className="grid place-items-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: tone.soft,
                  border: `1px solid ${tone.ring}`,
                  marginBottom: 18,
                }}
              >
                <ToneIcon size={26} style={{ color: tone.accent }} strokeWidth={2} />
              </motion.div>

              {/* Title — serif, premium */}
              <h2
                id="bw-dialog-title"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontWeight: 600,
                  fontSize: 25,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: INK,
                  marginBottom: 8,
                }}
              >
                {dialog.title}
              </h2>

              {/* Message */}
              {dialog.message && (
                <p
                  id="bw-dialog-message"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: SECONDARY,
                    maxWidth: 340,
                  }}
                >
                  {dialog.message}
                </p>
              )}

              {/* Prompt input */}
              {isPrompt && (
                <div className="w-full mt-5 text-left">
                  {dialog.multiline ? (
                    <textarea
                      ref={inputRef}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={dialog.placeholder}
                      rows={4}
                      className="w-full px-3.5 py-3 text-[13.5px] outline-none resize-y"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(11,20,34,0.16)",
                        borderRadius: "3px",
                        color: INK,
                        fontFamily: "inherit",
                        lineHeight: 1.5,
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = tone.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(11,20,34,0.16)")}
                    />
                  ) : (
                    <input
                      ref={inputRef}
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={dialog.placeholder}
                      className="w-full h-12 px-3.5 text-[13.5px] outline-none"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(11,20,34,0.16)",
                        borderRadius: "3px",
                        color: INK,
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = tone.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(11,20,34,0.16)")}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              className="px-7 pb-7 pt-1 flex gap-3"
              style={{ flexDirection: hasCancel ? "row" : "row-reverse" }}
            >
              {hasCancel && (
                <button
                  ref={cancelBtnRef}
                  type="button"
                  onClick={onCancel}
                  className="flex-1 h-12 text-[12px] font-bold tracking-[0.08em] uppercase transition-all duration-150 outline-none"
                  style={{
                    background: "transparent",
                    color: SECONDARY,
                    border: "1px solid rgba(11,20,34,0.16)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(11,20,34,0.04)";
                    e.currentTarget.style.color = INK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = SECONDARY;
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY}1f`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  {dialog.cancelLabel}
                </button>
              )}

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={doConfirm}
                disabled={submitDisabled}
                className="flex-1 h-12 text-[12px] font-bold tracking-[0.08em] uppercase transition-all duration-150 outline-none"
                style={{
                  background: `linear-gradient(180deg, ${tone.accent}, ${tone.accentDeep})`,
                  color: tone.confirmText,
                  border: "none",
                  borderRadius: "3px",
                  cursor: submitDisabled ? "not-allowed" : "pointer",
                  opacity: submitDisabled ? 0.5 : 1,
                  fontFamily: "inherit",
                  boxShadow: `0 10px 22px -10px ${tone.ring}`,
                }}
                onMouseEnter={(e) => { if (!submitDisabled) e.currentTarget.style.filter = "brightness(1.06)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${tone.ring}, 0 10px 22px -10px ${tone.ring}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = `0 10px 22px -10px ${tone.ring}`)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
