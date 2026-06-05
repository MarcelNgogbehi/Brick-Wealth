// app/api/admin/spvs/route.js
//
// GET  /api/admin/spvs — list SPVs with property + mortgage
// POST /api/admin/spvs — create new SPV

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listSpvs, createSpv, getSpvByCompanyNumber } from "@/lib/db";
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
      currency: searchParams.get("currency") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "25", 10), 100),
    };

    const result = await listSpvs(opts);
    return successResponse(result);
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create
// ────────────────────────────────────────────────────────────────────
const CreateSpvSchema = z.object({
  spvName: z.string().min(2, "SPV name required").max(200),
  companyNumber: z.string().min(4, "Company number required").max(20),
  jurisdiction: z.string().max(50).default("UK"),
  incorporatedOn: z.string().optional().or(z.literal("")),
  registeredAddress: z.string().max(500).optional().or(z.literal("")),
  purpose: z.string().max(2000).optional().or(z.literal("")),

  propertyId: z.string().min(1, "Property is required"),

  currency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
  targetRaiseAmount: z.number().min(1, "Target raise must be > 0").max(1_000_000_000),
  unitPrice: z.number().min(0.01).max(1_000_000),
  totalUnits: z.number().int().min(1).max(1_000_000),
  minimumUnits: z.number().int().min(1).max(1_000_000).default(1),

  openDate: z.string().optional().or(z.literal("")),
  closeDate: z.string().optional().or(z.literal("")),

  bankAccountReference: z.string().max(100).optional().or(z.literal("")),
  bankAccountName: z.string().max(200).optional().or(z.literal("")),

  status: z.enum(["draft", "active", "closed"]).default("draft"),
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

    const parsed = CreateSpvSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    // Check company number unique
    const existing = await getSpvByCompanyNumber(parsed.data.companyNumber);
    if (existing) {
      return errorResponse("An SPV with this company number already exists", 409, {
        companyNumber: "Already in use",
      });
    }

    try {
      const spv = await createSpv({
        ...parsed.data,
        createdById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "spv.created",
        entityType: "spv",
        entityId: spv.id,
        after: {
          spvName: spv.spvName,
          companyNumber: spv.companyNumber,
          propertyId: spv.propertyId,
          targetRaiseAmount: spv.targetRaiseAmount.toString(),
          currency: spv.currency,
        },
        request,
      });

      return successResponse({ spv }, { status: 201 });
    } catch (err) {
      log.error("spv.create.error", { error: err?.message });
      if (err.message?.includes("already has an SPV")) {
        return errorResponse(err.message, 409);
      }
      return errorResponse("Failed to create SPV", 500);
    }
  });
}