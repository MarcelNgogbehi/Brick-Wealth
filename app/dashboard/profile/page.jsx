"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Shield, Bell, Loader2, CheckCircle2, AlertCircle, Lock,
  Save, X, Edit2, Eye, EyeOff, LogOut, Smartphone, Monitor,
  Building2, ShieldCheck, Download, ChevronRight, Mail, MessageSquare,
  ArrowUpRight, Send, HelpCircle, Camera, Trash2,
} from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing-client";
import { useDialog } from "@/components/ConfirmDialog";

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  bg:          "#F0F1F5",
  surface:     "#FFFFFF",
  dark:        "#060E1C",
  gold:        "#C9A44A",
  goldDark:    "#9A7A2E",
  goldLight:   "#F7F0E2",
  goldDim:     "rgba(201,164,74,0.10)",
  ink:         "#060E1C",
  secondary:   "#4B5768",
  muted:       "#8896A8",
  border:      "rgba(6,14,28,0.07)",
  borderMid:   "rgba(6,14,28,0.12)",
  success:     "#0A6E4F",
  successDim:  "rgba(10,110,79,0.08)",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.07)",
  warning:     "#92400E",
  warningDim:  "rgba(146,64,14,0.07)",
};

const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { confirm } = useDialog();
  const [profile,     setProfile]     = useState(null);
  const [kyc,         setKyc]         = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const [pRes, kRes, prRes] = await Promise.all([
          fetch("/api/dashboard/profile",     { credentials: "same-origin" }),
          fetch("/api/dashboard/kyc",         { credentials: "same-origin" }),
          fetch("/api/dashboard/preferences", { credentials: "same-origin" }),
        ]);
        if (pRes.ok)  { const d = await pRes.json();  if (!dead && d.success)  setProfile(d.profile); }
        if (kRes.ok)  { const d = await kRes.json();  if (!dead) setKyc(d.documents || []); }
        if (prRes.ok) { const d = await prRes.json(); if (!dead && d.success)  setPreferences(d.preferences || []); }
      } catch {}
      if (!dead) setLoading(false);
    }
    load();
    return () => { dead = true; };
  }, []);

  const initials = profile
    ? (profile.fullName || profile.email || "?").split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const investorTypeLabel = {
    retail: "Retail Investor", high_net_worth: "High Net Worth",
    sophisticated: "Sophisticated Investor", institutional: "Institutional Investor",
  }[profile?.investorType] || (profile?.investorType?.replace(/_/g, " ") ?? "Investor");

  const kycMeta = {
    not_started:    { label: "Not Submitted", bg: "rgba(6,14,28,0.06)", fg: C.muted },
    pending_review: { label: "Under Review",  bg: C.warningDim,          fg: C.warning },
    approved:       { label: "Identity Verified", bg: C.successDim,       fg: C.success },
    rejected:       { label: "Action Needed", bg: C.dangerDim,            fg: C.danger },
  }[profile?.kycStatus] || { label: "—", bg: C.bg, fg: C.muted };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
        <p className="text-[12.5px]" style={{ color: C.muted }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ── Page title ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}>
        <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>
          Your Account
        </p>
        <h1 className="text-[36px] sm:text-[46px] font-bold leading-none"
          style={{ color: C.ink, letterSpacing: "-0.025em" }}>
          Investor Profile
        </h1>
      </motion.div>

      {/* ── Two-column grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Profile hero card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl p-6 sm:p-7"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
              boxShadow: "0 2px 8px rgba(6,14,28,0.05)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <AvatarUploader
                avatarUrl={profile?.avatarUrl}
                initials={initials}
                onChange={(url) => setProfile(p => ({ ...p, avatarUrl: url }))}
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h2 className="text-[24px] sm:text-[28px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>
                    {profile?.fullName || "—"}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.08em] uppercase"
                    style={{ background: `linear-gradient(135deg, ${C.success}, #0F8A63)`, color: "#fff" }}>
                    <ShieldCheck size={11} strokeWidth={2.5} /> {investorTypeLabel}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed mb-3.5 max-w-md" style={{ color: C.secondary }}>
                  {profile?.createdAt ? `Active since ${new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}. ` : ""}
                  Your account is{profile?.kycStatus === "approved" ? " fully verified with institutional-grade security protocols active." : " being verified — security protocols are active."}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                    style={{ backgroundColor: profile?.kycStatus === "approved" ? C.successDim : kycMeta.bg, color: profile?.kycStatus === "approved" ? C.success : kycMeta.fg, border: `1px solid ${profile?.kycStatus === "approved" ? "rgba(10,110,79,0.2)" : "transparent"}` }}>
                    <CheckCircle2 size={12} strokeWidth={2.5} /> {profile?.kycStatus === "approved" ? "KYC VERIFIED" : kycMeta.label.toUpperCase()}
                  </span>
                  {profile?.isActivated && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                      style={{ backgroundColor: C.successDim, color: C.success, border: "1px solid rgba(10,110,79,0.2)" }}>
                      <CheckCircle2 size={12} strokeWidth={2.5} /> AML CLEARED
                    </span>
                  )}
                </div>
              </div>
              {/* Edit button */}
              <div className="flex-shrink-0">
                <EditProfileButton profile={profile} onSaved={p => setProfile(p)} />
              </div>
            </div>
          </motion.div>

          {/* Contact Details */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}>
            <ContactCard profile={profile} onSaved={p => setProfile(p)} />
          </motion.div>

          {/* Investment Profile */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.11 }}
            className="rounded-2xl p-6"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
              boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
            <h3 className="text-[15px] font-bold mb-5" style={{ color: C.ink }}>Investment Strategy</h3>

            {/* Risk tolerance */}
            <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-2.5" style={{ color: C.muted }}>Risk Tolerance</p>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: riskColor(profile?.investorType) }}
                initial={{ width: 0 }} animate={{ width: riskPct(profile?.investorType) }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11.5px] font-semibold" style={{ color: C.secondary }}>Conservative</span>
              <span className="text-[11.5px] font-bold" style={{ color: riskColor(profile?.investorType) }}>{riskLabel(profile?.investorType)}</span>
            </div>

            {/* Profile chips */}
            <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mt-6 mb-2.5" style={{ color: C.muted }}>Investor Profile</p>
            <div className="flex flex-wrap gap-2">
              {[
                profile?.investorType && investorTypeLabel,
                profile?.estimatedNetWorth && formatNetWorth(profile.estimatedNetWorth),
                profile?.sourceOfFunds && formatFundsSource(profile.sourceOfFunds),
              ].filter(Boolean).map((c, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: C.bg, color: C.secondary, border: `1px solid ${C.border}` }}>{c}</span>
              ))}
            </div>
            <p className="text-[11px] mt-4" style={{ color: C.muted }}>Declared during onboarding · contact support to update your strategy.</p>
          </motion.div>

          {/* Active Sessions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}>
            <SessionsCard />
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Account standing — dark "perks" card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: C.dark }}>
            <span aria-hidden className="absolute -top-10 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.18), transparent 70%)" }} />
            <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase mb-4 relative" style={{ color: "rgba(255,255,255,0.4)" }}>{investorTypeLabel} · Standing</p>
            <div className="space-y-3.5 relative">
              {[
                { icon: ShieldCheck,  ok: profile?.kycStatus === "approved", label: profile?.kycStatus === "approved" ? "Identity verified (KYC)" : "KYC verification in progress" },
                { icon: CheckCircle2, ok: !!profile?.isActivated,            label: profile?.isActivated ? "AML cleared & account active" : "Compliance review pending" },
                { icon: Building2,    ok: true,                              label: "Access to vetted Grade-A opportunities" },
                { icon: Lock,         ok: true,                              label: "Bank-grade encryption & secure vault" },
              ].map((it, i) => {
                const Ico = it.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 grid place-items-center rounded-lg flex-shrink-0" style={{ backgroundColor: it.ok ? "rgba(201,164,74,0.16)" : "rgba(255,255,255,0.06)" }}>
                      <Ico size={14} strokeWidth={2} style={{ color: it.ok ? C.gold : "rgba(255,255,255,0.4)" }} />
                    </span>
                    <p className="text-[12.5px] leading-snug pt-1" style={{ color: "rgba(255,255,255,0.78)" }}>{it.label}</p>
                  </div>
                );
              })}
            </div>
            {profile?.createdAt && (
              <p className="text-[11px] mt-5 pt-4 relative" style={{ color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
            )}
          </motion.div>

          {/* Security Settings — dark */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.07 }}>
            <SecurityCard />
          </motion.div>

          {/* KYC Compliance */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.10 }}>
            <KycCard docs={kyc} kycStatus={profile?.kycStatus} />
          </motion.div>

          {/* Communication */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.13 }}>
            <CommunicationCard preferences={preferences} onSaved={setPreferences} />
          </motion.div>

          {/* Notification Status */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}>
            <NotificationStatusCard preferences={preferences} />
          </motion.div>

          {/* Need Assistance */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.19 }}>
            <AssistanceCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section cards
