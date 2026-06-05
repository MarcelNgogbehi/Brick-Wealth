// app/api/admin/properties/route.js
//
// GET  /api/admin/properties — list with search/filter/pagination
// POST /api/admin/properties — create new property

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listProperties, createProperty } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// GET — list properties
// ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const opts = {
      search: searchParams.get("search") || undefined,
      city: searchParams.get("city") || undefined,
      country: searchParams.get("country") || undefined,
      status: searchParams.get("status") || undefined,
      propertyType: searchParams.get("propertyType") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "25", 10), 100),
    };

    const result = await listProperties(opts);
    return successResponse(result);
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create property
// ────────────────────────────────────────────────────────────────────
const CreatePropertySchema = z.object({
  title: z.string().min(2, "Title required").max(120),
  addressLine1: z.string().min(2, "Address required").max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "City required").max(80),
  region: z.string().max(80).optional().or(z.literal("")),
  postcode: z.string().min(2, "Postcode required").max(20),
  country: z.string().length(2, "Use ISO country code").default("GB"),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  propertyType: z.enum(["house", "flat", "hmo", "commercial", "mixed_use", "land"]),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),
  sqft: z.number().int().min(0).max(1_000_000).optional().nullable(),
  yearBuilt: z.number().int().min(1500).max(2100).optional().nullable(),
  description: z.string().max(5000).optional().or(z.literal("")),
  story: z.string().max(5000).optional().or(z.literal("")),
  neighbourhoodHighlights: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["draft", "active", "sold"]).default("draft"),
}).strict();

export async function POST(request) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = CreatePropertySchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse(
        firstIssue?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    try {
      const property = await createProperty({
        ...parsed.data,
        createdById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "property.created",
        entityType: "property",
        entityId: property.id,
        after: {
          title: property.title,
          city: property.city,
          propertyType: property.propertyType,
        },
        request,
      });

      return successResponse({ property }, { status: 201 });
    } catch (err) {
      log.error("property.create.error", { error: err?.message });
      return errorResponse("Failed to create property", 500);
    }
  });
}