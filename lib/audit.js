// lib/audit.js
//
// Admin action audit logger.
// Every sensitive admin action should call logAdminAction() so we have
// a complete trail for compliance / regulator audits.

import { prisma } from "@/lib/prisma";
import { getClientIp, getUserAgent } from "@/lib/auth";

/**
 * Log an admin action.
 *
 * @param {Object} params
 * @param {string} params.adminId       The admin user's ID
 * @param {string} params.action        e.g. "approve_kyc", "update_user_tags"
 * @param {string} params.entityType    e.g. "user", "kyc_document"
 * @param {string} params.entityId      ID of the entity acted upon
 * @param {Object} [params.before]      State before the change (optional)
 * @param {Object} [params.after]       State after the change (optional)
 * @param {Object} [params.metadata]    Extra context (reason, notes, etc.)
 * @param {Request} [params.request]    The incoming request (for IP/UA)
 */
export async function logAdminAction({
  adminId,
  action,
  entityType,
  entityId,
  before,
  after,
  metadata,
  request,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorAdminId: adminId,
        action,
        entityType,
        entityId,
        beforeJson: before ?? undefined,
        afterJson: after ?? undefined,
        metadata: metadata ?? undefined,
        ipAddress: request ? getClientIp(request) : undefined,
        userAgent: request ? getUserAgent(request) : undefined,
      },
    });
  } catch (err) {
    // Audit failures are critical. Log loudly but don't crash the route —
    // the action itself still succeeded, we just couldn't record it.
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * Query the audit log for a specific entity (e.g. all actions on user X).
 */
export async function getAuditLogForEntity({ entityType, entityId, limit = 50 }) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Query the audit log for a specific admin (e.g. all actions by admin X).
 */
export async function getAuditLogForAdmin({ adminId, limit = 100 }) {
  return prisma.auditLog.findMany({
    where: { actorAdminId: adminId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Recent audit log entries across all admins (for super-admin dashboard).
 */
export async function getRecentAuditActivity({ limit = 20 } = {}) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Standard action types — use these constants instead of free-form strings.
 * Keeps the log queryable and consistent.
 */
export const AUDIT_ACTIONS = {
  // Auth
  ADMIN_LOGIN: "admin.login",
  ADMIN_LOGOUT: "admin.logout",
  ADMIN_LOGIN_FAILED: "admin.login_failed",
  // ... existing actions ...
  ANNOUNCEMENT_CREATED: "announcement.created",
  ANNOUNCEMENT_UPDATED: "announcement.updated",
  ANNOUNCEMENT_DELETED: "announcement.deleted",
  ANNOUNCEMENT_PUBLISHED: "announcement.published",


  // Investor management
  INVESTOR_TAGS_UPDATED: "investor.tags_updated",
  INVESTOR_NOTE_ADDED: "investor.note_added",
  INVESTOR_FLAGGED: "investor.flagged",
  INVESTOR_UNFLAGGED: "investor.unflagged",
  INVESTOR_SUSPENDED: "investor.suspended",
  INVESTOR_UNSUSPENDED: "investor.unsuspended",
  INVESTOR_ROLE_CHANGED: "investor.role_changed",
  INVESTOR_ASSISTANCE_REPLY: "investor.assistance_reply",
  INVESTOR_DELETED: "investor.deleted",

  // KYC
  KYC_APPROVED: "kyc.document_approved",
  KYC_REJECTED: "kyc.document_rejected",
  KYC_ALL_APPROVED: "kyc.all_approved",  // when admin approves all 5 at once
};