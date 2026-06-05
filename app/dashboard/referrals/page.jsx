"use client";

// app/dashboard/referrals/page.jsx — Referral Dashboard
// Layout mirrors the "Subscription & Referrals" mockup, styled in Bricks & Wealth navy/gold/green.
// Recognition-only: no monetary payouts; tier system is based on referral count.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardSearch } from "../_components/search-context";
import {
  Loader2, Copy, Check, Users, UserPlus, Share2, RefreshCw,
  Clock, CheckCircle2, AlertCircle, Info,
  TrendingUp, Mail, Award,
  Shield, Network, ChevronRight, Gem, Trophy,
} from "lucide-react";

// ─── Brand tokens ──────────────────────────────────────────────────────────
const NAVY    = "#0A1F44";
const NAVY_D  = "#06142F";
const GOLD    = "#C9A24A";
const GOLD_L  = "#D9B560";
const GOLD_DIM = "rgba(201,162,74,0.13)";
const GOLD_BRD = "rgba(201,162,74,0.28)";
const CREAM   = "#F8F4EC";
const INK     = "#0B1220";
const T2      = "#4A5468";
const TMUTED  = "#8A93A6";
const SUCCESS = "#0A6E4F";
const S_BG    = "rgba(10,110,79,0.10)";
const WARN    = "#92680A";
const W_BG    = "#FBF5E1";
const DANGER  = "#9B2C2C";
const D_BG    = "#FBEAEA";
const BORDER  = "#E4E4E7";
const SURFACE = "#FFFFFF";
const PAGE_BG = "#F7F8FA";

const SERIF = "var(--font-cormorant), Georgia, serif";
const SANS  = "var(--font-montserrat), sans-serif";

// ─── Tier ladder ───────────────────────────────────────────────────────────
const TIERS = [
  { id: "standard", name: "Standard", min: 0,  max: 4,        color: TMUTED,    Icon: Shield  },
  { id: "gold",     name: "Gold",     min: 5,  max: 14,       color: GOLD,      Icon: Trophy  },
  { id: "platinum", name: "Platinum", min: 15, max: Infinity, color: "#7B91B0", Icon: Gem     },
];

