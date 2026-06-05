"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Download, ExternalLink, AlertCircle,
  Award, ScrollText, ShieldCheck, FileCheck, FolderOpen, Upload,
} from "lucide-react";
import { CountUp, NUM, EASE, fadeUp, stagger } from "../_components/DashViz";
import { useDashboardSearch } from "../_components/search-context";

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
  borderMid:   "rgba(6,14,28,0.11)",
  track:       "#EDEFF3",
  success:     "#0A6E4F",
  successDim:  "rgba(10,110,79,0.09)",
  danger:      "#991B1B",
  dangerDim:   "rgba(153,27,27,0.07)",
  warning:     "#92400E",
  warningDim:  "rgba(146,64,14,0.07)",
};
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";

const DOC_TYPE_META = {
  passport:         { label: "Passport",         icon: ShieldCheck },
  national_id:      { label: "National ID",       icon: ShieldCheck },
  drivers_license:  { label: "Driver's Licence",  icon: ShieldCheck },
  proof_of_address: { label: "Proof of Address",  icon: FileCheck },
  source_of_funds:  { label: "Source of Funds",   icon: FileCheck },
  other:            { label: "Document",          icon: FileText },
};
const FILTERS = [{ key: "all", label: "All" }, { key: "kyc", label: "KYC" }, { key: "cert", label: "Certificates" }];
const PAGE_SIZE = 6;