════════════════════════════════════════════════════════════════════ */

/* ─── Avatar uploader ────────────────────────────────────────────
   Investor profile picture. Uploads to UploadThing's `avatar` route
   (which persists the URL onto the user record), then refreshes the
   shell so the new picture shows in the sidebar + top bar too. */
function AvatarUploader({ avatarUrl, initials, onChange }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving]   = useState(false);
  const [error, setError]         = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4MB.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFiles("avatar", { files: [file] });
      const url = res?.[0]?.serverData?.fileUrl || res?.[0]?.ufsUrl;
      if (!url) throw new Error("Upload failed — no URL returned.");
      onChange(url);
      router.refresh(); // re-renders the server layout → shell avatar updates
    } catch (err) {
      setError(err?.message || "Upload failed. Please try again.");
    }
    setUploading(false);
  }

  async function remove() {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/avatar", {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.success) throw new Error(d.message || "Failed to remove picture.");
      onChange(null);
      router.refresh();
    } catch (err) {
      setError(err?.message || "Failed to remove picture.");
    }
    setRemoving(false);
  }

  const busy = uploading || removing;

  return (
    <div className="flex flex-col items-center sm:items-start gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => !busy && inputRef.current?.click()}
        disabled={busy}
        className="group relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
        style={{ backgroundColor: C.dark, border: "none", cursor: busy ? "wait" : "pointer", padding: 0 }}
        title={avatarUrl ? "Change picture" : "Upload a picture"}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Profile picture" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full grid place-items-center text-[28px] font-bold" style={{ color: "#fff" }}>
            {initials}
          </span>
        )}

        {/* Overlay — always shown while busy, otherwise on hover */}
        <span
          className={`absolute inset-0 grid place-items-center transition-opacity ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          style={{ backgroundColor: "rgba(6,14,28,0.5)" }}
        >
          {uploading
            ? <Loader2 size={20} className="animate-spin" style={{ color: "#fff" }} />
            : <Camera size={20} strokeWidth={2} style={{ color: "#fff" }} />}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        className="hidden"
      />

      <div className="flex items-center gap-2 h-4">
        <button
          type="button"
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          className="text-[11px] font-semibold"
          style={{ color: C.secondary, background: "none", border: "none", cursor: busy ? "default" : "pointer", padding: 0 }}
        >
          {avatarUrl ? "Change" : "Add photo"}
        </button>
        {avatarUrl && (
          <>
            <span style={{ color: C.border }}>·</span>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: C.danger, background: "none", border: "none", cursor: busy ? "default" : "pointer", padding: 0 }}
            >
              {removing ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} Remove
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-[10.5px] max-w-[140px] text-center sm:text-left" style={{ color: C.danger }}>{error}</p>
      )}
    </div>
  );
}

/* ─── Edit Profile button (opens inline modal-ish form) ─────────── */
function EditProfileButton({ profile, onSaved }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function openEdit() {
    setForm({
      addressLine1: profile?.addressLine1 || "",
      addressLine2: profile?.addressLine2 || "",
      city:         profile?.city         || "",
      region:       profile?.region       || "",
      postcode:     profile?.postcode     || "",
      phoneNumber:  profile?.phoneNumber  || "",
      occupation:   profile?.occupation   || "",
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || "Failed to save"); setSaving(false); return; }
      onSaved(d.profile);
      setOpen(false);
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  return (
    <>
      <button type="button" onClick={openEdit}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold"
        style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        <Edit2 size={12} strokeWidth={2} /> Edit Profile
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(6,14,28,0.55)", backdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.surface, boxShadow: "0 24px 64px rgba(6,14,28,0.22)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>Edit Profile</h3>
              <button type="button" onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg" style={{ background: C.bg, border: "none", cursor: "pointer", color: C.secondary }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl text-[12.5px]"
                  style={{ backgroundColor: C.dangerDim, color: C.danger }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              {[
                { key: "addressLine1", label: "Address Line 1" },
                { key: "addressLine2", label: "Address Line 2" },
                { key: "city",         label: "City" },
                { key: "region",       label: "Region / County" },
                { key: "postcode",     label: "Postcode" },
                { key: "phoneNumber",  label: "Phone Number", type: "tel" },
                { key: "occupation",   label: "Occupation" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: C.secondary }}>{f.label}</label>
                  <input type={f.type || "text"} value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={inputStyle()} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: `1px solid ${C.border}` }}>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-[12.5px] font-semibold"
                style={{ border: `1px solid ${C.border}`, color: C.secondary, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12.5px] font-bold disabled:opacity-50"
                style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

/* ─── Contact Details card ───────────────────────────────────────── */
function ContactCard({ profile }) {
  const address = [
    profile?.addressLine1,
    profile?.city,
    profile?.postcode,
    profile?.country,
  ].filter(Boolean).join(", ") || "—";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>Contact Details</h3>
        <Edit2 size={14} strokeWidth={1.75} style={{ color: C.muted, cursor: "pointer" }} />
      </div>
      <div className="p-6 space-y-5">
        <ContactRow label="Email Address" value={profile?.email || "—"} />
        <ContactRow label="Phone Number"  value={profile?.phoneNumber || "—"} />
        <ContactRow label="Primary Residence" value={address} />
        {profile?.occupation && <ContactRow label="Occupation" value={profile.occupation} />}
        <ContactRow label="Member Since"
          value={profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "—"}
        />
      </div>
    </div>
  );
}

function ContactRow({ label, value }) {
  return (
    <div>
      <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: C.muted }}>{label}</p>
      <p className="text-[13.5px] font-medium" style={{ color: C.ink }}>{value}</p>
    </div>
  );
}

/* ─── Security Settings (dark) ───────────────────────────────────── */
function SecurityCard() {
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);
  const [open,       setOpen]       = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/dashboard/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || "Failed"); setSubmitting(false); return; }
      setSuccess("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setOpen(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) { setError(err.message); }
    setSubmitting(false);
  }

  const strength = newPw ? computeStrength(newPw) : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.dark }}>
      <div className="px-6 py-5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Shield size={15} strokeWidth={1.75} style={{ color: C.gold }} />
        <h3 className="text-[15px] font-bold" style={{ color: "#fff" }}>Security Settings</h3>
      </div>
      <div className="p-6 space-y-5">

        {/* 2FA row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13.5px] font-semibold" style={{ color: "#fff" }}>2FA Authentication</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>SMS &amp; Authenticator App</p>
          </div>
          {/* Static toggle indicator — 2FA managed server-side */}
          <div className="w-10 h-5.5 rounded-full flex items-center px-0.5"
            style={{ backgroundColor: C.success, width: 40, height: 22, position: "relative" }}>
            <div className="absolute right-1 w-4 h-4 rounded-full bg-white"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Success/error */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-[12px]"
            style={{ backgroundColor: C.successDim, color: C.success }}>
            <CheckCircle2 size={13} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-[12px]"
            style={{ backgroundColor: C.dangerDim, color: C.danger }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Change Password form */}
        {!open ? (
          <button type="button" onClick={() => setOpen(true)}
            className="w-full py-3 rounded-xl text-[13px] font-bold"
            style={{ backgroundColor: C.surface, color: C.dark, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Change Password
          </button>
        ) : (
          <form onSubmit={changePassword} className="space-y-3">
            <PwField label="Current Password" value={currentPw} onChange={setCurrentPw}
              show={showCur} toggle={() => setShowCur(v => !v)} dark />
            <PwField label="New Password" value={newPw} onChange={setNewPw}
              show={showNew} toggle={() => setShowNew(v => !v)} dark autoComplete="new-password" />
            {strength && (
              <div>
                <div className="flex items-center gap-2 text-[11px] mb-1.5">
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Strength:</span>
                  <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${strength.score * 25}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full rounded-full" style={{ backgroundColor: strength.color }} />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold"
                style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.6)", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || !currentPw || !newPw}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-bold disabled:opacity-40"
                style={{ backgroundColor: C.surface, color: C.dark, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── KYC Compliance card ────────────────────────────────────────── */
function KycCard({ docs, kycStatus }) {
  const approvedDocs = docs.filter(d => d.reviewStatus === "approved");
  const pendingDocs  = docs.filter(d => d.reviewStatus === "pending");

  const kycLabel = {
    not_started: "Not Started", pending_review: "Under Review",
    approved: "Approved", rejected: "Action Needed",
  }[kycStatus] || "—";

  const kycColor = {
    approved: C.success, rejected: C.danger,
    pending_review: C.warning,
  }[kycStatus] || C.muted;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>KYC Compliance</h3>
        <ShieldCheck size={16} strokeWidth={1.75} style={{ color: kycColor }} />
      </div>
      <div className="p-6 space-y-4">

        {docs.length === 0 ? (
          <div>
            <p className="text-[12.5px]" style={{ color: C.muted }}>No documents submitted yet.</p>
            <a href="/portal/verify"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-[12px] font-semibold"
              style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
              Submit KYC <ChevronRight size={12} />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedDocs.map(d => (
              <div key={d.id} className="flex items-start gap-3">
                <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: C.success, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                    {docTypeLabel(d.documentType)}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                    {d.documentType?.replace(/_/g, " ")} • Verified
                    {d.reviewedAt ? ` ${new Date(d.reviewedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
              </div>
            ))}
            {pendingDocs.map(d => (
              <div key={d.id} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5"
                  style={{ borderColor: C.warning }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: C.ink }}>
                    {docTypeLabel(d.documentType)}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.warning }}>Under review</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {docs.length > 0 && (
          <div className="pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: C.muted }}>
              Document Repository
            </p>
            <a href="/dashboard/documents"
              className="flex items-center gap-2 text-[12.5px] font-semibold"
              style={{ color: C.ink, textDecoration: "none" }}>
              <Download size={13} strokeWidth={2} /> View KYC Documents
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Communication preferences card ────────────────────────────── */
function CommunicationCard({ preferences, onSaved }) {
  const [prefs,   setPrefs]   = useState(preferences);
  const [dirty,   setDirty]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => { setPrefs(preferences); }, [preferences]);

  function toggle(category, channel) {
    setPrefs(prev => prev.map(p => p.category === category ? { ...p, [channel]: !p[channel] } : p));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ preferences: prefs.map(p => ({ category: p.category, emailEnabled: p.emailEnabled, inAppEnabled: p.inAppEnabled })) }),
      });
      const d = await res.json();
      if (res.ok) { onSaved(d.preferences); setDirty(false); setSuccess("Saved"); setTimeout(() => setSuccess(null), 3000); }
    } catch {}
    setSaving(false);
  }

  /* Simplify: show email pref per category as a checkbox list */
  const items = prefs.length > 0 ? prefs : [
    { category: "opportunity_alerts",  label: "Property Opportunity Alerts", emailEnabled: true },
    { category: "portfolio_summary",   label: "Weekly Portfolio Summary",    emailEnabled: true },
    { category: "market_reports",      label: "Institutional Market Reports",emailEnabled: false },
  ];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>Communication</h3>
        {dirty && (
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-bold"
            style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Save
          </button>
        )}
      </div>
      <div className="p-6 space-y-3.5">
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-[12px] mb-1"
            style={{ backgroundColor: C.successDim, color: C.success }}>
            <CheckCircle2 size={13} /> {success}
          </div>
        )}
        {items.map(p => (
          <label key={p.category} className="flex items-center gap-3 cursor-pointer select-none">
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: p.emailEnabled ? C.dark : "transparent",
                border: p.emailEnabled ? "none" : `2px solid ${C.borderMid}`,
              }}
              onClick={() => toggle(p.category, "emailEnabled")}>
              {p.emailEnabled && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[13px] font-medium" style={{ color: C.ink }}>{p.label}</span>
          </label>
        ))}
        <p className="text-[11px] pt-2" style={{ color: C.muted }}>
          Security alerts cannot be disabled.
        </p>
      </div>
    </div>
  );
}

