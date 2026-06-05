"use client";

// app/admin/kyc-queue/page.jsx
//
// KYC review queue — investors with kycStatus = "pending_review".
// Styled to match the Registration Review console: master/detail layout,
// stat cards, pending queue on the left and a document review panel on the right.

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, Loader2, AlertCircle,
  Eye, Check, X, ArrowUpRight, FileText, ArrowLeft, CalendarClock,
  Users, Mail, MapPin, FileCheck2,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

// ── Brand system (matches the admin dashboard) ────────────────────────────────
const C = {
  obsidian: "#070C18", navy: "#0A1F44", navySoft: "#2A4A7F",
  gold: "#B8923C", goldDeep: "#8F6E26", goldWash: "#F4ECD8",
  ink: "#0B1220", ink2: "#3C4456", ink3: "#7B8497",
  hair: "#ECEBE6", hair2: "#F3F2EE", paper: "#FFFFFF", canvas: "#F5F5F2",
  slate: "#AEB4C0", slateSoft: "#EEF0F3",
  pos: "#1C7A5E", posSoft: "#E7F1EC",
  alert: "#9B2C2C", alertSoft: "#F7EAEA",
  amber: "#9A6B12", amberSoft: "#F6EEDD",
};
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };
const EASE = [0.16, 1, 0.3, 1];

const DOC_TYPE_LABELS = {
  id_front: "ID Front",
  id_back: "ID Back",
  proof_of_address: "Proof of Address",
  selfie: "Selfie",
  source_of_funds: "Source of Funds",
};
const REQUIRED = ["id_front", "id_back", "proof_of_address", "selfie", "source_of_funds"];

function getCsrf() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
function avatarTint(seed) {
  const tints = [
    { bg: "#E7F1EC", fg: "#1C7A5E" }, { bg: "#EAF0FA", fg: "#2A4A7F" },
    { bg: "#F4ECD8", fg: "#8F6E26" }, { bg: "#F0ECF6", fg: "#6A4C8C" },
    { bg: "#EAF3F3", fg: "#1F6E73" }, { bg: "#FBEDE8", fg: "#9A5A2E" },
  ];
  let h = 0; for (const ch of String(seed || "?")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tints[h % tints.length];
}
function relTime(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fullDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function isToday(d) { return d && new Date(d).toDateString() === new Date().toDateString(); }
function within7d(d) { return d && (Date.now() - new Date(d).getTime()) < 7 * 864e5; }
function pendingDocCount(inv) { return (inv.kycDocuments || []).filter((d) => d.reviewStatus === "pending").length; }

function CountUp({ value = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, value, { duration: 0.8, ease: EASE, onUpdate: setN }); return () => c.stop(); }, [value]);
  return <span style={NUM}>{Math.round(n).toLocaleString()}</span>;
}
function StatCard({ loading, icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-2xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      <span className="w-11 h-11 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: accent ? C.goldWash : C.hair2 }}>
        <Icon size={18} strokeWidth={2} style={{ color: accent ? C.goldDeep : C.ink2 }} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase" style={{ color: C.ink3 }}>{label}</div>
        {loading ? <div className="h-6 w-12 mt-1 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
          : <div className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: C.ink, ...NUM }}><CountUp value={value} /></div>}
      </div>
    </div>
  );
}

