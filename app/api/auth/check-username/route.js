// app/api/auth/check-username/route.js
//
// GET /api/auth/check-username?username=xxx
// Real-time availability check. Powers the agent in the register form.

import { NextResponse } from "next/server";
import {
  generateRequestId,
  getClientIp,
  errorResponse,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { findUserByUsername } from "@/lib/db";
import { CheckUsernameSchema } from "@/lib/schemas";
import { log } from "@/lib/logger";

export async function GET(request) {
  const requestId = generateRequestId();
  const ip = getClientIp(request);

  // 30 checks/min per IP — generous for typing, strict enough vs enumeration
  const rl = await rateLimit({
    key: `check-username:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return errorResponse("Too many requests", 429, null, {
      "Retry-After": String(rl.retryAfter || 60),
    });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  const parsed = CheckUsernameSchema.safeParse({ username });
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, reason: "invalid" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const existing = await findUserByUsername(parsed.data.username);
    return NextResponse.json(
      { available: !existing },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          "Pragma": "no-cache",
          "Vary": "Cookie",
        },
      }
    );
  } catch (err) {
    log.error("auth.check_username.error", { requestId, error: err?.message });
    return errorResponse("Service temporarily unavailable", 503);
  }
}