// app/api/onboarding/kyc/route.js
//
// POST /api/onboarding/kyc
// Called when user clicks "Submit Documents" after uploading.
// Documents are already in DB (uploaded directly via UploadThing).
// This endpoint verifies all required docs exist + advances the wizard.

import { getCurrentUser } from "@/lib/session";
import { getUserKycDocuments, markKycSubmitted, updateOnboardingStep } from "@/lib/db";
import { verifyCsrf, errorResponse, successResponse } from "@/lib/auth";
import { log } from "@/lib/logger";

const REQUIRED_DOCUMENTS = ["id_front", "id_back", "proof_of_address", "selfie", "source_of_funds"];

export async function POST(request) {
  if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required", 401);

  // User must complete profile first
  if (!user.onboardingComplete) {
    return errorResponse("Please complete your profile first", 400);
  }

  try {
    const docs = await getUserKycDocuments(user.id);
    const uploadedTypes = new Set(docs.map((d) => d.documentType));

    const missing = REQUIRED_DOCUMENTS.filter((t) => !uploadedTypes.has(t));
    if (missing.length > 0) {
      return errorResponse("Please upload all required documents", 400, {
        missing,
      });
    }

    await markKycSubmitted(user.id);
    await updateOnboardingStep(user.id, "consents", { kycSubmittedAt: new Date() });

    log.audit("user.kyc_submitted", { userId: user.id });

    return successResponse({
      message: "KYC documents submitted for review",
      nextStep: "consents",
    });
  } catch (err) {
    log.error("onboarding.kyc.error", { userId: user.id, error: err?.message });
    return errorResponse("Failed to submit KYC. Please try again.", 500);
  }
}