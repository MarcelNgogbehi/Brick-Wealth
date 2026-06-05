"use client";

// app/dashboard/_components/MessageAdminButton.jsx
//
// Sidebar entry that lets an investor send a quick message to the admin
// team. Posts to /api/dashboard/assistance, which immediately creates a
// notification for every admin — so it "drops in" on the admin bell.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, X, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

const C = {
  ink: "#0B1220",
  secondary: "#4A5468",
  muted: "#8A93A6",
  gold: "#C9A24A",
  goldDark: "#9A7A2E",
  goldLight: "#F8F3E5",
  border: "rgba(6,14,28,0.10)",
  borderSoft: "rgba(6,14,28,0.07)",
  surface: "#FFFFFF",
  dark: "#060E1C",
  success: "#0F6E56",
  successBg: "#E8F4F0",
  danger: "#9B2C2C",
  dangerBg: "#FBEAEA",
};

const PURPOSES = [
  "General Enquiry", "Investment Query", "Document Request",
  "Technical Issue", "Feedback", "Complaint", "Other",
];

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function MessageAdminButton({
  text = "Message Admin",
  iconColor = "rgba(255,255,255,0.55)",
  textColor = "rgba(255,255,255,0.74)",
  hoverBg = "rgba(255,255,255,0.045)",
}) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [urgency, setUrgency] = useState("normal");
  const [message, setMessage] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [err, setErr] = useState("");

  // Lock body scroll while the composer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    // reset after the exit animation
    setTimeout(() => { setState("idle"); setErr(""); setMessage(""); setUrgency("normal"); setPurpose(PURPOSES[0]); }, 250);
  }

  async function send(e) {
    e.preventDefault();
    if (message.trim().length < 10) { setErr("Please add a little more detail (min 10 characters)."); return; }
    setState("sending"); setErr("");
    try {
      const res = await fetch("/api/dashboard/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ purpose, urgency, message: message.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) { setState("done"); }
      else { setErr(d.message || "Something went wrong. Please try again."); setState("error"); }
    } catch (e2) { setErr(e2.message || "Network error."); setState("error"); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
        style={{ color: textColor, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <MessageSquare size={15} strokeWidth={1.75} style={{ color: iconColor, flexShrink: 0 }} />
        <span className="flex-1 leading-none text-left">{text}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(6,14,28,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden"
              style={{ backgroundColor: C.surface, borderRadius: 20, boxShadow: "0 24px 64px rgba(6,14,28,0.28)" }}
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.2, 0.65, 0.3, 0.9] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="grid place-items-center" style={{ width: 34, height: 34, borderRadius: 10, background: C.goldLight }}>
                    <MessageSquare size={16} style={{ color: C.goldDark }} />
                  </div>
                  <div>
                    <p className="text-[14.5px] font-bold leading-tight" style={{ color: C.ink }}>Message the team</p>
                    <p className="text-[11.5px]" style={{ color: C.muted }}>We typically reply within 1 business day.</p>
                  </div>
                </div>
                <button type="button" onClick={close} className="p-1.5 rounded-lg"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted }}>
                  <X size={17} />
                </button>
              </div>

              {state === "done" ? (
                <div className="px-5 py-9 text-center">
                  <div className="grid place-items-center mx-auto mb-3" style={{ width: 50, height: 50, borderRadius: 14, background: C.successBg }}>
                    <CheckCircle2 size={24} style={{ color: C.success }} />
                  </div>
                  <p className="text-[15.5px] font-bold mb-1" style={{ color: C.ink }}>Message sent</p>
                  <p className="text-[12.5px] max-w-xs mx-auto mb-5" style={{ color: C.secondary, lineHeight: 1.55 }}>
                    Our team has been notified and will get back to you shortly. A confirmation is in your notifications.
                  </p>
                  <button type="button" onClick={close}
                    className="px-5 py-2.5 rounded-xl text-[12.5px] font-bold"
                    style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={send} className="px-5 py-4 space-y-3.5">
                  {/* Purpose */}
                  <div>
                    <label className="text-[10.5px] font-bold tracking-[0.08em] uppercase block mb-1.5" style={{ color: C.muted }}>Topic</label>
                    <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
                      className="w-full text-[13px] outline-none"
                      style={{ padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, backgroundColor: "#FAFAFB", appearance: "none" }}>
                      {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Urgency */}
                  <div className="flex gap-2.5">
                    {[["normal", "Normal"], ["urgent", "Urgent"]].map(([val, lbl]) => {
                      const on = urgency === val;
                      const urgent = val === "urgent";
                      return (
                        <button key={val} type="button" onClick={() => setUrgency(val)}
                          className="flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all"
                          style={{
                            backgroundColor: on ? (urgent ? C.dangerBg : C.dark) : "transparent",
                            color: on ? (urgent ? C.danger : "#fff") : C.secondary,
                            border: `1px solid ${on ? (urgent ? C.danger : C.dark) : C.border}`,
                            cursor: "pointer",
                          }}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-[10.5px] font-bold tracking-[0.08em] uppercase block mb-1.5" style={{ color: C.muted }}>Your message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} autoFocus
                      placeholder="How can we help?"
                      className="w-full text-[13px] outline-none resize-none"
                      style={{ padding: "11px 12px", border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, backgroundColor: "#FAFAFB", lineHeight: 1.55 }} />
                    <p className="text-[10.5px] mt-1 text-right" style={{ color: message.length > 1900 ? C.danger : C.muted }}>{message.length}/2000</p>
                  </div>

                  {(state === "error" || err) && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-[12px]" style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                      <AlertCircle size={13} /> {err || "Something went wrong."}
                    </div>
                  )}

                  <button type="submit" disabled={state === "sending"}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-bold disabled:opacity-60"
                    style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: state === "sending" ? "wait" : "pointer" }}>
                    {state === "sending" ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Send size={13} /> Send message</>}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
