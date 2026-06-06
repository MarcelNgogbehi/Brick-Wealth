// app/api/admin/leads/[id]/route.js
//
// PATCH  /api/admin/leads/:id   — update triage status and/or internal notes
// DELETE /api/admin/leads/:id   — remove a lead (spam / duplicate)

import { successResponse, errorResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getLeadById, updateLead, deleteLead } from "@/lib/db";
import { LeadUpdateSchema, zodFieldErrors } from "@/lib/schemas";
import { log } from "@/lib/logger";

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = LeadUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Please correct the errors below", 400, zodFieldErrors(parsed.error));
    }

    try {
      const existing = await getLeadById(id);
      if (!existing) return errorResponse("Lead not found", 404);

      const lead = await updateLead(id, {
        status: parsed.data.status,
        notes: parsed.data.notes,
        handledById: admin.id,
      });

      log.audit("lead.updated", {
        leadId: id,
        actorAdminId: admin.id,
        status: parsed.data.status ?? existing.status,
      });

      return successResponse({ lead });
    } catch (err) {
      log.error("admin.leads.update_error", { leadId: id, error: err?.message });
      return errorResponse("Failed to update lead", 500);
    }
  });
}

export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;

    try {
      const existing = await getLeadById(id);
      if (!existing) return errorResponse("Lead not found", 404);

      await deleteLead(id);
      log.audit("lead.deleted", { leadId: id, actorAdminId: admin.id });

      return successResponse({ deleted: true });
    } catch (err) {
      log.error("admin.leads.delete_error", { leadId: id, error: err?.message });
      return errorResponse("Failed to delete lead", 500);
    }
  });
}
