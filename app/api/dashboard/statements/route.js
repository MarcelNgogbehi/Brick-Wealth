// app/api/dashboard/statements/route.js
//
// GET  /api/dashboard/statements?action=years
//        → returns available tax years for this investor ({ uk, calendar })
//
// GET  /api/dashboard/statements?taxYear=2025/26&system=UK_SA
//        → returns the structured statement payload (for on-screen preview)
//
// POST /api/dashboard/statements    body: { taxYear, system }
//        → generates the Annual Statement PDF and returns it as a download
//
// All record-and-report. PDF carries the "not tax advice" disclaimer.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  buildInvestorTaxStatement,
  listAvailableTaxYearsForInvestor,
} from "@/lib/db";

const VALID_SYSTEMS = new Set(["UK_SA", "CALENDAR"]);

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { searchParams } = new URL(request.url);

    // Mode 1: list available years (for dropdowns)
    if (searchParams.get("action") === "years") {
      const years = await listAvailableTaxYearsForInvestor(user.id);
      return NextResponse.json({ success: true, years });
    }

    // Mode 2: fetch a specific statement (preview)
    const taxYear = searchParams.get("taxYear");
    const system = searchParams.get("system") || "UK_SA";

    if (!taxYear) {
      return NextResponse.json({ success: false, message: "taxYear is required" }, { status: 400 });
    }
    if (!VALID_SYSTEMS.has(system)) {
      return NextResponse.json({ success: false, message: "Unknown system" }, { status: 400 });
    }

    try {
      const statement = await buildInvestorTaxStatement({
        userId: user.id,
        taxYear,
        system,
      });
      return NextResponse.json({ success: true, statement });
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  });
}

// ─── POST: generate + download PDF ───────────────────────────────────
export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const user = await requireDashboardUser();

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const taxYear = typeof body?.taxYear === "string" ? body.taxYear : null;
    const system = typeof body?.system === "string" ? body.system : "UK_SA";

    if (!taxYear) {
      return NextResponse.json({ success: false, message: "taxYear is required" }, { status: 400 });
    }
    if (!VALID_SYSTEMS.has(system)) {
      return NextResponse.json({ success: false, message: "Unknown system" }, { status: 400 });
    }

    try {
      const statement = await buildInvestorTaxStatement({
        userId: user.id,
        taxYear,
        system,
      });

      // Dynamic import — keep @react-pdf out of the cold path
      const { generateAnnualStatementPdf, buildStatementFields } =
        await import("@/lib/tax-statement");

      const fields = buildStatementFields({ statement });
      const buffer = await generateAnnualStatementPdf(fields);

      const yearSafe = String(taxYear).replace("/", "-");
      const filename = `brick-and-wealth-annual-statement-${yearSafe}.pdf`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.length),
          "Cache-Control": "private, no-store",
        },
      });
    } catch (err) {
      console.error("[statements.POST] failed:", err?.message);
      return NextResponse.json({ success: false, message: err.message || "Failed to generate statement" }, { status: 400 });
    }
  });
}