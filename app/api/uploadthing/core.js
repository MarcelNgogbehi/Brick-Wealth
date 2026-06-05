// app/api/uploadthing/core.js
//
// UploadThing file route definitions.
// Defines what files can be uploaded, by whom, with what constraints.
// File data is stored at UploadThing's CDN; we save the URL to our DB.
//
// AUTH FLOWS:
// - INVESTOR routes (kycDocument, kycSelfie, proofOfPayment): getCurrentUser() → session_token cookie
// - ADMIN routes (propertyImage, opportunityImage, opportunityDocument): requireAdminForUpload() → admin_session cookie
//
// NOTE: file.ufsUrl is used throughout (file.url is deprecated in UploadThing v7).

import { z } from "zod";
import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { saveKycDocument, findSessionByTokenHash, setUserAvatar } from "@/lib/db";
import { hashToken } from "@/lib/auth";

const f = createUploadthing();

// ─── Admin auth helper ────────────────────────────────────────────────────────
async function requireAdminForUpload() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  if (!sessionToken) throw new UploadThingError("Admin authentication required");

  const sessionRow = await findSessionByTokenHash(hashToken(sessionToken));
  if (!sessionRow?.user) throw new UploadThingError("Invalid admin session");

  const user = sessionRow.user;
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new UploadThingError("Admin role required");
  }
  if (user.suspendedAt) throw new UploadThingError("Account suspended");

  return { userId: user.id, role: user.role };
}

// ─── Investor auth helper ─────────────────────────────────────────────────────
async function requireInvestorForUpload() {
  const user = await getCurrentUser();
  if (!user) throw new UploadThingError("Authentication required");
  return { userId: user.id };
}

// ════════════════════════════════════════════════════════════════════════════
// FILE ROUTER
// ════════════════════════════════════════════════════════════════════════════
export const ourFileRouter = {

  // ─── KYC documents (investor) ────────────────────────────────────────────
  kycDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf:   { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        documentType: z.enum([
          "id_front",
          "id_back",
          "proof_of_address",
          "source_of_funds",
        ]),
      })
    )
    .middleware(async ({ input }) => {
      const { userId } = await requireInvestorForUpload();
      return { userId, documentType: input.documentType };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await saveKycDocument({
        userId:       metadata.userId,
        documentType: metadata.documentType,
        fileUrl:      file.ufsUrl,
        fileName:     file.name,
        fileSize:     file.size,
        mimeType:     file.type,
      });
      return { uploadedBy: metadata.userId, documentType: metadata.documentType };
    }),

  // ─── Profile avatar (investor) ───────────────────────────────────────────
  // Investor's own profile picture. Uploads to UploadThing, then we persist
  // the CDN URL straight onto the user record (session-authenticated).
  avatar: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await requireInvestorForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      await setUserAvatar(metadata.userId, file.ufsUrl);
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl };
    }),

  // ─── KYC selfie (investor) ───────────────────────────────────────────────
  kycSelfie: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await requireInvestorForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      await saveKycDocument({
        userId:       metadata.userId,
        documentType: "selfie",
        fileUrl:      file.ufsUrl,
        fileName:     file.name,
        fileSize:     file.size,
        mimeType:     file.type,
      });
      return { uploadedBy: metadata.userId };
    }),

  // ─── Proof of payment (investor) ─────────────────────────────────────────
  // Receipt for a subscription payment. Client uploads here, gets the URL
  // back, then POSTs { fileUrl, fileName } to
  // /api/dashboard/subscriptions/[id]/proof to record it on the subscription.
  proofOfPayment: f({
    image: { maxFileSize: "10MB", maxFileCount: 1 },
    pdf:   { maxFileSize: "10MB", maxFileCount: 1 },
  })
    .middleware(async () => await requireInvestorForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        fileUrl:    file.ufsUrl,
        fileName:   file.name,
        fileSize:   file.size,
        mimeType:   file.type,
      };
    }),

  // ─── Property images (admin) ─────────────────────────────────────────────
  propertyImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async () => await requireAdminForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        adminId:     metadata.userId,
        fileUrl:     file.ufsUrl,
        fileName:    file.name,
        fileSize:    file.size,
        mimeType:    file.type,
        storageType: "uploadthing",
      };
    }),

  // ─── Opportunity images (admin) ──────────────────────────────────────────
  opportunityImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async () => await requireAdminForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        adminId:     metadata.userId,
        fileUrl:     file.ufsUrl,
        fileName:    file.name,
        fileSize:    file.size,
        mimeType:    file.type,
        storageType: "uploadthing",
      };
    }),

  // ─── Opportunity walkthrough video (admin) ──────────────────────────────
  opportunityVideo: f({
    video: { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(async () => await requireAdminForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        adminId:     metadata.userId,
        fileUrl:     file.ufsUrl,
        fileName:    file.name,
        fileSize:    file.size,
        mimeType:    file.type,
        storageType: "uploadthing",
      };
    }),

  // ─── Opportunity documents (admin) ───────────────────────────────────────
  opportunityDocument: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => await requireAdminForUpload())
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        adminId:     metadata.userId,
        fileUrl:     file.ufsUrl,
        fileName:    file.name,
        fileSize:    file.size,
        mimeType:    file.type,
        storageType: "uploadthing",
      };
    }),
};

export const config = {
  api: { bodyParser: false },
};
