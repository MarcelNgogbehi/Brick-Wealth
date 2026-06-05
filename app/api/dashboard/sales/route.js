// app/api/dashboard/sales/route.js
//
// GET  /api/dashboard/sales            — list investor's sale requests
// GET  /api/dashboard/sales?spvId=...  — sellable-units context for one SPV
// POST /api/dashboard/sales            — create a sale request
//
// (Single-request GET + cancel live in app/api/dashboard/sales/[id]/route.js — below.)

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getSellableUnits,
  createShareSaleRequest,
  listSaleRequestsForInvestor,
} from "@/lib/db";
import {
  notifySaleRequestReceived,
  notifyAdminOfSaleRequest,
} from "@/lib/notify";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { searchParams } = new URL(request.url);
    const spvId = searchParams.get("spvId");

    // Context mode — how many units can this user sell in this SPV?
    if (spvId) {
      const [sellable, spv, holding] = await Promise.all([
        getSellableUnits({ userId: user.id, spvId }),
        prisma.spv.findUnique({
          where: { id: spvId },
          select: { id: true, spvName: true, unitPrice: true, currency: true },
        }),
        prisma.holding.findUnique({
          where: { userId_spvId: { userId: user.id, spvId } },
        }),
      ]);
      if (!spv) {
        return NextResponse.json({ success: false, message: "SPV not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        spv: { id: spv.id, spvName: spv.spvName, unitPrice: spv.unitPrice?.toString(), currency: spv.currency },
        currentHolding: holding
          ? { totalUnits: holding.totalUnits, ownershipPct: holding.ownershipPct }
          : null,
        sellableUnits: sellable,
      });
    }

    // List mode
    const status = searchParams.get("status") || undefined;
    const result = await listSaleRequestsForInvestor({ userId: user.id, status });
    return NextResponse.json({ success: true, ...result });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create sale request
// ────────────────────────────────────────────────────────────────────
const Schema = z.object({
  spvId: z.string().min(1),
  unitsOffered: z.number().int().positive(),
  investorNote: z.string().max(2000).optional(),
}).strict();

export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const user = await requireDashboardUser();

    let raw;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 }); }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      const sale = await createShareSaleRequest({
        userId: user.id,
        spvId: parsed.data.spvId,
        unitsOffered: parsed.data.unitsOffered,
        investorNote: parsed.data.investorNote,
      });

      // Context for notification copy
      const spv = await prisma.spv.findUnique({
        where: { id: parsed.data.spvId },
        select: { spvName: true },
      });
      const spvName = spv?.spvName || "your SPV";
      const currencySymbol =
        sale.currency === "USD" ? "$" : sale.currency === "EUR" ? "€" : "£";

      notifySaleRequestReceived({
        userId: user.id,
        spvName,
        requestId: sale.id,
        unitsOffered: sale.unitsOffered,
      });
      notifyAdminOfSaleRequest({
        investorName: user.fullName,
        spvName,
        requestId: sale.id,
        unitsOffered: sale.unitsOffered,
        currencySymbol,
        indicativeAmount: sale.indicativeAmount?.toString(),
      });

      return NextResponse.json({
        success: true,
        saleRequest: { id: sale.id, status: sale.status, unitsOffered: sale.unitsOffered },
        message: "Sale request submitted",
      });
    } catch (err) {
      return NextResponse.json({ success: false, message: err?.message || "Failed" }, { status: 400 });
    }
  });
}