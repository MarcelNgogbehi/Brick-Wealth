// app/api/dashboard/sales/[id]/route.js
//
// GET   /api/dashboard/sales/[id]  — one sale request (own only)
// PATCH /api/dashboard/sales/[id]  — { action: "cancel" }

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getSaleRequestForInvestor,
  cancelSaleRequestByInvestor,
} from "@/lib/db";

export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;
    const saleRequest = await getSaleRequestForInvestor({ requestId: id, userId: user.id });
    if (!saleRequest) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, saleRequest });
  });
}

const PatchSchema = z.object({ action: z.enum(["cancel"]) }).strict();

export async function PATCH(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const user = await requireDashboardUser();
    const { id } = await params;

    let raw;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 }); }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }

    try {
      const updated = await cancelSaleRequestByInvestor({ requestId: id, userId: user.id });
      return NextResponse.json({
        success: true,
        saleRequest: { id: updated.id, status: updated.status },
        message: "Sale request cancelled",
      });
    } catch (err) {
      return NextResponse.json({ success: false, message: err?.message || "Failed" }, { status: 400 });
    }
  });
}