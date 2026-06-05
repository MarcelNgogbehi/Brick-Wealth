// scripts/create-admin.mjs
//
// One-time script to create or promote a super_admin account.
//
// Usage (PowerShell):
//   $env:ADMIN_EMAIL = "marcel@brickswealth.com"
//   $env:ADMIN_USERNAME = "marcel-admin"
//   $env:ADMIN_PASSWORD = "<your-strong-password>"
//   $env:ADMIN_FULL_NAME = "Marcel Ngogbehei"
//   node scripts/create-admin.mjs
//
// After running, CLEAR the env vars:
//   Remove-Item Env:ADMIN_PASSWORD
//   Remove-Item Env:ADMIN_EMAIL
//   Remove-Item Env:ADMIN_USERNAME
//   Remove-Item Env:ADMIN_FULL_NAME
//
// This script is SAFE to commit to git. Password lives only in env vars,
// never in the file itself.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import readline from "node:readline";

// Load env vars from .env and .env.local for the DB connection
dotenv.config();
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

// ─── INPUT VALIDATION ────────────────────────────────────────────────

function readEnv() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim();

  const errors = [];

  if (!email) {
    errors.push("ADMIN_EMAIL not set");
  } else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    errors.push("ADMIN_EMAIL is not a valid email address");
  }

  if (!username) {
    errors.push("ADMIN_USERNAME not set");
  } else if (!/^[a-z0-9_-]{3,40}$/i.test(username)) {
    errors.push("ADMIN_USERNAME must be 3-40 chars, alphanumeric/dash/underscore");
  }

  if (!password) {
    errors.push("ADMIN_PASSWORD not set");
  } else if (password.length < 12) {
    errors.push("ADMIN_PASSWORD must be at least 12 characters (admin accounts must use strong passwords)");
  }

  if (!fullName) {
    errors.push("ADMIN_FULL_NAME not set");
  }

  return { email, username, password, fullName, errors };
}

// ─── INTERACTIVE CONFIRMATION ────────────────────────────────────────

function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      resolve(a === "y" || a === "yes");
    });
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔐 Brick & Wealth — Admin Account Setup\n");

  const { email, username, password, fullName, errors } = readEnv();

  if (errors.length > 0) {
    console.error("❌ Missing or invalid environment variables:");
    for (const err of errors) console.error("   - " + err);
    console.error("\nSet them in your terminal before running this script.");
    console.error("See top of scripts/create-admin.mjs for usage examples.\n");
    process.exit(1);
  }

  // Mask the password for display (we never print the actual value)
  const maskedPassword = "*".repeat(Math.min(password.length, 12));

  console.log("About to create or promote this account:");
  console.log("  Email:    " + email);
  console.log("  Username: " + username);
  console.log("  Name:     " + fullName);
  console.log("  Password: " + maskedPassword + " (" + password.length + " chars)");
  console.log("  Role:     super_admin\n");

  const ok = await confirm("Proceed? (y/N): ");
  if (!ok) {
    console.log("Cancelled.\n");
    await prisma.$disconnect();
    process.exit(0);
  }

  // Check if email or username already exists
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  const existingByUsername = await prisma.user.findUnique({ where: { username } });

  // Hash the password with bcrypt (same rounds as the rest of the auth flow)
  console.log("\nHashing password...");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (existingByEmail) {
    // ──── UPDATE EXISTING ACCOUNT ────
    console.log(`\nAccount with email "${email}" already exists.`);
    console.log("This script will:");
    console.log("  - Update username to: " + username);
    console.log("  - Update password");
    console.log("  - Set role to super_admin");
    console.log("  - Mark all onboarding gates as complete\n");

    const okUpdate = await confirm("Update this existing account? (y/N): ");
    if (!okUpdate) {
      console.log("Cancelled.\n");
      await prisma.$disconnect();
      process.exit(0);
    }

    // If the desired username is taken by a DIFFERENT user, refuse
    if (existingByUsername && existingByUsername.id !== existingByEmail.id) {
      console.error(`\n❌ Username "${username}" is already taken by another user.`);
      console.error("   Pick a different ADMIN_USERNAME and try again.\n");
      await prisma.$disconnect();
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        username,
        passwordHash,
        fullName,
        emailVerified: true,
        role: "super_admin",
        // Skip investor onboarding flow — admins don't need KYC/consents
        onboardingComplete: true,
        kycComplete: true,
        kycStatus: "approved",
        consentsComplete: true,
        accountActivated: true,
        // Clear any existing suspension
        suspendedAt: null,
        suspensionReason: null,
      },
    });

    console.log("\n✅ Account updated successfully.");
    console.log("   ID:       " + updated.id);
    console.log("   Email:    " + updated.email);
    console.log("   Username: " + updated.username);
    console.log("   Role:     " + updated.role);
  } else {
    // ──── CREATE NEW ACCOUNT ────
    if (existingByUsername) {
      console.error(`\n❌ Username "${username}" is already taken.`);
      console.error("   Pick a different ADMIN_USERNAME and try again.\n");
      await prisma.$disconnect();
      process.exit(1);
    }

    const created = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        passwordHash,
        emailVerified: true,
        // Required by schema — set sensible defaults for an admin account
        residency: "UK",
        country: "GB",
        // Admin role
        role: "super_admin",
        // Skip investor onboarding flow
        onboardingComplete: true,
        kycComplete: true,
        kycStatus: "approved",
        consentsComplete: true,
        accountActivated: true,
      },
    });

    console.log("\n✅ Account created successfully.");
    console.log("   ID:       " + created.id);
    console.log("   Email:    " + created.email);
    console.log("   Username: " + created.username);
    console.log("   Role:     " + created.role);
  }

  console.log("\n────────────────────────────────────────────────");
  console.log("Next steps:");
  console.log("  1. Visit /portal");
  console.log("  2. Sign in with USERNAME: " + username);
  console.log("     (or your email — both work)");
  console.log("  3. You'll be redirected to /admin");
  console.log("\nSecurity reminder:");
  console.log("  Clear env vars NOW:");
  console.log("    Remove-Item Env:ADMIN_PASSWORD");
  console.log("    Remove-Item Env:ADMIN_EMAIL");
  console.log("    Remove-Item Env:ADMIN_USERNAME");
  console.log("    Remove-Item Env:ADMIN_FULL_NAME");
  console.log("  Or close this terminal window.\n");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("\n❌ Script failed:", err.message);
  console.error(err.stack);
  await prisma.$disconnect();
  process.exit(1);
});
