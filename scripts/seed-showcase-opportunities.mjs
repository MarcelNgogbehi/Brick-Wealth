// scripts/seed-showcase-opportunities.mjs
//
// Seeds the showcase opportunities from the public marketing site
// (app/opportunities/page.jsx) into the database as real Property → SPV →
// Opportunity chains, so they appear on the investor & admin dashboards.
//
// Intended for a webapp review/demo. Everything created here is tagged with a
// recognisable marker (companyNumber starts with "BWX-SEED-") so it can be
// removed cleanly afterwards — including any subscriptions/holdings an investor
// created against these opportunities during the review.
//
// Usage:
//   node scripts/seed-showcase-opportunities.mjs            # create the showcase
//   node scripts/seed-showcase-opportunities.mjs --remove   # delete everything it created
//
// or via npm:
//   npm run seed:opportunities
//   npm run seed:opportunities:remove
//
// Safe to commit — contains no secrets. DB connection comes from .env(.local).

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

// Marker that ties every seeded row back to this script.
const SEED_TAG = "BWX-SEED";

const RISK_WARNING =
  "Capital is at risk. Property investments are illiquid and the value of your " +
  "investment can go down as well as up. Past performance is not a reliable " +
  "indicator of future results. Forecast yields are targets, not guarantees. " +
  "This is showcase data for platform review.";

