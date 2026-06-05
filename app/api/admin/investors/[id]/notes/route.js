// app/api/admin/investors/[id]/notes/route.js
//
// GET   /api/admin/investors/[id]/notes — List all notes
// POST  /api/admin/investors/[id]/notes — Add a new note

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  addAdminNote,
  getNotesForInvestor,
  findUserById,
} from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const notes = await getNotesForInvestor(id);
    return successResponse({ notes });
  });
}

const NoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(5000, "Note too long"),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();
    const { id: targetUserId } = await params;

    // Verify target exists
    const target = await findUserById(targetUserId);
    if (!target) {
      return errorResponse("Investor not found", 404);
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = NoteSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid note",
        400
      );
    }

    const note = await addAdminNote({
      targetUserId,
      authorAdminId: admin.id,
      content: parsed.data.content,
    });

    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.INVESTOR_NOTE_ADDED,
      entityType: "user",
      entityId: targetUserId,
      metadata: { noteId: note.id, contentPreview: parsed.data.content.slice(0, 100) },
      request,
    });

    return successResponse({
      message: "Note added",
      note,
    });
  });
}