/* ═══════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════ */
export default function DocumentsPage() {
  const [docs,    setDocs]    = useState([]);
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const [kycRes, subRes] = await Promise.all([
          fetch("/api/dashboard/kyc",                       { credentials: "same-origin" }),
          fetch("/api/dashboard/subscriptions?pageSize=50", { credentials: "same-origin" }),
        ]);
        if (kycRes.ok) { const d = await kycRes.json(); if (!dead) setDocs(d.documents || []); }
        if (subRes.ok) {
          const d = await subRes.json();
          const allCerts = (d.subscriptions || []).flatMap((s) =>
            (s.allocations || []).filter((a) => a.certificateUrl || a.certificateNumber).map((a) => ({
              id: a.id, ref: a.certificateNumber, url: a.certificateUrl,
              opportunityTitle: s.opportunity?.title || "Investment", units: a.unitsAllocated,
              allocatedAt: a.confirmedAt, subscriptionId: s.id,
            })));
          if (!dead) setCerts(allCerts);
        }
      } catch (err) { if (!dead) setError(err.message); }
      if (!dead) setLoading(false);
    }
    load();
    return () => { dead = true; };
  }, []);

  const allRows = useMemo(() => {
    const kycRows = docs.map((d) => ({ id: d.id, name: (DOC_TYPE_META[d.documentType] || DOC_TYPE_META.other).label, category: "KYC", status: d.reviewStatus, date: d.uploadedAt, url: d.fileUrl, type: "kyc", doc: d }));
    const certRows = certs.map((c) => ({ id: c.id, name: c.opportunityTitle, category: "Certificate", date: c.allocatedAt, url: c.url || `/api/dashboard/allocations/${c.id}/certificate`, type: "cert", cert: c }));
    return [...certRows, ...kycRows].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [docs, certs]);

  const { query } = useDashboardSearch();   // scoped from the topbar
  const visibleRows = useMemo(() => {
    let rows = filter === "all" ? allRows : allRows.filter((r) => r.type === filter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((r) => `${r.name || ""} ${r.category || ""}`.toLowerCase().includes(q));
    return rows;
  }, [allRows, filter, query]);
  useEffect(() => { setPage(1); }, [filter, query]);

  const totalPages = Math.ceil(visibleRows.length / PAGE_SIZE);
  const pageRows   = visibleRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingKyc = docs.filter((d) => d.reviewStatus === "pending").length;

  /* Storage utilization — real KYC file sizes against a 10 GB cap. */
  const usedBytes = docs.reduce((s, d) => s + (d.fileSize || 0), 0);
  const CAP_GB = 10;
  const usedGB = usedBytes / 1024 ** 3;
  const usedNum = usedBytes >= 1024 ** 3 ? usedGB : usedBytes / 1024 ** 2;
  const usedUnit = usedBytes >= 1024 ** 3 ? "GB" : "MB";
  const usedPct = Math.min(100, Math.max(usedBytes > 0 ? 2 : 0, (usedGB / CAP_GB) * 100));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7">

      {/* ── Title ── */}
      <motion.div variants={fadeUp}>
        <p className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Document Vault</p>
        <h1 className="text-[36px] sm:text-[46px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.025em" }}>Documents</h1>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-[13px] rounded-xl" style={{ backgroundColor: C.dangerDim, border: "1px solid rgba(153,27,27,0.15)" }}>
          <AlertCircle size={14} style={{ color: C.danger }} /><span style={{ color: C.danger }}>{error}</span>
        </div>
      )}

      {/* ── Hero row ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="rounded-2xl p-7 sm:p-8 relative overflow-hidden flex flex-col justify-between" style={{ backgroundColor: C.dark, minHeight: 170 }}>
          <span aria-hidden className="absolute -top-12 -right-8 w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,164,74,0.16), transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="text-[22px] sm:text-[26px] leading-snug mb-2" style={{ color: "#fff", fontFamily: SERIF, fontWeight: 600 }}>Your Documents Hub</h2>
            <p className="text-[13px] leading-relaxed mb-6 max-w-md" style={{ color: "rgba(255,255,255,0.50)" }}>KYC verification files, investment certificates and subscription agreements — all in one secure place.</p>
            <Link href="/portal/verify" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold transition-transform hover:scale-[1.02]" style={{ backgroundColor: C.success, color: "#fff", textDecoration: "none" }}>
              <Upload size={13} strokeWidth={2} /> Upload New Document
            </Link>
          </div>
          <div className="absolute right-6 bottom-4 opacity-[0.06] pointer-events-none"><FolderOpen size={120} strokeWidth={0.75} style={{ color: "#fff" }} /></div>
        </div>

        <div className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <p className="text-[9.5px] font-bold tracking-[0.20em] uppercase mb-4" style={{ color: C.muted }}>Storage Utilization</p>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: C.bg }} />)}</div>
          ) : (
            <>
              <p className="leading-none mb-4" style={{ color: C.ink, letterSpacing: "-0.03em", ...NUM }}>
                <span className="text-[42px] font-bold"><CountUp value={usedNum} format={(v) => v.toFixed(1)} /></span>
                <span className="text-[15px] font-semibold ml-1.5" style={{ color: C.muted }}>{usedUnit}</span>
                <span className="text-[15px] font-semibold ml-1.5" style={{ color: C.muted }}>/ {CAP_GB} GB</span>
              </p>
              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: C.track }}>
                <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${C.dark}, ${C.gold})` }}
                  initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }} />
              </div>
              <div className="space-y-2 mt-auto">
                <StorageRow label="KYC Documents" value={docs.length} />
                <StorageRow label="Certificates" value={certs.length} />
                {pendingKyc > 0 && <StorageRow label="Pending Review" value={pendingKyc} tone={C.warning} />}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Categories ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen size={16} strokeWidth={1.75} style={{ color: C.ink }} />
          <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Categories</h2>
        </div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CategoryCard icon={ShieldCheck} label="KYC Documents" count={docs.length} updatedAt={docs[0]?.uploadedAt} onClick={() => setFilter("kyc")} />
          <CategoryCard icon={Award} label="Investment Certificates" count={certs.length} updatedAt={certs[0]?.allocatedAt} onClick={() => setFilter("cert")} />
          <CategoryCard icon={ScrollText} label="Subscription Agreements" count={0} updatedAt={null} />
        </motion.div>
      </motion.div>

      {/* ── Recent paperwork ── */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <FileText size={16} strokeWidth={1.75} style={{ color: C.ink }} />
            <h2 className="text-[18px] leading-tight" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 600 }}>Recent Paperwork</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 rounded-xl" style={{ border: `1px solid ${C.borderMid}`, backgroundColor: C.bg }}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const n = f.key === "all" ? allRows.length : allRows.filter((r) => r.type === f.key).length;
                return (
                  <button key={f.key} type="button" onClick={() => setFilter(f.key)} className="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
                    style={{ backgroundColor: active ? C.dark : "transparent", color: active ? "#fff" : C.secondary, border: "none", cursor: "pointer" }}>
                    {f.label}{n > 0 ? ` ${n}` : ""}
                  </button>
                );
              })}
            </div>
            <Link href="/portal/verify" className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-[12.5px] font-bold" style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>
              <Upload size={13} strokeWidth={2} /> Upload
            </Link>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(6,14,28,0.04)" }}>
          <div className="hidden sm:grid px-6 py-3.5 text-[9.5px] font-bold tracking-[0.16em] uppercase" style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, gridTemplateColumns: "1fr 160px 160px 100px" }}>
            <span>Document Name</span><span>Category</span><span>Date Added</span><span className="text-right">Action</span>
          </div>

          {loading && (
            <div className="p-6 space-y-4">{[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl animate-pulse flex-shrink-0" style={{ backgroundColor: C.bg }} /><div className="flex-1 space-y-2"><div className="h-3.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: C.bg }} /><div className="h-2.5 w-1/4 rounded animate-pulse" style={{ backgroundColor: C.bg }} /></div></div>
            ))}</div>
          )}

          {!loading && visibleRows.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 grid place-items-center mx-auto mb-4 rounded-2xl" style={{ backgroundColor: C.goldDim }}><FileText size={20} strokeWidth={1.5} style={{ color: C.gold }} /></div>
              <p className="text-[17px] mb-1.5" style={{ color: C.ink, fontFamily: SERIF, fontWeight: 500 }}>{filter === "all" ? "No documents yet" : "Nothing in this view"}</p>
              <p className="text-[12.5px] max-w-sm mx-auto" style={{ color: C.muted }}>{filter === "all" ? "Submit your KYC documents to unlock investment subscriptions." : "Switch filters to see your other paperwork."}</p>
              {filter === "all" && <Link href="/portal/verify" className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ backgroundColor: C.dark, color: "#fff", textDecoration: "none" }}>Submit KYC</Link>}
            </div>
          )}

          {!loading && pageRows.map((row, i) => <DocRow key={row.id} row={row} index={i} last={i === pageRows.length - 1} />)}

          {!loading && visibleRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-[12px]" style={{ color: C.muted }}>Showing {Math.min((page - 1) * PAGE_SIZE + 1, visibleRows.length)}–{Math.min(page * PAGE_SIZE, visibleRows.length)} of {visibleRows.length} documents</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 text-[12px] font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ border: `1px solid ${C.borderMid}`, color: C.ink, backgroundColor: C.surface, cursor: "pointer" }}>Previous</button>
                <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-4 py-2 text-[12px] font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ border: `1px solid ${C.dark}`, backgroundColor: C.dark, color: "#fff", cursor: "pointer" }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function StorageRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span style={{ color: tone || C.muted }}>{label}</span>
      <span className="font-bold" style={{ color: tone || C.ink, ...NUM }}><CountUp value={value} /></span>
    </div>
  );
}

