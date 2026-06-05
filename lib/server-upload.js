// lib/server-upload.js
//
// PHASE 5 MSG 4 — Server-side file upload helper.
//
// Generated PDFs (certificates, agreements) are Buffers created on the
// server. This helper uploads a Buffer to UploadThing using UTApi and
// returns { url }.
//
// The certificate/agreement routes pass `uploadServerFile` as `uploadFn`
// to the db generation functions, keeping db.js storage-agnostic.
//
// ────────────────────────────────────────────────────────────────────
// ADAPT TO YOUR SETUP
//
// You already use UploadThing for KYC + property images (client-side).
// This is the SERVER-side equivalent using UTApi. It needs your
// UPLOADTHING_TOKEN (or UPLOADTHING_SECRET on older SDKs) in env.
//
// If your UploadThing SDK version differs, the upload call shape may
// vary slightly — check the @uploadthing/server / uploadthing docs for
// UTApi.uploadFiles. The return shape is normalised below.
// ────────────────────────────────────────────────────────────────────

import { UTApi } from "uploadthing/server";

let _utapi = null;
function getUtApi() {
  if (!_utapi) {
    // UTApi reads UPLOADTHING_TOKEN from env automatically on v7+.
    // On older versions, pass { apiKey: process.env.UPLOADTHING_SECRET }.
    _utapi = new UTApi();
  }
  return _utapi;
}

/**
 * Upload a Buffer to UploadThing.
 * @param {Buffer} buffer  - the file bytes (PDF)
 * @param {string} filename - desired filename, e.g. "certificate-BW-HC-0001.pdf"
 * @returns {Promise<{ url: string, key?: string }>}
 */
export async function uploadServerFile(buffer, filename) {
  const utapi = getUtApi();

  // UTApi accepts File/Blob-like objects. Node 18+ has global File/Blob.
  const file = new File([buffer], filename, { type: "application/pdf" });

  const res = await utapi.uploadFiles(file);

  // Normalise response across SDK versions
  // v7+: { data: { url, key, ... }, error }
  // older: { data: { url } } or array
  const data = Array.isArray(res) ? res[0]?.data : res?.data;
  const error = Array.isArray(res) ? res[0]?.error : res?.error;

  if (error || !data?.url) {
    throw new Error(`Upload failed: ${error?.message || "no URL returned"}`);
  }

  return { url: data.url, key: data.key };
}

// ────────────────────────────────────────────────────────────────────
// ALTERNATIVE — if you'd rather store certificates differently
//
// If you use Cloudflare R2, S3, or another store for generated docs,
// replace the body of uploadServerFile() to upload there and return the
// public (or signed) URL. The rest of the pipeline doesn't care where
// the file lives — it just saves the URL on the allocation/subscription.
// ────────────────────────────────────────────────────────────────────