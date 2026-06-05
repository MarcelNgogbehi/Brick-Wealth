// app/api/onboarding/profile/route.js
//
// POST /api/onboarding/profile
// Saves the onboarding details (Step 2 of the wizard).
// Validates age (must be 18+), postcode format, all required fields.

import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { updateUserProfile, updateOnboardingStep } from "@/lib/db";
import { verifyCsrf, errorResponse, successResponse } from "@/lib/auth";
import { log } from "@/lib/logger";

// UK postcodes: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
// US ZIPs: 5 digits or 5+4 (12345 or 12345-6789)
const US_ZIP = /^\d{5}(-\d{4})?$/;

const ProfileSchema = z.object({
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date of birth",
  }),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18 or over" }),
  }),
  addressLine1: z.string().min(2, "Address is required").max(120),
  addressLine2: z.string().max(120).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(80),
  region: z.string().max(80).optional().or(z.literal("")),
  postcode: z.string().min(3, "Postcode is required").max(12),
  postcodeFormat: z.enum(["UK", "US", "OTHER"]),
  phoneNumber: z.string().min(7, "Phone number is required").max(20)
    .regex(/^[+\d\s\-()]+$/, "Invalid phone number format"),
  occupation: z.string().min(2, "Occupation is required").max(80),
  sourceOfFunds: z.enum(["salary", "savings", "inheritance", "investment", "business", "other"], {
    errorMap: () => ({ message: "Please select a source of funds" }),
  }),
  sourceOfFundsDetail: z.string().max(200).optional().or(z.literal("")),
  estimatedNetWorth: z.enum(["under_50k", "50k_250k", "250k_1m", "over_1m"], {
    errorMap: () => ({ message: "Please select an estimated net worth" }),
  }),
  investorType: z.enum(["retail", "sophisticated", "hnw"], {
    errorMap: () => ({ message: "Please select an investor type" }),
  }),
}).strict();

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(request) {
  if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required", 401);

  let raw;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return errorResponse("Please correct the errors below", 400, fieldErrors);
  }

  const data = parsed.data;

  // Server-side age check
  const age = calculateAge(data.dateOfBirth);
  if (age < 18) {
    return errorResponse("You must be 18 or older to register", 400, {
      dateOfBirth: "You must be 18 or older",
    });
  }
  if (age > 120) {
    return errorResponse("Please enter a valid date of birth", 400, {
      dateOfBirth: "Invalid date of birth",
    });
  }

  // Postcode format validation
  const pc = data.postcode.trim().toUpperCase();
  if (data.postcodeFormat === "UK" && !UK_POSTCODE.test(pc)) {
    return errorResponse("Invalid UK postcode", 400, {
      postcode: "Invalid UK postcode (e.g. SW1A 1AA)",
    });
  }
  if (data.postcodeFormat === "US" && !US_ZIP.test(pc)) {
    return errorResponse("Invalid US ZIP code", 400, {
      postcode: "Invalid US ZIP (e.g. 12345 or 12345-6789)",
    });
  }

  // Source of funds detail required if "other"
  if (data.sourceOfFunds === "other" && !data.sourceOfFundsDetail?.trim()) {
    return errorResponse("Please describe your source of funds", 400, {
      sourceOfFundsDetail: "Required when 'Other' is selected",
    });
  }

  try {
    await updateUserProfile(user.id, { ...data, postcode: pc });
    await updateOnboardingStep(user.id, "kyc", { profileSavedAt: new Date() });

    log.audit("user.profile_completed", { userId: user.id });

    return successResponse({
      message: "Profile saved",
      nextStep: "kyc",
    });
  } catch (err) {
    log.error("onboarding.profile.error", { userId: user.id, error: err?.message });
    return errorResponse("Failed to save profile. Please try again.", 500);
  }
}