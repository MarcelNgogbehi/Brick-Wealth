// lib/schemas.js
//
// Zod schemas for all auth endpoints.
// Single source of truth for validation rules.
//
// Why Zod:
//   - Strips unknown fields by default (no mass-assignment bugs)
//   - Returns structured errors per-field
//   - Type-safe (use z.infer<typeof Schema> for TS)
//   - Same schemas on client + server if you want

import { z } from "zod";

// ─── Primitives ─────────────────────────────────────────────────────
const emailSchema = z
  .string()
  .min(3, "Email is required")
  .max(254, "Email is too long")
  .email("Please enter a valid email address")
  .transform((v) => v.trim().toLowerCase());

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be 20 characters or less")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscore only")
  .transform((v) => v.toLowerCase());

const fullNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be 60 characters or less")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Use letters, spaces, hyphens or apostrophes")
  .transform((v) => v.trim());

const countryCodeSchema = z
  .string()
  .length(2, "Invalid country code")
  .regex(/^[A-Z]{2}$/, "Invalid country code")
  .transform((v) => v.toUpperCase());

const residencySchema = z.enum(["UK", "Diaspora"], {
  errorMap: () => ({ message: "Select UK or Diaspora" }),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less")
  .refine((p) => /[a-z]/.test(p), { message: "Must include a lowercase letter" })
  .refine((p) => /[A-Z]/.test(p), { message: "Must include an uppercase letter" })
  .refine((p) => /\d/.test(p), { message: "Must include a number" });

const tokenSchema = z
  .string()
  .min(32, "Invalid or expired link")
  .max(256, "Invalid token");

// ─── Endpoint schemas ───────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: emailSchema,
    residency: residencySchema,
    country: countryCodeSchema,
  })
  .strict(); // reject unknown fields

export const LoginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(128),
    captchaToken: z.string().optional(),
  })
  .strict();

export const VerifySchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
  })
  .strict();

export const ForgotPasswordSchema = z
  .object({
    email: emailSchema,
    captchaToken: z.string().optional(),
  })
  .strict();

export const ResetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
  })
  .strict();

export const ResendVerificationSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const CheckUsernameSchema = z.object({
  username: usernameSchema,
});

// ─── Public "Register Interest" / "Request Invitation" lead capture ──
const locationSchema = z
  .string()
  .min(2, "Please enter your city or country")
  .max(80, "Location is too long")
  .transform((v) => v.trim());

export const LeadSchema = z
  .object({
    name: fullNameSchema,
    email: emailSchema,
    location: locationSchema,
    message: z
      .string()
      .max(800, "Message is too long")
      .optional()
      .transform((v) => (v ? v.trim() : undefined)),
    source: z
      .string()
      .max(40)
      .optional()
      .transform((v) => (v ? v.trim().slice(0, 40) : "website")),
    // Multi-step "Register Interest" qualifiers (developer brief). Optional so
    // the compact (name/email/location) form still validates.
    investorType: z.enum(["uk", "diaspora"]).optional(),
    budgetRange: z
      .enum(["under_25k", "25k_100k", "100k_500k", "over_500k"])
      .optional(),
    interestType: z
      .enum(["co_ownership", "buy_to_let", "buy_to_own"])
      .optional(),
  })
  .strict();

// Admin updates to a lead (triage). Status + free-text notes.
export const LeadUpdateSchema = z
  .object({
    status: z
      .enum(["new", "contacted", "qualified", "converted", "archived"])
      .optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((d) => d.status !== undefined || d.notes !== undefined, {
    message: "Nothing to update",
  });

// ─── Helper to format Zod errors as { field: message } ──────────────
export function zodFieldErrors(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}