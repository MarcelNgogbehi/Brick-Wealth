// app/api/dashboard/assistance/route.js
//
// POST /api/dashboard/assistance
// Investor sends a help/feedback request.
// Creates a Notification for every admin + super_admin user so it
// appears in the admin notifications feed with full context.
// Also creates a confirmation notification for the investor themselves.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { createNotificationRow } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const PURPOSES = ["General Enquiry", "Technical Issue", "Investment Query", "Document Request", "Feedback", "Complaint", "Other"];

const Schema = z.object({
  purpose:  z.string().min(1).max(100),
  message:  z.string().min(10, "Please provide more detail (min 10 characters)").max(2000),
  urgency:  z.enum(["normal", "urgent"]).optional().default("normal"),
}).strict();

export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    const user = await requireDashboardUser();

    let raw;
    try { raw = await request.json(); }
    catch {
      return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
    }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input",
      }, { status: 400 });
    }

    const { purpose, message, urgency } = parsed.data;

    // Investor full name + email for admin notification body
    const investorName  = user.fullName || user.email;
    const investorEmail = user.email;
    const now           = new Date().toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });

    // Find all admin / super_admin users to notify
    const admins = await prisma.user.findMany({
      where: { OR: [{ role: "admin" }, { role: "super_admin" }] },
      select: { id: true },
    });

    const urgencyTag = urgency === "urgent" ? " 🔴 URGENT" : "";
    const adminTitle = `${urgencyTag}Assistance Request — ${investorName}`.trim();
    const adminBody  = `Purpose: ${purpose}\nFrom: ${investorName} (${investorEmail})\nSent: ${now}\n\n"${message}"`;

    // Create a notification for each admin
    await Promise.all(
      admins.map((admin) =>
        createNotificationRow({
          userId:   admin.id,
          category: "investor_assistance",
          title:    adminTitle,
          body:     adminBody,
          link:     `/admin/investors`,
          metadata: {
            investorId:    user.id,
            investorName,
            investorEmail,
            purpose,
            urgency,
            message,
            sentAt: new Date().toISOString(),
          },
        })
      )
    );

    // Confirmation notification for the investor
    await createNotificationRow({
      userId:   user.id,
      category: "support_confirmation",
      title:    `Your ${purpose} request has been received`,
      body:     `Our team has been notified and will respond within 1–2 business days. If urgent, please mark it accordingly next time.`,
      metadata: { purpose, sentAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: "Your request has been sent to our team.",
    });
  });
}
