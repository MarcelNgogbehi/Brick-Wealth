"use client";

// app/dashboard/_components/ProofOfPaymentUpload.jsx
//
// Proof-of-payment upload widget for a subscription.
//
// FLOW (mirrors your KYC upload pattern):
//   1. User selects/drops a file
//   2. File uploads to UploadThing endpoint → returns a URL
//   3. We POST { fileUrl, fileName } to
//      /api/dashboard/subscriptions/[id]/proof
//   4. Subscription flips SUBMITTED → UNDER_REVIEW
//
// ADAPT: set UPLOAD_ENDPOINT to your existing UploadThing route.
// If your route returns a different shape, adjust extractUrl().
//
// Usage:
//   <ProofOfPaymentUpload
//     subscriptionId={sub.id}
//     bankDetails={{ accountName, reference, amount, currencySymbol }}
//     existingProofUrl={sub.proofOfPaymentUrl}
//     onUploaded={(sub) => {...}}
//   />

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, Loader2, AlertCircle,
  Landmark, X, Eye,
} from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing-client";

const NAVY_900 = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#F8F3E5";
const GOLD_DARK = "#9A7A2E";
const CREAM = "#F8F4EC";
const INK = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";
const SUCCESS = "#0F6E56";
const SUCCESS_BG = "#E8F4F0";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function ProofOfPaymentUpload({
  subscriptionId,
  bankDetails = {},
  existingProofUrl = null,
  existingProofName = null,
  hideBankDetails = false,
  onUploaded,
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(!!existingProofUrl);
  const [proofUrl, setProofUrl] = useState(existingProofUrl);
  const [proofName, setProofName] = useState(existingProofName);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const { accountName, accountNumber, sortCode, reference, amount, currencySymbol } = bankDetails;

  function pickFile(f) {
    setError(null);
    if (!f) return;
    const okTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!okTypes.includes(f.type)) {
      setError("Please upload a JPG, PNG, or PDF.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Upload to UploadThing's proofOfPayment router
      const res = await uploadFiles("proofOfPayment", { files: [file] });
      if (!res?.[0]?.ufsUrl) throw new Error("Upload failed — no URL returned.");

      const fileUrl  = res[0].ufsUrl;
      const fileName = res[0].name || file.name;

      // 2. Record the URL on the subscription and advance status to UNDER_REVIEW
      const recRes = await fetch(`/api/dashboard/subscriptions/${subscriptionId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ fileUrl, fileName }),
      });
      const recData = await recRes.json();
      if (!recData.success) {
        throw new Error(recData.message || "Could not record proof of payment");
      }

      setProofUrl(fileUrl);
      setProofName(fileName);
      setDone(true);
      setFile(null);
      if (onUploaded) onUploaded(recData.subscription);
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
    setUploading(false);
  }

  return (
    <div
      className="p-5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(10,31,68,0.08)",
        borderRadius: "14px",
      }}
    >
      {/* Bank details */}
      {!hideBankDetails && (
      <div
        className="p-4 mb-4"
        style={{ backgroundColor: "#FBF8F1", border: "1px solid rgba(201,162,74,0.25)", borderRadius: "10px" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Landmark size={15} style={{ color: GOLD_DARK }} />
          <p className="text-[12px] font-bold" style={{ color: GOLD_DARK }}>Make your transfer to</p>
        </div>
        <div className="space-y-1.5 text-[12px]">
          {accountName && <DetailRow label="Account name" value={accountName} />}
          {accountNumber && <DetailRow label="Account number" value={accountNumber} />}
          {sortCode && <DetailRow label="Sort code" value={sortCode} />}
          {reference && <DetailRow label="Reference" value={reference} highlight />}
          {amount && <DetailRow label="Amount" value={`${currencySymbol || "£"}${amount}`} />}
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>
          Use the reference exactly as shown so we can match your payment quickly.
        </p>
      </div>
      )}

      {/* Upload zone OR done state */}
      {done ? (
        <div
          className="p-4 flex items-center gap-3"
          style={{ backgroundColor: SUCCESS_BG, borderRadius: "10px" }}
        >
          <CheckCircle2 size={20} strokeWidth={2} style={{ color: SUCCESS, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold" style={{ color: SUCCESS }}>
              Proof of payment uploaded
            </p>
            <p className="text-[11px] truncate" style={{ color: TEXT_SECONDARY }}>
              {proofName || "Your file"} · awaiting verification
            </p>
          </div>
          {proofUrl && (
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold flex-shrink-0"
              style={{
                backgroundColor: "#FFFFFF",
                color: SUCCESS,
                border: `1px solid ${SUCCESS}30`,
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              <Eye size={11} /> View
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="text-[10px] tracking-[0.14em] uppercase font-bold mb-2" style={{ color: TEXT_MUTED }}>
            Upload proof of payment
          </p>

          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center py-8 px-4 text-center cursor-pointer transition-all"
              style={{
                border: `1.5px dashed ${dragOver ? GOLD : "rgba(10,31,68,0.2)"}`,
                borderRadius: "12px",
                backgroundColor: dragOver ? GOLD_LIGHT : "#FAFAFA",
              }}
            >
              <div
                className="w-11 h-11 grid place-items-center mb-3"
                style={{ backgroundColor: GOLD_LIGHT, borderRadius: "12px" }}
              >
                <Upload size={18} style={{ color: GOLD_DARK }} />
              </div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: INK }}>
                Drop your receipt here
              </p>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
                or click to browse · JPG, PNG, or PDF · max 10MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => pickFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div
              className="p-3.5 flex items-center gap-3"
              style={{ border: "1px solid rgba(10,31,68,0.12)", borderRadius: "10px" }}
            >
              <div
                className="w-10 h-10 grid place-items-center flex-shrink-0"
                style={{ backgroundColor: GOLD_LIGHT, borderRadius: "8px" }}
              >
                <FileText size={16} style={{ color: GOLD_DARK }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>{file.name}</p>
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={uploading}
                className="w-7 h-7 grid place-items-center flex-shrink-0"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_MUTED }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {error && (
            <div
              className="mt-3 p-2.5 flex items-start gap-2"
              style={{ backgroundColor: DANGER_BG, borderRadius: "8px" }}
            >
              <AlertCircle size={13} style={{ color: DANGER, flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px]" style={{ color: DANGER }}>{error}</p>
            </div>
          )}

          {file && (
            <motion.button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              whileTap={{ scale: 0.99 }}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold disabled:opacity-60"
              style={{
                backgroundColor: NAVY_900,
                color: CREAM,
                border: "none",
                borderRadius: "10px",
                cursor: uploading ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading..." : "Upload proof of payment"}
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: TEXT_SECONDARY }}>{label}</span>
      <span
        className="font-semibold"
        style={{
          color: highlight ? GOLD_DARK : INK,
          ...(highlight ? { padding: "1px 8px", backgroundColor: GOLD_LIGHT, borderRadius: "5px" } : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}