"use client";

// app/admin/spvs/[id]/cap-table/_AdminCapTable.jsx
//
// Admin cap table view for one SPV.
// Summary + shareholder table + CSV snapshot export.

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Download, Users, PieChart, Banknote, TrendingUp,
  ArrowLeft, FileSpreadsheet, AlertCircle,
} from "lucide-react";
import { useDialog } from "@/components/ConfirmDialog";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const BORDER = "#E4E4E7";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const SUCCESS = "#0F6E56";
const DANGER = "#9B2C2C";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function AdminCapTable({ spvId }) {
  const { alert } = useDialog();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/spvs/${spvId}/cap-table`, { credentials: "same-origin" });
      const d = await res.json();
      if (d.success) setData(d);
      else setError(d.message);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }, [spvId]);

  useEffect(() => { load(); }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/spvs/${spvId}/cap-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (d.success && d.csv) {
        const blob = new Blob([d.csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = d.filename || "cap-table.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await alert({ title: "Export failed", message: d.message || "The cap table could not be exported.", tone: "danger" });
      }
    } catch (err) { await alert({ title: "Export failed", message: err.message, tone: "danger" }); }
    setExporting(false);
  }

  if (loading) {
    return <div className="grid place-items-center py-24"><Loader2 size={20} className="animate-spin" style={{ color: GOLD }} /></div>;
  }
  if (error || !data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <AlertCircle size={22} className="mx-auto mb-2" style={{ color: DANGER }} />
          <p className="text-[13px]" style={{ color: DANGER }}>{error || "Not found"}</p>
        </div>
      </div>
    );
  }

  const { spv, rows, summary } = data;
  const currencySymbol = summary.currency === "USD" ? "$" : summary.currency === "EUR" ? "€" : "£";

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      {spv.opportunity?.id && (
        <a href={`/admin/opportunities/${spv.opportunity.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold mb-4"
          style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
          <ArrowLeft size={13} /> Opportunity
        </a>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase font-bold mb-1" style={{ color: GOLD_DARK }}>
            Cap table
          </p>
          <h1 className="text-[24px] font-bold leading-tight" style={{ color: INK }}>{spv.spvName}</h1>
          <p className="text-[12.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
            {spv.companyNumber} · {spv.property?.title}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting || rows.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-semibold disabled:opacity-50"
          style={{ backgroundColor: NAVY_900, color: "#FFFFFF", border: "none", borderRadius: "8px", cursor: exporting ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export snapshot (CSV)
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Banknote} label="Total raised" value={`${currencySymbol}${parseFloat(summary.totalRaised).toLocaleString("en-GB")}`} primary />
        <SummaryCard icon={Users} label="Investors" value={summary.totalInvestors} />
        <SummaryCard icon={PieChart} label="Units allocated" value={`${summary.totalUnitsAllocated} / ${summary.totalUnits}`} />
        <SummaryCard icon={TrendingUp} label="Subscribed" value={`${summary.pctSubscribed.toFixed(1)}%`} />
      </div>

      {/* Subscription progress bar */}
      <div className="mb-6">
        <div className="h-2 w-full overflow-hidden" style={{ backgroundColor: "rgba(10,31,68,0.06)", borderRadius: "999px" }}>
          <div className="h-full" style={{ width: `${Math.min(100, summary.pctSubscribed)}%`, background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD})`, borderRadius: "999px" }} />
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: TEXT_MUTED }}>
          {summary.unitsRemaining.toLocaleString("en-GB")} units remaining
        </p>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="py-16 text-center" style={{ border: `1px dashed ${BORDER}`, borderRadius: "12px", backgroundColor: "#FAFAFA" }}>
          <FileSpreadsheet size={24} strokeWidth={1.5} style={{ color: TEXT_MUTED, margin: "0 auto" }} />
          <p className="text-[14px] font-semibold mt-2" style={{ color: INK }}>No shareholders yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Allocations will appear here once units are issued.</p>
        </div>
      ) : (
        <div className="overflow-hidden" style={{ border: `1px solid ${BORDER}`, borderRadius: "12px", backgroundColor: "#FFFFFF" }}>
          <div className="grid items-center px-4 py-2.5 text-[10px] tracking-[0.08em] uppercase font-bold"
            style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr", backgroundColor: "#FAFAFA", borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
            <span>Shareholder</span>
            <span className="text-right">Units</span>
            <span className="text-right">Invested</span>
            <span className="text-right">Ownership</span>
          </div>
          {rows.map((r) => (
            <div key={r.userId} className="grid items-center px-4 py-3"
              style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr", borderBottom: `1px solid ${BORDER}` }}>
              <div className="min-w-0 pr-3">
                <p className="text-[13px] font-semibold truncate" style={{ color: INK }}>{r.fullName}</p>
                <p className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>{r.email}</p>
              </div>
              <p className="text-[13px] font-semibold text-right" style={{ color: INK }}>
                {r.totalUnits.toLocaleString("en-GB")}
              </p>
              <p className="text-[13px] font-semibold text-right" style={{ color: INK }}>
                {currencySymbol}{parseFloat(r.totalInvested).toLocaleString("en-GB")}
              </p>
              <p className="text-[13px] font-bold text-right" style={{ color: GOLD_DARK }}>
                {r.ownershipPct?.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10.5px]" style={{ color: TEXT_MUTED }}>
        Exporting creates a permanent CapTableSnapshot record (audit trail) and downloads a CSV.
      </p>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, primary }) {
  return (
    <div className="p-3.5" style={{ backgroundColor: primary ? NAVY_900 : "#FFFFFF", border: primary ? "none" : `1px solid ${BORDER}`, borderRadius: "12px" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: primary ? GOLD : GOLD_DARK }} />
        <span className="text-[10px] tracking-[0.08em] uppercase font-bold" style={{ color: primary ? "rgba(248,244,236,0.6)" : TEXT_MUTED }}>
          {label}
        </span>
      </div>
      <p className="text-[20px] font-bold leading-none" style={{ color: primary ? "#F8F4EC" : INK }}>{value}</p>
    </div>
  );
}