// ─── Showcase data (mirrors app/opportunities/page.jsx) ──────────────────────
// tier: "live" → Opportunity status "live" (shows on the investor dashboard)
//       "upcoming" → status "draft" (admin pipeline / coming soon)
//       "past" → status "funded" (closed, fully subscribed)
const SHOWCASE = [
  // ── LIVE ──
  { tier: "live", spvCode: "SPV-008", category: "HMO", name: "The Wilbraham",
    neighbourhood: "Fallowfield", city: "Manchester · M14",
    summary: "6-bed Victorian HMO refurbished to professional standard. Tenanted from completion with 11.6% gross yield on rent.",
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=85&auto=format&fit=crop",
    propertyValue: "£420,000", minPerShare: "£500", targetYield: "8.4%", holdPeriod: "5 yrs",
    subscribed: 73, closingDate: "12 May 2026", bedrooms: 6 },
  { tier: "live", spvCode: "SPV-009", category: "Buy-to-Let", name: "Brunswick Mews",
    neighbourhood: "Edgbaston", city: "Birmingham · B15",
    summary: "3-unit period conversion with long-let strategy targeting professional tenants in a stable rental market.",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=85&auto=format&fit=crop",
    propertyValue: "£685,000", minPerShare: "£500", targetYield: "7.6%", holdPeriod: "7 yrs",
    subscribed: 41, closingDate: "30 May 2026", bedrooms: 3 },
  { tier: "live", spvCode: "SPV-010", category: "Conversion", name: "Holloway Court",
    neighbourhood: "Islington", city: "London · N7",
    summary: "Single dwelling converted to four well-appointed flats. Planning approved, 18-month delivery timeline.",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&q=85&auto=format&fit=crop",
    propertyValue: "£1,180,000", minPerShare: "£1,000", targetYield: "11.2%", holdPeriod: "3 yrs",
    subscribed: 58, closingDate: "20 May 2026", bedrooms: 4 },
  { tier: "live", spvCode: "SPV-011", category: "Buy-to-Let", name: "Roundhay Gardens",
    neighbourhood: "Roundhay", city: "Leeds · LS8",
    summary: "4-bed semi-detached family home with A-rated EPC and green mortgage secured.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85&auto=format&fit=crop",
    propertyValue: "£365,000", minPerShare: "£500", targetYield: "7.9%", holdPeriod: "5 yrs",
    subscribed: 22, closingDate: "15 Jun 2026", bedrooms: 4 },

  // ── UPCOMING (Coming Soon → draft) ──
  { tier: "upcoming", spvCode: "SPV-013", category: "HMO", name: "Selly Park House",
    neighbourhood: "Selly Park", city: "Birmingham · B29",
    summary: "8-bed student HMO in established letting district. Article 4 compliant.",
    image: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1400&q=85&auto=format&fit=crop",
    minPerShare: "£500", targetYield: "9.1%", holdPeriod: "5 yrs", launchDate: "2 Jun 2026", bedrooms: 8 },
  { tier: "upcoming", spvCode: "SPV-014", category: "Commercial", name: "Northern Quarter Suites",
    neighbourhood: "Manchester Central", city: "Manchester · M1",
    summary: "Mixed-use commercial unit on 15-year FRI lease to established UK retailer.",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=85&auto=format&fit=crop",
    minPerShare: "£2,500", targetYield: "6.8%", holdPeriod: "10 yrs", launchDate: "18 Jun 2026" },
  { tier: "upcoming", spvCode: "SPV-015", category: "Off-Plan", name: "Albany Quarter",
    neighbourhood: "Hove", city: "Brighton · BN3",
    summary: "8-unit coastal development from a Tier-1 housebuilder. Two-year hold to first letting.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=85&auto=format&fit=crop",
    minPerShare: "£2,500", targetYield: "9.6%", holdPeriod: "4 yrs", launchDate: "8 Jul 2026" },

  // ── PAST (closed → funded) ──
  { tier: "past", spvCode: "SPV-007", category: "HMO", name: "Fallowfield Heights",
    neighbourhood: "Fallowfield", city: "Manchester · M14",
    summary: "6-bed HMO raise closed in March 2026. Performing on plan with 8.2% delivered yield.",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=85&auto=format&fit=crop",
    raised: "£395,000", minPerShare: "£500", targetYield: "8.0%", holdPeriod: "5 yrs", closedDate: "1 Mar 2026", bedrooms: 6 },
  { tier: "past", spvCode: "SPV-006", category: "Buy-to-Let", name: "Headingley Townhouse",
    neighbourhood: "Headingley", city: "Leeds · LS6",
    summary: "Townhouse buy-to-let raise closed January 2026. Performing on plan with 7.4% delivered yield.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=85&auto=format&fit=crop",
    raised: "£325,000", minPerShare: "£500", targetYield: "7.2%", holdPeriod: "5 yrs", closedDate: "1 Jan 2026", bedrooms: 5 },
  { tier: "past", spvCode: "SPV-005", category: "Conversion", name: "Camberwell Conversion",
    neighbourhood: "Camberwell", city: "London · SE5",
    summary: "Flat conversion raise closed November 2025. Exited successfully at 10.8% delivered yield.",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&q=85&auto=format&fit=crop",
    raised: "£890,000", minPerShare: "£1,000", targetYield: "10.5%", holdPeriod: "3 yrs", closedDate: "1 Nov 2025", bedrooms: 4 },
  { tier: "past", spvCode: "SPV-004", category: "HMO", name: "Withington Chambers",
    neighbourhood: "Withington", city: "Manchester · M20",
    summary: "6-bed HMO raise closed September 2025. Performing on plan with 8.6% delivered yield.",
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=85&auto=format&fit=crop",
    raised: "£410,000", minPerShare: "£500", targetYield: "8.4%", holdPeriod: "5 yrs", closedDate: "1 Sep 2025", bedrooms: 6 },
];

// ─── Parsers ─────────────────────────────────────────────────────────────────
const money = (s) => Math.round(Number(String(s || "0").replace(/[^0-9.]/g, "")) || 0);
const pct = (s) => parseFloat(String(s || "0").replace(/[^0-9.]/g, "")) || 0;
const yearsToMonths = (s) => Math.round((parseFloat(String(s || "0")) || 0) * 12);
function splitCity(s) {
  const [city, tail] = String(s || "").split("·").map((x) => x.trim());
  return { city: city || "United Kingdom", postcode: tail || "" };
}
const PROPERTY_TYPE = {
  HMO: "hmo", "Buy-to-Let": "buy_to_let", Conversion: "conversion",
  "Off-Plan": "off_plan", Commercial: "commercial",
};

