"use client";

// app/admin/_components/MediaUploader.jsx
//
// Reusable admin media upload widgets backed by UploadThing.
// Files are uploaded straight to UploadThing's CDN from the browser; we then
// either store the returned URL on a form field (SingleMediaUpload) or persist
// a PropertyImage record via the images API (PropertyImageGallery).
//
// No more pasting URLs — admins upload the actual picture / video file.

import { useRef, useState } from "react";
import { Loader2, Upload, X, Star, Trash2, ImageIcon, Film, AlertCircle } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing-client";
import { useDialog } from "@/components/ConfirmDialog";

const GOLD = "#C9A24A";
const BORDER = "#E4E4E7";
const BORDER_STRONG = "#D4D4D8";
const BG_SURFACE = "#FAFAFA";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#4A5468";
const TEXT_MUTED = "#8A93A6";
const DANGER = "#9B2C2C";
const DANGER_BG = "#FBEAEA";
const SUCCESS = "#0F6E56";

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// Pull the public CDN url out of whatever UploadThing's client returns.
function extractUrl(result) {
  const item = Array.isArray(result) ? result[0] : result;
  if (!item) return null;
  return item.ufsUrl || item.url || item.serverData?.fileUrl || null;
}

// ════════════════════════════════════════════════════════════════════
// SINGLE MEDIA UPLOAD — for a single image or video stored as a URL on a form
// ════════════════════════════════════════════════════════════════════
export function SingleMediaUpload({
  endpoint,
  kind = "image",          // "image" | "video"
  value,
  onChange,
  accept,
  hint,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const isVideo = kind === "video";
  const Icon = isVideo ? Film : ImageIcon;
  const defaultAccept = isVideo ? "video/*" : "image/*";

  async function handleFile(file) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const res = await uploadFiles(endpoint, { files: [file] });
      const url = extractUrl(res);
      if (!url) throw new Error("Upload did not return a URL");
      onChange(url);
    } catch (e) {
      setErr(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="space-y-2">
          <div
            className="aspect-[16/9] overflow-hidden grid place-items-center"
            style={{ backgroundColor: "#000", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
          >
            {isVideo ? (
              <video src={value} controls className="w-full h-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
              style={{ color: TEXT_SECONDARY, backgroundColor: "#FFFFFF", border: `1px solid ${BORDER_STRONG}`, borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
              style={{ color: DANGER, backgroundColor: DANGER_BG, border: `1px solid ${DANGER}30`, borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 transition-colors disabled:opacity-60"
          style={{ backgroundColor: BG_SURFACE, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "10px", cursor: uploading ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
          ) : (
            <Icon size={22} style={{ color: TEXT_MUTED }} strokeWidth={1.6} />
          )}
          <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
            {uploading ? "Uploading…" : `Upload ${isVideo ? "a video" : "an image"}`}
          </span>
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {hint || (isVideo ? "MP4 / MOV / WebM · up to 128MB" : "JPG / PNG / WebP · up to 8MB")}
          </span>
        </button>
      )}

      {err && (
        <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: DANGER }}>
          <AlertCircle size={11} /> {err}
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY IMAGE GALLERY — multi-image upload + hero selection + delete
// ════════════════════════════════════════════════════════════════════
export function PropertyImageGallery({ propertyId, images = [], onReload }) {
  const { confirm } = useDialog();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setErr(null);
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadFiles("propertyImage", { files: [file] });
        const url = extractUrl(res);
        if (!url) throw new Error(`Upload failed for ${file.name}`);

        const saveRes = await fetch(`/api/admin/properties/${propertyId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
          credentials: "same-origin",
          body: JSON.stringify({
            fileUrl: url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            // First image on a property with none becomes the hero automatically.
            isHero: images.length === 0 && i === 0,
          }),
        });
        if (!saveRes.ok) {
          const j = await saveRes.json().catch(() => ({}));
          throw new Error(j?.message || `Failed to save ${file.name}`);
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      onReload?.();
    } catch (e) {
      setErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  async function setHero(imageId) {
    setBusyId(imageId);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ imageId, action: "set_hero" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to set hero");
      }
      onReload?.();
    } catch (e) {
      setErr(e?.message || "Failed to set hero");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(image) {
    const ok = await confirm({
      title: "Delete this image?",
      message: "This permanently removes the image from the property.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(image.id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
        credentials: "same-origin",
        body: JSON.stringify({ imageId: image.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to delete");
      }
      onReload?.();
    } catch (e) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Existing images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group overflow-hidden"
              style={{ border: `1px solid ${img.isHero ? GOLD : BORDER}`, borderRadius: "10px" }}
            >
              <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: BG_SURFACE }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.fileUrl} alt={img.altText || img.fileName || "Property image"} className="w-full h-full object-cover" />
              </div>

              {img.isHero && (
                <span
                  className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase"
                  style={{ backgroundColor: GOLD, color: "#FFFFFF", borderRadius: "4px" }}
                >
                  <Star size={9} fill="#FFFFFF" /> Hero
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-2 flex items-center gap-1.5" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.55))" }}>
                {!img.isHero && (
                  <button
                    type="button"
                    onClick={() => setHero(img.id)}
                    disabled={busyId === img.id}
                    className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "rgba(255,255,255,0.92)", color: TEXT_PRIMARY, border: "none", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" }}
                    title="Set as hero image"
                  >
                    {busyId === img.id ? <Loader2 size={10} className="animate-spin" /> : <Star size={10} />} Hero
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(img)}
                  disabled={busyId === img.id}
                  className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold ml-auto disabled:opacity-50"
                  style={{ backgroundColor: "rgba(155,44,44,0.92)", color: "#FFFFFF", border: "none", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" }}
                  title="Delete image"
                >
                  {busyId === img.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dropzone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center gap-2 py-7 px-4 transition-colors disabled:opacity-60"
        style={{ backgroundColor: BG_SURFACE, border: `1px dashed ${BORDER_STRONG}`, borderRadius: "10px", cursor: uploading ? "wait" : "pointer", fontFamily: "inherit" }}
      >
        {uploading ? (
          <>
            <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
            <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              Uploading {progress.done}/{progress.total}…
            </span>
          </>
        ) : (
          <>
            <Upload size={22} style={{ color: TEXT_MUTED }} strokeWidth={1.6} />
            <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              {images.length > 0 ? "Add more images" : "Upload property images"}
            </span>
            <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
              JPG / PNG / WebP · up to 8MB each · select multiple
            </span>
          </>
        )}
      </button>

      {images.length > 0 && (
        <p className="text-[11px] mt-2" style={{ color: TEXT_MUTED }}>
          {images.length} image{images.length === 1 ? "" : "s"} ·{" "}
          <span style={{ color: SUCCESS }}>the hero image is shown first to investors</span>
        </p>
      )}

      {err && (
        <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: DANGER }}>
          <AlertCircle size={11} /> {err}
        </p>
      )}
    </div>
  );
}