function CategoryCard({ icon: Icon, label, count, updatedAt, onClick }) {
  const dateStr = updatedAt ? (() => {
    const diff = Math.floor((Date.now() - new Date(updatedAt)) / 86400000);
    if (diff === 0) return "Updated Today";
    if (diff === 1) return "Updated Yesterday";
    return `Updated ${diff}d ago`;
  })() : null;
  return (
    <motion.div variants={fadeUp} role={onClick ? "button" : undefined} onClick={onClick}
      className="rounded-2xl p-5 transition-all" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(6,14,28,0.04)", minHeight: 110, cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(6,14,28,0.09)"; e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(6,14,28,0.04)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
      <div className="w-9 h-9 grid place-items-center rounded-xl mb-3" style={{ backgroundColor: C.bg }}><Icon size={16} strokeWidth={1.75} style={{ color: C.secondary }} /></div>
      <p className="text-[13.5px] font-semibold leading-snug mb-1" style={{ color: C.ink }}>{label}</p>
      <p className="text-[11.5px]" style={{ color: C.muted }}><span className="font-bold" style={{ color: C.ink, ...NUM }}>{count}</span> file{count !== 1 ? "s" : ""}{dateStr ? ` · ${dateStr}` : ""}</p>
    </motion.div>
  );
}