// ─── Build the field bundle for one showcase entry ───────────────────────────
function build(entry) {
  const { city, postcode } = splitCity(entry.city);
  const years = parseFloat(entry.holdPeriod) || 5;
  const termMonths = yearsToMonths(entry.holdPeriod);
  const unitPrice = money(entry.minPerShare) || 500;

  // Raise target: live uses propertyValue; past uses the raised figure; upcoming
  // is notional (unit price × a default float) since the site has no figure.
  const targetRaise =
    entry.tier === "past" ? money(entry.raised)
      : entry.tier === "live" ? money(entry.propertyValue)
        : unitPrice * 800;

  const totalUnits = Math.max(1, Math.round(targetRaise / unitPrice));
  const unitsAllocated =
    entry.tier === "past" ? totalUnits
      : entry.tier === "live" ? Math.round((totalUnits * (entry.subscribed || 0)) / 100)
        : 0;

  const yieldPct = pct(entry.targetYield);
  const projectedReturnPct = Math.round(yieldPct * years * 10) / 10;

  const oppStatus = entry.tier === "live" ? "live" : entry.tier === "past" ? "funded" : "draft";
  const closeDate =
    entry.tier === "live" ? entry.closingDate
      : entry.tier === "past" ? entry.closedDate
        : entry.launchDate;

  return {
    spvCode: entry.spvCode,
    companyNumber: `${SEED_TAG}-${entry.spvCode}`,
    property: {
      title: entry.name,
      addressLine1: `${entry.name}, ${entry.neighbourhood || city}`,
      city,
      region: entry.neighbourhood || null,
      postcode: postcode || "N/A",
      country: "GB",
      propertyType: PROPERTY_TYPE[entry.category] || "residential",
      bedrooms: entry.bedrooms ?? null,
      propertyValue: entry.tier === "live" ? money(entry.propertyValue) : targetRaise,
      description: entry.summary,
      neighbourhoodHighlights: `${entry.neighbourhood ? entry.neighbourhood + ", " : ""}${city}`,
      status: "live",
    },
    image: entry.image,
    spv: {
      spvName: `${entry.name} SPV`,
      currency: "GBP",
      targetRaiseAmount: targetRaise,
      unitPrice,
      totalUnits,
      unitsAllocated,
      minimumUnits: 1,
      purpose: `Special purpose vehicle for ${entry.name} (${entry.category}).`,
      registeredAddress: `${entry.name}, ${city}, United Kingdom`,
      status: entry.tier === "past" ? "active" : "active",
      closeDate,
    },
    opportunity: {
      title: entry.name,
      subtitle: `${entry.neighbourhood ? entry.neighbourhood + " · " : ""}${entry.city}`,
      summary: entry.summary,
      fullDescription:
        `## ${entry.name}\n\n${entry.summary}\n\n` +
        `**Strategy:** ${entry.category}  \n**Target yield:** ${entry.targetYield}  \n` +
        `**Hold period:** ${entry.holdPeriod}  \n**Minimum per share:** ${entry.minPerShare}`,
      riskWarning: RISK_WARNING,
      targetYieldPct: yieldPct,
      termMonths,
      projectedReturnPct,
      status: oppStatus,
      closeDate,
      eligibleInvestorTypes: ["retail", "sophisticated", "hnw"],
      requiresKyc: false,
    },
  };
}