export default function KycQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kyc/queue", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load KYC queue");
      const data = await res.json();
      const list = data.queue || [];
      setQueue(list);
      setSelectedId((cur) => (cur && list.some((r) => r.id === cur)) ? cur : (list[0]?.id ?? null));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const selected = queue.find((r) => r.id === selectedId) || null;
  const stats = useMemo(() => ({
    pending: queue.length,
    today: queue.filter((r) => isToday(r.submittedAt)).length,
    week: queue.filter((r) => within7d(r.submittedAt)).length,
    docs: queue.reduce((s, r) => s + pendingDocCount(r), 0),
  }), [queue]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[27px] font-bold leading-tight tracking-[-0.02em]" style={{ color: C.ink }}>KYC Review Queue</h1>
          <p className="text-[13px] mt-1" style={{ color: C.ink3 }}>Verify identity &amp; compliance documents to activate investor accounts.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full self-start" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stats.pending > 0 ? C.gold : C.pos }} />
          <span className="text-[12px] font-semibold" style={{ color: C.ink2, ...NUM }}>{stats.pending} in queue</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard loading={loading} icon={ShieldCheck} label="Pending" value={stats.pending} accent={stats.pending > 0} />
        <StatCard loading={loading} icon={CalendarClock} label="Today" value={stats.today} />
        <StatCard loading={loading} icon={Users} label="This Week" value={stats.week} />
        <StatCard loading={loading} icon={FileCheck2} label="Docs to Review" value={stats.docs} />
      </div>

      {error && (
        <div className="p-4 mb-4 flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.alertSoft, border: `1px solid ${C.alert}33` }}>
          <AlertCircle size={16} style={{ color: C.alert }} />
          <p className="text-[13px] font-semibold" style={{ color: C.alert }}>{error}</p>
        </div>
      )}

      {/* All clear */}
      {!loading && !error && queue.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
          <span className="w-14 h-14 mx-auto mb-4 grid place-items-center rounded-full" style={{ backgroundColor: C.posSoft }}><CheckCircle2 size={26} style={{ color: C.pos }} strokeWidth={2.2} /></span>
          <h2 className="text-[17px] font-bold mb-1.5" style={{ color: C.ink }}>All caught up</h2>
          <p className="text-[13px] max-w-md mx-auto" style={{ color: C.ink3 }}>No investors are waiting for KYC review. New submissions appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Pending queue */}
          <div className={`rounded-2xl overflow-hidden ${selected ? "hidden lg:block" : "block"}`} style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.hair2}`, backgroundColor: C.canvas }}>
              <span className="text-[13px] font-bold" style={{ color: C.ink }}>Pending Queue</span>
              {!loading && <span className="grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: C.navy, color: "#fff", ...NUM }}>{queue.length}</span>}
            </div>
            {loading ? (
              <div className="divide-y" style={{ borderColor: C.hair2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: C.hair2 }} />
                    <div className="flex-1 space-y-2"><div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /><div className="h-2.5 w-1/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[64vh] overflow-y-auto">
                {queue.map((inv) => {
                  const on = inv.id === selectedId;
                  const tint = avatarTint(inv.fullName || inv.email);
                  const pend = pendingDocCount(inv);
                  return (
                    <button key={inv.id} type="button" onClick={() => setSelectedId(inv.id)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors relative"
                      style={{ borderBottom: `1px solid ${C.hair2}`, background: on ? C.goldWash : "transparent", cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#FBFBFA"; }}
                      onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                      {on && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: C.gold }} />}
                      <span className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(inv.fullName)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate" style={{ color: C.ink }}>{inv.fullName}</div>
                        <div className="text-[11.5px] truncate" style={{ color: C.ink3 }}>{inv.country || "—"}{inv.submittedAt ? ` · ${relTime(inv.submittedAt)}` : ""}</div>
                      </div>
                      {pend > 0 && <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: C.amberSoft, color: C.amber, ...NUM }}>{pend}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className={`${selected ? "block" : "hidden lg:block"}`}>
            {!selected ? (
              <div className="rounded-2xl h-full grid place-items-center py-20 px-6 text-center" style={{ background: C.paper, border: `1px solid ${C.hair}` }}>
                <div>
                  <span className="w-14 h-14 grid place-items-center rounded-2xl mx-auto mb-3" style={{ background: C.hair2 }}><ShieldCheck size={26} strokeWidth={1.5} style={{ color: C.ink3 }} /></span>
                  <p className="text-[14px] font-bold" style={{ color: C.ink }}>Select an investor</p>
                  <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>Choose someone from the queue to review their documents.</p>
                </div>
              </div>
            ) : (
              <KycDetail key={selected.id} investor={selected} onReload={loadQueue} onBack={() => setSelectedId(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function KycDetail({ investor, onReload, onBack }) {
  const docs = investor.kycDocuments || [];
  const docsByType = Object.fromEntries(docs.map((d) => [d.documentType, d]));
  const allPresent = REQUIRED.every((t) => docsByType[t]);
  const approvedCount = REQUIRED.filter((t) => docsByType[t]?.reviewStatus === "approved").length;
  const allApproved = approvedCount === REQUIRED.length;
  const tint = avatarTint(investor.fullName || investor.email);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
      {/* Top bar */}
      <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${C.hair2}` }}>
        <button type="button" onClick={onBack} className="lg:hidden inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-4" style={{ color: C.ink2, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to queue
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-12 h-12 rounded-full grid place-items-center flex-shrink-0 text-[14px] font-bold" style={{ backgroundColor: tint.bg, color: tint.fg }}>{getInitials(investor.fullName)}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase" style={{ backgroundColor: C.amberSoft, color: C.amber }}><Clock size={9} /> Pending review</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: C.hair2, color: C.ink3, ...NUM }}>{approvedCount}/{REQUIRED.length} approved</span>
              </div>
              <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] mt-1" style={{ color: C.ink }}>{investor.fullName}</h2>
              <p className="text-[12.5px] mt-0.5 flex items-center gap-x-3 gap-y-0.5 flex-wrap" style={{ color: C.ink3 }}>
                <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {investor.email}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {investor.country || "—"}</span>
                {investor.submittedAt && <span className="inline-flex items-center gap-1.5"><Clock size={12} /> Submitted {fullDate(investor.submittedAt)}</span>}
              </p>
            </div>
          </div>
          <Link href={`/admin/investors/${investor.id}`}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12.5px] font-bold flex-shrink-0"
            style={{ color: C.ink2, backgroundColor: C.paper, border: `1px solid ${C.hair}`, textDecoration: "none" }}>
            Full Profile <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Status hints */}
        {!allPresent && (
          <div className="mt-4 px-3 py-2 rounded-xl text-[12px]" style={{ backgroundColor: C.amberSoft, color: C.amber }}>
            <strong>Note:</strong> Not all required documents have been uploaded yet. Wait for the investor to complete their submission before approving.
          </div>
        )}
        {allApproved && (
          <div className="mt-4 px-3 py-2 rounded-xl text-[12px] flex items-center gap-2" style={{ backgroundColor: C.posSoft, color: C.pos }}>
            <CheckCircle2 size={14} /> All documents approved — the investor will be activated automatically.
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 grid place-items-center rounded-lg" style={{ backgroundColor: C.goldWash }}><FileText size={15} style={{ color: C.goldDeep }} /></span>
          <h3 className="text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>Identity &amp; Compliance Documents</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {REQUIRED.map((type) => (
            <DocThumbnail key={type} type={type} doc={docsByType[type]} onReload={onReload} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────
function DocThumbnail({ type, doc, onReload }) {
  const { prompt } = useDialog();
  const [action, setAction] = useState(null);

  async function handleApprove() {
    if (!doc) return;
    setAction("approve");
    try {
      await fetch(`/api/admin/kyc/${doc.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin" });
      await onReload();
    } catch {}
    setAction(null);
  }
  async function handleReject() {
    if (!doc) return;
    const reason = await prompt({
      title: `Reject ${DOC_TYPE_LABELS[type]}?`,
      message: "Give the investor a clear reason (at least 3 characters). They'll see this.",
      placeholder: "e.g. Document is blurry / expired",
      confirmLabel: "Reject document",
      cancelLabel: "Cancel",
      tone: "danger",
      required: true,
      multiline: true,
    });
    if (!reason || reason.trim().length < 3) return;
    setAction("reject");
    try {
      await fetch(`/api/admin/kyc/${doc.id}/reject`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrf() }, credentials: "same-origin", body: JSON.stringify({ reason: reason.trim() }) });
      await onReload();
    } catch {}
    setAction(null);
  }

  if (!doc) {
    return (
      <div className="aspect-[4/5] p-2 flex flex-col items-center justify-center text-center rounded-xl" style={{ backgroundColor: C.canvas, border: `1px dashed ${C.hair}` }}>
        <FileText size={20} style={{ color: C.slate }} strokeWidth={1.5} />
        <p className="text-[10px] font-bold tracking-[0.08em] uppercase mt-2 mb-1" style={{ color: C.ink3 }}>{DOC_TYPE_LABELS[type]}</p>
        <p className="text-[10px]" style={{ color: C.slate }}>Not uploaded</p>
      </div>
    );
  }

  const config = {
    pending: { color: C.amber, bg: C.amberSoft, label: "Pending", icon: Clock },
    approved: { color: C.pos, bg: C.posSoft, label: "Approved", icon: CheckCircle2 },
    rejected: { color: C.alert, bg: C.alertSoft, label: "Rejected", icon: XCircle },
  }[doc.reviewStatus] || { color: C.ink3, bg: C.hair2, label: doc.reviewStatus, icon: Clock };

  const StatusIcon = config.icon;
  const isImage = doc.mimeType?.startsWith("image/");

  return (
    <div className="overflow-hidden flex flex-col rounded-xl" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}` }}>
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/5] grid place-items-center" style={{ backgroundColor: C.canvas, textDecoration: "none", borderBottom: `1px solid ${C.hair}` }}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.fileUrl} alt={DOC_TYPE_LABELS[type]} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <FileText size={28} style={{ color: C.slate }} strokeWidth={1.5} />
            <p className="text-[10px] mt-1" style={{ color: C.ink3 }}>{doc.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}</p>
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.06em] uppercase rounded" style={{ backgroundColor: config.bg, color: config.color }}>
          <StatusIcon size={8} /> {config.label}
        </div>
        <div className="absolute bottom-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-md" style={{ backgroundColor: "rgba(7,12,24,0.7)", color: "#fff" }}>
          <Eye size={12} />
        </div>
      </a>

      <div className="p-2 flex-1 flex flex-col">
        <p className="text-[10.5px] font-bold tracking-[0.06em] uppercase mb-2 text-center" style={{ color: C.ink }}>{DOC_TYPE_LABELS[type]}</p>
        <div className="flex gap-1 mt-auto">
          {doc.reviewStatus !== "approved" && (
            <button type="button" onClick={handleApprove} disabled={action !== null} title="Approve"
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10.5px] font-bold transition-colors disabled:opacity-50"
              style={{ color: C.pos, backgroundColor: C.posSoft, border: `1px solid ${C.pos}30`, cursor: action ? "wait" : "pointer", fontFamily: "inherit" }}>
              {action === "approve" ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
            </button>
          )}
          {doc.reviewStatus !== "rejected" && (
            <button type="button" onClick={handleReject} disabled={action !== null} title="Reject"
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10.5px] font-bold transition-colors disabled:opacity-50"
              style={{ color: C.alert, backgroundColor: C.alertSoft, border: `1px solid ${C.alert}30`, cursor: action ? "wait" : "pointer", fontFamily: "inherit" }}>
              {action === "reject" ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Reject
            </button>
          )}
        </div>
        {doc.rejectionReason && (
          <p className="mt-1.5 px-1.5 py-1 rounded text-[9.5px]" style={{ backgroundColor: C.alertSoft, color: C.alert }}>{doc.rejectionReason}</p>
        )}
      </div>
    </div>
  );
}
