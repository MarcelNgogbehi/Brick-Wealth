// app/api/admin/opportunities/route.js
//
// GET  /api/admin/opportunities — list with search/filter/pagination
// POST /api/admin/opportunities — create new opportunity from SPV

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listOpportunities, createOpportunity } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const opts = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      investorType: searchParams.get("investorType") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "25", 10), 100),
    };

    const result = await listOpportunities(opts);
    return successResponse(result);
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create
// ────────────────────────────────────────────────────────────────────
const CreateSchema = z.object({
  spvId: z.string().min(1, "SPV is required"),
  title: z.string().min(3, "Title required").max(200),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  summary: z.string().max(1000).optional().or(z.literal("")),
  fullDescription: z.string().max(20000).optional().or(z.literal("")),
  riskWarning: z.string().max(5000).optional().or(z.literal("")),
  targetYieldPct: z.number().min(0).max(100).optional().nullable(),
  termMonths: z.number().int().min(0).max(600).optional().nullable(),
  projectedReturnPct: z.number().min(0).max(1000).optional().nullable(),
  requiresKyc: z.boolean().optional().default(false),
  eligibleInvestorTypes: z.array(z.enum(["retail", "sophisticated", "hnw"]))
    .min(1, "At least one investor type required")
    .default(["retail", "sophisticated", "hnw"]),
  requiresSuitabilityCheck: z.boolean().optional().default(false),
  openDate: z.string().optional().or(z.literal("")),
  closeDate: z.string().optional().or(z.literal("")),
}).strict();

export async function POST(request) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    try {
      const opportunity = await createOpportunity({
        ...parsed.data,
        createdById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.created",
        entityType: "opportunity",
        entityId: opportunity.id,
        after: {
          title: opportunity.title,
          spvId: opportunity.spvId,
          status: opportunity.status,
        },
        request,
      });

      return successResponse({ opportunity }, { status: 201 });
    } catch (err) {
      log.error("opportunity.create.error", { error: err?.message });
      if (err.message?.includes("already has an opportunity") ||
          err.message?.includes("SPV not found")) {
        return errorResponse(err.message, 409);
      }
      return errorResponse("Failed to create opportunity", 500);
    }
  });
}