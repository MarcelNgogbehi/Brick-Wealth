// app/api/admin/spvs/[id]/cap-table/route.js
//
// GET  /api/admin/spvs/[id]/cap-table          — live cap table
// POST /api/admin/spvs/[id]/cap-table          — create snapshot + CSV
//
// The live GET is the read view. The POST persists a CapTableSnapshot
// and returns CSV content the admin can download.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getCapTableForSpv,
  createCapTableSnapshot,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET — live cap table
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const capTable = await getCapTableForSpv(id);
    if (!capTable) {
      return NextResponse.json(
        { success: false, message: "SPV not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...capTable });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — snapshot + CSV
// ────────────────────────────────────────────────────────────────────
export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();
    const { id } = await params;

    try {
      const { snapshot, spv, holdingsJson } = await createCapTableSnapshot({
        spvId: id,
        adminId: admin.id,
      });

      // Build CSV
      const headers = [
        "Shareholder", "Email", "Address", "Units", "Amount Invested",
        "Ownership %", "First Invested",
      ];
      const lines = [headers.join(",")];
      for (const h of holdingsJson) {
        lines.push([
          csvEscape(h.fullName),
          csvEscape(h.email),
          csvEscape(h.address),
          h.totalUnits,
          h.totalInvested,
          (h.ownershipPct ?? 0).toFixed(4),
          h.firstInvestedAt ? new Date(h.firstInvestedAt).toISOString().slice(0, 10) : "",
        ].join(","));
      }
      const csv = lines.join("\n");

      await logAdminAction({
        adminId: admin.id,
        action: "cap_table.exported",
        entityType: "spv",
        entityId: id,
        metadata: {
          snapshotId: snapshot.id,
          totalInvestors: snapshot.totalInvestors,
          totalUnitsAllocated: snapshot.totalUnitsAllocated,
        },
        request,
      }).catch(() => {});

      const filename = `cap-table-${spv.companyNumber || id}-${new Date().toISOString().slice(0, 10)}.csv`;

      return NextResponse.json({
        success: true,
        snapshot: {
          id: snapshot.id,
          snapshotDate: snapshot.snapshotDate,
          totalInvestors: snapshot.totalInvestors,
          totalUnitsAllocated: snapshot.totalUnitsAllocated,
          totalRaised: snapshot.totalRaised?.toString(),
        },
        csv,
        filename,
        message: "Cap table snapshot created",
      });
    } catch (err) {
      const msg = err?.message || "Snapshot failed";
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }
  });
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}