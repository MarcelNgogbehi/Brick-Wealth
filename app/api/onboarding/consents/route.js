// app/api/onboarding/consents/route.js
//
// POST /api/onboarding/consents
// Saves all the consent ticks. Each consent gets its own row with
// timestamp, IP, and document version — full audit trail.

import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import {
  recordConsent,
  markConsentsComplete,
  updateOnboardingStep,
  activateAccountIfReady,
} from "@/lib/db";
import {
  verifyCsrf,
  errorResponse,
  successResponse,
  getClientIp,
  getUserAgent,
} from "@/lib/auth";
import { log } from "@/lib/logger";

// Bump these when documents change. Old user rows preserve old versions.
const DOCUMENT_VERSIONS = {
  terms_of_service: "v1.0",
  privacy_policy: "v1.0",
  risk_warning: "v1.0",
  cookie_policy: "v1.0",
  data_processing: "v1.0",
  marketing_emails: "v1.0",
};

// All required consents must be true. Marketing is optional.
const REQUIRED = ["terms_of_service", "privacy_policy", "risk_warning", "data_processing"];
const OPTIONAL = ["cookie_policy", "marketing_emails"];

const ConsentSchema = z.object({
  terms_of_service: z.boolean(),
  privacy_policy: z.boolean(),
  risk_warning: z.boolean(),
  cookie_policy: z.boolean(),
  data_processing: z.boolean(),
  marketing_emails: z.boolean(),
}).strict();

export async function POST(request) {
  if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required", 401);

  // NOTE: KYC is intentionally NOT required here. Investors may defer their
  // identity-document upload and still activate their account — they simply
  // cannot subscribe until KYC is approved (enforced in
  // checkSubscriptionEligibility). Profile completion is still required.
  if (!user.onboardingComplete) {
    return errorResponse("Please complete your profile before consenting", 400);
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const parsed = ConsentSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse("Invalid consent data", 400);
  }

  // All required consents must be ticked
  const missing = REQUIRED.filter((k) => parsed.data[k] !== true);
  if (missing.length > 0) {
    return errorResponse("Please accept all required terms to continue", 400, {
      consents: `Missing: ${missing.join(", ")}`,
    });
  }

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    // Record each consent individually — full audit trail
    const allTypes = [...REQUIRED, ...OPTIONAL];
    await Promise.all(
      allTypes.map((type) =>
        recordConsent({
          userId: user.id,
          consentType: type,
          documentVersion: DOCUMENT_VERSIONS[type],
          granted: parsed.data[type] === true,
          ip,
          userAgent,
        })
      )
    );

    await markConsentsComplete(user.id);
    await updateOnboardingStep(user.id, "done", {
      consentsAt: new Date(),
      completedAt: new Date(),
    });

    // If everything is complete, flip the activated flag
    await activateAccountIfReady(user.id);

    log.audit("user.consents_completed", {
      userId: user.id,
      marketing: parsed.data.marketing_emails,
    });

    return successResponse({
      message: "Welcome to Bricks & Wealth",
      redirectUrl: "/dashboard",
    });
  } catch (err) {
    log.error("onboarding.consents.error", { userId: user.id, error: err?.message });
    return errorResponse("Failed to save consents. Please try again.", 500);
  }
}