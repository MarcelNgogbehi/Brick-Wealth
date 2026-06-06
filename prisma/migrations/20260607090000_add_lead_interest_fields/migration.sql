-- Multi-step "Register Interest" qualifiers (developer brief).
-- Additive, nullable columns — safe to apply to existing rows.
ALTER TABLE "Lead" ADD COLUMN "investorType" TEXT;
ALTER TABLE "Lead" ADD COLUMN "budgetRange" TEXT;
ALTER TABLE "Lead" ADD COLUMN "interestType" TEXT;