function DocRow({ row, index, last }) {
  const isCert = row.type === "cert";
  const iconBg = isCert ? C.goldDim : "rgba(6,14,28,0.06)";
  const iconColor = isCert ? C.goldDark : C.secondary;
  const IconComp = isCert ? Award : (DOC_TYPE_META[row.doc?.documentType]?.icon || FileText);
  const catBg = isCert ? "rgba(201,164,74,0.12)" : (row.doc?.reviewStatus === "approved" ? C.successDim : row.doc?.reviewStatus === "rejected" ? C.dangerDim : C.warningDim);
  const catFg = isCert ? C.goldDark : (row.doc?.reviewStatus === "approved" ? C.success : row.doc?.reviewStatus === "rejected" ? C.danger : C.warning);
  const catLabel = isCert ? "Certificate" : "KYC";
  const dateStr = row.date ? new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const downloadUrl = row.url;

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.04 }}
      className="grid items-center px-6 py-4 transition-colors" style={{ borderBottom: last ? "none" : `1px solid ${C.border}`, gridTemplateColumns: "1fr" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bg; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
      {/* Mobile */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className="w-9 h-9 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: iconBg }}><IconComp size={15} strokeWidth={1.75} style={{ color: iconColor }} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: C.ink }}>{row.name}</p>
          <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: catBg, color: catFg }}>{catLabel}</span><span className="text-[11px]" style={{ color: C.muted }}>{dateStr}</span></div>
        </div>
        {downloadUrl && <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg flex-shrink-0" style={{ color: C.muted }}><Download size={14} /></a>}
      </div>
      {/* Desktop */}
      <div className="hidden sm:grid items-center" style={{ gridTemplateColumns: "1fr 160px 160px 100px" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: iconBg }}><IconComp size={15} strokeWidth={1.75} style={{ color: iconColor }} /></div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold truncate" style={{ color: C.ink }}>{row.name}</p>
            {isCert && row.cert?.ref && <p className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>Ref: {row.cert.ref}</p>}
            {!isCert && row.doc?.rejectionReason && <p className="text-[11px] mt-0.5 truncate" style={{ color: C.danger }}>{row.doc.rejectionReason}</p>}
          </div>
        </div>
        <div><span className="inline-flex px-2.5 py-1 text-[10.5px] font-bold rounded-lg" style={{ backgroundColor: catBg, color: catFg }}>{catLabel}</span></div>
        <div><p className="text-[13px]" style={{ color: C.secondary }}>{dateStr}</p></div>
        <div className="flex items-center justify-end gap-1">
          {downloadUrl && <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors" style={{ color: C.muted, textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.color = C.ink; e.currentTarget.style.backgroundColor = C.bg; }} onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.backgroundColor = "transparent"; }} title="Download"><Download size={14} /></a>}
          {isCert && row.cert?.subscriptionId && <Link href={`/dashboard/subscriptions/${row.cert.subscriptionId}`} className="p-2 rounded-lg transition-colors" style={{ color: C.muted, textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.color = C.ink; e.currentTarget.style.backgroundColor = C.bg; }} onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.backgroundColor = "transparent"; }} title="View subscription"><ExternalLink size={14} /></Link>}
        </div>
      </div>
    </motion.div>
  );
}