function getTier(total) {
  return TIERS.find((t) => total >= t.min && total <= t.max) ?? TIERS[0];
}
function getNextTier(total) {
  const idx = TIERS.findIndex((t) => total >= t.min && total <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

// ─── Status badge config ──────────────────────────────────────────────────
const STATUS_META = {
  PENDING_APPROVAL: { label: "Pending",  bg: W_BG,      fg: WARN    },
  APPROVED:         { label: "Joined",   bg: "#E8EEF7", fg: "#3A5874" },
  ACTIVATED:        { label: "Active",   bg: S_BG,      fg: SUCCESS },
  DECLINED:         { label: "Declined", bg: D_BG,      fg: DANGER   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function csrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] ?? "?").toUpperCase();
}

const PAGE_SIZE = 5;

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ReferralsPage() {
  const [data,       setData]       = useState(null);
  const [tree,       setTree]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [err,        setErr]        = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [tablePage,  setTablePage]  = useState(1);
  const [rotating,   setRotating]   = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [showTree,   setShowTree]   = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link   = data?.code ? `${origin}/portal?ref=${data.code.code}` : "";

  // ── fetch ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [oRes, tRes] = await Promise.all([
        fetch("/api/dashboard/referrals",        { credentials: "same-origin" }),
        fetch("/api/dashboard/referrals?tree=1", { credentials: "same-origin" }),
      ]);
      const [oD, tD] = await Promise.all([oRes.json(), tRes.json()]);
      if (oD.success) setData(oD);
      else setErr(oD.message || "Failed to load");
      if (tD.success) setTree(tD.tree || []);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── copy link ────────────────────────────────────────────────────────────
  async function copyLink() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); } catch { /* silent */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  // ── mailto invite ────────────────────────────────────────────────────────
  function sendInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim() || !link) return;
    const sub  = encodeURIComponent("You're invited to invest with Bricks & Wealth");
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to invite you to join Bricks & Wealth — fractional property investment.\n\nApply here:\n${link}\n\nBest regards`
    );
    window.location.href = `mailto:${inviteEmail.trim()}?subject=${sub}&body=${body}`;
    setInviteEmail("");
  }

  // ── native share ─────────────────────────────────────────────────────────
  async function shareLink() {
    if (!link) return;
    if (navigator.share) {
      try { await navigator.share({ title: "Bricks & Wealth", url: link }); } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  }

  // ── rotate code ──────────────────────────────────────────────────────────
  async function rotate() {
    setRotating(true);
    try {
      const res = await fetch("/api/dashboard/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf() },
        credentials: "same-origin",
        body: JSON.stringify({ action: "rotate" }),
      });
      const d = await res.json();
      if (d.success) { setShowRotate(false); load(); }
      else setErr(d.message || "Could not rotate");
    } catch (e) { setErr(e.message); }
    setRotating(false);
  }

  // ── derived stats ────────────────────────────────────────────────────────
  const counts   = data?.counts ?? { total: 0, pending: 0, approved: 0, activated: 0, declined: 0 };
  const joined   = counts.approved + counts.activated;
  const convRate = counts.total > 0
    ? ((counts.activated / counts.total) * 100).toFixed(1)
    : "0.0";

  const tier   = getTier(counts.total);
  const nTier  = getNextTier(counts.total);
  const toNext = nTier ? nTier.min - counts.total : 0;
  const tierPct = nTier
    ? Math.round(((counts.total - tier.min) / (nTier.min - tier.min)) * 100)
    : 100;

  // ── pagination (scoped by the topbar search) ──────────────────────────────
  const { query } = useDashboardSearch();
  const allReferrals = data?.referrals ?? [];
  const referrals = query.trim()
    ? allReferrals.filter((r) => (r.displayName || "").toLowerCase().includes(query.trim().toLowerCase()))
    : allReferrals;
  const totalPages = Math.max(1, Math.ceil(referrals.length / PAGE_SIZE));
  const safePage   = Math.min(tablePage, totalPages);
  const paged      = referrals.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── CSV download ─────────────────────────────────────────────────────────
  function downloadCsv() {
    const rows = [["Name", "Status", "Date Referred"]];
    referrals.forEach((r) => rows.push([r.displayName, r.status, fmtDate(r.registeredAt)]));
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "referrals.csv";
    a.click();
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ backgroundColor: PAGE_BG, minHeight: "100%", fontFamily: SANS }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-16">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1
              className="text-[24px] sm:text-[28px] font-bold leading-tight"
              style={{ fontFamily: SERIF, color: INK }}
            >
              Subscription &amp; Referrals
            </h1>
            <p className="text-[13px] mt-1" style={{ color: T2, lineHeight: 1.6 }}>
              Manage your institutional access and referral network.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-[9px] flex-shrink-0"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: TMUTED }}>
              Current Status
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ color: tier.color }}>
              <tier.Icon size={13} style={{ color: tier.color }} />
              {tier.name} Partner
            </span>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-[9px]"
              style={{ backgroundColor: D_BG, border: "1px solid rgba(155,44,44,0.2)" }}
            >
              <AlertCircle size={14} style={{ color: DANGER, flexShrink: 0 }} />
              <p className="text-[12.5px]" style={{ color: DANGER }}>{err}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════════════════
            ROW 1 — Road to next tier  |  Stat cards
        ═════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-5">

          {/* Road to <next tier> hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="relative overflow-hidden p-6 sm:p-7 flex flex-col justify-between gap-6"
            style={{
              background: `linear-gradient(135deg, #061530 0%, #020810 100%)`,
              borderRadius: "16px",
              minHeight: 230,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Top: title + completion badge */}
            <div className="flex items-start justify-between gap-4 relative">
              <div className="max-w-[78%]">
                <p className="text-[17px] sm:text-[19px] font-bold mb-1.5" style={{ color: SURFACE, fontFamily: SERIF }}>
                  {nTier ? `Road to ${nTier.name}` : "Platinum Member"}
                </p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {nTier
                    ? "Unlock zero-fee investing and concierge support by reaching Platinum status."
                    : "You've reached our highest recognition tier — enjoy zero-fee investing and dedicated concierge support."}
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
                style={{ backgroundColor: GOLD_DIM, borderRadius: "8px" }}
              >
                <CheckCircle2 size={13} style={{ color: GOLD_L }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.04em]" style={{ color: GOLD_L }}>
                  {tierPct}% Complete
                </span>
              </div>
            </div>

            {/* Progress block */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Current Referrals: <span style={{ color: CREAM }}>{counts.total}</span>
                </span>
                {nTier && (
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Target: <span style={{ color: CREAM }}>{nTier.min}</span>
                  </span>
                )}
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${tierPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_L})` }}
                />
              </div>

              {/* Avatars + flavour + actions */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="grid place-items-center rounded-full"
                      style={{
                        width: 26, height: 26,
                        marginLeft: i === 0 ? 0 : -8,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        border: "1.5px solid #061530",
                      }}
                    >
                      <Users size={11} style={{ color: "rgba(255,255,255,0.7)" }} />
                    </div>
                  ))}
                  <div
                    className="grid place-items-center rounded-full text-[9.5px] font-bold"
                    style={{
                      width: 26, height: 26, marginLeft: -8,
                      backgroundColor: GOLD_DIM, color: GOLD_L,
                      border: "1.5px solid #061530",
                    }}
                  >
                    +{Math.max(0, counts.total)}
                  </div>
                </div>
                <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {nTier
                    ? `${toNext} more ${toNext === 1 ? "introduction" : "introductions"} to ${nTier.name}.`
                    : "You're part of our exclusive Platinum network."}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-5">
                <button
                  type="button"
                  className="px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.05em] rounded-lg transition-opacity"
                  style={{ backgroundColor: GOLD, color: NAVY_D, border: "none", cursor: "pointer", fontFamily: SANS }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  View Benefits
                </button>
                <button
                  type="button"
                  onClick={() => setShowTree((v) => !v)}
                  className="px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.05em] rounded-lg transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    color: CREAM,
                    border: "1px solid rgba(255,255,255,0.22)",
                    cursor: "pointer",
                    fontFamily: SANS,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Tier History
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stat cards (stacked) */}
          <div className="grid grid-cols-1 gap-5">
            <StatCard
              Icon={UserPlus}
              iconColor={NAVY}
              iconBg="#EAF0FA"
              label="Total Invites"
              value={counts.total}
              footnote={`${joined} joined so far`}
            />
            <StatCard
              Icon={TrendingUp}
              iconColor={SUCCESS}
              iconBg={S_BG}
              label="Conversions"
              value={counts.activated}
              footnote={`${convRate}% success rate`}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 2 — Invite New Investors
        ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="p-5 sm:p-6 mb-5"
          style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}
        >
          <p className="text-[15px] font-bold mb-1" style={{ color: INK }}>Invite New Investors</p>
          <p className="text-[12.5px] mb-5" style={{ color: T2, lineHeight: 1.6 }}>
            Share your exclusive partner link with your network. Every introduction is reviewed by our team and adds to your recognition tier.
          </p>

          {/* Link row + share actions */}
          <div className="flex items-stretch gap-2.5 flex-wrap">
            <div
              className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 h-12"
              style={{ backgroundColor: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: "10px" }}
            >
              <Share2 size={14} style={{ color: TMUTED, flexShrink: 0 }} />
              <span className="text-[12.5px] truncate" style={{ color: T2 }}>{link || "—"}</span>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 px-5 h-12 text-[12px] font-bold uppercase tracking-[0.04em] rounded-[10px] transition-all whitespace-nowrap"
              style={{ backgroundColor: copied ? SUCCESS : INK, color: SURFACE, border: "none", cursor: "pointer", fontFamily: SANS }}
            >
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("invite-email-input")?.focus()}
              title="Invite via email"
              className="grid place-items-center h-12 w-12 rounded-[10px] transition-colors flex-shrink-0"
              style={{ backgroundColor: PAGE_BG, border: `1px solid ${BORDER}`, color: T2, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD_BRD)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
            >
              <Mail size={15} />
            </button>
            <button
              type="button"
              onClick={shareLink}
              title="Share"
              className="grid place-items-center h-12 w-12 rounded-[10px] transition-colors flex-shrink-0"
              style={{ backgroundColor: PAGE_BG, border: `1px solid ${BORDER}`, color: T2, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD_BRD)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* Code meta + email invite */}
          {data?.code && (
            <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
              <span className="text-[11px]" style={{ color: TMUTED }}>
                Code: <span className="font-bold" style={{ color: INK }}>{data.code.code}</span>
              </span>
              <span className="text-[11px]" style={{ color: TMUTED }}>
                {data.code.remaining} of {data.code.maxUses} invites remaining
              </span>
            </div>
          )}

          <form onSubmit={sendInvite} className="flex items-stretch gap-2.5 mt-4 flex-wrap">
            <input
              id="invite-email-input"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="investor@email.com"
              className="flex-1 min-w-[220px] px-3.5 h-11 text-[13px] outline-none rounded-[10px]"
              style={{ backgroundColor: PAGE_BG, border: `1px solid ${BORDER}`, color: INK, fontFamily: SANS }}
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 h-11 text-[12px] font-bold uppercase tracking-[0.04em] rounded-[10px] transition-opacity whitespace-nowrap"
              style={{ backgroundColor: GOLD, color: NAVY_D, border: "none", cursor: "pointer", fontFamily: SANS }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Mail size={13} /> Send Invite
            </button>
          </form>

          {/* Generate new link */}
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            {!showRotate ? (
              <button
                type="button"
                onClick={() => setShowRotate(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: T2, background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}
              >
                <RefreshCw size={12} /> Generate a new link
              </button>
            ) : (
              <div>
                <p className="text-[12px] mb-2.5" style={{ color: T2, lineHeight: 1.55 }}>
                  Your current link will stop working. People who already used it stay attributed to you.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={rotate}
                    disabled={rotating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.04em] rounded-[7px] disabled:opacity-50"
                    style={{ backgroundColor: NAVY, color: CREAM, border: "none", cursor: rotating ? "wait" : "pointer", fontFamily: SANS }}
                  >
                    {rotating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Generate new
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRotate(false)}
                    disabled={rotating}
                    className="px-3.5 py-2 text-[11px] font-semibold rounded-[7px]"
                    style={{ backgroundColor: SURFACE, color: T2, border: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: SANS }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 3 — Recent Referrals Ledger
        ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="mb-5 overflow-hidden"
          style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[15px] font-bold" style={{ color: INK }}>Recent Referrals Ledger</p>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1 text-[12px] font-semibold transition-colors"
              style={{ color: "#9A7A2E", background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}
            >
              View Full Report <ChevronRight size={14} />
            </button>
          </div>

          {/* Column header */}
          {referrals.length > 0 && (
            <div
              className="hidden sm:grid px-5 sm:px-6 py-2.5"
              style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr", borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFAFA" }}
            >
              {["Investor Name", "Status", "Join Date", "Contribution"].map((h, i) => (
                <span
                  key={h}
                  className="text-[10px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: TMUTED, textAlign: i === 3 ? "right" : "left" }}
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Empty state */}
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 grid place-items-center mb-3 rounded-full" style={{ backgroundColor: PAGE_BG }}>
                <UserPlus size={22} strokeWidth={1.5} style={{ color: TMUTED }} />
              </div>
              <p className="text-[14px] font-bold mb-1" style={{ color: INK }}>No introductions yet</p>
              <p className="text-[12.5px] max-w-xs" style={{ color: TMUTED, lineHeight: 1.6 }}>
                Share your link above. When someone joins through it, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <>
              {paged.map((r, i) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.PENDING_APPROVAL;
                const isActive = r.status === "ACTIVATED";
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="flex sm:grid items-center gap-3 px-5 sm:px-6 py-3.5 flex-wrap"
                    style={{
                      gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr",
                      borderBottom: i < paged.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="grid place-items-center flex-shrink-0 text-[13px] font-bold"
                        style={{
                          width: 38, height: 38, borderRadius: "50%",
                          backgroundColor: GOLD_DIM, color: GOLD,
                          border: `1px solid ${GOLD_BRD}`, fontFamily: SERIF,
                        }}
                      >
                        {initials(r.displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold truncate" style={{ color: INK }}>{r.displayName}</p>
                        <p className="text-[11px]" style={{ color: TMUTED }}>
                          {isActive ? "Active Investor" : "Introduction"}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold rounded-[6px]"
                        style={{ backgroundColor: meta.bg, color: meta.fg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.fg }} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Join date */}
                    <div className="hidden sm:block">
                      <span className="text-[12.5px]" style={{ color: T2 }}>{fmtDate(r.registeredAt)}</span>
                    </div>

                    {/* Contribution (recognition) */}
                    <div className="sm:text-right">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-[6px]"
                        style={{ backgroundColor: isActive ? S_BG : GOLD_DIM, color: isActive ? SUCCESS : GOLD }}
                      >
                        <Award size={11} />
                        {isActive ? "+1 Active" : "+1 to tier"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Pagination footer */}
              {referrals.length > PAGE_SIZE && (
                <div
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5"
                  style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "#FAFAFA" }}
                >
                  <span className="text-[12px]" style={{ color: TMUTED }}>
                    Showing{" "}
                    {Math.min((tablePage - 1) * PAGE_SIZE + 1, referrals.length)}–
                    {Math.min(tablePage * PAGE_SIZE, referrals.length)} of {referrals.length} referrals
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      className="px-3.5 py-2 text-[12px] font-semibold disabled:opacity-40 transition-colors rounded-[7px]"
                      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, cursor: tablePage === 1 ? "not-allowed" : "pointer", color: INK, fontFamily: SANS }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                      disabled={tablePage === totalPages}
                      className="px-3.5 py-2 text-[12px] font-bold disabled:opacity-40 transition-colors rounded-[7px]"
                      style={{ backgroundColor: NAVY, color: SURFACE, border: "none", cursor: tablePage === totalPages ? "not-allowed" : "pointer", fontFamily: SANS }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 4 — Tier ladder + How it works
        ═════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 mb-5">
          {/* Tier ladder */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.07 }}
            className="p-5 flex flex-col"
            style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}
          >
            <p className="text-[13.5px] font-bold mb-1" style={{ color: INK }}>Program Tiers</p>
            <p className="text-[12px] mb-4" style={{ color: T2, lineHeight: 1.55 }}>
              Earn more recognition as you grow the community.
            </p>
            <div className="flex flex-col gap-2.5 flex-1">
              {TIERS.map((t) => {
                const active = t.id === tier.id;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3.5 py-3 rounded-[10px]"
                    style={{ backgroundColor: active ? GOLD_DIM : PAGE_BG, border: `1px solid ${active ? GOLD_BRD : BORDER}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <t.Icon size={15} style={{ color: t.color }} />
                      <span className="text-[12.5px] font-semibold" style={{ color: INK }}>{t.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold" style={{ color: t.color }}>
                        {t.id === "platinum" ? "15+" : `${t.min}–${t.max}`} referrals
                      </p>
                      {active && (
                        <p className="text-[9.5px] font-bold tracking-[0.1em] uppercase" style={{ color: GOLD }}>Current</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: "1", Icon: Share2, iconBg: GOLD_DIM, iconColor: GOLD, title: "Share Your Link", body: "Send your unique link or email invite to your network of qualified investors." },
              { num: "2", Icon: Users,  iconBg: "#E8EEF7", iconColor: "#3A5874", title: "They Join", body: "Your introduction is reviewed. Once approved, they complete onboarding and KYC." },
              { num: "3", Icon: Award,  iconBg: S_BG, iconColor: SUCCESS, title: "Build Your Network", body: "Track your tier and community impact as each active investor adds to your record." },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22 + i * 0.07 }}
                className="p-5 flex flex-col items-center text-center"
                style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}
              >
                <div className="w-12 h-12 grid place-items-center mb-3 rounded-full" style={{ backgroundColor: s.iconBg }}>
                  <s.Icon size={22} style={{ color: s.iconColor }} />
                </div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: TMUTED }}>{s.num}.</p>
                <p className="text-[14px] font-bold mb-2" style={{ color: INK }}>{s.title}</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: T2 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 5 — Network tree (collapsible)
        ═════════════════════════════════════════════════════════════════ */}
        {tree.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.28 }}
            className="overflow-hidden"
            style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}
          >
            <button
              type="button"
              onClick={() => setShowTree((v) => !v)}
              className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left"
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}
            >
              <div className="flex items-center gap-2.5">
                <Network size={15} style={{ color: GOLD }} />
                <p className="text-[14px] font-bold" style={{ color: INK }}>Your Network</p>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ backgroundColor: GOLD_DIM, color: GOLD }}>
                  {tree.length} direct
                </span>
              </div>
              <ChevronRight size={15} className={`transition-transform duration-200 ${showTree ? "rotate-90" : ""}`} style={{ color: TMUTED }} />
            </button>

            <AnimatePresence>
              {showTree && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pb-5">
                    <TreeNodes nodes={tree} depth={0} />
                    <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: TMUTED }}>
                      <Info size={11} />
                      Shows up to three levels of introductions beneath you.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ Icon, iconColor, iconBg, label, value, footnote }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="p-5 flex flex-col justify-between"
      style={{ backgroundColor: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}`, minHeight: 105 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: TMUTED }}>{label}</span>
        <div className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <div className="text-[30px] leading-none font-bold mt-2" style={{ fontFamily: SERIF, color: INK }}>{value}</div>
        <p className="text-[11px] mt-1.5" style={{ color: TMUTED }}>{footnote}</p>
      </div>
    </motion.div>
  );
}

// ─── Network tree (recursive) ─────────────────────────────────────────────────
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] ?? "?").toUpperCase();
}

function TreeNodes({ nodes, depth }) {
  const BORDER_C = "#E4E4E7";
  const GOLD_DIM2 = "rgba(201,162,74,0.13)";
  const GOLD_C   = "#C9A24A";
  const SERIF2   = "var(--font-cormorant), Georgia, serif";

  return (
    <div
      className={depth > 0 ? "ml-5 pl-4" : ""}
      style={depth > 0 ? { borderLeft: `1px dashed ${BORDER_C}` } : {}}
    >
      {nodes.map((n) => (
        <div key={n.id} className="py-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="grid place-items-center flex-shrink-0 text-[11px] font-bold"
              style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: GOLD_DIM2, color: GOLD_C, fontFamily: SERIF2 }}
            >
              {getInitials(n.displayName)}
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "#0B1220" }}>{n.displayName}</span>
            {n.activated && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold rounded" style={{ backgroundColor: S_BG, color: SUCCESS }}>
                <CheckCircle2 size={9} /> Active
              </span>
            )}
            {n.referralCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 font-bold rounded" style={{ backgroundColor: GOLD_DIM2, color: GOLD_C }}>
                +{n.referralCount}
              </span>
            )}
          </div>
          {n.children?.length > 0 && <TreeNodes nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
