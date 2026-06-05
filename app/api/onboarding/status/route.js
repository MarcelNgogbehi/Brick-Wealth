// app/api/onboarding/status/route.js
//
// GET /api/onboarding/status
// Returns the user's wizard progress + pre-fill data.

import { getCurrentUser } from "@/lib/session";
import { getOrCreateOnboardingProgress, getUserKycDocuments, getUserConsents } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required", 401);

  const [progress, kycDocs, consents] = await Promise.all([
    getOrCreateOnboardingProgress(user.id),
    getUserKycDocuments(user.id),
    getUserConsents(user.id),
  ]);

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      residency: user.residency,
      country: user.country,
      // Profile fields (may be null if not yet completed)
      dateOfBirth: user.dateOfBirth,
      ageConfirmed: user.ageConfirmed,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      region: user.region,
      postcode: user.postcode,
      phoneNumber: user.phoneNumber,
      occupation: user.occupation,
      sourceOfFunds: user.sourceOfFunds,
      sourceOfFundsDetail: user.sourceOfFundsDetail,
      estimatedNetWorth: user.estimatedNetWorth,
      investorType: user.investorType,
      // Status flags
      emailVerified: user.emailVerified,
      onboardingComplete: user.onboardingComplete,
      kycComplete: user.kycComplete,
      kycStatus: user.kycStatus,
      consentsComplete: user.consentsComplete,
      accountActivated: user.accountActivated,
    },
    progress: {
      currentStep: progress.currentStep,
      passwordSetAt: progress.passwordSetAt,
      profileSavedAt: progress.profileSavedAt,
      kycSubmittedAt: progress.kycSubmittedAt,
      consentsAt: progress.consentsAt,
      completedAt: progress.completedAt,
    },
    kycDocuments: kycDocs.map((d) => ({
      id: d.id,
      documentType: d.documentType,
      fileName: d.fileName,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt,
      reviewStatus: d.reviewStatus,
    })),
    consents: consents.map((c) => ({
      type: c.consentType,
      version: c.documentVersion,
      granted: c.granted,
      grantedAt: c.grantedAt,
    })),
  });
}