// ─── SEED ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🏗️  Seeding ${SHOWCASE.length} showcase opportunities (tag: ${SEED_TAG})\n`);
  let created = 0, skipped = 0;

  for (const entry of SHOWCASE) {
    const b = build(entry);

    const existing = await prisma.spv.findUnique({ where: { companyNumber: b.companyNumber } });
    if (existing) {
      console.log(`   ↷ ${b.spvCode}  ${entry.name} — already seeded, skipping`);
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({ data: b.property });

      await tx.propertyImage.create({
        data: {
          propertyId: property.id,
          fileUrl: b.image,
          fileName: `${entry.spvCode}-hero.jpg`,
          altText: entry.name,
          isHero: true,
          sortOrder: 0,
          storageType: "uploadthing",
        },
      });

      const spv = await tx.spv.create({
        data: {
          ...b.spv,
          companyNumber: b.companyNumber,
          propertyId: property.id,
          closeDate: b.spv.closeDate ? new Date(b.spv.closeDate) : null,
          openDate: new Date(),
        },
      });

      await tx.opportunity.create({
        data: {
          ...b.opportunity,
          spvId: spv.id,
          closeDate: b.opportunity.closeDate ? new Date(b.opportunity.closeDate) : null,
          openDate: new Date(),
          publishedAt: b.opportunity.status === "live" ? new Date() : null,
          heroImageUrl: b.image,
        },
      });
    });

    console.log(`   ✓ ${b.spvCode}  ${entry.name}  [${b.opportunity.status}]`);
    created++;
  }

  console.log(`\n✅ Done — ${created} created, ${skipped} skipped.`);
  console.log(`   Live opportunities now appear on the investor dashboard (/dashboard/opportunities).`);
  console.log(`   To remove everything later: npm run seed:opportunities:remove\n`);
}

// ─── REMOVE ──────────────────────────────────────────────────────────────────
async function remove() {
  console.log(`\n🧹 Removing seeded showcase data (tag: ${SEED_TAG})\n`);

  const spvs = await prisma.spv.findMany({
    where: { companyNumber: { startsWith: `${SEED_TAG}-` } },
    select: { id: true, propertyId: true, spvName: true, opportunity: { select: { id: true } } },
  });

  if (spvs.length === 0) {
    console.log("   Nothing to remove — no seeded SPVs found.\n");
    return;
  }

  const spvIds = spvs.map((s) => s.id);
  const propIds = spvs.map((s) => s.propertyId);
  const oppIds = spvs.map((s) => s.opportunity?.id).filter(Boolean);

  // Investor records that may have been created against these during review.
  const subs = await prisma.subscription.findMany({ where: { spvId: { in: spvIds } }, select: { id: true } });
  const subIds = subs.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    await tx.allocation.deleteMany({ where: { spvId: { in: spvIds } } });
    await tx.holding.deleteMany({ where: { spvId: { in: spvIds } } });
    await tx.shareSaleRequest.deleteMany({ where: { spvId: { in: spvIds } } });
    await tx.titleTransfer.deleteMany({ where: { spvId: { in: spvIds } } });
    if (subIds.length) await tx.subscriptionAuditEvent.deleteMany({ where: { subscriptionId: { in: subIds } } });
    await tx.subscription.deleteMany({ where: { spvId: { in: spvIds } } });

    if (oppIds.length) {
      await tx.opportunityView.deleteMany({ where: { opportunityId: { in: oppIds } } });
      await tx.propertyUpdate.deleteMany({ where: { opportunityId: { in: oppIds } } });
      await tx.opportunityDocument.deleteMany({ where: { opportunityId: { in: oppIds } } });
      await tx.opportunity.deleteMany({ where: { id: { in: oppIds } } });
    }

    await tx.mortgage.deleteMany({ where: { spvId: { in: spvIds } } });
    await tx.spv.deleteMany({ where: { id: { in: spvIds } } });
    await tx.propertyImage.deleteMany({ where: { propertyId: { in: propIds } } });
    await tx.property.deleteMany({ where: { id: { in: propIds } } });
  });

  console.log(`   Removed ${spvs.length} SPV chain(s), ${subIds.length} subscription(s) and related records.`);
  console.log(`\n✅ Teardown complete — the database is back to its pre-seed state.\n`);
}

// ─── ENTRY ───────────────────────────────────────────────────────────────────
const isRemove = process.argv.includes("--remove") || process.env.SEED_ACTION === "remove";

(isRemove ? remove() : seed())
  .catch((err) => {
    console.error("\n❌ Script failed:", err.message);
    console.error(err.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