/* ─── Sessions card ──────────────────────────────────────────────── */
function SessionsCard() {
  const [sessions, setSessions] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard/sessions", { credentials: "same-origin" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setSessions(d.sessions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function revoke(id) {
    const ok = await confirm({
      title: "Sign out this device?",
      message: "That session will be ended immediately and will need to sign in again.",
      confirmLabel: "Sign out device",
      cancelLabel: "Keep it",
      tone: "warning",
    });
    if (!ok) return;
    setRevoking(id);
    try {
      await fetch("/api/dashboard/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ sessionId: id }),
      });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {}
    setRevoking(null);
  }

  if (loading || !sessions?.length) return null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>Active Sessions</h3>
      </div>
      <div className="p-6 space-y-3">
        {sessions.map(s => {
          const dev = parseDevice(s.deviceInfo);
          return (
            <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ backgroundColor: s.isCurrent ? C.bg : "transparent",
                border: `1px solid ${s.isCurrent ? C.border : "transparent"}` }}>
              <div className="w-9 h-9 grid place-items-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: s.isCurrent ? C.goldDim : "rgba(6,14,28,0.05)" }}>
                {dev.isMobile
                  ? <Smartphone size={14} strokeWidth={1.75} style={{ color: s.isCurrent ? C.goldDark : C.secondary }} />
                  : <Monitor size={14} strokeWidth={1.75} style={{ color: s.isCurrent ? C.goldDark : C.secondary }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>
                  {dev.name}
                  {s.isCurrent && (
                    <span className="ml-2 px-1.5 py-0.5 text-[9.5px] font-bold rounded"
                      style={{ backgroundColor: C.goldDim, color: C.goldDark }}>
                      This device
                    </span>
                  )}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {relTime(s.createdAt)}
                </p>
              </div>
              {!s.isCurrent && (
                <button type="button" onClick={() => revoke(s.id)} disabled={revoking !== null}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg"
                  style={{ color: C.secondary, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.danger; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.secondary; }}>
                  {revoking === s.id ? <Loader2 size={10} className="animate-spin" /> : "Sign Out"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────────── */
function PwField({ label, value, onChange, show, toggle, dark, autoComplete = "current-password" }) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold mb-1.5"
        style={{ color: dark ? "rgba(255,255,255,0.55)" : C.secondary }}>
        {label}
      </label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
          style={{
            ...inputStyle(dark),
            paddingRight: 44,
          }} />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ background: "transparent", border: "none", cursor: "pointer",
            color: dark ? "rgba(255,255,255,0.4)" : C.muted }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function inputStyle(dark = false) {
  return {
    width: "100%", height: 40, padding: "0 14px", fontSize: 13,
    border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : C.borderMid}`,
    borderRadius: "9px", fontFamily: "inherit", outline: "none",
    color: dark ? "#fff" : C.ink,
    backgroundColor: dark ? "rgba(255,255,255,0.07)" : C.surface,
    transition: "border-color 0.2s",
  };
}

function docTypeLabel(t) {
  return {
    passport: "Proof of Identity", national_id: "Proof of Identity",
    drivers_license: "Driver's Licence", proof_of_address: "Proof of Address",
    source_of_funds: "Source of Funds",
  }[t] || "Document";
}

function riskLabel(type) {
  return { retail: "Conservative", high_net_worth: "Moderate",
    sophisticated: "Aggressive Growth", institutional: "Balanced" }[type] || "Moderate";
}
function riskColor(type) {
  return { retail: "#3D8B5C", high_net_worth: C.gold,
    sophisticated: C.danger, institutional: C.info }[type] || C.gold;
}
function riskPct(type) {
  return { retail: "30%", high_net_worth: "55%", sophisticated: "85%", institutional: "65%" }[type] || "50%";
}
function formatFundsSource(s) {
  return { employment: "Employment Income", business: "Business Income", investments: "Investment Returns",
    inheritance: "Inheritance", savings: "Personal Savings" }[s] || (s?.replace(/_/g, " ") || "—");
}
function formatNetWorth(v) {
  return { under_50k: "Under £50,000", "50k_250k": "£50K – £250K",
    "250k_1m": "£250K – £1M", over_1m: "Over £1,000,000" }[v] || "—";
}
function parseDevice(ua) {
  if (!ua) return { name: "Unknown device", isMobile: false };
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let name = "Browser";
  if (/Chrome/i.test(ua)) name = "Chrome";
  else if (/Firefox/i.test(ua)) name = "Firefox";
  else if (/Safari/i.test(ua)) name = "Safari";
  let os = "";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  return { name: os ? `${name} on ${os}` : name, isMobile };
}
function relTime(d) {
  if (!d) return "—";
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function computeStrength(pw) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return { score: Math.max(1, s),
    label: ["Weak","Fair","Good","Strong"][Math.min(s,3)],
    color: [C.danger,C.warning,"#3D8B5C",C.success][Math.min(s,3)] };
}

/* ─── Notification Status card ───────────────────────────────────── */
function NotificationStatusCard({ preferences }) {
  const emailOn = preferences?.some(p => p.emailEnabled) ?? true;
  const inAppOn = preferences?.some(p => p.inAppEnabled) ?? true;

  const channels = [
    { icon: Mail,          label: "Email Notifications", enabled: emailOn },
    { icon: MessageSquare, label: "SMS Alerts",          enabled: false   },
    { icon: Bell,          label: "Push Notifications",  enabled: inAppOn  },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.dark }}
    >
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-[16px] font-bold mb-1" style={{ color: "#fff" }}>
          Notification Status
        </h3>
        <p className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.48)" }}>
          Your preferred channels for critical investor updates.
        </p>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {channels.map(({ icon: Icon, label, enabled }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-9 h-9 flex-shrink-0 grid place-items-center rounded-xl"
              style={{ backgroundColor: enabled ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)" }}
            >
              <Icon size={15} strokeWidth={1.75} style={{ color: enabled ? "#fff" : "rgba(255,255,255,0.3)" }} />
            </div>
            <span
              className="flex-1 text-[13.5px] font-medium"
              style={{ color: enabled ? "#fff" : "rgba(255,255,255,0.38)" }}
            >
              {label}
            </span>
            <span
              className="text-[10px] font-extrabold tracking-[0.08em] px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: enabled ? "#0A6E4F" : "rgba(255,255,255,0.10)",
                color: enabled ? "#fff" : "rgba(255,255,255,0.40)",
              }}
            >
              {enabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          className="w-full py-3.5 text-[13px] font-bold rounded-xl transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#fff", color: C.dark, border: "none", cursor: "pointer", fontFamily: "inherit" }}
          onClick={() => document.querySelector("[data-section='communication']")?.scrollIntoView({ behavior: "smooth" })}
        >
          Manage All Settings
        </button>
      </div>
    </div>
  );
}

/* ─── Assistance card ────────────────────────────────────────────── */
const PURPOSES = [
  "General Enquiry",
  "Technical Issue",
  "Investment Query",
  "Document Request",
  "Feedback",
  "Complaint",
  "Other",
];

function AssistanceCard() {
  const [open,    setOpen]    = useState(false);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [urgency, setUrgency] = useState("normal");
  const [message, setMessage] = useState("");
  const [state,   setState]   = useState("idle"); // idle | sending | done | error
  const [errMsg,  setErrMsg]  = useState("");

  async function submit(e) {
    e.preventDefault();
    if (message.trim().length < 10) { setErrMsg("Please provide at least 10 characters."); return; }
    setState("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/dashboard/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() },
        credentials: "same-origin",
        body: JSON.stringify({ purpose, urgency, message: message.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setState("done");
        setMessage("");
      } else {
        setErrMsg(data.message || "Something went wrong.");
        setState("error");
      }
    } catch (err) {
      setErrMsg(err.message);
      setState("error");
    }
  }

  function reset() { setState("idle"); setErrMsg(""); setOpen(false); }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}
    >
      {/* Collapsed row */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8F8FB]"
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <div
            className="w-10 h-10 flex-shrink-0 grid place-items-center rounded-full"
            style={{ backgroundColor: C.dark }}
          >
            <Bell size={16} strokeWidth={1.75} style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold leading-tight" style={{ color: C.ink }}>
              Need assistance?
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: C.muted }}>
              Your advisor is online now.
            </p>
          </div>
          <ArrowUpRight size={16} strokeWidth={1.75} style={{ color: C.muted, flexShrink: 0 }} />
        </button>
      ) : (
        /* Expanded form */
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} strokeWidth={1.75} style={{ color: C.gold }} />
              <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>Send a Request</h3>
            </div>
            <button
              type="button"
              onClick={reset}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          {state === "done" ? (
            <div className="py-6 text-center">
              <div
                className="w-12 h-12 grid place-items-center mx-auto mb-3 rounded-full"
                style={{ backgroundColor: C.successDim }}
              >
                <CheckCircle2 size={22} style={{ color: C.success }} />
              </div>
              <p className="text-[15px] font-bold mb-1" style={{ color: C.ink }}>Request sent</p>
              <p className="text-[12.5px] mb-4 max-w-xs mx-auto" style={{ color: C.secondary, lineHeight: 1.55 }}>
                Our team has been notified and will respond within 1–2 business days.
              </p>
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 rounded-xl text-[12.5px] font-bold"
                style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              {/* Purpose */}
              <div>
                <label className="text-[11px] font-bold tracking-[0.07em] uppercase block mb-1.5" style={{ color: C.muted }}>
                  Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-[13px] outline-none"
                  style={{
                    padding: "10px 13px", border: `1px solid ${C.borderMid}`, borderRadius: "10px",
                    color: C.ink, backgroundColor: "#FAFAFA", fontFamily: "inherit", appearance: "none",
                  }}
                >
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Urgency */}
              <div className="flex gap-2.5">
                {[["normal", "Normal"], ["urgent", "Urgent"]].map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setUrgency(val)}
                    className="flex-1 py-2 text-[12px] font-semibold rounded-xl transition-all"
                    style={{
                      backgroundColor: urgency === val ? (val === "urgent" ? C.dangerDim : C.dark) : "transparent",
                      color: urgency === val ? (val === "urgent" ? C.danger : "#fff") : C.secondary,
                      border: `1px solid ${urgency === val ? (val === "urgent" ? C.danger : C.dark) : C.borderMid}`,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold tracking-[0.07em] uppercase block mb-1.5" style={{ color: C.muted }}>
                  Your message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe what you need help with…"
                  className="w-full text-[13px] outline-none resize-none"
                  style={{
                    padding: "11px 13px", border: `1px solid ${C.borderMid}`, borderRadius: "10px",
                    color: C.ink, backgroundColor: "#FAFAFA", fontFamily: "inherit", lineHeight: 1.55,
                  }}
                />
                <p className="text-[11px] mt-1 text-right" style={{ color: message.length > 1800 ? C.danger : C.muted }}>
                  {message.length}/2000
                </p>
              </div>

              {/* Error */}
              {(state === "error" || errMsg) && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-[12px]"
                  style={{ backgroundColor: C.dangerDim, color: C.danger }}
                >
                  <AlertCircle size={13} />
                  {errMsg || "Something went wrong. Please try again."}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "sending"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-bold disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: C.dark, color: "#fff", border: "none", cursor: state === "sending" ? "wait" : "pointer", fontFamily: "inherit" }}
              >
                {state === "sending"
                  ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                  : <><Send size={13} /> Send Request</>
                }
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
