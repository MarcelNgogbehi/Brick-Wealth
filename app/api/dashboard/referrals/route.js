// app/api/dashboard/referrals/route.js
//
// GET  /api/dashboard/referrals          — my code + referees + counts
// GET  /api/dashboard/referrals?tree=1   — my referral network (chain)
// POST /api/dashboard/referrals          — { action: "rotate" } mint a new code
//
// Recognition only — no rewards, no amounts. The investor's "Invite &
// Referrals" page reads from here.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getReferralOverviewForInvestor,
  getReferralTreeForInvestor,
  rotateReferralCode,
} from "@/lib/db";

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("tree") === "1") {
      const tree = await getReferralTreeForInvestor({ userId: user.id, maxDepth: 3 });
      return NextResponse.json({ success: true, tree });
    }

    const overview = await getReferralOverviewForInvestor(user.id);
    return NextResponse.json({ success: true, ...overview });
  });
}

// ─── POST (rotate code) ──────────────────────────────────────────────
export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const user = await requireDashboardUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    if (body?.action === "rotate") {
      const code = await rotateReferralCode({ userId: user.id });
      return NextResponse.json({
        success: true,
        message: "New referral link generated. Your old link no longer works.",
        code: {
          code: code.code,
          maxUses: code.maxUses,
          useCount: code.useCount,
          remaining: Math.max(0, code.maxUses - code.useCount),
          isActive: code.isActive,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  });
}