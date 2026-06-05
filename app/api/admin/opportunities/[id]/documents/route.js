// app/api/admin/opportunities/[id]/documents/route.js
//
// POST   /api/admin/opportunities/[id]/documents — register doc metadata
// PATCH  /api/admin/opportunities/[id]/documents — { documentId, ...updates }
// DELETE /api/admin/opportunities/[id]/documents — { documentId }

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getOpportunityById,
  addOpportunityDocument,
  updateOpportunityDocument,
  deleteOpportunityDocument,
} from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

const VALID_CATEGORIES = ["prospectus", "im", "aml", "valuation", "certificate", "legal", "other"];

// ────────────────────────────────────────────────────────────────────
// POST — register new document
// ────────────────────────────────────────────────────────────────────
const AddDocSchema = z.object({
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().max(100).optional(),
  category: z.enum(VALID_CATEGORIES).default("other"),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  isRequired: z.boolean().optional().default(false),
  storageType: z.enum(["uploadthing", "r2"]).optional().default("uploadthing"),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: opportunityId } = await params;

    const opp = await getOpportunityById(opportunityId);
    if (!opp) return errorResponse("Opportunity not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = AddDocSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400
      );
    }

    try {
      const document = await addOpportunityDocument({
        opportunityId,
        ...parsed.data,
        uploadedById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.document_added",
        entityType: "opportunity",
        entityId: opportunityId,
        metadata: {
          documentId: document.id,
          category: document.category,
          fileName: document.fileName,
          storageType: document.storageType,
        },
        request,
      });

      return successResponse({ document }, { status: 201 });
    } catch (err) {
      log.error("opportunity.document.add.error", { error: err?.message });
      return errorResponse("Failed to add document", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — update document metadata
// ────────────────────────────────────────────────────────────────────
const UpdateDocSchema = z.object({
  documentId: z.string().min(1),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: opportunityId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = UpdateDocSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid input", 400);
    }

    const { documentId, ...updates } = parsed.data;

    try {
      const document = await updateOpportunityDocument(documentId, updates);

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.document_updated",
        entityType: "opportunity",
        entityId: opportunityId,
        metadata: { documentId, fieldsChanged: Object.keys(updates) },
        request,
      });

      return successResponse({ document });
    } catch (err) {
      log.error("opportunity.document.update.error", { error: err?.message });
      return errorResponse("Failed to update document", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE — remove a document
// ────────────────────────────────────────────────────────────────────
const DeleteSchema = z.object({
  documentId: z.string().min(1),
}).strict();

export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: opportunityId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = DeleteSchema.safeParse(raw);
    if (!parsed.success) return errorResponse("Invalid input", 400);

    try {
      await deleteOpportunityDocument(parsed.data.documentId);

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.document_deleted",
        entityType: "opportunity",
        entityId: opportunityId,
        metadata: { documentId: parsed.data.documentId },
        request,
      });

      return successResponse({ message: "Document deleted" });
    } catch (err) {
      log.error("opportunity.document.delete.error", { error: err?.message });
      return errorResponse("Failed to delete document", 500);
    }
  });
}