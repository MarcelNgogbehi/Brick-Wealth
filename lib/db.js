// lib/db.js
//
// Complete database layer for Brick & Wealth.
// All API routes import from here.
//
// Covers:
//   Phase 1-2:
//     - Users, auth tokens, login attempts, sessions  (auth flow)
//     - Onboarding progress, profile updates           (onboarding flow)
//     - KYC documents                                  (verification flow)
//     - Consents                                       (compliance flow)
//     - Account activation gate                        (final unlock)
//     - Admin: dashboard stats, investor list, KYC queue, notes, audit
//   Phase 3:
//     - Properties (CRUD + images)
//     - SPVs (CRUD + mortgage)
//     - Mortgages (upsert/delete)
//     - Opportunities (CRUD + documents + status workflow)
//     - Investor-facing queries (filtered, security-hardened)
//     - Compliance audit (OpportunityView, DocumentView)
//   Phase 4:
//     - Investor profile (self-service edit)
//     - Active sessions management
//     - Notification preferences
//     - Notifications (in-app)
//     - Announcements (admin broadcasts + investor read state)
//     - Property updates timeline + comments + reactions
//   Phase 5:
//     - Subscriptions (create, list, cancel, status flow)
//     - Eligibility checks (KYC, suitability, availability, duplicates)
//     - Allocations (splittable; cap-table truth)
//     - Holdings (denormalised aggregate)
//     - Cap table snapshots + certificate number generator
//     - Per-subscription audit events
//
// If you change ORMs later, only this file changes.

import { prisma } from "./prisma.js";

// ════════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════════

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserByUsername(username) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createPendingUser({ email, fullName, username, residency, country }) {
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      fullName,
      username: username.toLowerCase(),
      residency,
      country,
      emailVerified: false,
      passwordHash: null,
      registrationStatus: "pending",
    },
  });
}

export async function deleteUser(userId) {
  return prisma.user.delete({ where: { id: userId } });
}

export async function activateUser(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, passwordHash },
  });
}

export async function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

// ════════════════════════════════════════════════════════════════════
// AUTH TOKENS (register / reset / session — single table)
// ════════════════════════════════════════════════════════════════════

export async function createAuthToken({ userId, tokenHash, type, expiresAt }) {
  return prisma.authToken.create({
    data: { userId, tokenHash, type, expiresAt },
  });
}

export async function findValidToken(tokenHash, type) {
  return prisma.authToken.findFirst({
    where: {
      tokenHash,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function consumeToken(tokenId) {
  return prisma.authToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

export async function invalidateUserTokens(userId, type) {
  return prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
}

// ════════════════════════════════════════════════════════════════════
// LOGIN ATTEMPTS (audit + lockout)
// ════════════════════════════════════════════════════════════════════

export async function recordLoginAttempt({ email, ip, userAgent, success }) {
  return prisma.loginAttempt.create({
    data: { email, ip, userAgent, success },
  });
}

export async function countRecentFailedLogins(email, windowMs) {
  const since = new Date(Date.now() - windowMs);
  return prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });
}

// ════════════════════════════════════════════════════════════════════
// SESSIONS (stored as AuthToken with type="session")
// ════════════════════════════════════════════════════════════════════

export async function createSession({ userId, tokenHash, expiresAt }) {
  return prisma.authToken.create({
    data: { userId, tokenHash, type: "session", expiresAt },
  });
}

export async function findSessionByTokenHash(tokenHash) {
  return prisma.authToken.findFirst({
    where: {
      tokenHash,
      type: "session",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

export async function revokeSession(tokenHash) {
  return prisma.authToken.updateMany({
    where: { tokenHash, type: "session" },
    data: { usedAt: new Date() },
  });
}

// ════════════════════════════════════════════════════════════════════
// ONBOARDING PROGRESS
// ════════════════════════════════════════════════════════════════════

export async function getOrCreateOnboardingProgress(userId) {
  return prisma.onboardingProgress.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateOnboardingStep(userId, step, extra = {}) {
  return prisma.onboardingProgress.upsert({
    where: { userId },
    update: { currentStep: step, ...extra },
    create: { userId, currentStep: step, ...extra },
  });
}

// ════════════════════════════════════════════════════════════════════
// USER PROFILE (onboarding step 2)
// ════════════════════════════════════════════════════════════════════

export async function updateUserProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      ageConfirmed: data.ageConfirmed,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      region: data.region,
      postcode: data.postcode,
      postcodeFormat: data.postcodeFormat,
      phoneNumber: data.phoneNumber,
      occupation: data.occupation,
      sourceOfFunds: data.sourceOfFunds,
      sourceOfFundsDetail: data.sourceOfFundsDetail,
      estimatedNetWorth: data.estimatedNetWorth,
      investorType: data.investorType,
      onboardingComplete: true,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// KYC DOCUMENTS
// ════════════════════════════════════════════════════════════════════

export async function saveKycDocument({
  userId, documentType, fileUrl, fileName, fileSize, mimeType,
}) {
  // Upsert pattern — if user re-uploads same type, replace the URL
  const existing = await prisma.kycDocument.findFirst({
    where: { userId, documentType },
  });

  if (existing) {
    return prisma.kycDocument.update({
      where: { id: existing.id },
      data: {
        fileUrl, fileName, fileSize, mimeType,
        uploadedAt: new Date(),
        reviewStatus: "pending",
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
    });
  }
  return prisma.kycDocument.create({
    data: { userId, documentType, fileUrl, fileName, fileSize, mimeType },
  });
}

export async function getUserKycDocuments(userId) {
  return prisma.kycDocument.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function markKycSubmitted(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { kycComplete: true, kycStatus: "pending_review" },
  });
}

// ════════════════════════════════════════════════════════════════════
// CONSENTS
// ════════════════════════════════════════════════════════════════════

export async function recordConsent({
  userId, consentType, documentVersion, granted, ip, userAgent,
}) {
  return prisma.consent.upsert({
    where: {
      userId_consentType_documentVersion: {
        userId,
        consentType,
        documentVersion,
      },
    },
    update: { granted, grantedAt: new Date(), ip, userAgent },
    create: {
      userId, consentType, documentVersion, granted, ip, userAgent,
    },
  });
}

export async function getUserConsents(userId) {
  return prisma.consent.findMany({
    where: { userId },
    orderBy: { grantedAt: "desc" },
  });
}

export async function markConsentsComplete(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { consentsComplete: true },
  });
}

// ════════════════════════════════════════════════════════════════════
// ACCOUNT ACTIVATION (the final gate)
// ════════════════════════════════════════════════════════════════════

export async function activateAccountIfReady(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // KYC is deliberately excluded from the activation gate: investors can
  // defer their document upload and still activate their account. The KYC
  // approval requirement is enforced separately at subscription time
  // (see checkSubscriptionEligibility — "kyc_not_approved").
  const ready =
    user.emailVerified &&
    user.onboardingComplete &&
    user.consentsComplete;

  if (ready && !user.accountActivated) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountActivated: true },
    });
    // Phase 7: advance referral edge to ACTIVATED (no-op if not referred)
    await syncReferralStatus({ refereeUserId: userId, status: "ACTIVATED" }).catch(() => {});
    return updated;
  }
  return user;
}

// ════════════════════════════════════════════════════════════════════
// REGISTRATION APPROVAL (admin-controlled)
// ════════════════════════════════════════════════════════════════════

export async function getPendingRegistrations({ limit = 100 } = {}) {
  return prisma.user.findMany({
    where: { role: "investor", registrationStatus: "pending" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      email: true,
      fullName: true,
      username: true,
      residency: true,
      country: true,
      createdAt: true,
      registrationStatus: true,
    },
  });
}

export async function approveRegistration(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { registrationStatus: "approved" },
  });
}

export async function declineRegistration(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { registrationStatus: "declined" },
  });
}

// ════════════════════════════════════════════════════════════════════
// MAINTENANCE (optional cron)
// ════════════════════════════════════════════════════════════════════

export async function purgeExpiredTokens() {
  return prisma.authToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null, lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//                  ADMIN FUNCTIONS (Phase 2)
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// ADMIN: DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════

export async function getAdminDashboardStats() {
  const [
    totalInvestors,
    activatedInvestors,
    pendingKyc,
    pendingKycDocs,
    flaggedInvestors,
    newSignups7d,
    rejectedKyc,
    pendingRegistrations,
    newLeads,
  ] = await Promise.all([
    // "Total Investors" counts only admin-APPROVED investors — registrants
    // still pending approval (or declined) are tracked separately under
    // "Needs Approval" and must not inflate the investor base.
    prisma.user.count({ where: { role: "investor", registrationStatus: "approved" } }),
    prisma.user.count({
      where: { role: "investor", registrationStatus: "approved", accountActivated: true },
    }),
    prisma.user.count({
      where: { role: "investor", kycStatus: "pending_review" },
    }),
    prisma.kycDocument.count({ where: { reviewStatus: "pending" } }),
    prisma.user.count({
      where: { role: "investor", flaggedForReview: true },
    }),
    prisma.user.count({
      where: {
        role: "investor",
        registrationStatus: "approved",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count({
      where: { role: "investor", kycStatus: "rejected" },
    }),
    // Guard: registrationStatus may not be in the Prisma client if generate
    // hasn't run yet after the migration. Use $queryRaw to be safe.
    prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "User" WHERE role = 'investor' AND "registrationStatus" = 'pending'`
      .then((rows) => Number(rows[0]?.count ?? 0))
      .catch(() => 0),
    // New (untriaged) marketing leads — guarded so a missing table can't break stats.
    prisma.lead.count({ where: { status: "new" } }).catch(() => 0),
  ]);

  return {
    totalInvestors,
    activatedInvestors,
    pendingKyc,
    pendingKycDocs,
    flaggedInvestors,
    newSignups7d,
    rejectedKyc,
    pendingRegistrations,
    newLeads,
    notVerified: totalInvestors - activatedInvestors,
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: DASHBOARD INSIGHTS
//
// Capital, pipeline, asset-class and activity data for the command center.
// Everything here is derived from real rows — no synthetic numbers.
// ════════════════════════════════════════════════════════════════════

const num = (v) => (v == null ? 0 : Number(v));

// Audit logs store entityType in mixed forms ("User", "kyc_document",
// "share_sale_request"…). Normalise to the canonical keys the dashboard's
// activity feed uses for its icon map.
const ENTITY_KEY = {
  user: "user",
  kyc_document: "kyc",
  subscription: "subscription",
  share_sale_request: "subscription",
  opportunity: "opportunity",
  spv: "spv",
  property: "property",
  property_update: "property",
  distribution: "distribution",
  announcement: "announcement",
  update_comment: "user",
  registration: "registration",
};
const normalizeEntity = (t) => (t ? ENTITY_KEY[t.toLowerCase()] || t.toLowerCase() : "activity");

export async function getAdminDashboardInsights() {
  const ACTIVE_ALLOC = ["ACTIVE", "PARTIALLY_TRANSFERRED"];

  const [
    aumAgg,
    pipelineAgg,
    pipelineCount,
    spvAgg,
    liveOpps,
    yieldOpps,
    activity,
  ] = await Promise.all([
    // Assets under management — capital currently held in active allocations.
    prisma.allocation.aggregate({
      where: { status: { in: ACTIVE_ALLOC } },
      _sum: { amountReceived: true },
    }),
    // Capital in pipeline — value of subscriptions still working through review.
    prisma.subscription.aggregate({
      where: { status: { in: SUBSCRIPTION_ACTIVE_STATUSES } },
      _sum: { totalAmount: true },
    }),
    prisma.subscription.count({
      where: { status: { in: SUBSCRIPTION_ACTIVE_STATUSES } },
    }),
    // Occupancy & target raise across the in-market book. Note: "live"/"funded"
    // are *Opportunity* statuses (an SPV's own status is draft/active), so we
    // filter SPVs by their related opportunity, not by Spv.status.
    prisma.spv.aggregate({
      where: { opportunity: { status: { in: ["live", "funded"] } } },
      _sum: { unitsAllocated: true, totalUnits: true, targetRaiseAmount: true },
    }),
    // Live / draft opportunities for the underwriting pipeline table.
    prisma.opportunity.findMany({
      where: { status: { in: ["draft", "live", "funded"] } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        spv: {
          include: {
            property: {
              include: { images: { where: { isHero: true }, take: 1 } },
            },
          },
        },
      },
    }),
    // All live/funded opportunities for asset-class yield aggregation.
    prisma.opportunity.findMany({
      where: { status: { in: ["live", "funded"] } },
      select: {
        targetYieldPct: true,
        spv: {
          select: {
            targetRaiseAmount: true,
            property: { select: { propertyType: true } },
          },
        },
      },
    }),
    // Recent admin actions for the system activity feed.
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { actor: { select: { fullName: true } } },
    }),
  ]);

  // ── Asset-class yields ──────────────────────────────────────────
  const byClass = new Map();
  for (const o of yieldOpps) {
    const type = o.spv?.property?.propertyType?.trim();
    if (!type) continue;
    const entry = byClass.get(type) || { type, yieldSum: 0, yieldN: 0, value: 0 };
    if (o.targetYieldPct != null) {
      entry.yieldSum += o.targetYieldPct;
      entry.yieldN += 1;
    }
    entry.value += num(o.spv?.targetRaiseAmount);
    byClass.set(type, entry);
  }
  const assetClasses = [...byClass.values()]
    .map((e) => ({
      type: e.type,
      avgYield: e.yieldN > 0 ? e.yieldSum / e.yieldN : null,
      value: e.value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // ── Pipeline rows ───────────────────────────────────────────────
  const pipeline = liveOpps.map((o) => {
    const spv = o.spv;
    const totalUnits = spv?.totalUnits ?? 0;
    const allocated = spv?.unitsAllocated ?? 0;
    return {
      id: o.id,
      title: o.title,
      status: o.status,
      yieldPct: o.targetYieldPct,
      termMonths: o.termMonths,
      city: spv?.property?.city ?? null,
      country: spv?.property?.country ?? null,
      companyNumber: spv?.companyNumber ?? null,
      valuation: num(spv?.targetRaiseAmount),
      currency: spv?.currency ?? "GBP",
      raiseProgress: totalUnits > 0 ? Math.round((allocated / totalUnits) * 100) : 0,
      heroImageUrl:
        o.heroImageUrl || spv?.property?.images?.[0]?.url || null,
    };
  });

  const allocatedUnits = spvAgg._sum.unitsAllocated ?? 0;
  const issuedUnits = spvAgg._sum.totalUnits ?? 0;

  return {
    aum: num(aumAgg._sum.amountReceived),
    capitalInPipeline: num(pipelineAgg._sum.totalAmount),
    pipelineCount,
    targetRaiseTotal: num(spvAgg._sum.targetRaiseAmount),
    occupancyPct: issuedUnits > 0 ? Math.round((allocatedUnits / issuedUnits) * 1000) / 10 : 0,
    assetClasses,
    pipeline,
    activity: activity.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: normalizeEntity(a.entityType),
      entityId: a.entityId,
      actorName: a.actor?.fullName ?? "System",
      metadata: a.metadata ?? null,
      createdAt: a.createdAt,
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: INVESTOR ACTIVITY FEED
//
// A unified, chronological stream of investor-initiated events across the
// platform — registrations, KYC submissions, subscriptions, payment proofs,
// cancellations and secondary-share sales. Each source is queried with a
// bounded window, merged, sorted newest-first and paginated in memory.
// `category` narrows to one event family; `search` matches investor name/email.
// ════════════════════════════════════════════════════════════════════

export async function getInvestorActivityFeed({ limit = 40, category = null, search = null } = {}) {
  const wantAll = !category || category === "all";
  const want = (c) => wantAll || category === c;
  // Pull a generous window per source so the merged result reliably fills the
  // requested page (and survives search post-filtering).
  const take = search ? Math.max(limit * 5, 150) : Math.max(limit + 1, 60);

  const cur = (c) => (c === "USD" ? "$" : c === "EUR" ? "€" : "£");
  const money = (v, c) => `${cur(c)}${Number(v || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  const [users, kycDocs, subs, sales] = await Promise.all([
    want("registrations")
      ? prisma.user.findMany({
          where: { role: "investor" },
          orderBy: { createdAt: "desc" },
          take,
          select: { id: true, fullName: true, email: true, investorType: true, createdAt: true },
        })
      : [],
    want("kyc")
      ? prisma.kycDocument.findMany({
          orderBy: { uploadedAt: "desc" },
          take,
          select: {
            id: true, userId: true, documentType: true, uploadedAt: true,
            user: { select: { fullName: true, email: true } },
          },
        })
      : [],
    want("subscriptions") || want("payments")
      ? prisma.subscription.findMany({
          orderBy: { createdAt: "desc" },
          take,
          select: {
            id: true, userId: true, opportunityId: true, unitsRequested: true,
            totalAmount: true, currency: true, submittedAt: true,
            proofUploadedAt: true, cancelledAt: true, createdAt: true,
          },
        })
      : [],
    want("sales")
      ? prisma.shareSaleRequest.findMany({
          orderBy: { createdAt: "desc" },
          take,
          select: {
            id: true, userId: true, spvId: true, unitsOffered: true,
            indicativeAmount: true, currency: true, status: true,
            createdAt: true, settledAt: true, settledUnits: true, settledAmount: true,
          },
        })
      : [],
  ]);

  // Subscriptions and sale requests carry only userId/spvId scalars — batch-load
  // the supporting investor / opportunity / SPV names in one round trip each.
  const userIds = new Set();
  subs.forEach((s) => userIds.add(s.userId));
  sales.forEach((s) => userIds.add(s.userId));
  const oppIds = [...new Set(subs.map((s) => s.opportunityId))];
  const spvIds = [...new Set(sales.map((s) => s.spvId))];

  const [userRows, oppRows, spvRows] = await Promise.all([
    userIds.size ? prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, fullName: true, email: true } }) : [],
    oppIds.length ? prisma.opportunity.findMany({ where: { id: { in: oppIds } }, select: { id: true, title: true } }) : [],
    spvIds.length ? prisma.spv.findMany({ where: { id: { in: spvIds } }, select: { id: true, spvName: true } }) : [],
  ]);
  const userById = Object.fromEntries(userRows.map((u) => [u.id, u]));
  const oppById = Object.fromEntries(oppRows.map((o) => [o.id, o]));
  const spvById = Object.fromEntries(spvRows.map((s) => [s.id, s]));

  const events = [];

  for (const u of users) {
    events.push({
      id: `reg:${u.id}`, kind: "registered", category: "registrations",
      actorId: u.id, actorName: u.fullName, actorEmail: u.email,
      title: "Registered an account",
      detail: u.investorType ? `${u.investorType} investor` : "New investor",
      href: `/admin/investors/${u.id}`, createdAt: u.createdAt,
    });
  }
  for (const k of kycDocs) {
    events.push({
      id: `kyc:${k.id}`, kind: "kyc_submitted", category: "kyc",
      actorId: k.userId, actorName: k.user?.fullName, actorEmail: k.user?.email,
      title: "Submitted a KYC document",
      detail: (k.documentType || "").replace(/_/g, " "),
      href: `/admin/kyc-queue`, createdAt: k.uploadedAt,
    });
  }
  for (const s of subs) {
    const u = userById[s.userId];
    const opp = oppById[s.opportunityId];
    const base = { actorId: s.userId, actorName: u?.fullName, actorEmail: u?.email, href: `/admin/subscriptions/${s.id}` };
    if (want("subscriptions") && s.submittedAt) {
      events.push({
        ...base, id: `sub:${s.id}`, kind: "subscribed", category: "subscriptions",
        title: `Subscribed — ${s.unitsRequested} unit${s.unitsRequested !== 1 ? "s" : ""}`,
        detail: opp?.title || "an opportunity", amount: money(s.totalAmount, s.currency), createdAt: s.submittedAt,
      });
    }
    if (want("payments") && s.proofUploadedAt) {
      events.push({
        ...base, id: `pay:${s.id}`, kind: "payment_proof", category: "payments",
        title: "Uploaded payment proof", detail: opp?.title || "a subscription", createdAt: s.proofUploadedAt,
      });
    }
    if (want("subscriptions") && s.cancelledAt) {
      events.push({
        ...base, id: `cancel:${s.id}`, kind: "subscription_cancelled", category: "subscriptions",
        title: "Cancelled a subscription", detail: opp?.title || "", createdAt: s.cancelledAt,
      });
    }
  }
  for (const r of sales) {
    const u = userById[r.userId];
    const spv = spvById[r.spvId];
    events.push({
      id: `sale:${r.id}`, kind: "sale_requested", category: "sales",
      actorId: r.userId, actorName: u?.fullName, actorEmail: u?.email, href: `/admin/sales/${r.id}`,
      title: `Requested to sell ${r.unitsOffered} unit${r.unitsOffered !== 1 ? "s" : ""}`,
      detail: spv?.spvName || "", amount: money(r.indicativeAmount, r.currency), createdAt: r.createdAt,
    });
    if (r.settledAt) {
      events.push({
        id: `sale-settled:${r.id}`, kind: "sale_settled", category: "sales",
        actorId: r.userId, actorName: u?.fullName, actorEmail: u?.email, href: `/admin/sales/${r.id}`,
        title: `Sale settled — ${r.settledUnits ?? r.unitsOffered} units`,
        detail: spv?.spvName || "", amount: r.settledAmount ? money(r.settledAmount, r.currency) : null, createdAt: r.settledAt,
      });
    }
  }

  let merged = events.filter((e) => e.createdAt);
  if (search) {
    const q = search.trim().toLowerCase();
    merged = merged.filter(
      (e) =>
        (e.actorName || "").toLowerCase().includes(q) ||
        (e.actorEmail || "").toLowerCase().includes(q) ||
        (e.detail || "").toLowerCase().includes(q) ||
        (e.title || "").toLowerCase().includes(q)
    );
  }
  merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hasMore = merged.length > limit;
  return { items: merged.slice(0, limit), hasMore };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: INVESTOR LIST (with search, filter, pagination)
// ════════════════════════════════════════════════════════════════════

export async function listInvestors({
  search,
  kycStatus,
  country,
  tag,
  flagged,
  role,
  sortBy = "newest",
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};

  if (role) {
    where.role = role;
  } else {
    where.role = "investor";
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  if (kycStatus) where.kycStatus = kycStatus;
  if (country) where.country = country.toUpperCase();
  if (tag) where.tags = { has: tag };
  if (flagged !== undefined) where.flaggedForReview = flagged;

  const orderBy = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    name: { fullName: "asc" },
    last_seen: { lastSeenAt: "desc" },
  }[sortBy] || { createdAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [investors, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        residency: true,
        country: true,
        emailVerified: true,
        kycStatus: true,
        accountActivated: true,
        flaggedForReview: true,
        flagReason: true,
        tags: true,
        suspendedAt: true,
        lastSeenAt: true,
        createdAt: true,
        referredById: true,
        referralCount: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // ── Per-investor capital (real money, aggregated for just this page) ────────
  // Two grouped queries scoped to the visible user IDs — keeps the table cheap
  // while surrendering genuine commitment / invested figures (no fabrication).
  const ACTIVE_ALLOC = ["ACTIVE", "PARTIALLY_TRANSFERRED"];
  const ids = investors.map((i) => i.id);
  const [allocAgg, subAgg] = ids.length
    ? await Promise.all([
        prisma.allocation.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, status: { in: ACTIVE_ALLOC } },
          _sum: { amountReceived: true, unitsAllocated: true },
          _count: { _all: true },
        }),
        prisma.subscription.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, status: { in: SUBSCRIPTION_ACTIVE_STATUSES } },
          _sum: { totalAmount: true },
        }),
      ])
    : [[], []];

  const investedMap = new Map(
    allocAgg.map((a) => [a.userId, {
      invested: Number(a._sum.amountReceived ?? 0),
      units: a._sum.unitsAllocated ?? 0,
      positions: a._count._all,
    }]),
  );
  const committedMap = new Map(subAgg.map((s) => [s.userId, Number(s._sum.totalAmount ?? 0)]));

  const enriched = investors.map((inv) => {
    const a = investedMap.get(inv.id);
    const invested = a?.invested ?? 0;
    const committed = committedMap.get(inv.id) ?? 0;
    return {
      ...inv,
      invested,
      committed,
      unfunded: Math.max(committed - invested, 0),
      positions: a?.positions ?? 0,
      units: a?.units ?? 0,
    };
  });

  return {
    investors: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: SINGLE INVESTOR (with full details)
// ════════════════════════════════════════════════════════════════════

export async function getInvestorById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      kycDocuments: {
        orderBy: { uploadedAt: "desc" },
      },
      consents: {
        orderBy: { grantedAt: "desc" },
      },
      onboardingProgress: true,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: INVESTOR FINANCIAL FOOTPRINT
//
// Counts the investor's *active* financial ties. Used to block account
// deletion while the investor is mid-investment (their Subscription /
// Allocation / Holding / ShareSaleRequest rows store userId as a plain
// column, so they would otherwise be silently orphaned).
// ════════════════════════════════════════════════════════════════════

export async function getInvestorFinancialFootprint(userId) {
  const [activeSubscriptions, activeAllocations, holdings, activeSaleRequests] =
    await Promise.all([
      prisma.subscription.count({
        where: { userId, status: { in: SUBSCRIPTION_ACTIVE_STATUSES } },
      }),
      prisma.allocation.count({
        where: { userId, status: { in: ["ACTIVE", "PARTIALLY_TRANSFERRED"] } },
      }),
      prisma.holding.count({
        where: { userId, totalUnits: { gt: 0 } },
      }),
      prisma.shareSaleRequest.count({
        where: { userId, status: { in: SALE_REQUEST_ACTIVE_STATUSES } },
      }),
    ]);

  const total =
    activeSubscriptions + activeAllocations + holdings + activeSaleRequests;

  return {
    activeSubscriptions,
    activeAllocations,
    holdings,
    activeSaleRequests,
    total,
    hasActivePositions: total > 0,
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: INVESTOR MODIFICATIONS
// ════════════════════════════════════════════════════════════════════

export async function updateInvestorTags(userId, tags) {
  return prisma.user.update({
    where: { id: userId },
    data: { tags },
    select: { id: true, tags: true },
  });
}

export async function flagInvestor(userId, reason) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      flaggedForReview: true,
      flagReason: reason,
    },
  });
}

export async function unflagInvestor(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      flaggedForReview: false,
      flagReason: null,
    },
  });
}

export async function suspendInvestor(userId, reason) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      suspendedAt: new Date(),
      suspensionReason: reason,
    },
  });
}

export async function unsuspendInvestor(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      suspendedAt: null,
      suspensionReason: null,
    },
  });
}

export async function updateUserRole(userId, role) {
  if (!["investor", "admin", "super_admin"].includes(role)) {
    throw new Error("Invalid role");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true, email: true, fullName: true },
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: NOTES
// ════════════════════════════════════════════════════════════════════

export async function addAdminNote({ targetUserId, authorAdminId, content }) {
  return prisma.adminNote.create({
    data: {
      targetUserId,
      authorAdminId,
      content,
    },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function getNotesForInvestor(userId) {
  return prisma.adminNote.findMany({
    where: { targetUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteAdminNote(noteId, requestingAdminId) {
  // Only the author or a super_admin can delete
  const note = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error("Note not found");
  if (note.authorAdminId !== requestingAdminId) {
    const admin = await prisma.user.findUnique({
      where: { id: requestingAdminId },
      select: { role: true },
    });
    if (admin?.role !== "super_admin") {
      throw new Error("Only the author or super_admin can delete this note");
    }
  }
  return prisma.adminNote.delete({ where: { id: noteId } });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: KYC QUEUE
// ════════════════════════════════════════════════════════════════════

export async function getKycQueue({ limit = 50 } = {}) {
  return prisma.user.findMany({
    where: {
      role: "investor",
      kycStatus: "pending_review",
    },
    include: {
      kycDocuments: {
        orderBy: { uploadedAt: "desc" },
      },
      onboardingProgress: {
        select: {
          kycSubmittedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: KYC DOCUMENT ACTIONS
// ════════════════════════════════════════════════════════════════════

export async function getKycDocument(docId) {
  return prisma.kycDocument.findUnique({
    where: { id: docId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          kycStatus: true,
        },
      },
    },
  });
}

export async function approveKycDocument({ docId, reviewerAdminId }) {
  return prisma.kycDocument.update({
    where: { id: docId },
    data: {
      reviewStatus: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewerAdminId,
      rejectionReason: null,
    },
  });
}

export async function rejectKycDocument({ docId, reviewerAdminId, reason }) {
  return prisma.kycDocument.update({
    where: { id: docId },
    data: {
      reviewStatus: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerAdminId,
      rejectionReason: reason,
    },
  });
}

/**
 * After approving/rejecting any KYC document, recompute the user's
 * overall kycStatus. Call this from the approve/reject API routes.
 *
 * Returns { newStatus, allApproved, anyRejected }
 */
export async function recomputeUserKycStatus(userId) {
  const docs = await prisma.kycDocument.findMany({
    where: { userId },
    select: { documentType: true, reviewStatus: true },
  });

  const REQUIRED = ["id_front", "id_back", "proof_of_address", "selfie", "source_of_funds"];

  const statusByType = {};
  for (const doc of docs) {
    statusByType[doc.documentType] = doc.reviewStatus;
  }

  const allApproved = REQUIRED.every((t) => statusByType[t] === "approved");
  const anyRejected = REQUIRED.some((t) => statusByType[t] === "rejected");

  let newStatus;
  if (anyRejected) {
    newStatus = "rejected";
  } else if (allApproved) {
    newStatus = "approved";
  } else {
    newStatus = "pending_review";
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: newStatus },
  });

  // If newly approved AND all other conditions met, activate account
  if (newStatus === "approved" && updated.consentsComplete && updated.onboardingComplete) {
    await prisma.user.update({
      where: { id: userId },
      data: { accountActivated: true },
    });
    // Phase 7: advance referral edge to ACTIVATED (no-op if not referred)
    await syncReferralStatus({ refereeUserId: userId, status: "ACTIVATED" }).catch(() => {});
  }

  return { newStatus, allApproved, anyRejected };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: ADMIN USER LIST (for super_admin team management)
// ════════════════════════════════════════════════════════════════════

export async function listAdmins() {
  return prisma.user.findMany({
    where: {
      OR: [{ role: "admin" }, { role: "super_admin" }],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      lastSeenAt: true,
      createdAt: true,
      suspendedAt: true,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: LAST-SEEN TRACKING
// ════════════════════════════════════════════════════════════════════

export async function bumpLastSeen(userId) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  } catch (err) {
    console.error("[bumpLastSeen] Failed:", err);
  }
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//                  PHASE 3 — PROPERTIES, SPVs, MORTGAGES
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// PROPERTIES
// ════════════════════════════════════════════════════════════════════

export async function listProperties({
  search,
  city,
  country,
  status,
  propertyType,
  sortBy = "newest",
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { addressLine1: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { postcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (city) where.city = { contains: city, mode: "insensitive" };
  if (country) where.country = country.toUpperCase();
  if (status) where.status = status;
  if (propertyType) where.propertyType = propertyType;

  const orderBy = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    title: { title: "asc" },
  }[sortBy] || { createdAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        images: {
          where: { isHero: true },
          take: 1,
        },
        spv: {
          select: { id: true, spvName: true, status: true },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPropertyById(propertyId) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      images: {
        orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }],
      },
      spv: {
        include: {
          mortgage: true,
        },
      },
    },
  });
}

export async function createProperty(data) {
  return prisma.property.create({
    data: {
      title: data.title,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      region: data.region || null,
      postcode: data.postcode,
      country: data.country || "GB",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      sqft: data.sqft ?? null,
      yearBuilt: data.yearBuilt ?? null,
      description: data.description || null,
      story: data.story || null,
      neighbourhoodHighlights: data.neighbourhoodHighlights || null,
      status: data.status || "draft",
      createdById: data.createdById || null,
    },
  });
}

export async function updateProperty(propertyId, data) {
  const update = {};
  const fields = [
    "title", "addressLine1", "addressLine2", "city", "region",
    "postcode", "country", "latitude", "longitude", "propertyType",
    "bedrooms", "bathrooms", "sqft", "yearBuilt", "propertyValue",
    "description", "story", "neighbourhoodHighlights", "status",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }

  return prisma.property.update({
    where: { id: propertyId },
    data: update,
  });
}

export async function deleteProperty(propertyId) {
  return prisma.property.delete({
    where: { id: propertyId },
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY IMAGES
// ════════════════════════════════════════════════════════════════════

export async function addPropertyImage({
  propertyId, fileUrl, fileName, fileSize, mimeType,
  caption, altText, isHero, storageType,
}) {
  if (isHero) {
    await prisma.propertyImage.updateMany({
      where: { propertyId, isHero: true },
      data: { isHero: false },
    });
  }

  const lastImage = await prisma.propertyImage.findFirst({
    where: { propertyId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return prisma.propertyImage.create({
    data: {
      propertyId,
      fileUrl,
      fileName: fileName || null,
      fileSize: fileSize || null,
      mimeType: mimeType || null,
      caption: caption || null,
      altText: altText || null,
      isHero: !!isHero,
      sortOrder: (lastImage?.sortOrder ?? -1) + 1,
      storageType: storageType || "uploadthing",
    },
  });
}

export async function setPropertyHeroImage(imageId) {
  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    select: { propertyId: true },
  });
  if (!image) throw new Error("Image not found");

  await prisma.propertyImage.updateMany({
    where: { propertyId: image.propertyId, isHero: true },
    data: { isHero: false },
  });

  return prisma.propertyImage.update({
    where: { id: imageId },
    data: { isHero: true },
  });
}

export async function deletePropertyImage(imageId) {
  return prisma.propertyImage.delete({
    where: { id: imageId },
  });
}

// ════════════════════════════════════════════════════════════════════
// SPVs
// ════════════════════════════════════════════════════════════════════

export async function listSpvs({
  search,
  status,
  currency,
  sortBy = "newest",
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};

  if (search) {
    where.OR = [
      { spvName: { contains: search, mode: "insensitive" } },
      { companyNumber: { contains: search, mode: "insensitive" } },
      { property: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) where.status = status;
  if (currency) where.currency = currency.toUpperCase();

  const orderBy = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    name: { spvName: "asc" },
  }[sortBy] || { createdAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [spvs, total] = await Promise.all([
    prisma.spv.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
        mortgage: {
          select: {
            id: true,
            lenderName: true,
            ltvPct: true,
            principalAmount: true,
          },
        },
      },
    }),
    prisma.spv.count({ where }),
  ]);

  return {
    spvs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSpvById(spvId) {
  return prisma.spv.findUnique({
    where: { id: spvId },
    include: {
      property: {
        include: {
          images: {
            where: { isHero: true },
            take: 1,
          },
        },
      },
      mortgage: true,
    },
  });
}

export async function getSpvByCompanyNumber(companyNumber) {
  return prisma.spv.findUnique({
    where: { companyNumber },
  });
}

export async function listAvailableProperties() {
  return prisma.property.findMany({
    where: {
      spv: null,
      status: { not: "sold" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      propertyType: true,
      status: true,
    },
  });
}

export async function createSpv(data) {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    include: { spv: true },
  });
  if (!property) throw new Error("Property not found");
  if (property.spv) throw new Error("Property already has an SPV");

  return prisma.spv.create({
    data: {
      spvName: data.spvName,
      companyNumber: data.companyNumber,
      jurisdiction: data.jurisdiction || "UK",
      incorporatedOn: data.incorporatedOn ? new Date(data.incorporatedOn) : null,
      registeredAddress: data.registeredAddress || null,
      purpose: data.purpose || null,
      propertyId: data.propertyId,
      currency: data.currency || "GBP",
      targetRaiseAmount: data.targetRaiseAmount,
      unitPrice: data.unitPrice,
      totalUnits: data.totalUnits,
      minimumUnits: data.minimumUnits ?? 1,
      openDate: data.openDate ? new Date(data.openDate) : null,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      bankAccountReference: data.bankAccountReference || null,
      bankAccountName: data.bankAccountName || null,
      status: data.status || "draft",
      createdById: data.createdById || null,
    },
  });
}

export async function updateSpv(spvId, data) {
  const update = {};
  const fields = [
    "spvName", "companyNumber", "jurisdiction", "registeredAddress",
    "purpose", "currency", "targetRaiseAmount", "unitPrice",
    "totalUnits", "minimumUnits", "bankAccountReference",
    "bankAccountName", "status",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }
  if (data.incorporatedOn !== undefined) {
    update.incorporatedOn = data.incorporatedOn ? new Date(data.incorporatedOn) : null;
  }
  if (data.openDate !== undefined) {
    update.openDate = data.openDate ? new Date(data.openDate) : null;
  }
  if (data.closeDate !== undefined) {
    update.closeDate = data.closeDate ? new Date(data.closeDate) : null;
  }

  return prisma.spv.update({
    where: { id: spvId },
    data: update,
  });
}

export async function deleteSpv(spvId) {
  return prisma.spv.delete({
    where: { id: spvId },
  });
}

// ════════════════════════════════════════════════════════════════════
// MORTGAGES
// ════════════════════════════════════════════════════════════════════

export async function getMortgageBySpvId(spvId) {
  return prisma.mortgage.findUnique({
    where: { spvId },
  });
}

export async function upsertMortgage(spvId, data) {
  const spv = await prisma.spv.findUnique({ where: { id: spvId } });
  if (!spv) throw new Error("SPV not found");

  const payload = {
    spvId,
    lenderName: data.lenderName,
    mortgageType: data.mortgageType,
    currency: data.currency || spv.currency,
    principalAmount: data.principalAmount,
    ltvPct: data.ltvPct,
    interestRate: data.interestRate,
    termMonths: data.termMonths,
    monthlyPaymentEst: data.monthlyPaymentEst ?? null,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : null,
    covenantsNotes: data.covenantsNotes || null,
  };

  return prisma.mortgage.upsert({
    where: { spvId },
    create: payload,
    update: payload,
  });
}

export async function deleteMortgage(spvId) {
  return prisma.mortgage.delete({
    where: { spvId },
  });
}

// ════════════════════════════════════════════════════════════════════
// SUPPORTED CURRENCIES + REFERENCE DATA (for dropdowns)
// ════════════════════════════════════════════════════════════════════

export const SUPPORTED_CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

export const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "hmo", label: "HMO (House in Multiple Occupation)" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "land", label: "Land / Development" },
];

export const MORTGAGE_TYPES = [
  { value: "spv_btl", label: "SPV Buy-to-Let" },
  { value: "commercial", label: "Commercial" },
  { value: "bridging", label: "Bridging" },
  { value: "development", label: "Development" },
];

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//                  PHASE 3 MSG 2 — OPPORTUNITIES & DOCUMENTS
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

export async function listOpportunities({
  search,
  status,
  investorType,
  sortBy = "newest",
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { subtitle: { contains: search, mode: "insensitive" } },
      { spv: { spvName: { contains: search, mode: "insensitive" } } },
      { spv: { property: { title: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (status) where.status = status;
  if (investorType) where.eligibleInvestorTypes = { has: investorType };

  const orderBy = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    title: { title: "asc" },
    published: { publishedAt: "desc" },
  }[sortBy] || { createdAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        spv: {
          select: {
            id: true,
            spvName: true,
            companyNumber: true,
            currency: true,
            targetRaiseAmount: true,
            unitPrice: true,
            totalUnits: true,
            unitsAllocated: true,
            status: true,
            property: {
              select: {
                id: true,
                title: true,
                city: true,
                country: true,
                images: {
                  where: { isHero: true },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { documents: true },
        },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  const safe = opportunities.map((o) => ({
    ...o,
    spv: o.spv
      ? {
          ...o.spv,
          targetRaiseAmount: o.spv.targetRaiseAmount?.toString(),
          unitPrice: o.spv.unitPrice?.toString(),
        }
      : null,
  }));

  return {
    opportunities: safe,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOpportunityById(opportunityId) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      spv: {
        include: {
          property: {
            include: {
              images: {
                orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }],
              },
            },
          },
          mortgage: true,
        },
      },
      documents: {
        orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
      },
    },
  });

  if (!opp) return null;

  return {
    ...opp,
    spv: opp.spv
      ? {
          ...opp.spv,
          targetRaiseAmount: opp.spv.targetRaiseAmount?.toString(),
          unitPrice: opp.spv.unitPrice?.toString(),
          mortgage: opp.spv.mortgage
            ? {
                ...opp.spv.mortgage,
                principalAmount: opp.spv.mortgage.principalAmount?.toString(),
                monthlyPaymentEst: opp.spv.mortgage.monthlyPaymentEst?.toString() || null,
              }
            : null,
        }
      : null,
  };
}

export async function listSpvsAvailableForOpportunity() {
  return prisma.spv.findMany({
    where: {
      opportunity: null,
      status: { in: ["draft", "active"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      spvName: true,
      companyNumber: true,
      status: true,
      currency: true,
      targetRaiseAmount: true,
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          images: {
            where: { isHero: true },
            take: 1,
          },
        },
      },
    },
  }).then((spvs) =>
    spvs.map((s) => ({
      ...s,
      targetRaiseAmount: s.targetRaiseAmount?.toString(),
    }))
  );
}

export async function createOpportunity(data) {
  const spv = await prisma.spv.findUnique({
    where: { id: data.spvId },
    include: {
      opportunity: true,
      property: {
        include: {
          images: { where: { isHero: true }, take: 1 },
        },
      },
    },
  });
  if (!spv) throw new Error("SPV not found");
  if (spv.opportunity) throw new Error("SPV already has an opportunity");

  const heroImageUrl = spv.property?.images?.[0]?.fileUrl || null;

  return prisma.opportunity.create({
    data: {
      spvId: data.spvId,
      title: data.title,
      subtitle: data.subtitle || null,
      summary: data.summary || null,
      fullDescription: data.fullDescription || null,
      riskWarning: data.riskWarning || null,
      targetYieldPct: data.targetYieldPct ?? null,
      termMonths: data.termMonths ?? null,
      projectedReturnPct: data.projectedReturnPct ?? null,
      requiresKyc: data.requiresKyc ?? false,
      eligibleInvestorTypes: data.eligibleInvestorTypes || ["retail", "sophisticated", "hnw"],
      requiresSuitabilityCheck: data.requiresSuitabilityCheck ?? false,
      suitabilityQuestions: data.suitabilityQuestions || null,
      status: data.status || "draft",
      openDate: data.openDate ? new Date(data.openDate) : spv.openDate,
      closeDate: data.closeDate ? new Date(data.closeDate) : spv.closeDate,
      heroImageUrl,
      createdById: data.createdById || null,
    },
  });
}

export async function updateOpportunity(opportunityId, data) {
  const update = {};
  const fields = [
    "title", "subtitle", "summary", "fullDescription", "riskWarning",
    "rentalStrategy", "exitStrategy", "walkthroughVideoUrl",
    "targetYieldPct", "termMonths", "projectedReturnPct",
    "requiresKyc", "eligibleInvestorTypes", "requiresSuitabilityCheck",
    "suitabilityQuestions", "heroImageUrl",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }
  if (data.openDate !== undefined) {
    update.openDate = data.openDate ? new Date(data.openDate) : null;
  }
  if (data.closeDate !== undefined) {
    update.closeDate = data.closeDate ? new Date(data.closeDate) : null;
  }

  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: update,
  });
}

export async function deleteOpportunity(opportunityId) {
  return prisma.opportunity.delete({
    where: { id: opportunityId },
  });
}

// ════════════════════════════════════════════════════════════════════
// OPPORTUNITIES — STATUS WORKFLOW
// ════════════════════════════════════════════════════════════════════

export async function publishOpportunity(opportunityId) {
  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status: "live",
      publishedAt: new Date(),
    },
  });
}

export async function closeOpportunity(opportunityId) {
  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status: "closed",
      closedAt: new Date(),
    },
  });
}

export async function markOpportunityFunded(opportunityId) {
  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status: "funded",
      closedAt: new Date(),
    },
  });
}

export async function archiveOpportunity(opportunityId) {
  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: { status: "archived" },
  });
}

export async function revertOpportunityToDraft(opportunityId) {
  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      status: "draft",
      publishedAt: null,
      closedAt: null,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// OPPORTUNITY DOCUMENTS
// ════════════════════════════════════════════════════════════════════

export async function addOpportunityDocument({
  opportunityId, fileUrl, fileName, fileSize, mimeType,
  category, title, description, isRequired, storageType, uploadedById,
}) {
  const lastDoc = await prisma.opportunityDocument.findFirst({
    where: { opportunityId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return prisma.opportunityDocument.create({
    data: {
      opportunityId,
      fileUrl,
      fileName,
      fileSize: fileSize ?? null,
      mimeType: mimeType ?? null,
      category: category || "other",
      title: title || null,
      description: description || null,
      sortOrder: (lastDoc?.sortOrder ?? -1) + 1,
      isRequired: !!isRequired,
      storageType: storageType || "uploadthing",
      uploadedById: uploadedById || null,
    },
  });
}

export async function updateOpportunityDocument(documentId, data) {
  const update = {};
  const fields = ["title", "description", "category", "sortOrder", "isRequired"];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }
  return prisma.opportunityDocument.update({
    where: { id: documentId },
    data: update,
  });
}

export async function deleteOpportunityDocument(documentId) {
  return prisma.opportunityDocument.delete({
    where: { id: documentId },
  });
}

// ════════════════════════════════════════════════════════════════════
// OPPORTUNITY CONSTANTS (for dropdowns)
// ════════════════════════════════════════════════════════════════════

export const OPPORTUNITY_STATUSES = [
  { value: "draft", label: "Draft", color: "muted", description: "Not yet visible to investors" },
  { value: "live", label: "Live", color: "success", description: "Open for investment" },
  { value: "closed", label: "Closed", color: "muted", description: "No longer accepting subscriptions" },
  { value: "funded", label: "Funded", color: "navy", description: "Target raise complete" },
  { value: "archived", label: "Archived", color: "muted", description: "Hidden from listings" },
];

export const DOCUMENT_CATEGORIES = [
  { value: "prospectus", label: "Prospectus", required: true },
  { value: "im", label: "Information Memorandum", required: true },
  { value: "aml", label: "AML Policy", required: false },
  { value: "valuation", label: "Valuation Report", required: false },
  { value: "certificate", label: "Certificate", required: false },
  { value: "legal", label: "Legal Document", required: false },
  { value: "other", label: "Other", required: false },
];

export const INVESTOR_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "sophisticated", label: "Sophisticated" },
  { value: "hnw", label: "High Net Worth" },
];

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 3 MSG 3 — INVESTOR-FACING QUERIES + AUDIT
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

export async function getInvestorDashboardSummary(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      emailVerified: true,
      onboardingComplete: true,
      kycStatus: true,
      consentsComplete: true,
      accountActivated: true,
      registrationStatus: true,
      investorType: true,
      suspendedAt: true,
    },
  });

  if (!user) return null;

  const liveOpportunitiesCount = await prisma.opportunity.count({
    where: {
      status: "live",
      ...(user.investorType
        ? { eligibleInvestorTypes: { has: user.investorType } }
        : {}),
    },
  });

  let nextStep = null;
  if (!user.emailVerified) {
    nextStep = { step: "verify_email", label: "Verify your email" };
  } else if (!user.onboardingComplete) {
    nextStep = { step: "complete_profile", label: "Complete your profile", url: "/portal/verify" };
  } else if (user.kycStatus === "not_started") {
    nextStep = { step: "start_kyc", label: "Submit KYC documents", url: "/portal/verify" };
  } else if (user.kycStatus === "pending_review") {
    nextStep = { step: "kyc_review", label: "KYC under review" };
  } else if (user.kycStatus === "rejected") {
    nextStep = { step: "kyc_rejected", label: "Resubmit KYC", url: "/portal/verify" };
  } else if (!user.consentsComplete) {
    nextStep = { step: "complete_consents", label: "Accept legal terms", url: "/portal/verify" };
  }

  return {
    user,
    liveOpportunitiesCount,
    nextStep,
    isActivated: !!user.accountActivated && !user.suspendedAt,
  };
}

export async function listOpportunitiesForInvestor({
  userId,
  search,
  sortBy = "newest",
  page = 1,
  pageSize = 20,
} = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { investorType: true, kycStatus: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) {
    return { opportunities: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const where = {
    status: "live",
  };

  if (user.investorType) {
    where.eligibleInvestorTypes = { has: user.investorType };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { subtitle: { contains: search, mode: "insensitive" } },
      { spv: { property: { title: { contains: search, mode: "insensitive" } } } },
      { spv: { property: { city: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const orderBy = {
    newest: { publishedAt: "desc" },
    oldest: { publishedAt: "asc" },
    yield: { targetYieldPct: "desc" },
    closing: { closeDate: "asc" },
  }[sortBy] || { publishedAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        heroImageUrl: true,
        targetYieldPct: true,
        termMonths: true,
        projectedReturnPct: true,
        openDate: true,
        closeDate: true,
        publishedAt: true,
        requiresKyc: true,
        spv: {
          select: {
            currency: true,
            targetRaiseAmount: true,
            unitPrice: true,
            totalUnits: true,
            unitsAllocated: true,
            minimumUnits: true,
            property: {
              select: {
                title: true,
                city: true,
                country: true,
                propertyType: true,
                images: {
                  where: { isHero: true },
                  take: 1,
                  select: { fileUrl: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  const safe = opportunities.map((o) => ({
    ...o,
    spv: o.spv
      ? {
          ...o.spv,
          targetRaiseAmount: o.spv.targetRaiseAmount?.toString() ?? "0",
          unitPrice: o.spv.unitPrice?.toString() ?? "0",
        }
      : null,
  }));

  return {
    opportunities: safe,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOpportunityForInvestor({ opportunityId, userId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { investorType: true, kycStatus: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) return null;

  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      summary: true,
      fullDescription: true,
      riskWarning: true,
      rentalStrategy: true,
      exitStrategy: true,
      walkthroughVideoUrl: true,
      targetYieldPct: true,
      termMonths: true,
      projectedReturnPct: true,
      openDate: true,
      closeDate: true,
      publishedAt: true,
      status: true,
      heroImageUrl: true,
      requiresKyc: true,
      eligibleInvestorTypes: true,
      requiresSuitabilityCheck: true,
      spv: {
        select: {
          spvName: true,
          companyNumber: true,
          jurisdiction: true,
          purpose: true,
          currency: true,
          targetRaiseAmount: true,
          unitPrice: true,
          totalUnits: true,
          unitsAllocated: true,
          minimumUnits: true,
          property: {
            select: {
              title: true,
              addressLine1: true,
              city: true,
              region: true,
              postcode: true,
              country: true,
              latitude: true,
              longitude: true,
              propertyType: true,
              bedrooms: true,
              bathrooms: true,
              sqft: true,
              yearBuilt: true,
              propertyValue: true,
              description: true,
              story: true,
              neighbourhoodHighlights: true,
              images: {
                orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }],
                select: {
                  id: true,
                  fileUrl: true,
                  caption: true,
                  altText: true,
                  isHero: true,
                },
              },
            },
          },
        },
      },
      documents: {
        orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          category: true,
          title: true,
          description: true,
          isRequired: true,
        },
      },
    },
  });

  if (!opp) return null;

  if (opp.status !== "live") return null;

  if (user.investorType && !opp.eligibleInvestorTypes.includes(user.investorType)) {
    return null;
  }

  if (opp.requiresKyc && opp.requiresKyc === true && user.kycStatus !== "approved") {
    return null;
  }

  return {
    ...opp,
    spv: opp.spv
      ? {
          ...opp.spv,
          targetRaiseAmount: opp.spv.targetRaiseAmount?.toString() ?? "0",
          unitPrice: opp.spv.unitPrice?.toString() ?? "0",
          property: opp.spv.property
            ? {
                ...opp.spv.property,
                propertyValue: opp.spv.property.propertyValue?.toString() ?? null,
              }
            : null,
        }
      : null,
  };
}

export async function recordOpportunityView({ opportunityId, userId, ipAddress, userAgent }) {
  try {
    return await prisma.opportunityView.create({
      data: {
        opportunityId,
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error("[recordOpportunityView] failed:", err?.message);
    return null;
  }
}

export async function recordDocumentView({
  documentId, opportunityId, userId, ipAddress, userAgent,
}) {
  try {
    return await prisma.documentView.create({
      data: {
        documentId,
        opportunityId,
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error("[recordDocumentView] failed:", err?.message);
    return null;
  }
}

export async function getUserViewedDocumentIds(userId, opportunityId) {
  const views = await prisma.documentView.findMany({
    where: { userId, opportunityId },
    select: { documentId: true },
    distinct: ["documentId"],
  });
  return views.map((v) => v.documentId);
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 4 MSG 1 — PROFILE / SECURITY / PREFERENCES
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

export async function getInvestorProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      username: true,
      avatarUrl: true,
      residency: true,
      country: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postcode: true,
      postcodeFormat: true,
      phoneNumber: true,
      occupation: true,
      dateOfBirth: true,
      sourceOfFunds: true,
      sourceOfFundsDetail: true,
      estimatedNetWorth: true,
      investorType: true,
      kycStatus: true,
      accountActivated: true,
      createdAt: true,
    },
  });
}

// Investor profile picture. `url` may be null to remove the current avatar.
export async function setUserAvatar(userId, url) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url || null },
    select: { id: true, avatarUrl: true },
  });
}

const ADDRESS_FIELDS = ["addressLine1", "addressLine2", "city", "region", "postcode"];

export async function updateInvestorProfile(userId, data) {
  const update = {};
  const allowedFields = [
    "addressLine1", "addressLine2", "city", "region",
    "postcode", "phoneNumber", "occupation",
  ];
  for (const f of allowedFields) {
    if (data[f] !== undefined) update[f] = data[f] || null;
  }

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postcode: true,
      kycStatus: true,
    },
  });
  if (!current) throw new Error("User not found");

  const addressChanged = ADDRESS_FIELDS.some(
    (f) => f in update && (update[f] || null) !== (current[f] || null)
  );

  if (addressChanged && current.kycStatus === "approved") {
    update.flaggedForReview = true;
    update.flagReason = "Address changed by investor — proof of address re-verification required";
  }

  return prisma.user.update({
    where: { id: userId },
    data: update,
    select: {
      id: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      region: true,
      postcode: true,
      phoneNumber: true,
      occupation: true,
      flaggedForReview: true,
    },
  });
}

export async function getActiveSessions(userId) {
  const sessions = await prisma.authToken.findMany({
    where: {
      userId,
      type: "session",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      deviceInfo: true,
    },
  });

  return sessions;
}

export async function revokeSpecificSession(userId, sessionId) {
  const session = await prisma.authToken.findUnique({
    where: { id: sessionId },
    select: { userId: true, type: true, usedAt: true },
  });

  if (!session || session.userId !== userId || session.type !== "session") {
    return false;
  }

  await prisma.authToken.update({
    where: { id: sessionId },
    data: { usedAt: new Date() },
  });

  return true;
}

export async function revokeAllOtherSessions(userId, keepTokenHash) {
  return prisma.authToken.updateMany({
    where: {
      userId,
      type: "session",
      usedAt: null,
      tokenHash: { not: keepTokenHash },
    },
    data: { usedAt: new Date() },
  });
}

export async function createSessionWithDevice({ userId, tokenHash, expiresAt, deviceInfo }) {
  return prisma.authToken.create({
    data: {
      userId,
      tokenHash,
      type: "session",
      expiresAt,
      deviceInfo: deviceInfo || null,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES — CATEGORIES + DEFAULTS
// ════════════════════════════════════════════════════════════════════

export const NOTIFICATION_CATEGORIES = [
  {
    key: "opportunity_published",
    label: "New opportunities",
    description: "Email me when new investments go live",
    canDisableEmail: true,
    canDisableInApp: true,
  },
  {
    key: "subscription_update",
    label: "My subscriptions",
    description: "Updates on my subscriptions (allocations, certificates, etc.)",
    canDisableEmail: false,
    canDisableInApp: true,
  },
  {
    key: "admin_announcement",
    label: "Announcements",
    description: "Important news from Brick & Wealth",
    canDisableEmail: true,
    canDisableInApp: true,
  },
  {
    key: "property_update",
    label: "Property updates",
    description: "Updates on properties I've invested in",
    canDisableEmail: true,
    canDisableInApp: true,
  },
  {
    key: "security_alert",
    label: "Security alerts",
    description: "Login from new device, password changes, etc.",
    canDisableEmail: false,
    canDisableInApp: false,
  },
];

export async function getNotificationPreferences(userId) {
  const saved = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const byCategory = {};
  for (const p of saved) {
    byCategory[p.category] = p;
  }

  return NOTIFICATION_CATEGORIES.map((cat) => {
    const existing = byCategory[cat.key];
    return {
      category: cat.key,
      label: cat.label,
      description: cat.description,
      canDisableEmail: cat.canDisableEmail,
      canDisableInApp: cat.canDisableInApp,
      emailEnabled: existing ? existing.emailEnabled : true,
      inAppEnabled: existing ? existing.inAppEnabled : true,
    };
  });
}

export async function updateNotificationPreferences(userId, preferences) {
  if (!Array.isArray(preferences)) {
    throw new Error("preferences must be an array");
  }

  const validKeys = new Set(NOTIFICATION_CATEGORIES.map((c) => c.key));
  const updates = [];

  for (const pref of preferences) {
    if (!validKeys.has(pref.category)) continue;

    const cat = NOTIFICATION_CATEGORIES.find((c) => c.key === pref.category);
    const emailEnabled = cat.canDisableEmail
      ? !!pref.emailEnabled
      : true;
    const inAppEnabled = cat.canDisableInApp
      ? !!pref.inAppEnabled
      : true;

    updates.push(
      prisma.notificationPreference.upsert({
        where: {
          userId_category: { userId, category: pref.category },
        },
        update: { emailEnabled, inAppEnabled },
        create: { userId, category: pref.category, emailEnabled, inAppEnabled },
      })
    );
  }

  await Promise.all(updates);
  return getNotificationPreferences(userId);
}

export async function userWantsNotification(userId, category, channel) {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_category: { userId, category } },
  });

  const cat = NOTIFICATION_CATEGORIES.find((c) => c.key === category);

  if (!cat) return false;

  if (channel === "email") {
    if (!cat.canDisableEmail) return true;
    return pref ? pref.emailEnabled : true;
  }
  if (channel === "inApp") {
    if (!cat.canDisableInApp) return true;
    return pref ? pref.inAppEnabled : true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 4 MSG 2 — NOTIFICATIONS + ANNOUNCEMENTS
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

export async function createNotificationRow({
  userId, category, title, body, link, metadata,
}) {
  return prisma.notification.create({
    data: {
      userId,
      category,
      title,
      body: body || null,
      link: link || null,
      metadata: metadata || undefined,
    },
  });
}

export async function listNotifications({
  userId,
  category,
  onlyUnread = false,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = { userId };
  if (category) where.category = category;
  if (onlyUnread) where.readAt = null;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function getRecentNotifications(userId, limit = 10) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(notificationId, userId) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function deleteNotification(notificationId, userId) {
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
  return result.count > 0;
}

export async function deleteAllNotificationsForUser(userId) {
  const result = await prisma.notification.deleteMany({ where: { userId } });
  return result.count;
}

export async function purgeOldNotifications(days = 90) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.notification.deleteMany({
    where: {
      readAt: { not: null, lt: cutoff },
    },
  });
}

export async function listAnnouncements({
  status,
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};
  const now = new Date();

  if (status === "draft") {
    where.publishedAt = null;
  } else if (status === "published") {
    where.publishedAt = { not: null, lte: now };
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
  } else if (status === "expired") {
    where.expiresAt = { not: null, lte: now };
  }

  const skip = Math.max(0, (page - 1) * pageSize);

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    announcements,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAnnouncementById(announcementId) {
  return prisma.announcement.findUnique({
    where: { id: announcementId },
  });
}

export async function createAnnouncement({
  title, body, audience, isPinned, expiresAt, createdById,
}) {
  return prisma.announcement.create({
    data: {
      title,
      body,
      audience: audience || "all",
      isPinned: !!isPinned,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById,
    },
  });
}

export async function updateAnnouncement(announcementId, data) {
  const update = {};
  const fields = ["title", "body", "audience", "isPinned"];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }
  if (data.expiresAt !== undefined) {
    update.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }
  return prisma.announcement.update({
    where: { id: announcementId },
    data: update,
  });
}

export async function deleteAnnouncement(announcementId) {
  return prisma.announcement.delete({
    where: { id: announcementId },
  });
}

export async function publishAnnouncement(announcementId, notifiedCount) {
  return prisma.announcement.update({
    where: { id: announcementId },
    data: {
      publishedAt: new Date(),
      notifiedCount: notifiedCount || 0,
    },
  });
}

export async function resolveAnnouncementAudience(audience) {
  const baseWhere = {
    role: "investor",
    suspendedAt: null,
  };

  if (audience === "activated") {
    baseWhere.accountActivated = true;
  } else if (audience && audience.startsWith("tag:")) {
    const tagName = audience.slice(4);
    if (tagName) baseWhere.tags = { has: tagName };
  }

  const users = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, email: true, fullName: true },
  });

  return users;
}

export async function listAnnouncementsForInvestor({
  userId,
  page = 1,
  pageSize = 20,
} = {}) {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountActivated: true, tags: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) {
    return { announcements: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const audienceConditions = ["all"];
  if (user.accountActivated) audienceConditions.push("activated");
  for (const tag of user.tags || []) {
    audienceConditions.push(`tag:${tag}`);
  }

  const where = {
    publishedAt: { not: null, lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    audience: { in: audienceConditions },
  };

  const skip = Math.max(0, (page - 1) * pageSize);

  const reads = await prisma.announcementRead.findMany({
    where: { userId },
    select: { announcementId: true },
  });
  const readIds = new Set(reads.map((r) => r.announcementId));

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    announcements: announcements.map((a) => ({
      ...a,
      isRead: readIds.has(a.id),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMostRecentUnreadAnnouncement(userId) {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountActivated: true, tags: true, suspendedAt: true },
  });
  if (!user || user.suspendedAt) return null;

  const audienceConditions = ["all"];
  if (user.accountActivated) audienceConditions.push("activated");
  for (const tag of user.tags || []) {
    audienceConditions.push(`tag:${tag}`);
  }

  const reads = await prisma.announcementRead.findMany({
    where: { userId },
    select: { announcementId: true },
  });
  const readIds = reads.map((r) => r.announcementId);

  return prisma.announcement.findFirst({
    where: {
      publishedAt: { not: null, lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      audience: { in: audienceConditions },
      ...(readIds.length > 0 ? { id: { notIn: readIds } } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });
}

export async function markAnnouncementRead(announcementId, userId) {
  try {
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      update: {},
      create: { announcementId, userId },
    });
    return true;
  } catch (err) {
    console.error("[markAnnouncementRead] failed:", err?.message);
    return false;
  }
}

export const ANNOUNCEMENT_AUDIENCES = [
  { value: "all", label: "All investors", description: "Every active investor account" },
  { value: "activated", label: "Activated only", description: "Only fully-activated accounts (KYC approved)" },
];

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 4 MSG 3 — PROPERTY UPDATES + COMMENTS + REACTIONS
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// UPDATE TYPES + REACTION TYPES (constants for dropdowns / validation)
// ════════════════════════════════════════════════════════════════════

export const UPDATE_TYPES = [
  { value: "acquisition",   label: "Acquisition",       description: "Property purchase milestone" },
  { value: "refurb",        label: "Refurbishment",     description: "Works progress" },
  { value: "letting",       label: "Letting",           description: "Tenancy & occupancy news" },
  { value: "distribution",  label: "Distribution",      description: "Income paid to investors" },
  { value: "valuation",     label: "Valuation",         description: "Independent valuation update" },
  { value: "exit",          label: "Exit",              description: "Property sale / capital return" },
  { value: "general",       label: "General",           description: "Other news or admin notes" },
];

export const REACTION_TYPES = ["heart", "clap", "acknowledge"];

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: LIST
// ════════════════════════════════════════════════════════════════════

export async function listPropertyUpdatesForAdmin({
  opportunityId,
  includeDeleted = false,
  page = 1,
  pageSize = 50,
} = {}) {
  const where = { opportunityId };
  if (!includeDeleted) where.deletedAt = null;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [updates, total] = await Promise.all([
    prisma.propertyUpdate.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            reactions: true,
          },
        },
      },
    }),
    prisma.propertyUpdate.count({ where }),
  ]);

  return {
    updates,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: GET BY ID
// ════════════════════════════════════════════════════════════════════

export async function getPropertyUpdateById(updateId) {
  return prisma.propertyUpdate.findUnique({
    where: { id: updateId },
    include: {
      _count: {
        select: {
          comments: { where: { deletedAt: null } },
          reactions: true,
        },
      },
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: CREATE (draft)
// ════════════════════════════════════════════════════════════════════

export async function createPropertyUpdate({
  opportunityId, type, title, body, images, isPinned, metadata, createdById,
}) {
  return prisma.propertyUpdate.create({
    data: {
      opportunityId,
      type: type || "general",
      title,
      body,
      images: Array.isArray(images) ? images.slice(0, 6) : [],
      isPinned: !!isPinned,
      metadata: metadata || undefined,
      createdById,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: UPDATE
// ════════════════════════════════════════════════════════════════════

export async function updatePropertyUpdate(updateId, data) {
  const update = {};
  const fields = ["type", "title", "body", "isPinned", "metadata"];
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f];
  }
  if (data.images !== undefined) {
    update.images = Array.isArray(data.images) ? data.images.slice(0, 6) : [];
  }
  return prisma.propertyUpdate.update({
    where: { id: updateId },
    data: update,
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: PUBLISH
// ════════════════════════════════════════════════════════════════════

export async function publishPropertyUpdate(updateId, notifiedCount = 0) {
  return prisma.propertyUpdate.update({
    where: { id: updateId },
    data: {
      publishedAt: new Date(),
      notifiedCount,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — ADMIN: DELETE (soft)
// ════════════════════════════════════════════════════════════════════

export async function softDeletePropertyUpdate(updateId) {
  return prisma.propertyUpdate.update({
    where: { id: updateId },
    data: { deletedAt: new Date() },
  });
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — RESOLVE RECIPIENTS (Phase 5 swap point)
//
// Returns a list of user IDs to notify when an update is published.
//
// PHASE 4 MSG 3: Plan C — returns EMPTY array. Notifications are wired
// in the route but no actual recipients resolve, so no emails go out.
//
// PHASE 5 TODO: Replace this implementation with a query that returns
// only investors with an active Subscription / Allocation against the
// opportunity. The signature stays the same — call sites don't change.
//
//   const subscriptions = await prisma.subscription.findMany({
//     where: {
//       opportunityId,
//       status: { in: ["confirmed", "allocated"] },
//     },
//     select: { userId: true },
//     distinct: ["userId"],
//   });
//   return subscriptions.map((s) => s.userId);
// ════════════════════════════════════════════════════════════════════

export async function resolveUpdateRecipients(opportunityId) {
  // PHASE 5 MSG 4 — the swap. Investors who own (or are mid-allocation in)
  // this opportunity get notified when a property update is published.
  const subscriptions = await prisma.subscription.findMany({
    where: {
      opportunityId,
      status: { in: ["PARTIALLY_ALLOCATED", "FULLY_ALLOCATED"] },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return subscriptions.map((s) => s.userId);
}

// ════════════════════════════════════════════════════════════════════
// PROPERTY UPDATES — INVESTOR: LIST FOR OPPORTUNITY
//
// Returns published, non-deleted updates with reactions/comment counts.
// Caller must have already verified the user can see the opportunity.
// ════════════════════════════════════════════════════════════════════

export async function listPropertyUpdatesForInvestor({
  opportunityId,
  userId,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = {
    opportunityId,
    publishedAt: { not: null },
    deletedAt: null,
  };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [updates, total] = await Promise.all([
    prisma.propertyUpdate.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.propertyUpdate.count({ where }),
  ]);

  if (updates.length === 0) {
    return { updates: [], total, page, pageSize, totalPages: 0 };
  }

  // Aggregate reactions per update (one query, group by type)
  const updateIds = updates.map((u) => u.id);
  const reactionGroups = await prisma.updateReaction.groupBy({
    by: ["updateId", "type"],
    where: { updateId: { in: updateIds } },
    _count: { type: true },
  });

  const reactionsByUpdate = {};
  for (const r of reactionGroups) {
    if (!reactionsByUpdate[r.updateId]) reactionsByUpdate[r.updateId] = {};
    reactionsByUpdate[r.updateId][r.type] = r._count.type;
  }

  // Find which reactions the current user has made
  const userReactions = await prisma.updateReaction.findMany({
    where: { updateId: { in: updateIds }, userId },
    select: { updateId: true, type: true },
  });
  const userReactionsByUpdate = {};
  for (const r of userReactions) {
    if (!userReactionsByUpdate[r.updateId]) userReactionsByUpdate[r.updateId] = [];
    userReactionsByUpdate[r.updateId].push(r.type);
  }

  return {
    updates: updates.map((u) => ({
      ...u,
      reactionCounts: reactionsByUpdate[u.id] || {},
      myReactions: userReactionsByUpdate[u.id] || [],
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// REACTIONS — TOGGLE
//
// Adds or removes a reaction. Returns the new state for that type.
// ════════════════════════════════════════════════════════════════════

export async function toggleReaction({ updateId, userId, type }) {
  if (!REACTION_TYPES.includes(type)) {
    throw new Error("Invalid reaction type");
  }

  const existing = await prisma.updateReaction.findUnique({
    where: { updateId_userId_type: { updateId, userId, type } },
  });

  if (existing) {
    await prisma.updateReaction.delete({
      where: { id: existing.id },
    });
    return { added: false, type };
  }

  await prisma.updateReaction.create({
    data: { updateId, userId, type },
  });
  return { added: true, type };
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — LIST FOR UPDATE
//
// Returns top-level comments with their replies nested.
// Includes commenter info (name, role) for display.
// ════════════════════════════════════════════════════════════════════

export async function listCommentsForUpdate({
  updateId,
  page = 1,
  pageSize = 50,
} = {}) {
  const skip = Math.max(0, (page - 1) * pageSize);

  const topLevel = await prisma.updateComment.findMany({
    where: { updateId, parentCommentId: null },
    orderBy: [{ isPinnedByAdmin: "desc" }, { createdAt: "asc" }],
    skip,
    take: pageSize,
  });

  if (topLevel.length === 0) {
    return { comments: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Get all replies for these top-level comments
  const topLevelIds = topLevel.map((c) => c.id);
  const replies = await prisma.updateComment.findMany({
    where: { updateId, parentCommentId: { in: topLevelIds } },
    orderBy: { createdAt: "asc" },
  });

  // Collect all unique user IDs
  const userIds = new Set();
  for (const c of [...topLevel, ...replies]) userIds.add(c.userId);

  // Fetch user info in one query
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, fullName: true, role: true },
  });
  const usersById = {};
  for (const u of users) usersById[u.id] = u;

  function hydrate(c) {
    const user = usersById[c.userId] || { fullName: "Unknown", role: "investor" };
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    return {
      id: c.id,
      updateId: c.updateId,
      userId: c.userId,
      authorName: c.deletedAt ? "Deleted" : user.fullName,
      authorIsAdmin: isAdmin && !c.deletedAt,
      body: c.deletedAt ? "[deleted]" : c.body,
      parentCommentId: c.parentCommentId,
      isPinnedByAdmin: c.isPinnedByAdmin,
      isFlagged: c.isFlagged,
      isDeleted: !!c.deletedAt,
      editedAt: c.editedAt,
      createdAt: c.createdAt,
    };
  }

  // Build threaded structure
  const repliesByParent = {};
  for (const r of replies) {
    if (!repliesByParent[r.parentCommentId]) repliesByParent[r.parentCommentId] = [];
    repliesByParent[r.parentCommentId].push(hydrate(r));
  }

  const result = topLevel.map((c) => ({
    ...hydrate(c),
    replies: repliesByParent[c.id] || [],
  }));

  const total = await prisma.updateComment.count({
    where: { updateId, parentCommentId: null },
  });

  return {
    comments: result,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — CREATE
//
// Validates parent if provided.
// ════════════════════════════════════════════════════════════════════

export async function createComment({ updateId, userId, body, parentCommentId }) {
  if (parentCommentId) {
    const parent = await prisma.updateComment.findUnique({
      where: { id: parentCommentId },
      select: { updateId: true, parentCommentId: true, deletedAt: true },
    });
    if (!parent || parent.updateId !== updateId) {
      throw new Error("Invalid parent comment");
    }
    if (parent.deletedAt) {
      throw new Error("Cannot reply to a deleted comment");
    }
    // Enforce one level of threading
    if (parent.parentCommentId !== null) {
      throw new Error("Cannot reply to a reply — comments are one level deep");
    }
  }

  return prisma.updateComment.create({
    data: {
      updateId,
      userId,
      body,
      parentCommentId: parentCommentId || null,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — EDIT (within 5-min window, owner only)
// ════════════════════════════════════════════════════════════════════

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export async function editComment({ commentId, userId, body }) {
  const comment = await prisma.updateComment.findUnique({
    where: { id: commentId },
    select: { userId: true, createdAt: true, deletedAt: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.deletedAt) throw new Error("Comment was deleted");
  if (comment.userId !== userId) throw new Error("Not your comment");

  const age = Date.now() - new Date(comment.createdAt).getTime();
  if (age > EDIT_WINDOW_MS) {
    throw new Error("Edit window expired (5 minutes after posting)");
  }

  return prisma.updateComment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
  });
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — SOFT DELETE (owner or admin)
// ════════════════════════════════════════════════════════════════════

export async function softDeleteComment({ commentId, requestingUserId, isAdmin, reason }) {
  const comment = await prisma.updateComment.findUnique({
    where: { id: commentId },
    select: { userId: true, deletedAt: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.deletedAt) return; // idempotent

  // Owner OR admin
  if (comment.userId !== requestingUserId && !isAdmin) {
    throw new Error("Cannot delete others' comments");
  }

  return prisma.updateComment.update({
    where: { id: commentId },
    data: {
      deletedAt: new Date(),
      deletedByAdmin: !!isAdmin && comment.userId !== requestingUserId,
      deletionReason: isAdmin ? (reason || null) : null,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — ADMIN PIN
// ════════════════════════════════════════════════════════════════════

export async function setCommentPinnedByAdmin(commentId, isPinned) {
  return prisma.updateComment.update({
    where: { id: commentId },
    data: { isPinnedByAdmin: !!isPinned },
  });
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — FLAG (investor reports)
// ════════════════════════════════════════════════════════════════════

export async function flagComment({ commentId, reporterId, reason }) {
  try {
    await prisma.updateCommentFlag.create({
      data: { commentId, reporterId, reason: reason || null },
    });
  } catch (err) {
    // Unique constraint — already flagged. Idempotent.
    if (err?.code !== "P2002") throw err;
    return { alreadyFlagged: true };
  }

  // Update flagCount + isFlagged on the comment
  const count = await prisma.updateCommentFlag.count({
    where: { commentId },
  });

  await prisma.updateComment.update({
    where: { id: commentId },
    data: {
      flagCount: count,
      isFlagged: count > 0,
    },
  });

  return { flagCount: count };
}

// ════════════════════════════════════════════════════════════════════
// COMMENTS — ADMIN FLAG QUEUE
// ════════════════════════════════════════════════════════════════════

export async function listFlaggedComments({ limit = 50 } = {}) {
  return prisma.updateComment.findMany({
    where: { isFlagged: true, deletedAt: null },
    orderBy: [{ flagCount: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      update: {
        select: {
          id: true,
          title: true,
          opportunityId: true,
        },
      },
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// RATE LIMIT — comment posting (in-memory bucket)
//
// 5 comments per minute per user. Returns true if OK, false if limited.
// For production scale, swap to Upstash Redis-based limiter (Phase 9).
// ════════════════════════════════════════════════════════════════════

const _commentBuckets = new Map();
const COMMENT_LIMIT = 5;
const COMMENT_WINDOW_MS = 60_000;

export function checkCommentRateLimit(userId) {
  const now = Date.now();
  let bucket = _commentBuckets.get(userId);
  if (!bucket) {
    bucket = { count: 0, resetAt: now + COMMENT_WINDOW_MS };
    _commentBuckets.set(userId, bucket);
  }
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + COMMENT_WINDOW_MS;
  }
  if (bucket.count >= COMMENT_LIMIT) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { allowed: true };
}

// Cleanup expired buckets occasionally (best-effort, non-blocking)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [userId, bucket] of _commentBuckets.entries()) {
      if (now > bucket.resetAt + COMMENT_WINDOW_MS) {
        _commentBuckets.delete(userId);
      }
    }
  }, 5 * 60_000).unref?.();
}

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 5 MSG 1 — SUBSCRIPTIONS / ALLOCATIONS / HOLDINGS
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_STATUSES = {
  SUBMITTED:           "SUBMITTED",
  UNDER_REVIEW:        "UNDER_REVIEW",
  VERIFIED:            "VERIFIED",
  FUNDED:              "FUNDED",
  PARTIALLY_ALLOCATED: "PARTIALLY_ALLOCATED",
  FULLY_ALLOCATED:     "FULLY_ALLOCATED",
  REJECTED:            "REJECTED",
  CANCELLED:           "CANCELLED",
};

export const SUBSCRIPTION_STATUS_LABELS = {
  SUBMITTED:           { label: "Submitted",           color: "muted",   description: "Awaiting admin review" },
  UNDER_REVIEW:        { label: "Under Review",        color: "amber",   description: "Admin verifying details" },
  VERIFIED:            { label: "Verified",            color: "blue",    description: "Awaiting payment" },
  FUNDED:              { label: "Funded",              color: "blue",    description: "Payment received" },
  PARTIALLY_ALLOCATED: { label: "Partially Allocated", color: "navy",    description: "Some units issued" },
  FULLY_ALLOCATED:     { label: "Fully Allocated",     color: "success", description: "All units issued" },
  REJECTED:            { label: "Rejected",            color: "danger",  description: "" },
  CANCELLED:           { label: "Cancelled",           color: "muted",   description: "" },
};

// Active (non-terminal) statuses — visible in queues
export const SUBSCRIPTION_ACTIVE_STATUSES = [
  "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "FUNDED", "PARTIALLY_ALLOCATED",
];

// Statuses that count toward "owned" — for holdings + Phase 5 Msg 4 notifications
export const SUBSCRIPTION_OWNED_STATUSES = [
  "PARTIALLY_ALLOCATED", "FULLY_ALLOCATED",
];

// Oversized threshold (regulatory flag) — admin reviews these extra carefully
const OVERSIZED_GBP_THRESHOLD = 10_000;

// ════════════════════════════════════════════════════════════════════
// CERTIFICATE NUMBER GENERATOR
//
// Generates sequential "BW-HC-NNNN" numbers, zero-padded to 4 digits.
// ════════════════════════════════════════════════════════════════════

export async function generateNextCertificateNumber() {
  const count = await prisma.allocation.count({
    where: { certificateNumber: { not: null } },
  });
  const next = count + 1;
  return `BW-HC-${String(next).padStart(4, "0")}`;
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION ELIGIBILITY — CHECK BEFORE CREATE
// ════════════════════════════════════════════════════════════════════

export async function checkSubscriptionEligibility({ userId, opportunityId, allowRepeat = false }) {
  const reasons = [];
  const context = {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      kycStatus: true,
      accountActivated: true,
      suspendedAt: true,
      investorType: true,
      consentsComplete: true,
    },
  });

  if (!user) {
    return { eligible: false, reasons: ["user_not_found"], context };
  }

  if (user.suspendedAt) reasons.push("account_suspended");
  if (!user.accountActivated) reasons.push("account_not_activated");
  if (!user.consentsComplete) reasons.push("consents_incomplete");

  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      status: true,
      closeDate: true,
      requiresKyc: true,
      requiresSuitabilityCheck: true,
      eligibleInvestorTypes: true,
      spv: {
        select: {
          id: true,
          totalUnits: true,
          unitsAllocated: true,
          unitPrice: true,
          minimumUnits: true,
          currency: true,
          status: true,
          closeDate: true,
        },
      },
    },
  });

  if (!opp) {
    return { eligible: false, reasons: [...reasons, "opportunity_not_found"], context };
  }

  if (opp.status !== "live") reasons.push("opportunity_not_live");

  // KYC approval is required to subscribe to ANY opportunity, regardless
  // of the opportunity's own requiresKyc flag.
  if (user.kycStatus !== "approved") reasons.push("kyc_not_approved");

  if (
    user.investorType &&
    opp.eligibleInvestorTypes?.length > 0 &&
    !opp.eligibleInvestorTypes.includes(user.investorType)
  ) {
    reasons.push("investor_type_ineligible");
  }

  if (opp.closeDate && new Date(opp.closeDate) < new Date()) {
    reasons.push("opportunity_closed");
  }

  const active = await prisma.subscription.count({
    where: {
      userId,
      opportunityId,
      status: { in: SUBSCRIPTION_ACTIVE_STATUSES },
    },
  });
  // Phase 6: top-ups are allowed to have a concurrent in-flight subscription.
  if (active > 0 && !allowRepeat) reasons.push("already_active_subscription");

  const remainingUnits = (opp.spv?.totalUnits ?? 0) - (opp.spv?.unitsAllocated ?? 0);
  context.opportunity = opp;
  context.remainingUnits = remainingUnits;
  context.minimumUnits = opp.spv?.minimumUnits ?? 1;
  context.unitPrice = opp.spv?.unitPrice?.toString();
  context.currency = opp.spv?.currency;
  context.requiresSuitabilityCheck = opp.requiresSuitabilityCheck;

  if (remainingUnits <= 0) reasons.push("fully_subscribed");

  return {
    eligible: reasons.length === 0,
    reasons,
    context,
  };
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — CREATE (investor submits)
// ════════════════════════════════════════════════════════════════════

export async function createSubscription({
  userId,
  opportunityId,
  unitsRequested,
  selfCertifiedAtSubmit,
  riskAcknowledgedAtSubmit,
  suitabilityAnswers,
}) {
  if (!Number.isInteger(unitsRequested) || unitsRequested < 1) {
    throw new Error("unitsRequested must be a positive integer");
  }
  if (!selfCertifiedAtSubmit || !riskAcknowledgedAtSubmit) {
    throw new Error("Self-certification and risk acknowledgement are required");
  }

  const check = await checkSubscriptionEligibility({ userId, opportunityId });
  if (!check.eligible) {
    throw new Error(`Not eligible: ${check.reasons.join(", ")}`);
  }
  const { context } = check;

  if (unitsRequested < context.minimumUnits) {
    throw new Error(`Minimum subscription is ${context.minimumUnits} units`);
  }
  if (unitsRequested > context.remainingUnits) {
    throw new Error(`Only ${context.remainingUnits} units remaining`);
  }

  if (context.requiresSuitabilityCheck && !suitabilityAnswers) {
    throw new Error("Suitability answers are required for this opportunity");
  }

  const unitPriceAtSub = parseFloat(context.unitPrice);
  const totalAmount = unitPriceAtSub * unitsRequested;

  const oversized = totalAmount > OVERSIZED_GBP_THRESHOLD;

  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      selfCertifiedAt: now,
      riskAcknowledgedAt: now,
    },
  }).catch(() => {});

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      opportunityId,
      spvId: context.opportunity.spv.id,
      unitsRequested,
      unitPriceAtSub,
      totalAmount,
      currency: context.currency,
      status: SUBSCRIPTION_STATUSES.SUBMITTED,
      selfCertifiedAtSubmit: true,
      riskAcknowledgedAtSubmit: true,
      suitabilityAnswers: suitabilityAnswers || undefined,
      oversizedFlag: oversized,
      amlRequired: oversized,
      submittedAt: now,
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: "SUBSCRIPTION_CREATED",
      actorId: userId,
      actorRole: "investor",
      visibleToInvestor: true,
      afterState: {
        status: subscription.status,
        unitsRequested,
        totalAmount: totalAmount.toString(),
      },
    },
  }).catch(() => {});

  return subscription;
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — RECORD PROOF OF PAYMENT URL
// ════════════════════════════════════════════════════════════════════

export async function recordSubscriptionProofOfPayment({
  subscriptionId,
  userId,
  fileUrl,
  fileName,
}) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, userId: true, status: true, proofOfPaymentUrl: true },
  });
  if (!sub || sub.userId !== userId) throw new Error("Subscription not found");
  if (sub.status !== "SUBMITTED" && sub.status !== "UNDER_REVIEW") {
    throw new Error("Cannot upload proof after subscription has been processed");
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      proofOfPaymentUrl: fileUrl,
      proofOfPaymentName: fileName,
      proofUploadedAt: now,
      status: sub.status === "SUBMITTED" ? "UNDER_REVIEW" : sub.status,
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "PROOF_OF_PAYMENT_UPLOADED",
      actorId: userId,
      actorRole: "investor",
      visibleToInvestor: true,
      beforeState: { proofUrl: sub.proofOfPaymentUrl, status: sub.status },
      afterState: { proofUrl: fileUrl, status: updated.status },
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — STRIPE CARD PAYMENT
//
// Card payment is an optional rail in front of the existing flow. The
// investor still uploads a receipt and the admin still verifies/funds —
// these helpers only (a) fetch the amount to charge and (b) record that a
// card payment cleared (idempotently, from the webhook).
// ════════════════════════════════════════════════════════════════════

// Load the bits the /pay route needs, with ownership enforced.
export async function getSubscriptionForCheckout({ subscriptionId, userId }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true, userId: true, status: true,
      totalAmount: true, currency: true, unitsRequested: true,
      paidAt: true,
      opportunity: { select: { title: true } },
    },
  });
  if (!sub || sub.userId !== userId) return null;
  return sub;
}

// Idempotently mark a subscription as paid by card. Called from the Stripe
// webhook (the trusted source of truth). Does NOT change workflow status —
// the receipt upload still drives SUBMITTED → UNDER_REVIEW, and the admin
// still verifies/funds/allocates exactly as before.
export async function recordSubscriptionStripePayment({
  subscriptionId,
  sessionId,
  paymentIntentId,
}) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, paidAt: true },
  });
  if (!sub) return null;
  if (sub.paidAt) return sub; // already recorded — idempotent no-op

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      paymentMethod: "stripe_card",
      stripeCheckoutSessionId: sessionId || undefined,
      stripePaymentIntentId: paymentIntentId || undefined,
      paidAt: new Date(),
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "CARD_PAYMENT_RECEIVED",
      actorId: updated.userId,
      actorRole: "investor",
      visibleToInvestor: true,
      beforeState: { paidAt: null },
      afterState: { paidAt: updated.paidAt, paymentIntentId: paymentIntentId || null },
      notes: "Card payment cleared via Stripe.",
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — INVESTOR CANCELS (only allowed pre-VERIFIED)
// ════════════════════════════════════════════════════════════════════

export async function cancelSubscriptionByInvestor({ subscriptionId, userId }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, userId: true, status: true },
  });
  if (!sub || sub.userId !== userId) throw new Error("Subscription not found");

  const cancellableStates = ["SUBMITTED", "UNDER_REVIEW"];
  if (!cancellableStates.includes(sub.status)) {
    throw new Error(
      `Cannot cancel — subscription is already ${sub.status}. Contact support if you need help.`
    );
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "CANCELLED_BY_INVESTOR",
      actorId: userId,
      actorRole: "investor",
      visibleToInvestor: true,
      beforeState: { status: sub.status },
      afterState: { status: "CANCELLED" },
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — INVESTOR LISTS THEIR OWN
// ════════════════════════════════════════════════════════════════════

export async function listSubscriptionsForInvestor({
  userId,
  status,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = { userId };
  if (status) {
    if (status === "active") where.status = { in: SUBSCRIPTION_ACTIVE_STATUSES };
    else if (status === "owned") where.status = { in: SUBSCRIPTION_OWNED_STATUSES };
    else where.status = status;
  }

  const skip = Math.max(0, (page - 1) * pageSize);

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        opportunityId: true,
        spvId: true,
        unitsRequested: true,
        unitPriceAtSub: true,
        totalAmount: true,
        currency: true,
        status: true,
        submittedAt: true,
        verifiedAt: true,
        fundedAt: true,
        fullyAllocatedAt: true,
        proofOfPaymentUrl: true,
        proofUploadedAt: true,
        rejectionReason: true,
        oversizedFlag: true,
        subscriptionAgreementUrl: true,
        createdAt: true,
        allocations: {
          select: {
            id: true,
            unitsAllocated: true,
            unitPrice: true,
            amountReceived: true,
            certificateNumber: true,
            certificateUrl: true,
            certificateGeneratedAt: true,
            confirmedAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  const opportunityIds = [...new Set(subscriptions.map((s) => s.opportunityId))];
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
    select: {
      id: true,
      title: true,
      heroImageUrl: true,
      spv: { select: { property: { select: { city: true, country: true } } } },
    },
  });
  const oppById = {};
  for (const o of opportunities) oppById[o.id] = o;

  const safe = subscriptions.map((s) => ({
    ...s,
    unitPriceAtSub: s.unitPriceAtSub?.toString(),
    totalAmount: s.totalAmount?.toString(),
    opportunity: oppById[s.opportunityId] || null,
    allocations: s.allocations.map((a) => ({
      ...a,
      unitPrice: a.unitPrice?.toString(),
      amountReceived: a.amountReceived?.toString(),
    })),
  }));

  return {
    subscriptions: safe,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION — GET ONE (investor, own only)
// ════════════════════════════════════════════════════════════════════

export async function getSubscriptionForInvestor({ subscriptionId, userId }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      allocations: {
        orderBy: { confirmedAt: "asc" },
      },
      auditEvents: {
        where: { visibleToInvestor: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!sub || sub.userId !== userId) return null;

  const opp = await prisma.opportunity.findUnique({
    where: { id: sub.opportunityId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      heroImageUrl: true,
      targetYieldPct: true,
      termMonths: true,
      spv: {
        select: {
          id: true,
          spvName: true,
          companyNumber: true,
          unitPrice: true,
          nominalValue: true,
          currency: true,
          bankAccountName: true,
          bankAccountReference: true,
          property: {
            select: {
              title: true,
              city: true,
              country: true,
              addressLine1: true,
              postcode: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });

  return {
    ...sub,
    unitPriceAtSub: sub.unitPriceAtSub?.toString(),
    totalAmount: sub.totalAmount?.toString(),
    opportunity: opp
      ? {
          ...opp,
          spv: opp.spv
            ? {
                ...opp.spv,
                unitPrice: opp.spv.unitPrice?.toString(),
                nominalValue: opp.spv.nominalValue?.toString(),
              }
            : null,
        }
      : null,
    allocations: sub.allocations.map((a) => ({
      ...a,
      unitPrice: a.unitPrice?.toString(),
      amountReceived: a.amountReceived?.toString(),
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// ALLOCATION — CREATE (admin allocates; supports splits)
// ════════════════════════════════════════════════════════════════════

export async function createAllocation({
  subscriptionId,
  unitsAllocated,
  confirmedById,
  notes,
}) {
  if (!Number.isInteger(unitsAllocated) || unitsAllocated < 1) {
    throw new Error("unitsAllocated must be a positive integer");
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      allocations: {
        select: { unitsAllocated: true, status: true },
      },
    },
  });
  if (!sub) throw new Error("Subscription not found");

  if (sub.status === "REJECTED" || sub.status === "CANCELLED") {
    throw new Error(`Cannot allocate — subscription is ${sub.status}`);
  }
  if (sub.status === "FULLY_ALLOCATED") {
    throw new Error("Already fully allocated");
  }

  const alreadyAllocated = sub.allocations
    .filter((a) => a.status === "ACTIVE")
    .reduce((s, a) => s + a.unitsAllocated, 0);
  const remaining = sub.unitsRequested - alreadyAllocated;

  if (unitsAllocated > remaining) {
    throw new Error(
      `Only ${remaining} unit${remaining === 1 ? "" : "s"} remaining to allocate on this subscription`
    );
  }

  const unitPrice = parseFloat(sub.unitPriceAtSub.toString());
  const amountReceived = unitPrice * unitsAllocated;

  const certificateNumber = await generateNextCertificateNumber();

  const result = await prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.create({
      data: {
        subscriptionId: sub.id,
        spvId: sub.spvId,
        userId: sub.userId,
        unitsAllocated,
        unitPrice,
        amountReceived,
        certificateNumber,
        confirmedById,
        notes: notes || null,
      },
    });

    const newTotalAllocated = alreadyAllocated + unitsAllocated;
    const fullyAllocated = newTotalAllocated >= sub.unitsRequested;
    const now = new Date();

    const updatedSub = await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status: fullyAllocated ? "FULLY_ALLOCATED" : "PARTIALLY_ALLOCATED",
        fullyAllocatedAt: fullyAllocated ? now : sub.fullyAllocatedAt,
      },
    });

    await tx.spv.update({
      where: { id: sub.spvId },
      data: {
        unitsAllocated: { increment: unitsAllocated },
      },
    });

    await tx.subscriptionAuditEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: "ALLOCATION_CREATED",
        actorId: confirmedById,
        actorRole: "admin",
        visibleToInvestor: true,
        afterState: {
          allocationId: allocation.id,
          unitsAllocated,
          certificateNumber,
          status: updatedSub.status,
        },
        notes,
      },
    });

    return { allocation, subscription: updatedSub };
  });

  const holding = await recomputeHolding({
    userId: sub.userId,
    spvId: sub.spvId,
    opportunityId: sub.opportunityId,
  });

  return { ...result, holding };
}

// ════════════════════════════════════════════════════════════════════
// HOLDING — RECOMPUTE from allocations
// ════════════════════════════════════════════════════════════════════

export async function recomputeHolding({ userId, spvId, opportunityId }) {
  const [agg, spv] = await Promise.all([
    prisma.allocation.aggregate({
      where: { userId, spvId, status: "ACTIVE" },
      _sum: { unitsAllocated: true, amountReceived: true },
      _min: { confirmedAt: true },
    }),
    prisma.spv.findUnique({
      where: { id: spvId },
      select: { totalUnits: true, currency: true },
    }),
  ]);

  const totalUnits = agg._sum.unitsAllocated ?? 0;
  const totalInvested = agg._sum.amountReceived?.toString() ?? "0";
  const firstInvestedAt = agg._min.confirmedAt ?? new Date();

  if (totalUnits === 0) {
    await prisma.holding.deleteMany({
      where: { userId, spvId },
    });
    return null;
  }

  const ownershipPct = spv?.totalUnits > 0
    ? (totalUnits / spv.totalUnits) * 100
    : 0;

  return prisma.holding.upsert({
    where: { userId_spvId: { userId, spvId } },
    update: {
      totalUnits,
      totalInvested,
      ownershipPct,
      lastUpdatedAt: new Date(),
    },
    create: {
      userId,
      spvId,
      opportunityId,
      totalUnits,
      totalInvested,
      currency: spv?.currency || "GBP",
      ownershipPct,
      firstInvestedAt,
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// HOLDINGS — LIST FOR INVESTOR
// ════════════════════════════════════════════════════════════════════

export async function listHoldingsForInvestor(userId) {
  const holdings = await prisma.holding.findMany({
    where: { userId },
    orderBy: { firstInvestedAt: "desc" },
  });

  if (holdings.length === 0) return [];

  const spvIds = holdings.map((h) => h.spvId);
  const spvs = await prisma.spv.findMany({
    where: { id: { in: spvIds } },
    select: {
      id: true,
      spvName: true,
      companyNumber: true,
      unitPrice: true,
      totalUnits: true,
      currency: true,
      property: {
        select: {
          title: true,
          city: true,
          country: true,
          images: {
            where: { isHero: true },
            take: 1,
            select: { fileUrl: true },
          },
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          heroImageUrl: true,
          status: true,
        },
      },
    },
  });
  const spvById = {};
  for (const s of spvs) spvById[s.id] = s;

  // In-flight sale requests (not yet settled) per SPV — so the dashboard can
  // show "units pending sale" the moment a request is raised or approved,
  // before the transfer is recorded.
  const pendingSales = await prisma.shareSaleRequest.groupBy({
    by: ["spvId"],
    where: {
      userId,
      spvId: { in: spvIds },
      status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED"] },
    },
    _sum: { unitsOffered: true },
  });
  const pendingBySpv = {};
  for (const p of pendingSales) pendingBySpv[p.spvId] = p._sum.unitsOffered || 0;

  return holdings.map((h) => ({
    id: h.id,
    spvId: h.spvId,
    opportunityId: h.opportunityId,
    totalUnits: h.totalUnits,
    totalInvested: h.totalInvested?.toString(),
    currency: h.currency,
    ownershipPct: h.ownershipPct,
    pendingSaleUnits: pendingBySpv[h.spvId] || 0,
    firstInvestedAt: h.firstInvestedAt,
    lastUpdatedAt: h.lastUpdatedAt,
    spv: spvById[h.spvId]
      ? {
          ...spvById[h.spvId],
          unitPrice: spvById[h.spvId].unitPrice?.toString(),
        }
      : null,
  }));
}

// ════════════════════════════════════════════════════════════════════
// SUBSCRIPTION AUDIT EVENT — generic helper
// ════════════════════════════════════════════════════════════════════

export async function logSubscriptionEvent({
  subscriptionId, eventType, actorId, actorRole,
  beforeState, afterState, visibleToInvestor, notes,
}) {
  try {
    await prisma.subscriptionAuditEvent.create({
      data: {
        subscriptionId,
        eventType,
        actorId,
        actorRole,
        beforeState: beforeState ?? undefined,
        afterState: afterState ?? undefined,
        visibleToInvestor: visibleToInvestor ?? true,
        notes: notes || null,
      },
    });
  } catch (err) {
    console.error("[logSubscriptionEvent] failed:", err?.message);
  }
}

// ════════════════════════════════════════════════════════════════════
// CAP TABLE SNAPSHOT — admin triggers snapshot
// ════════════════════════════════════════════════════════════════════

export async function createCapTableSnapshot({ spvId, adminId }) {
  const spv = await prisma.spv.findUnique({
    where: { id: spvId },
    select: {
      id: true,
      spvName: true,
      companyNumber: true,
      unitPrice: true,
      totalUnits: true,
      currency: true,
    },
  });
  if (!spv) throw new Error("SPV not found");

  const holdings = await prisma.holding.findMany({
    where: { spvId },
  });

  const userIds = holdings.map((h) => h.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      fullName: true,
      addressLine1: true,
      city: true,
      postcode: true,
      country: true,
    },
  });
  const userById = {};
  for (const u of users) userById[u.id] = u;

  const totalInvestors = holdings.length;
  const totalUnitsAllocated = holdings.reduce((s, h) => s + h.totalUnits, 0);
  const totalRaised = holdings.reduce(
    (s, h) => s + parseFloat(h.totalInvested?.toString() || "0"),
    0
  );

  const holdingsJson = holdings.map((h) => {
    const u = userById[h.userId];
    return {
      userId: h.userId,
      fullName: u?.fullName,
      email: u?.email,
      address: [u?.addressLine1, u?.city, u?.postcode, u?.country].filter(Boolean).join(", "),
      totalUnits: h.totalUnits,
      totalInvested: h.totalInvested?.toString(),
      ownershipPct: h.ownershipPct,
      firstInvestedAt: h.firstInvestedAt,
    };
  });

  const snapshot = await prisma.capTableSnapshot.create({
    data: {
      spvId,
      totalInvestors,
      totalUnitsAllocated,
      totalRaised,
      currency: spv.currency,
      exportedByAdminId: adminId,
      holdingsJson,
    },
  });

  return { snapshot, spv, holdingsJson };
}
// ════════════════════════════════════════════════════════════════════
// PHASE 5 MESSAGE 3 — ADMIN SUBSCRIPTION REVIEW & ALLOCATION
// APPEND these to your existing lib/db.js
// ════════════════════════════════════════════════════════════════════
//
// Covers:
//   - listSubscriptionsForAdmin   (queue with filters + search)
//   - getSubscriptionForAdmin     (full investor + payment context)
//   - verifySubscription          (UNDER_REVIEW → VERIFIED)
//   - fundSubscription            (VERIFIED → FUNDED)
//   - rejectSubscription          (→ REJECTED, terminal)
//   - getCapTableForSpv           (live cap table read)
//   - getSubscriptionAdminStats   (queue counts for dashboard)
//
// Allocation itself uses the existing createAllocation() from Msg 1.
//
// Status flow:
//   SUBMITTED → UNDER_REVIEW → VERIFIED → FUNDED →
//   PARTIALLY_ALLOCATED → FULLY_ALLOCATED
//   Terminal: REJECTED, CANCELLED

// ════════════════════════════════════════════════════════════════════
// ADMIN: SUBSCRIPTION QUEUE (list with filters)
//
// filters:
//   status      — exact status, OR "active" (non-terminal), "needs_action"
//   oversized   — true to show only oversized/AML subscriptions
//   spvId       — filter to one SPV
//   search      — investor name/email or opportunity title
// ════════════════════════════════════════════════════════════════════

export async function listSubscriptionsForAdmin({
  status,
  oversized,
  spvId,
  search,
  sortBy = "newest",
  page = 1,
  pageSize = 25,
} = {}) {
  const where = {};

  if (status) {
    if (status === "active") {
      where.status = { in: SUBSCRIPTION_ACTIVE_STATUSES };
    } else if (status === "needs_action") {
      // Subscriptions waiting on admin: under review (proof in) or verified (awaiting fund)
      where.status = { in: ["UNDER_REVIEW", "VERIFIED", "FUNDED"] };
    } else {
      where.status = status;
    }
  }

  if (oversized === true) where.oversizedFlag = true;
  if (spvId) where.spvId = spvId;

  // Search across investor + opportunity requires a pre-resolve of user ids
  if (search) {
    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    const matchedOpps = await prisma.opportunity.findMany({
      where: { title: { contains: search, mode: "insensitive" } },
      select: { id: true },
    });
    where.OR = [
      { userId: { in: matchedUsers.map((u) => u.id) } },
      { opportunityId: { in: matchedOpps.map((o) => o.id) } },
    ];
  }

  const orderBy = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    amount: { totalAmount: "desc" },
    status: { status: "asc" },
  }[sortBy] || { createdAt: "desc" };

  const skip = Math.max(0, (page - 1) * pageSize);

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        opportunityId: true,
        spvId: true,
        unitsRequested: true,
        unitPriceAtSub: true,
        totalAmount: true,
        currency: true,
        status: true,
        proofOfPaymentUrl: true,
        proofUploadedAt: true,
        oversizedFlag: true,
        amlRequired: true,
        submittedAt: true,
        createdAt: true,
        allocations: {
          where: { status: "ACTIVE" },
          select: { unitsAllocated: true },
        },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  // Hydrate investor + opportunity
  const userIds = [...new Set(subscriptions.map((s) => s.userId))];
  const oppIds = [...new Set(subscriptions.map((s) => s.opportunityId))];

  const [users, opps] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, kycStatus: true },
    }),
    prisma.opportunity.findMany({
      where: { id: { in: oppIds } },
      select: { id: true, title: true, spv: { select: { spvName: true } } },
    }),
  ]);
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const oppById = Object.fromEntries(opps.map((o) => [o.id, o]));

  const safe = subscriptions.map((s) => {
    const allocatedUnits = s.allocations.reduce((sum, a) => sum + a.unitsAllocated, 0);
    return {
      id: s.id,
      userId: s.userId,
      opportunityId: s.opportunityId,
      spvId: s.spvId,
      unitsRequested: s.unitsRequested,
      allocatedUnits,
      unitPriceAtSub: s.unitPriceAtSub?.toString(),
      totalAmount: s.totalAmount?.toString(),
      currency: s.currency,
      status: s.status,
      proofOfPaymentUrl: s.proofOfPaymentUrl,
      proofUploadedAt: s.proofUploadedAt,
      oversizedFlag: s.oversizedFlag,
      amlRequired: s.amlRequired,
      submittedAt: s.submittedAt,
      createdAt: s.createdAt,
      investor: userById[s.userId] || null,
      opportunity: oppById[s.opportunityId] || null,
    };
  });

  return {
    subscriptions: safe,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: SINGLE SUBSCRIPTION (full context)
// ════════════════════════════════════════════════════════════════════

export async function getSubscriptionForAdmin(subscriptionId) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      allocations: { orderBy: { confirmedAt: "asc" } },
      auditEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!sub) return null;

  const [investor, opp] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sub.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        kycStatus: true,
        investorType: true,
        estimatedNetWorth: true,
        sourceOfFunds: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        region: true,
        postcode: true,
        country: true,
        accountActivated: true,
        flaggedForReview: true,
        selfCertifiedAt: true,
        riskAcknowledgedAt: true,
      },
    }),
    prisma.opportunity.findUnique({
      where: { id: sub.opportunityId },
      select: {
        id: true,
        title: true,
        spv: {
          select: {
            id: true,
            spvName: true,
            companyNumber: true,
            unitPrice: true,
            nominalValue: true,
            totalUnits: true,
            unitsAllocated: true,
            currency: true,
            bankAccountName: true,
            bankAccountReference: true,
          },
        },
      },
    }),
  ]);

  const allocatedUnits = sub.allocations
    .filter((a) => a.status === "ACTIVE")
    .reduce((s, a) => s + a.unitsAllocated, 0);

  return {
    ...sub,
    unitPriceAtSub: sub.unitPriceAtSub?.toString(),
    totalAmount: sub.totalAmount?.toString(),
    allocatedUnits,
    remainingToAllocate: sub.unitsRequested - allocatedUnits,
    investor,
    opportunity: opp
      ? {
          ...opp,
          spv: opp.spv
            ? {
                ...opp.spv,
                unitPrice: opp.spv.unitPrice?.toString(),
                nominalValue: opp.spv.nominalValue?.toString(),
              }
            : null,
        }
      : null,
    allocations: sub.allocations.map((a) => ({
      ...a,
      unitPrice: a.unitPrice?.toString(),
      amountReceived: a.amountReceived?.toString(),
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: VERIFY SUBSCRIPTION (UNDER_REVIEW → VERIFIED)
//
// Admin has confirmed investor details + proof looks legitimate.
// ════════════════════════════════════════════════════════════════════

export async function verifySubscription({ subscriptionId, adminId, notes }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true },
  });
  if (!sub) throw new Error("Subscription not found");
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(sub.status)) {
    throw new Error(`Cannot verify — subscription is ${sub.status}`);
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "VERIFIED",
      verifiedAt: now,
      reviewerAdminId: adminId,
      reviewedAt: now,
      ...(notes ? { adminNotesInternal: notes } : {}),
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "VERIFIED",
      actorId: adminId,
      actorRole: "admin",
      visibleToInvestor: true,
      beforeState: { status: sub.status },
      afterState: { status: "VERIFIED" },
      notes: notes || null,
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: FUND SUBSCRIPTION (VERIFIED → FUNDED)
//
// Admin confirms the bank transfer has actually landed.
// ════════════════════════════════════════════════════════════════════

export async function fundSubscription({ subscriptionId, adminId, notes }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true },
  });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "VERIFIED") {
    throw new Error(`Cannot mark funded — subscription must be VERIFIED (currently ${sub.status})`);
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "FUNDED",
      fundedAt: now,
      ...(notes ? { adminNotesInternal: notes } : {}),
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "FUNDED",
      actorId: adminId,
      actorRole: "admin",
      visibleToInvestor: true,
      beforeState: { status: "VERIFIED" },
      afterState: { status: "FUNDED" },
      notes: notes || null,
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: REJECT SUBSCRIPTION (→ REJECTED, terminal)
//
// Can reject from any pre-allocation state. Reason required.
// If any allocations already exist, this throws — must handle manually.
// ════════════════════════════════════════════════════════════════════

export async function rejectSubscription({ subscriptionId, adminId, reason }) {
  if (!reason || !reason.trim()) {
    throw new Error("A reason is required to reject a subscription");
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { allocations: { where: { status: "ACTIVE" }, select: { id: true } } },
  });
  if (!sub) throw new Error("Subscription not found");

  if (["REJECTED", "CANCELLED"].includes(sub.status)) {
    throw new Error(`Subscription is already ${sub.status}`);
  }
  if (sub.allocations.length > 0) {
    throw new Error(
      "Cannot reject — units have already been allocated. Reverse the allocation first."
    );
  }

  const now = new Date();
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "REJECTED",
      rejectedAt: now,
      rejectionReason: reason,
      reviewerAdminId: adminId,
      reviewedAt: now,
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId,
      eventType: "REJECTED",
      actorId: adminId,
      actorRole: "admin",
      visibleToInvestor: true,
      beforeState: { status: sub.status },
      afterState: { status: "REJECTED" },
      notes: reason,
    },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: CAP TABLE FOR SPV (live read — not a snapshot)
//
// Returns current ownership across all investors for one SPV.
// Use createCapTableSnapshot() (Msg 1) to persist + export.
// ════════════════════════════════════════════════════════════════════

export async function getCapTableForSpv(spvId) {
  const spv = await prisma.spv.findUnique({
    where: { id: spvId },
    select: {
      id: true,
      spvName: true,
      companyNumber: true,
      unitPrice: true,
      nominalValue: true,
      totalUnits: true,
      unitsAllocated: true,
      currency: true,
      property: { select: { title: true, city: true } },
      opportunity: { select: { id: true, title: true } },
    },
  });
  if (!spv) return null;

  const holdings = await prisma.holding.findMany({
    where: { spvId },
    orderBy: { totalUnits: "desc" },
  });

  const userIds = holdings.map((h) => h.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true, fullName: true, email: true,
      addressLine1: true, city: true, postcode: true, country: true,
    },
  });
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  const rows = holdings.map((h) => {
    const u = userById[h.userId];
    return {
      userId: h.userId,
      fullName: u?.fullName || "Unknown",
      email: u?.email || "",
      address: [u?.addressLine1, u?.city, u?.postcode, u?.country].filter(Boolean).join(", "),
      totalUnits: h.totalUnits,
      totalInvested: h.totalInvested?.toString(),
      ownershipPct: h.ownershipPct,
      firstInvestedAt: h.firstInvestedAt,
    };
  });

  const totalRaised = rows.reduce((s, r) => s + parseFloat(r.totalInvested || "0"), 0);

  return {
    spv: {
      ...spv,
      unitPrice: spv.unitPrice?.toString(),
      nominalValue: spv.nominalValue?.toString(),
    },
    rows,
    summary: {
      totalInvestors: rows.length,
      totalUnitsAllocated: spv.unitsAllocated,
      totalUnits: spv.totalUnits,
      unitsRemaining: spv.totalUnits - spv.unitsAllocated,
      totalRaised: totalRaised.toString(),
      currency: spv.currency,
      pctSubscribed: spv.totalUnits > 0 ? (spv.unitsAllocated / spv.totalUnits) * 100 : 0,
    },
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: SUBSCRIPTION QUEUE STATS (for dashboard badges)
// ════════════════════════════════════════════════════════════════════

export async function getSubscriptionAdminStats() {
  const [
    underReview,
    verified,
    funded,
    oversizedPending,
    totalActive,
    fullyAllocated,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.subscription.count({ where: { status: "VERIFIED" } }),
    prisma.subscription.count({ where: { status: "FUNDED" } }),
    prisma.subscription.count({
      where: { oversizedFlag: true, status: { in: SUBSCRIPTION_ACTIVE_STATUSES } },
    }),
    prisma.subscription.count({ where: { status: { in: SUBSCRIPTION_ACTIVE_STATUSES } } }),
    prisma.subscription.count({ where: { status: "FULLY_ALLOCATED" } }),
  ]);

  return {
    underReview,
    verified,
    funded,
    oversizedPending,
    totalActive,
    fullyAllocated,
    // "needs action" = anything waiting on admin
    needsAction: underReview + verified + funded,
  };
}


// ════════════════════════════════════════════════════════════════════
// PHASE 5 MSG 4 — CERTIFICATE / AGREEMENT GENERATION HELPERS
// ════════════════════════════════════════════════════════════════════
// PART 1 — APPEND THESE FUNCTIONS
// ════════════════════════════════════════════════════════════════════

// ─── Hydrate an allocation with everything needed for a certificate ──
//
// Returns { allocation, user, spv, opportunity } or null.
// Used by the certificate generator + the download route (ownership check).

export async function getAllocationForCertificate(allocationId) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
  });
  if (!allocation) return null;

  const [user, spv] = await Promise.all([
    prisma.user.findUnique({
      where: { id: allocation.userId },
      select: {
        id: true, fullName: true, email: true,
        addressLine1: true, addressLine2: true, city: true,
        region: true, postcode: true, country: true,
        selfCertifiedAt: true, riskAcknowledgedAt: true,
      },
    }),
    prisma.spv.findUnique({
      where: { id: allocation.spvId },
      select: {
        id: true, spvName: true, companyNumber: true,
        nominalValue: true, currency: true,
        opportunity: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    allocation: {
      ...allocation,
      unitPrice: allocation.unitPrice?.toString(),
      amountReceived: allocation.amountReceived?.toString(),
    },
    user,
    spv: spv ? { ...spv, nominalValue: spv.nominalValue?.toString() } : null,
    opportunity: spv?.opportunity || null,
  };
}

// ─── Generate (or regenerate) the certificate PDF for an allocation ──
//
// Renders the PDF, uploads it via the provided uploader, and saves the
// URL onto the allocation. Returns { certificateUrl, certificateNumber }.
//
// `uploadFn` is a function (buffer, filename) => Promise<{ url }>.
// You pass in your UploadThing/storage uploader from the route so this
// db function stays storage-agnostic. If no uploadFn is given, it returns
// the buffer for the caller to handle.

export async function generateCertificateForAllocation({ allocationId, uploadFn }) {
  const ctx = await getAllocationForCertificate(allocationId);
  if (!ctx) throw new Error("Allocation not found");
  if (!ctx.allocation.certificateNumber) {
    throw new Error("Allocation has no certificate number");
  }

  // Dynamic import — keep @react-pdf out of the hot path
  const { generateShareCertificatePdf, buildCertificateFields } =
    await import("@/lib/certificates");

  const fields = buildCertificateFields({
    allocation: ctx.allocation,
    user: ctx.user,
    spv: ctx.spv,
  });

  const buffer = await generateShareCertificatePdf(fields);
  const filename = `certificate-${ctx.allocation.certificateNumber}.pdf`;

  if (!uploadFn) {
    // Caller will handle storage
    return { buffer, filename, certificateNumber: ctx.allocation.certificateNumber };
  }

  const { url } = await uploadFn(buffer, filename);

  await prisma.allocation.update({
    where: { id: allocationId },
    data: {
      certificateUrl: url,
      certificateGeneratedAt: new Date(),
    },
  });

  return { certificateUrl: url, certificateNumber: ctx.allocation.certificateNumber };
}

// ─── Generate the subscription agreement PDF ─────────────────────────
//
// Same uploader pattern. Saves URL onto Subscription.subscriptionAgreementUrl.

export async function generateAgreementForSubscription({ subscriptionId, uploadFn }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!sub) throw new Error("Subscription not found");

  const [user, spv, opportunity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sub.userId },
      select: {
        id: true, fullName: true, email: true,
        addressLine1: true, addressLine2: true, city: true,
        region: true, postcode: true, country: true,
        selfCertifiedAt: true, riskAcknowledgedAt: true,
      },
    }),
    prisma.spv.findUnique({
      where: { id: sub.spvId },
      select: { id: true, spvName: true, companyNumber: true },
    }),
    prisma.opportunity.findUnique({
      where: { id: sub.opportunityId },
      select: { id: true, title: true },
    }),
  ]);

  const { generateSubscriptionAgreementPdf, buildAgreementFields } =
    await import("@/lib/subscription-agreement");

  const fields = buildAgreementFields({
    subscription: {
      ...sub,
      unitPriceAtSub: sub.unitPriceAtSub?.toString(),
      totalAmount: sub.totalAmount?.toString(),
    },
    user, spv, opportunity,
  });

  const buffer = await generateSubscriptionAgreementPdf(fields);
  const filename = `subscription-agreement-${fields.agreementRef}.pdf`;

  if (!uploadFn) {
    return { buffer, filename };
  }

  const { url } = await uploadFn(buffer, filename);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      subscriptionAgreementUrl: url,
      agreementGeneratedAt: new Date(),
    },
  });

  return { agreementUrl: url };
}

// ─── Count an investor's owned/active subscriptions (welcome detect) ─
//
// Used to detect a "first investment" so we can send the welcome note
// only once. Counts allocations belonging to the user (excluding the
// one just made if you pass excludeAllocationId).

export async function countUserAllocations(userId) {
  return prisma.allocation.count({
    where: { userId, status: "ACTIVE" },
  });
}

// ─── Ownership check for certificate download ───────────────────────
//
// Returns the certificate URL only if the allocation belongs to userId.

export async function getCertificateUrlForInvestor({ allocationId, userId }) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    select: { userId: true, certificateUrl: true, certificateNumber: true },
  });
  if (!allocation || allocation.userId !== userId) return null;
  return {
    certificateUrl: allocation.certificateUrl,
    certificateNumber: allocation.certificateNumber,
  };
}


// ════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 6 MSG 1 — BUY MORE SHARES (top-up)
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// STEP B — APPEND: getTopUpContext
//
// Loads what the "Buy More" modal needs: the investor's current holding
// in this SPV, the opportunity, units remaining, and eligibility (with
// allowRepeat). Used to pre-fill and validate the top-up modal.
// ════════════════════════════════════════════════════════════════════

export async function getTopUpContext({ userId, opportunityId }) {
  // Must already hold units in this opportunity's SPV to "buy more"
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      id: true,
      title: true,
      status: true,
      heroImageUrl: true,
      spv: {
        select: {
          id: true,
          spvName: true,
          unitPrice: true,
          currency: true,
          totalUnits: true,
          unitsAllocated: true,
          minimumUnits: true,
        },
      },
    },
  });
  if (!opp || !opp.spv) return null;

  const holding = await prisma.holding.findUnique({
    where: { userId_spvId: { userId, spvId: opp.spv.id } },
  });

  // Eligibility with repeat allowed
  const eligibility = await checkSubscriptionEligibility({
    userId,
    opportunityId,
    allowRepeat: true,
  });

  const remainingUnits = opp.spv.totalUnits - opp.spv.unitsAllocated;

  return {
    opportunity: {
      id: opp.id,
      title: opp.title,
      status: opp.status,
      heroImageUrl: opp.heroImageUrl,
    },
    spv: {
      id: opp.spv.id,
      spvName: opp.spv.spvName,
      unitPrice: opp.spv.unitPrice?.toString(),
      currency: opp.spv.currency,
      minimumUnits: opp.spv.minimumUnits,
    },
    currentHolding: holding
      ? {
          totalUnits: holding.totalUnits,
          totalInvested: holding.totalInvested?.toString(),
          ownershipPct: holding.ownershipPct,
        }
      : null,
    remainingUnits,
    eligible: eligibility.eligible,
    reasons: eligibility.reasons,
    // Convenience: is the opp still open and are units available?
    canTopUp:
      eligibility.eligible && opp.status === "live" && remainingUnits > 0,
  };
}

// ════════════════════════════════════════════════════════════════════
// STEP C — APPEND: createTopUpSubscription
//
// Thin wrapper around createSubscription that flags the eligibility check
// to allow a repeat. Tags the subscription as a top-up in its audit event
// so admins can see it's an existing holder increasing their position.
// ════════════════════════════════════════════════════════════════════

export async function createTopUpSubscription({
  userId,
  opportunityId,
  unitsRequested,
  selfCertifiedAtSubmit,
  riskAcknowledgedAtSubmit,
  suitabilityAnswers,
}) {
  // Pre-check with allowRepeat so an existing holder isn't blocked
  const check = await checkSubscriptionEligibility({
    userId,
    opportunityId,
    allowRepeat: true,
  });
  if (!check.eligible) {
    throw new Error(`Not eligible: ${check.reasons.join(", ")}`);
  }

  // createSubscription re-checks eligibility WITHOUT allowRepeat, which
  // would re-block us. So we call the shared internals via a thin inline
  // path here: validate units against context, then create directly.
  const { context } = check;

  if (!Number.isInteger(unitsRequested) || unitsRequested < 1) {
    throw new Error("unitsRequested must be a positive integer");
  }
  if (!selfCertifiedAtSubmit || !riskAcknowledgedAtSubmit) {
    throw new Error("Self-certification and risk acknowledgement are required");
  }
  if (unitsRequested < context.minimumUnits) {
    throw new Error(`Minimum subscription is ${context.minimumUnits} units`);
  }
  if (unitsRequested > context.remainingUnits) {
    throw new Error(`Only ${context.remainingUnits} units remaining`);
  }
  if (context.requiresSuitabilityCheck && !suitabilityAnswers) {
    throw new Error("Suitability answers are required for this opportunity");
  }

  const unitPriceAtSub = parseFloat(context.unitPrice);
  const totalAmount = unitPriceAtSub * unitsRequested;
  const OVERSIZED_GBP_THRESHOLD = 10_000;
  const oversized = totalAmount > OVERSIZED_GBP_THRESHOLD;
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { selfCertifiedAt: now, riskAcknowledgedAt: now },
  }).catch(() => {});

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      opportunityId,
      spvId: context.opportunity.spv.id,
      unitsRequested,
      unitPriceAtSub,
      totalAmount,
      currency: context.currency,
      status: SUBSCRIPTION_STATUSES.SUBMITTED,
      selfCertifiedAtSubmit: true,
      riskAcknowledgedAtSubmit: true,
      suitabilityAnswers: suitabilityAnswers || undefined,
      oversizedFlag: oversized,
      amlRequired: oversized,
      submittedAt: now,
    },
  });

  await prisma.subscriptionAuditEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: "SUBSCRIPTION_CREATED",
      actorId: userId,
      actorRole: "investor",
      visibleToInvestor: true,
      afterState: {
        status: subscription.status,
        unitsRequested,
        totalAmount: totalAmount.toString(),
        isTopUp: true,
      },
      notes: "Top-up — existing holder increasing position",
    },
  }).catch(() => {});

  return subscription;
}


// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 6 MSG 2 — SELL SHARES (record-and-transfer)
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// PHASE 6 MSG 2 — SELL SHARES (record-and-transfer)
// APPEND to lib/db.js
// ════════════════════════════════════════════════════════════════════
//
// Compliance-safe model: the platform never holds funds. An investor
// offers units back; admin reviews, lines up a buyer (company buyback,
// another platform investor, or external), and RECORDS the title transfer.
//
// Settlement mechanics (FIFO):
//   - Consume the seller's units from their ACTIVE allocations, oldest
//     first. Each touched allocation is voided (full) or marked
//     PARTIALLY_TRANSFERRED with a reissued remainder certificate (split).
//   - If the buyer is a platform investor, create a fresh allocation +
//     certificate for them (so they get a real cert + holding).
//   - If company buyback / external, the SPV.unitsAllocated decrements
//     (units return to the available pool) — no buyer allocation.
//   - Both holdings recompute. A TitleTransfer record is written.
//
// Status flow:
//   REQUESTED → UNDER_REVIEW → APPROVED → SETTLED
//   Terminal: DECLINED, CANCELLED

// ─── Constants ──────────────────────────────────────────────────────
export const SALE_REQUEST_STATUSES = {
  REQUESTED:    "REQUESTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED:     "APPROVED",
  SETTLED:      "SETTLED",
  DECLINED:     "DECLINED",
  CANCELLED:    "CANCELLED",
};

export const SALE_REQUEST_ACTIVE_STATUSES = ["REQUESTED", "UNDER_REVIEW", "APPROVED"];

export const SALE_BUYER_TYPES = [
  { value: "company_buyback", label: "Company buyback" },
  { value: "named_investor",  label: "Existing investor" },
  { value: "external",        label: "External buyer" },
];

// ════════════════════════════════════════════════════════════════════
// INVESTOR: how many units can this user actually sell in this SPV?
//   = sum of ACTIVE allocation remainders (unitsAllocated - unitsTransferred)
//     minus any units already tied up in an active sale request.
// ════════════════════════════════════════════════════════════════════

export async function getSellableUnits({ userId, spvId }) {
  const allocations = await prisma.allocation.findMany({
    where: { userId, spvId, status: { in: ["ACTIVE", "PARTIALLY_TRANSFERRED"] } },
    select: { unitsAllocated: true, unitsTransferred: true },
  });
  const owned = allocations.reduce(
    (s, a) => s + (a.unitsAllocated - (a.unitsTransferred || 0)),
    0
  );

  // Units already committed to in-flight sale requests
  const pendingAgg = await prisma.shareSaleRequest.aggregate({
    where: { userId, spvId, status: { in: SALE_REQUEST_ACTIVE_STATUSES } },
    _sum: { unitsOffered: true },
  });
  const pending = pendingAgg._sum.unitsOffered ?? 0;

  return Math.max(0, owned - pending);
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: create a share sale request
// ════════════════════════════════════════════════════════════════════

export async function createShareSaleRequest({ userId, spvId, unitsOffered, investorNote }) {
  if (!Number.isInteger(unitsOffered) || unitsOffered < 1) {
    throw new Error("unitsOffered must be a positive integer");
  }

  const holding = await prisma.holding.findUnique({
    where: { userId_spvId: { userId, spvId } },
  });
  if (!holding) throw new Error("You don't hold any units in this SPV");

  const sellable = await getSellableUnits({ userId, spvId });
  if (unitsOffered > sellable) {
    throw new Error(`You can sell at most ${sellable} unit${sellable === 1 ? "" : "s"} (after pending requests)`);
  }

  const spv = await prisma.spv.findUnique({
    where: { id: spvId },
    select: { unitPrice: true, currency: true, opportunity: { select: { id: true } } },
  });
  if (!spv?.opportunity) throw new Error("SPV / opportunity not found");

  const unitPrice = parseFloat(spv.unitPrice.toString());
  const indicativeAmount = unitPrice * unitsOffered;

  return prisma.shareSaleRequest.create({
    data: {
      userId,
      spvId,
      opportunityId: spv.opportunity.id,
      unitsOffered,
      indicativeUnitPrice: unitPrice,
      indicativeAmount,
      currency: spv.currency,
      investorNote: investorNote || null,
      status: "REQUESTED",
    },
  });
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: list / get own sale requests
// ════════════════════════════════════════════════════════════════════

export async function listSaleRequestsForInvestor({ userId, status, page = 1, pageSize = 20 } = {}) {
  const where = { userId };
  if (status) {
    if (status === "active") where.status = { in: SALE_REQUEST_ACTIVE_STATUSES };
    else where.status = status;
  }
  const skip = Math.max(0, (page - 1) * pageSize);

  const [requests, total] = await Promise.all([
    prisma.shareSaleRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    prisma.shareSaleRequest.count({ where }),
  ]);

  const spvIds = [...new Set(requests.map((r) => r.spvId))];
  const spvs = await prisma.spv.findMany({
    where: { id: { in: spvIds } },
    select: { id: true, spvName: true, opportunity: { select: { id: true, title: true } } },
  });
  const spvById = Object.fromEntries(spvs.map((s) => [s.id, s]));

  return {
    requests: requests.map((r) => ({
      ...r,
      indicativeUnitPrice: r.indicativeUnitPrice?.toString(),
      indicativeAmount: r.indicativeAmount?.toString(),
      settledUnitPrice: r.settledUnitPrice?.toString() ?? null,
      settledAmount: r.settledAmount?.toString() ?? null,
      spv: spvById[r.spvId] || null,
    })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSaleRequestForInvestor({ requestId, userId }) {
  const r = await prisma.shareSaleRequest.findUnique({ where: { id: requestId } });
  if (!r || r.userId !== userId) return null;
  const spv = await prisma.spv.findUnique({
    where: { id: r.spvId },
    select: { id: true, spvName: true, opportunity: { select: { id: true, title: true } } },
  });
  return {
    ...r,
    indicativeUnitPrice: r.indicativeUnitPrice?.toString(),
    indicativeAmount: r.indicativeAmount?.toString(),
    settledUnitPrice: r.settledUnitPrice?.toString() ?? null,
    settledAmount: r.settledAmount?.toString() ?? null,
    spv: spv || null,
  };
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: cancel a sale request (only pre-approval)
// ════════════════════════════════════════════════════════════════════

export async function cancelSaleRequestByInvestor({ requestId, userId }) {
  const r = await prisma.shareSaleRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true, status: true },
  });
  if (!r || r.userId !== userId) throw new Error("Sale request not found");
  if (!["REQUESTED", "UNDER_REVIEW"].includes(r.status)) {
    throw new Error(`Cannot cancel — request is ${r.status}`);
  }
  return prisma.shareSaleRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: list / get sale requests
// ════════════════════════════════════════════════════════════════════

export async function listSaleRequestsForAdmin({ status, spvId, search, page = 1, pageSize = 25 } = {}) {
  const where = {};
  if (status) {
    if (status === "active") where.status = { in: SALE_REQUEST_ACTIVE_STATUSES };
    else if (status === "needs_action") where.status = { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED"] };
    else where.status = status;
  }
  if (spvId) where.spvId = spvId;
  if (search) {
    const users = await prisma.user.findMany({
      where: { OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ] },
      select: { id: true },
    });
    where.userId = { in: users.map((u) => u.id) };
  }
  const skip = Math.max(0, (page - 1) * pageSize);

  const [requests, total] = await Promise.all([
    prisma.shareSaleRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    prisma.shareSaleRequest.count({ where }),
  ]);

  const userIds = [...new Set(requests.map((r) => r.userId))];
  const spvIds = [...new Set(requests.map((r) => r.spvId))];
  const [users, spvs] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }),
    prisma.spv.findMany({ where: { id: { in: spvIds } }, select: { id: true, spvName: true, opportunity: { select: { title: true } } } }),
  ]);
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const spvById = Object.fromEntries(spvs.map((s) => [s.id, s]));

  return {
    requests: requests.map((r) => ({
      ...r,
      indicativeUnitPrice: r.indicativeUnitPrice?.toString(),
      indicativeAmount: r.indicativeAmount?.toString(),
      settledAmount: r.settledAmount?.toString() ?? null,
      investor: userById[r.userId] || null,
      spv: spvById[r.spvId] || null,
    })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSaleRequestForAdmin(requestId) {
  const r = await prisma.shareSaleRequest.findUnique({ where: { id: requestId } });
  if (!r) return null;

  const [investor, spv, sellable] = await Promise.all([
    prisma.user.findUnique({
      where: { id: r.userId },
      select: { id: true, fullName: true, email: true, kycStatus: true, accountActivated: true },
    }),
    prisma.spv.findUnique({
      where: { id: r.spvId },
      select: {
        id: true, spvName: true, companyNumber: true, unitPrice: true,
        totalUnits: true, unitsAllocated: true, currency: true,
        opportunity: { select: { id: true, title: true } },
      },
    }),
    getSellableUnits({ userId: r.userId, spvId: r.spvId }),
  ]);

  // Seller's current holding for context
  const holding = await prisma.holding.findUnique({
    where: { userId_spvId: { userId: r.userId, spvId: r.spvId } },
  });

  return {
    ...r,
    indicativeUnitPrice: r.indicativeUnitPrice?.toString(),
    indicativeAmount: r.indicativeAmount?.toString(),
    settledUnitPrice: r.settledUnitPrice?.toString() ?? null,
    settledAmount: r.settledAmount?.toString() ?? null,
    investor,
    spv: spv ? { ...spv, unitPrice: spv.unitPrice?.toString() } : null,
    sellerHolding: holding
      ? { totalUnits: holding.totalUnits, ownershipPct: holding.ownershipPct }
      : null,
    sellableNow: sellable,
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: review (acknowledge / approve / decline)
// ════════════════════════════════════════════════════════════════════

export async function reviewSaleRequest({ requestId, adminId, action, note, declineReason }) {
  const r = await prisma.shareSaleRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });
  if (!r) throw new Error("Sale request not found");

  const now = new Date();

  if (action === "acknowledge") {
    if (r.status !== "REQUESTED") throw new Error(`Cannot acknowledge — request is ${r.status}`);
    return prisma.shareSaleRequest.update({
      where: { id: requestId },
      data: { status: "UNDER_REVIEW", reviewerAdminId: adminId, reviewedAt: now, adminNote: note || null },
    });
  }

  if (action === "approve") {
    if (!["REQUESTED", "UNDER_REVIEW"].includes(r.status)) throw new Error(`Cannot approve — request is ${r.status}`);
    return prisma.shareSaleRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewerAdminId: adminId, reviewedAt: now, adminNote: note || null },
    });
  }

  if (action === "decline") {
    if (!declineReason || !declineReason.trim()) throw new Error("A reason is required to decline");
    if (["SETTLED", "CANCELLED"].includes(r.status)) throw new Error(`Request is already ${r.status}`);
    return prisma.shareSaleRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", reviewerAdminId: adminId, reviewedAt: now, declineReason },
    });
  }

  throw new Error("Unknown action");
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: SETTLE — the core transfer. Transaction-wrapped.
//
// buyerType: "company_buyback" | "named_investor" | "external"
//   - named_investor: requires buyerUserId (an existing platform investor)
//   - external / company_buyback: buyerName (free text), no new allocation
//
// FIFO-consumes the seller's ACTIVE allocations, voids/splits certs,
// optionally issues a buyer allocation+cert, recomputes both holdings,
// writes a TitleTransfer, and marks the request SETTLED.
//
// `uploadFn` (optional) generates the buyer's certificate PDF.
// ════════════════════════════════════════════════════════════════════

export async function settleSaleRequest({
  requestId, adminId, buyerType, buyerUserId, buyerName,
  settledUnitPrice, notes, uploadFn,
}) {
  const r = await prisma.shareSaleRequest.findUnique({ where: { id: requestId } });
  if (!r) throw new Error("Sale request not found");
  if (!["APPROVED", "UNDER_REVIEW"].includes(r.status)) {
    throw new Error(`Cannot settle — request must be APPROVED (currently ${r.status})`);
  }
  if (!["company_buyback", "named_investor", "external"].includes(buyerType)) {
    throw new Error("Invalid buyerType");
  }
  if (buyerType === "named_investor" && !buyerUserId) {
    throw new Error("buyerUserId is required for a named investor buyer");
  }
  if (buyerType === "named_investor" && buyerUserId === r.userId) {
    throw new Error("Buyer cannot be the seller");
  }

  const units = r.unitsOffered;
  const price = settledUnitPrice != null ? parseFloat(String(settledUnitPrice)) : parseFloat(r.indicativeUnitPrice.toString());
  const amount = price * units;

  // Validate the seller still has the units (guard against drift)
  const sellable = await getSellableUnits({ userId: r.userId, spvId: r.spvId });
  // sellable excludes this request's own units? No — this request is active,
  // so its units ARE subtracted. Add them back for the check.
  const sellableInclThis = sellable + units;
  if (units > sellableInclThis) {
    throw new Error(`Seller no longer holds ${units} units (has ${sellableInclThis})`);
  }

  // Resolve buyer if named investor
  let buyer = null;
  if (buyerType === "named_investor") {
    buyer = await prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { id: true, fullName: true, accountActivated: true, suspendedAt: true },
    });
    if (!buyer) throw new Error("Buyer not found");
    if (!buyer.accountActivated || buyer.suspendedAt) throw new Error("Buyer is not an active investor");
  }

  // Pull seller's consumable allocations, oldest first (FIFO)
  const sellerAllocations = await prisma.allocation.findMany({
    where: { userId: r.userId, spvId: r.spvId, status: { in: ["ACTIVE", "PARTIALLY_TRANSFERRED"] } },
    orderBy: { confirmedAt: "asc" },
  });

  // Pre-compute the new buyer certificate number (if needed) outside the tx
  let buyerCertNumber = null;
  if (buyerType === "named_investor") {
    buyerCertNumber = await generateNextCertificateNumber();
  }
  // For split reissues, we may need extra cert numbers. Compute lazily inside.

  const voidedCertNumbers = [];

  const result = await prisma.$transaction(async (tx) => {
    let remaining = units;
    // Track how many units we consume from each originating subscription, so we
    // can write an investor-visible audit event keeping the Subscriptions
    // dashboard/timeline in sync with the sale.
    const consumedBySub = {};

    for (const alloc of sellerAllocations) {
      if (remaining <= 0) break;
      const allocRemaining = alloc.unitsAllocated - (alloc.unitsTransferred || 0);
      if (allocRemaining <= 0) continue;

      const take = Math.min(allocRemaining, remaining);
      const fullyConsumed = take === allocRemaining;
      consumedBySub[alloc.subscriptionId] = (consumedBySub[alloc.subscriptionId] || 0) + take;

      if (fullyConsumed) {
        // Void this allocation entirely
        await tx.allocation.update({
          where: { id: alloc.id },
          data: {
            status: "TRANSFERRED",
            unitsTransferred: alloc.unitsAllocated,
            voidedAt: new Date(),
            voidReason: `Sold via sale request ${r.id}`,
          },
        });
        if (alloc.certificateNumber) voidedCertNumbers.push(alloc.certificateNumber);
      } else {
        // Partial: mark this allocation's transferred count up; void old cert;
        // reissue a remainder allocation for the seller with a fresh cert.
        await tx.allocation.update({
          where: { id: alloc.id },
          data: {
            status: "TRANSFERRED",
            unitsTransferred: alloc.unitsAllocated,
            voidedAt: new Date(),
            voidReason: `Partially sold via sale request ${r.id}; remainder reissued`,
          },
        });
        if (alloc.certificateNumber) voidedCertNumbers.push(alloc.certificateNumber);

        // Reissue remainder to the seller
        const remainderUnits = allocRemaining - take;
        if (remainderUnits > 0) {
          const cnt = await tx.allocation.count({ where: { certificateNumber: { not: null } } });
          const reissueCert = `BW-HC-${String(cnt + 1).padStart(4, "0")}`;
          const reissue = await tx.allocation.create({
            data: {
              subscriptionId: alloc.subscriptionId,
              spvId: alloc.spvId,
              userId: r.userId,
              unitsAllocated: remainderUnits,
              unitPrice: alloc.unitPrice,
              amountReceived: parseFloat(alloc.unitPrice.toString()) * remainderUnits,
              certificateNumber: reissueCert,
              status: "ACTIVE",
              confirmedById: adminId,
              notes: `Remainder reissue after partial sale (was ${alloc.certificateNumber})`,
            },
          });
          await tx.allocation.update({ where: { id: alloc.id }, data: { supersededById: reissue.id } });
        }
      }
      remaining -= take;
    }

    if (remaining > 0) throw new Error("Could not consume enough units (data drift)");

    // Investor-visible audit trail on each affected subscription, so the
    // Subscriptions dashboard reflects that units have been sold/transferred.
    const buyerLabel =
      buyerType === "named_investor" ? "another investor"
        : buyerType === "company_buyback" ? "the company (buyback)"
          : "an external buyer";
    for (const [subscriptionId, soldUnits] of Object.entries(consumedBySub)) {
      await tx.subscriptionAuditEvent.create({
        data: {
          subscriptionId,
          eventType: "UNITS_TRANSFERRED",
          actorId: adminId,
          actorRole: "admin",
          visibleToInvestor: true,
          afterState: { soldUnits, saleRequestId: r.id, buyerType },
          notes: `${soldUnits} unit${soldUnits !== 1 ? "s" : ""} sold via share-sale request and transferred to ${buyerLabel}.`,
        },
      });
    }

    // Buyer side
    let buyerAllocation = null;
    if (buyerType === "named_investor") {
      // Create a fresh allocation for the buyer. We attach it to the
      // seller's subscription chain is wrong — instead, leave subscriptionId
      // pointing at a synthetic marker is not possible (FK). We reuse the
      // seller's most recent subscription for this SPV as the lineage anchor.
      const anchorSub = await tx.subscription.findFirst({
        where: { spvId: r.spvId, userId: r.userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      buyerAllocation = await tx.allocation.create({
        data: {
          subscriptionId: anchorSub.id, // lineage anchor; buyer holding tracked via userId
          spvId: r.spvId,
          userId: buyerUserId,
          unitsAllocated: units,
          unitPrice: price,
          amountReceived: amount,
          certificateNumber: buyerCertNumber,
          status: "ACTIVE",
          confirmedById: adminId,
          notes: `Acquired via title transfer from sale request ${r.id}`,
        },
      });
    } else {
      // company_buyback / external: units leave circulation → return to pool
      await tx.spv.update({
        where: { id: r.spvId },
        data: { unitsAllocated: { decrement: units } },
      });
    }

    // Title transfer record
    const transfer = await tx.titleTransfer.create({
      data: {
        spvId: r.spvId,
        opportunityId: r.opportunityId,
        fromUserId: r.userId,
        unitsTransferred: units,
        unitPrice: price,
        amount,
        currency: r.currency,
        toType: buyerType,
        toUserId: buyerType === "named_investor" ? buyerUserId : null,
        toName: buyerType === "named_investor" ? (buyer?.fullName || null) : (buyerName || null),
        voidedCertificateNumbers: voidedCertNumbers,
        newCertificateNumber: buyerCertNumber,
        shareSaleRequestId: r.id,
        recordedByAdminId: adminId,
        notes: notes || null,
      },
    });

    // Mark the request settled
    const updatedReq = await tx.shareSaleRequest.update({
      where: { id: r.id },
      data: {
        status: "SETTLED",
        buyerType,
        buyerUserId: buyerType === "named_investor" ? buyerUserId : null,
        buyerName: buyerType === "named_investor" ? (buyer?.fullName || null) : (buyerName || null),
        settledUnits: units,
        settledUnitPrice: price,
        settledAmount: amount,
        settledAt: new Date(),
        titleTransferId: transfer.id,
      },
    });

    return { request: updatedReq, transfer, buyerAllocation };
  });

  // Recompute holdings for both sides (outside tx; reads aggregate state)
  await recomputeHolding({ userId: r.userId, spvId: r.spvId, opportunityId: r.opportunityId });
  if (buyerType === "named_investor") {
    await recomputeHolding({ userId: buyerUserId, spvId: r.spvId, opportunityId: r.opportunityId });
  }

  // Best-effort: generate buyer certificate PDF
  if (buyerType === "named_investor" && result.buyerAllocation && uploadFn) {
    try {
      await generateCertificateForAllocation({ allocationId: result.buyerAllocation.id, uploadFn });
    } catch (e) {
      console.error("[settleSaleRequest] buyer cert generation failed:", e?.message);
    }
  }

  return {
    request: {
      ...result.request,
      indicativeUnitPrice: result.request.indicativeUnitPrice?.toString(),
      indicativeAmount: result.request.indicativeAmount?.toString(),
      settledUnitPrice: result.request.settledUnitPrice?.toString(),
      settledAmount: result.request.settledAmount?.toString(),
    },
    transfer: {
      id: result.transfer.id,
      unitsTransferred: result.transfer.unitsTransferred,
      voidedCertificateNumbers: result.transfer.voidedCertificateNumbers,
      newCertificateNumber: result.transfer.newCertificateNumber,
    },
    buyerCertificateNumber: buyerCertNumber,
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: sale queue stats
// ════════════════════════════════════════════════════════════════════

export async function getSaleRequestAdminStats() {
  const [requested, underReview, approved, settled] = await Promise.all([
    prisma.shareSaleRequest.count({ where: { status: "REQUESTED" } }),
    prisma.shareSaleRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.shareSaleRequest.count({ where: { status: "APPROVED" } }),
    prisma.shareSaleRequest.count({ where: { status: "SETTLED" } }),
  ]);
  return { requested, underReview, approved, settled, needsAction: requested + underReview + approved };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: candidate buyers for an SPV (existing active investors)
// ════════════════════════════════════════════════════════════════════

export async function listBuyerCandidates({ spvId, excludeUserId, search }) {
  const where = { accountActivated: true, suspendedAt: null, role: "investor" };
  if (excludeUserId) where.id = { not: excludeUserId };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  const users = await prisma.user.findMany({
    where, take: 20, orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });
  return users;
}


// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 7 — REFERRALS + INVITE-ONLY RETROFIT
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// PHASE 7 — REFERRALS + INVITE RETROFIT (db layer)
// APPEND to lib/db.js
// ════════════════════════════════════════════════════════════════════
//
// Recognition-only. No payouts, no investment-linked credit anywhere.
// The chain is A → B → C…: referredById on User is the parent edge;
// the Referral model is the immutable record of each introduction.

// ─── Constants ──────────────────────────────────────────────────────
export const REFERRAL_STATUSES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED:         "APPROVED",
  ACTIVATED:        "ACTIVATED",
  DECLINED:         "DECLINED",
};

// Default cap on how many referees one investor code may bring in.
export const DEFAULT_REFERRAL_MAX_USES = 5;

// ════════════════════════════════════════════════════════════════════
// CODE GENERATION — "BW-REF-XXXX" (4 chars, unambiguous alphabet)
// ════════════════════════════════════════════════════════════════════

const _REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1

function _randomRefSuffix(len = 4) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += _REF_ALPHABET[Math.floor(Math.random() * _REF_ALPHABET.length)];
  }
  return s;
}

async function _generateUniqueReferralCode() {
  // Try a few times before widening length (collision is very unlikely)
  for (let attempt = 0; attempt < 6; attempt++) {
    const len = attempt < 4 ? 4 : 5;
    const code = `BW-REF-${_randomRefSuffix(len)}`;
    const existing = await prisma.referralCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  // Extremely unlikely fallback
  return `BW-REF-${_randomRefSuffix(6)}`;
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: get (or lazily create) this user's active referral code
//
// One active code per owner at a time. Mirrors onto User.referralCode
// so "show me my link" is a single read.
// ════════════════════════════════════════════════════════════════════

export async function getOrCreateReferralCode({ userId, maxUses = DEFAULT_REFERRAL_MAX_USES, createdByAdmin = false }) {
  // Existing active code?
  const active = await prisma.referralCode.findFirst({
    where: { ownerUserId: userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;

  const code = await _generateUniqueReferralCode();
  const created = await prisma.referralCode.create({
    data: { code, ownerUserId: userId, maxUses, createdByAdmin },
  });

  // Mirror primary code onto the user
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  }).catch(() => {});

  return created;
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: rotate code (disable old, mint new) — keeps history
// ════════════════════════════════════════════════════════════════════

export async function rotateReferralCode({ userId }) {
  await prisma.referralCode.updateMany({
    where: { ownerUserId: userId, isActive: true },
    data: { isActive: false },
  });
  return getOrCreateReferralCode({ userId });
}

// ════════════════════════════════════════════════════════════════════
// RESOLVE a referral code at registration time.
//
// Returns { valid, code, ownerUserId, reason } — does NOT consume.
// Consumption (useCount++) happens in createPendingUserWithReferral
// only once the referee user is actually created.
// ════════════════════════════════════════════════════════════════════

export async function resolveReferralCode(rawCode) {
  if (!rawCode || typeof rawCode !== "string") {
    return { valid: false, reason: "no_code" };
  }
  const code = rawCode.trim().toUpperCase();

  const rc = await prisma.referralCode.findUnique({
    where: { code },
    select: {
      id: true, code: true, ownerUserId: true, isActive: true,
      maxUses: true, useCount: true, expiresAt: true,
    },
  });

  if (!rc) return { valid: false, reason: "not_found" };
  if (!rc.isActive) return { valid: false, reason: "inactive" };
  if (rc.expiresAt && new Date(rc.expiresAt) < new Date()) return { valid: false, reason: "expired" };
  if (rc.useCount >= rc.maxUses) return { valid: false, reason: "exhausted" };

  // Owner must be a real, non-suspended user
  const owner = await prisma.user.findUnique({
    where: { id: rc.ownerUserId },
    select: { id: true, fullName: true, suspendedAt: true },
  });
  if (!owner || owner.suspendedAt) return { valid: false, reason: "owner_unavailable" };

  return {
    valid: true,
    code: rc.code,
    referralCodeId: rc.id,
    ownerUserId: rc.ownerUserId,
    ownerName: owner.fullName,
  };
}

// ════════════════════════════════════════════════════════════════════
// CREATE PENDING USER (+ optional referral attribution)
//
// Phase 7 replacement for createPendingUser. If a valid referral code is
// supplied, the new user is chained to the referrer and a Referral record
// is created (PENDING_APPROVAL). Transaction-wrapped so attribution and
// code consumption are atomic with user creation.
//
// Falls back to a plain pending user when no/invalid code (soft model).
// ════════════════════════════════════════════════════════════════════

export async function createPendingUserWithReferral({
  email, fullName, username, residency, country, referralCodeRaw,
}) {
  let resolved = null;
  if (referralCodeRaw) {
    resolved = await resolveReferralCode(referralCodeRaw);
    if (!resolved.valid) resolved = null; // soft: ignore invalid code, still register
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        username: username.toLowerCase(),
        residency,
        country,
        emailVerified: false,
        passwordHash: null,
        registrationStatus: "pending",
        ...(resolved
          ? { referredById: resolved.ownerUserId, referredAt: new Date() }
          : {}),
      },
    });

    if (resolved) {
      // Consume one use + create the referral edge
      await tx.referralCode.update({
        where: { id: resolved.referralCodeId },
        data: { useCount: { increment: 1 } },
      });

      await tx.referral.create({
        data: {
          referralCodeId: resolved.referralCodeId,
          referrerUserId: resolved.ownerUserId,
          refereeUserId: user.id,
          status: "PENDING_APPROVAL",
        },
      });
    }

    return user;
  });

  return { user: result, referredBy: resolved ? resolved.ownerName : null };
}

// ════════════════════════════════════════════════════════════════════
// REFERRAL STATUS SYNC — keep the Referral row in step with the referee
//
// Called from the approval route and from account activation. Updates
// the Referral status + the referrer's denormalised referralCount.
// ════════════════════════════════════════════════════════════════════

export async function syncReferralStatus({ refereeUserId, status }) {
  const referral = await prisma.referral.findUnique({
    where: { refereeUserId },
    select: { id: true, referrerUserId: true, status: true },
  });
  if (!referral) return null; // not a referred user — nothing to do

  const now = new Date();
  const data = { status };
  if (status === "APPROVED") data.approvedAt = now;
  if (status === "ACTIVATED") data.activatedAt = now;

  const updated = await prisma.referral.update({
    where: { id: referral.id },
    data,
  });

  // Recompute referrer's direct-referral recognition count
  // (counts approved + activated referees — i.e. ones that "stuck")
  const count = await prisma.referral.count({
    where: {
      referrerUserId: referral.referrerUserId,
      status: { in: ["APPROVED", "ACTIVATED"] },
    },
  });
  await prisma.user.update({
    where: { id: referral.referrerUserId },
    data: { referralCount: count },
  }).catch(() => {});

  return updated;
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: my referral overview (code + direct referees + counts)
//
// Recognition only — shows who you've introduced and how far they've got.
// No amounts, no rewards.
// ════════════════════════════════════════════════════════════════════

export async function getReferralOverviewForInvestor(userId) {
  // Ensure they have a code to share
  const code = await getOrCreateReferralCode({ userId });

  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: userId },
    orderBy: { registeredAt: "desc" },
  });

  // Hydrate referee names (minimal — recognition view, not PII dump)
  const refereeIds = referrals.map((r) => r.refereeUserId);
  const referees = await prisma.user.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true, fullName: true, accountActivated: true, createdAt: true },
  });
  const byId = Object.fromEntries(referees.map((u) => [u.id, u]));

  const items = referrals.map((r) => {
    const u = byId[r.refereeUserId];
    return {
      id: r.id,
      status: r.status,
      registeredAt: r.registeredAt,
      approvedAt: r.approvedAt,
      activatedAt: r.activatedAt,
      // First name + last initial only — tasteful, not a contact dump
      displayName: u ? _shortName(u.fullName) : "Invitee",
    };
  });

  const counts = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "PENDING_APPROVAL").length,
    approved: referrals.filter((r) => r.status === "APPROVED").length,
    activated: referrals.filter((r) => r.status === "ACTIVATED").length,
    declined: referrals.filter((r) => r.status === "DECLINED").length,
  };

  const remaining = Math.max(0, code.maxUses - code.useCount);

  return {
    code: {
      code: code.code,
      maxUses: code.maxUses,
      useCount: code.useCount,
      remaining,
      isActive: code.isActive,
      rewardNote: code.rewardNote || null,
    },
    referrals: items,
    counts,
  };
}

function _shortName(fullName) {
  if (!fullName) return "Invitee";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: walk the chain downward (the network tree)
//
// Returns a nested tree of referees up to `maxDepth` levels. Recognition
// view — names shortened, no PII. Breadth-limited to keep it sane.
// ════════════════════════════════════════════════════════════════════

export async function getReferralTreeForInvestor({ userId, maxDepth = 3 }) {
  async function buildNode(uid, depth) {
    if (depth > maxDepth) return [];
    const children = await prisma.user.findMany({
      where: { referredById: uid },
      select: { id: true, fullName: true, accountActivated: true, referralCount: true },
      take: 50,
      orderBy: { referredAt: "asc" },
    });
    const nodes = [];
    for (const c of children) {
      nodes.push({
        id: c.id,
        displayName: _shortName(c.fullName),
        activated: c.accountActivated,
        referralCount: c.referralCount,
        children: await buildNode(c.id, depth + 1),
      });
    }
    return nodes;
  }
  return buildNode(userId, 1);
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: referral context for an investor (used on the approval screen)
//
// "Who referred this pending user?" + "who has this user referred?"
// ════════════════════════════════════════════════════════════════════

export async function getReferralContextForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referredById: true, referralCount: true },
  });
  if (!user) return null;

  let referredBy = null;
  if (user.referredById) {
    const parent = await prisma.user.findUnique({
      where: { id: user.referredById },
      select: { id: true, fullName: true, email: true, referralCount: true },
    });
    const edge = await prisma.referral.findUnique({
      where: { refereeUserId: userId },
      select: { status: true, registeredAt: true, referralCodeId: true },
    });
    let codeStr = null;
    if (edge?.referralCodeId) {
      const rc = await prisma.referralCode.findUnique({
        where: { id: edge.referralCodeId },
        select: { code: true },
      });
      codeStr = rc?.code || null;
    }
    referredBy = parent
      ? { id: parent.id, fullName: parent.fullName, email: parent.email, code: codeStr, status: edge?.status }
      : null;
  }

  const directReferralCount = await prisma.user.count({ where: { referredById: userId } });

  return { referredBy, directReferralCount, recognitionCount: user.referralCount };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: referral stats (dashboard)
// ════════════════════════════════════════════════════════════════════

export async function getReferralAdminStats() {
  const [totalReferrals, pending, activated, activeCodes] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.referral.count({ where: { status: "ACTIVATED" } }),
    prisma.referralCode.count({ where: { isActive: true } }),
  ]);
  return { totalReferrals, pending, activated, activeCodes };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: top referrers (recognition leaderboard — no monetary value)
// ════════════════════════════════════════════════════════════════════

export async function getTopReferrers({ limit = 10 } = {}) {
  const users = await prisma.user.findMany({
    where: { referralCount: { gt: 0 } },
    orderBy: { referralCount: "desc" },
    take: limit,
    select: { id: true, fullName: true, email: true, referralCount: true },
  });
  return users;
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: paginated list of all referral edges
// ════════════════════════════════════════════════════════════════════

export async function listReferralsForAdmin({
  status,
  page = 1,
  pageSize = 25,
} = {}) {
  const where = status ? { status } : {};
  const skip  = Math.max(0, (page - 1) * pageSize);

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.referral.count({ where }),
  ]);

  // Hydrate referrer + referee names
  const userIds = [
    ...new Set([
      ...referrals.map((r) => r.referrerUserId),
      ...referrals.map((r) => r.refereeUserId),
    ]),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  // Hydrate codes
  const codeIds = [...new Set(referrals.map((r) => r.referralCodeId).filter(Boolean))];
  const codes   = await prisma.referralCode.findMany({
    where: { id: { in: codeIds } },
    select: { id: true, code: true },
  });
  const codeById = Object.fromEntries(codes.map((c) => [c.id, c.code]));

  const rows = referrals.map((r) => ({
    id:           r.id,
    status:       r.status,
    registeredAt: r.registeredAt,
    approvedAt:   r.approvedAt,
    activatedAt:  r.activatedAt,
    code:         codeById[r.referralCodeId] || null,
    referrer:     byId[r.referrerUserId] || null,
    referee:      byId[r.refereeUserId]  || null,
  }));

  return { referrals: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}


// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//
//        PHASE 8 — DISTRIBUTIONS + TAX SUMMARIES
//
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// PHASE 8 — DISTRIBUTIONS + TAX SUMMARIES (db layer)
// APPEND to lib/db.js
// ════════════════════════════════════════════════════════════════════
//
// Two responsibilities:
//   1. Distributions — admin records dividend events, system snapshots
//      per-holder pro-rata, all tracked for tax reporting.
//   2. Tax statements — aggregate (dividends + subscriptions + transfers)
//      for an investor over a chosen tax year boundary.
//
// MVP scope: record-and-report. Phase 9+ adds actual payout processing.
// No tax advice anywhere — this is a record of what happened.

// ════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════

export const DISTRIBUTION_STATUSES = {
  DRAFT:     "DRAFT",      // building, not yet attributed
  RECORDED:  "RECORDED",   // allocations created, locked
  PAID:      "PAID",       // payment confirmed (Phase 9+)
  CANCELLED: "CANCELLED",  // withdrawn
};

export const DISTRIBUTION_STATUS_LABELS = {
  DRAFT:     { label: "Draft",     color: "muted",   description: "Not yet attributed to holders" },
  RECORDED:  { label: "Recorded",  color: "navy",    description: "Attributed pro-rata, awaiting payment" },
  PAID:      { label: "Paid",      color: "success", description: "Payment confirmed" },
  CANCELLED: { label: "Cancelled", color: "danger",  description: "" },
};

// Statements use one of these year systems:
export const TAX_YEAR_SYSTEMS = {
  UK_SA:    "UK_SA",    // 6 April → 5 April ("2025/26")
  CALENDAR: "CALENDAR", // 1 January → 31 December ("2025")
};

// ════════════════════════════════════════════════════════════════════
// TAX YEAR HELPERS
//
// UK Self Assessment year runs 6 April → 5 April.
// Calendar year runs 1 January → 31 December.
// Both supported — investor picks at statement time.
// ════════════════════════════════════════════════════════════════════

// Given a Date, return the UK SA year string ("2025/26")
export function toUkTaxYear(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  const day = d.getUTCDate();
  // Before 6 April → previous year's tax year
  const startYear = month < 3 || (month === 3 && day < 6) ? year - 1 : year;
  const endYear = startYear + 1;
  return `${startYear}/${String(endYear).slice(2)}`;
}

// Given a Date, return calendar year string ("2025")
export function toCalendarYear(date) {
  return String(new Date(date).getUTCFullYear());
}

// Parse a tax year string + system → { from, to } boundaries (inclusive from, exclusive to)
export function parseTaxYearBounds({ year, system }) {
  if (system === "UK_SA" || system === TAX_YEAR_SYSTEMS.UK_SA) {
    // "2025/26" → 2025-04-06 to 2026-04-06
    const m = String(year).match(/^(\d{4})/);
    if (!m) throw new Error("Invalid UK tax year format (expected 2025/26)");
    const startYear = parseInt(m[1], 10);
    return {
      from: new Date(Date.UTC(startYear, 3, 6)),         // April is month index 3
      to:   new Date(Date.UTC(startYear + 1, 3, 6)),
      label: `${startYear}/${String(startYear + 1).slice(2)}`,
      system: "UK_SA",
    };
  }
  if (system === "CALENDAR" || system === TAX_YEAR_SYSTEMS.CALENDAR) {
    const m = String(year).match(/^(\d{4})/);
    if (!m) throw new Error("Invalid calendar year format (expected 2025)");
    const startYear = parseInt(m[1], 10);
    return {
      from: new Date(Date.UTC(startYear, 0, 1)),
      to:   new Date(Date.UTC(startYear + 1, 0, 1)),
      label: String(startYear),
      system: "CALENDAR",
    };
  }
  throw new Error(`Unknown tax year system: ${system}`);
}

// List available tax years for an investor (years they had activity in)
export async function listAvailableTaxYearsForInvestor(userId) {
  // Pull distinct years from distributions + subscriptions + transfers
  const [dists, subs, transfers] = await Promise.all([
    prisma.distributionAllocation.findMany({
      where: { userId },
      select: { taxYearUk: true, taxYearCalendar: true },
      distinct: ["taxYearUk"],
    }),
    prisma.subscription.findMany({
      where: { userId, submittedAt: { not: null } },
      select: { submittedAt: true },
    }),
    prisma.titleTransfer.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      select: { createdAt: true },
    }),
  ]);

  const ukYears = new Set();
  const calYears = new Set();

  for (const d of dists) {
    if (d.taxYearUk) ukYears.add(d.taxYearUk);
    if (d.taxYearCalendar) calYears.add(d.taxYearCalendar);
  }
  for (const s of subs) {
    if (s.submittedAt) {
      ukYears.add(toUkTaxYear(s.submittedAt));
      calYears.add(toCalendarYear(s.submittedAt));
    }
  }
  for (const t of transfers) {
    ukYears.add(toUkTaxYear(t.createdAt));
    calYears.add(toCalendarYear(t.createdAt));
  }

  return {
    uk: Array.from(ukYears).sort().reverse(),
    calendar: Array.from(calYears).sort().reverse(),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: CREATE / LIST / GET DISTRIBUTIONS
// ════════════════════════════════════════════════════════════════════

export async function createDistributionDraft({
  spvId, declarationLabel, description, totalAmount, recordDate, paymentDate,
  withholdingPct, withholdingNote, bankReference, recordedByAdminId,
}) {
  if (!Number.isFinite(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
    throw new Error("totalAmount must be a positive number");
  }

  const spv = await prisma.spv.findUnique({
    where: { id: spvId },
    select: { id: true, currency: true, opportunity: { select: { id: true } } },
  });
  if (!spv) throw new Error("SPV not found");
  if (!spv.opportunity) throw new Error("SPV has no associated opportunity");

  const recordD = new Date(recordDate);
  const paymentD = new Date(paymentDate);
  if (isNaN(recordD.getTime())) throw new Error("Invalid recordDate");
  if (isNaN(paymentD.getTime())) throw new Error("Invalid paymentDate");

  // amountPerUnit computed during RECORD step (needs units snapshot)
  return prisma.distribution.create({
    data: {
      spvId,
      opportunityId: spv.opportunity.id,
      declarationLabel,
      description: description || null,
      totalAmount: parseFloat(totalAmount),
      currency: spv.currency,
      amountPerUnit: 0, // placeholder — set during recordDistribution
      recordDate: recordD,
      paymentDate: paymentD,
      taxYearUk: toUkTaxYear(paymentD),
      taxYearCalendar: toCalendarYear(paymentD),
      withholdingPct: withholdingPct ?? null,
      withholdingNote: withholdingNote || null,
      bankReference: bankReference || null,
      recordedByAdminId,
      status: "DRAFT",
    },
  });
}

export async function updateDistributionDraft(distributionId, data) {
  const existing = await prisma.distribution.findUnique({
    where: { id: distributionId },
    select: { status: true, paymentDate: true },
  });
  if (!existing) throw new Error("Distribution not found");
  if (existing.status !== "DRAFT") {
    throw new Error("Only DRAFT distributions can be edited. Cancel and create a new one.");
  }

  const update = {};
  const fields = ["declarationLabel", "description", "withholdingPct", "withholdingNote", "bankReference"];
  for (const f of fields) if (data[f] !== undefined) update[f] = data[f];

  if (data.totalAmount !== undefined) {
    const n = parseFloat(data.totalAmount);
    if (!Number.isFinite(n) || n <= 0) throw new Error("totalAmount must be positive");
    update.totalAmount = n;
  }
  if (data.recordDate !== undefined) update.recordDate = new Date(data.recordDate);
  if (data.paymentDate !== undefined) {
    const pd = new Date(data.paymentDate);
    update.paymentDate = pd;
    update.taxYearUk = toUkTaxYear(pd);
    update.taxYearCalendar = toCalendarYear(pd);
  }

  return prisma.distribution.update({
    where: { id: distributionId },
    data: update,
  });
}

// ════════════════════════════════════════════════════════════════════
// RECORD DISTRIBUTION — the core attribution engine.
//
// Snapshots all current holders of the SPV at the record date, computes
// each one's pro-rata share, and creates DistributionAllocation rows.
//
// Transaction-wrapped. Locks distribution into RECORDED status.
//
// NOTE on "at record date": MVP treats "current Holding" as the record-
// date snapshot since holdings are denormalised live. For perfect
// historical attribution (if holdings could change between record date
// and recording action), we'd reconstruct from Allocation history — but
// in practice admin records distributions shortly after the record date,
// and the next phase can add point-in-time reconstruction if needed.
// ════════════════════════════════════════════════════════════════════

export async function recordDistribution({ distributionId, adminId }) {
  const dist = await prisma.distribution.findUnique({
    where: { id: distributionId },
  });
  if (!dist) throw new Error("Distribution not found");
  if (dist.status !== "DRAFT") {
    throw new Error(`Cannot record — distribution is ${dist.status}`);
  }

  // Current holders of this SPV
  const holdings = await prisma.holding.findMany({
    where: { spvId: dist.spvId, totalUnits: { gt: 0 } },
    select: { id: true, userId: true, totalUnits: true, opportunityId: true },
  });

  if (holdings.length === 0) {
    throw new Error("No active holders in this SPV — cannot record distribution");
  }

  const totalUnitsAtRecord = holdings.reduce((s, h) => s + h.totalUnits, 0);
  const totalAmount = parseFloat(dist.totalAmount.toString());
  const amountPerUnit = totalAmount / totalUnitsAtRecord;
  // Round per-unit to 6dp for storage (matches schema)
  const amountPerUnitRounded = Math.round(amountPerUnit * 1_000_000) / 1_000_000;

  const withholdingPct = dist.withholdingPct ? parseFloat(dist.withholdingPct) : 0;
  const taxYearUk = dist.taxYearUk;
  const taxYearCal = dist.taxYearCalendar;
  const paymentDate = dist.paymentDate;

  const result = await prisma.$transaction(async (tx) => {
    // Build allocations — gross = unitsHeld * amountPerUnit, rounded 2dp
    const allocations = holdings.map((h) => {
      const gross = Math.round(h.totalUnits * amountPerUnit * 100) / 100;
      const withholding = withholdingPct > 0
        ? Math.round(gross * (withholdingPct / 100) * 100) / 100
        : 0;
      const net = Math.round((gross - withholding) * 100) / 100;
      const pct = totalUnitsAtRecord > 0 ? (h.totalUnits / totalUnitsAtRecord) * 100 : 0;

      return {
        distributionId: dist.id,
        userId: h.userId,
        spvId: dist.spvId,
        opportunityId: dist.opportunityId,
        holdingId: h.id,
        unitsHeld: h.totalUnits,
        ownershipPctAtRecord: pct,
        grossAmount: gross,
        withholdingAmount: withholding,
        netAmount: net,
        currency: dist.currency,
        taxYearUk,
        taxYearCalendar: taxYearCal,
        paymentDate,
        status: "RECORDED",
      };
    });

    // createMany for speed
    await tx.distributionAllocation.createMany({ data: allocations });

    // Update parent — lock in amountPerUnit + snapshot stats
    const updated = await tx.distribution.update({
      where: { id: dist.id },
      data: {
        amountPerUnit: amountPerUnitRounded,
        holdersAtRecord: holdings.length,
        totalUnitsAtRecord,
        status: "RECORDED",
        recordedAt: new Date(),
        recordedByAdminId: adminId,
      },
    });

    return { distribution: updated, allocationCount: holdings.length };
  });

  return result;
}

// ════════════════════════════════════════════════════════════════════
// CANCEL DISTRIBUTION (DRAFT — deletes; RECORDED — soft cancel)
// ════════════════════════════════════════════════════════════════════

export async function cancelDistribution({ distributionId, adminId, reason }) {
  const dist = await prisma.distribution.findUnique({
    where: { id: distributionId },
    select: { id: true, status: true },
  });
  if (!dist) throw new Error("Distribution not found");
  if (dist.status === "PAID") {
    throw new Error("Cannot cancel a paid distribution");
  }
  if (dist.status === "CANCELLED") return dist;

  if (dist.status === "DRAFT") {
    // No allocations yet — safe to hard-delete
    return prisma.distribution.delete({ where: { id: distributionId } });
  }

  // RECORDED → soft cancel; allocations stay in place but marked CANCELLED
  return prisma.$transaction(async (tx) => {
    await tx.distributionAllocation.updateMany({
      where: { distributionId },
      data: { status: "CANCELLED" },
    });
    return tx.distribution.update({
      where: { id: distributionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
    });
  });
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: LIST / GET DISTRIBUTIONS
// ════════════════════════════════════════════════════════════════════

export async function listDistributionsForAdmin({
  spvId, status, taxYearUk, page = 1, pageSize = 25,
} = {}) {
  const where = {};
  if (spvId) where.spvId = spvId;
  if (status) where.status = status;
  if (taxYearUk) where.taxYearUk = taxYearUk;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [distributions, total] = await Promise.all([
    prisma.distribution.findMany({
      where,
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.distribution.count({ where }),
  ]);

  const spvIds = [...new Set(distributions.map((d) => d.spvId))];
  const spvs = await prisma.spv.findMany({
    where: { id: { in: spvIds } },
    select: { id: true, spvName: true, opportunity: { select: { title: true } } },
  });
  const spvById = Object.fromEntries(spvs.map((s) => [s.id, s]));

  return {
    distributions: distributions.map((d) => ({
      ...d,
      totalAmount: d.totalAmount?.toString(),
      amountPerUnit: d.amountPerUnit?.toString(),
      spv: spvById[d.spvId] || null,
    })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDistributionForAdmin(distributionId) {
  const d = await prisma.distribution.findUnique({
    where: { id: distributionId },
  });
  if (!d) return null;

  const [spv, allocations] = await Promise.all([
    prisma.spv.findUnique({
      where: { id: d.spvId },
      select: {
        id: true, spvName: true, companyNumber: true, currency: true,
        totalUnits: true, unitsAllocated: true,
        opportunity: { select: { id: true, title: true } },
      },
    }),
    prisma.distributionAllocation.findMany({
      where: { distributionId },
      orderBy: { grossAmount: "desc" },
    }),
  ]);

  const userIds = [...new Set(allocations.map((a) => a.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true },
  });
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return {
    ...d,
    totalAmount: d.totalAmount?.toString(),
    amountPerUnit: d.amountPerUnit?.toString(),
    spv,
    allocations: allocations.map((a) => ({
      ...a,
      grossAmount: a.grossAmount?.toString(),
      withholdingAmount: a.withholdingAmount?.toString(),
      netAmount: a.netAmount?.toString(),
      user: userById[a.userId] || null,
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN: DISTRIBUTION STATS (for dashboard)
// ════════════════════════════════════════════════════════════════════

export async function getDistributionAdminStats() {
  const [drafts, recorded, paid, cancelled] = await Promise.all([
    prisma.distribution.count({ where: { status: "DRAFT" } }),
    prisma.distribution.count({ where: { status: "RECORDED" } }),
    prisma.distribution.count({ where: { status: "PAID" } }),
    prisma.distribution.count({ where: { status: "CANCELLED" } }),
  ]);

  // Total distributed (RECORDED or PAID) all-time
  const totalAgg = await prisma.distribution.aggregate({
    where: { status: { in: ["RECORDED", "PAID"] } },
    _sum: { totalAmount: true },
  });

  return {
    drafts, recorded, paid, cancelled,
    pendingPayout: recorded, // Phase 9+: actually paid out
    totalDistributedAllTime: totalAgg._sum.totalAmount?.toString() || "0",
  };
}

// ════════════════════════════════════════════════════════════════════
// INVESTOR: list my distribution allocations
// ════════════════════════════════════════════════════════════════════

export async function listDistributionsForInvestor({
  userId, taxYearUk, taxYearCalendar, status, page = 1, pageSize = 50,
} = {}) {
  const where = { userId };
  if (taxYearUk) where.taxYearUk = taxYearUk;
  if (taxYearCalendar) where.taxYearCalendar = taxYearCalendar;
  if (status) where.status = status;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [allocations, total] = await Promise.all([
    prisma.distributionAllocation.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      skip,
      take: pageSize,
      include: {
        distribution: {
          select: {
            id: true, declarationLabel: true, description: true,
            recordDate: true, paymentDate: true, status: true,
            withholdingPct: true,
          },
        },
      },
    }),
    prisma.distributionAllocation.count({ where }),
  ]);

  const spvIds = [...new Set(allocations.map((a) => a.spvId))];
  const spvs = await prisma.spv.findMany({
    where: { id: { in: spvIds } },
    select: { id: true, spvName: true, opportunity: { select: { id: true, title: true } } },
  });
  const spvById = Object.fromEntries(spvs.map((s) => [s.id, s]));

  return {
    allocations: allocations.map((a) => ({
      ...a,
      grossAmount: a.grossAmount?.toString(),
      withholdingAmount: a.withholdingAmount?.toString(),
      netAmount: a.netAmount?.toString(),
      spv: spvById[a.spvId] || null,
    })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  };
}

// ════════════════════════════════════════════════════════════════════
// THE STATEMENT AGGREGATOR — the heart of Phase 8
//
// Compiles everything that happened in a tax year for one investor:
//   - Dividend income (DistributionAllocations)
//   - Subscriptions (money in — for reference)
//   - Title transfers (disposals — relevant for CGT)
//   - Holdings as of year-end
//
// Returns a structured payload the statement PDF + investor UI use.
// ════════════════════════════════════════════════════════════════════

export async function buildInvestorTaxStatement({ userId, taxYear, system = "UK_SA" }) {
  const bounds = parseTaxYearBounds({ year: taxYear, system });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, email: true,
      addressLine1: true, addressLine2: true, city: true, region: true,
      postcode: true, country: true,
      investorType: true,
    },
  });
  if (!user) throw new Error("Investor not found");

  // 1) DIVIDENDS in this tax year
  // Filter on the cached year string OR on paymentDate within bounds (belt-and-braces)
  const yearField = system === "CALENDAR" ? "taxYearCalendar" : "taxYearUk";
  const dividendAllocs = await prisma.distributionAllocation.findMany({
    where: {
      userId,
      [yearField]: bounds.label,
      status: { in: ["RECORDED", "PAID"] }, // exclude CANCELLED
      paymentDate: { gte: bounds.from, lt: bounds.to },
    },
    orderBy: { paymentDate: "asc" },
    include: {
      distribution: {
        select: {
          declarationLabel: true,
          recordDate: true,
          paymentDate: true,
          withholdingPct: true,
          status: true,
        },
      },
    },
  });

  // 2) SUBSCRIPTIONS in this tax year (money in)
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      submittedAt: { gte: bounds.from, lt: bounds.to },
      status: { notIn: ["REJECTED", "CANCELLED"] },
    },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true, opportunityId: true, spvId: true,
      unitsRequested: true, unitPriceAtSub: true, totalAmount: true,
      currency: true, status: true, submittedAt: true, fundedAt: true,
      fullyAllocatedAt: true,
    },
  });

  // 3) TITLE TRANSFERS in this tax year (disposals + acquisitions)
  const transfers = await prisma.titleTransfer.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
      createdAt: { gte: bounds.from, lt: bounds.to },
    },
    orderBy: { createdAt: "asc" },
  });

  // 4) HOLDINGS at year end (positions snapshot for capital context)
  const holdings = await prisma.holding.findMany({
    where: { userId, totalUnits: { gt: 0 } },
  });

  // Hydrate SPV/opportunity names for everything
  const spvIds = new Set();
  const oppIds = new Set();
  for (const a of dividendAllocs) { spvIds.add(a.spvId); oppIds.add(a.opportunityId); }
  for (const s of subscriptions) { spvIds.add(s.spvId); oppIds.add(s.opportunityId); }
  for (const t of transfers) { spvIds.add(t.spvId); oppIds.add(t.opportunityId); }
  for (const h of holdings) { spvIds.add(h.spvId); oppIds.add(h.opportunityId); }

  const [spvs, opps] = await Promise.all([
    prisma.spv.findMany({
      where: { id: { in: [...spvIds] } },
      select: { id: true, spvName: true, companyNumber: true },
    }),
    prisma.opportunity.findMany({
      where: { id: { in: [...oppIds] } },
      select: { id: true, title: true },
    }),
  ]);
  const spvById = Object.fromEntries(spvs.map((s) => [s.id, s]));
  const oppById = Object.fromEntries(opps.map((o) => [o.id, o]));

  // ── Aggregates ──
  const dividendTotals = dividendAllocs.reduce((acc, a) => {
    acc.gross += parseFloat(a.grossAmount.toString());
    acc.withholding += parseFloat(a.withholdingAmount.toString());
    acc.net += parseFloat(a.netAmount.toString());
    return acc;
  }, { gross: 0, withholding: 0, net: 0 });

  const subscriptionTotal = subscriptions.reduce(
    (s, sub) => s + parseFloat(sub.totalAmount.toString()), 0
  );

  // Disposals (sold) only — that's the CGT-relevant figure
  const disposalsTotal = transfers
    .filter((t) => t.fromUserId === userId)
    .reduce((s, t) => s + parseFloat(t.amount.toString()), 0);

  const holdingsValue = holdings.reduce(
    (s, h) => s + parseFloat(h.totalInvested.toString()), 0
  );
  const holdingsUnits = holdings.reduce((s, h) => s + h.totalUnits, 0);

  return {
    investor: user,
    taxYear: bounds.label,
    system: bounds.system,
    period: { from: bounds.from, to: bounds.to },
    generatedAt: new Date(),

    summary: {
      dividendGross: dividendTotals.gross,
      dividendWithholding: dividendTotals.withholding,
      dividendNet: dividendTotals.net,
      subscriptionsCommitted: subscriptionTotal,
      disposalsTotal,
      holdingsValue,
      holdingsUnits,
      currency: dividendAllocs[0]?.currency || holdings[0]?.currency || "GBP",
    },

    dividends: dividendAllocs.map((a) => ({
      id: a.id,
      label: a.distribution?.declarationLabel,
      recordDate: a.distribution?.recordDate,
      paymentDate: a.paymentDate,
      unitsHeld: a.unitsHeld,
      grossAmount: parseFloat(a.grossAmount.toString()),
      withholdingAmount: parseFloat(a.withholdingAmount.toString()),
      netAmount: parseFloat(a.netAmount.toString()),
      currency: a.currency,
      status: a.status,
      spv: spvById[a.spvId],
      opportunity: oppById[a.opportunityId],
    })),

    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      submittedAt: s.submittedAt,
      fundedAt: s.fundedAt,
      units: s.unitsRequested,
      unitPrice: parseFloat(s.unitPriceAtSub.toString()),
      totalAmount: parseFloat(s.totalAmount.toString()),
      currency: s.currency,
      status: s.status,
      spv: spvById[s.spvId],
      opportunity: oppById[s.opportunityId],
    })),

    transfers: transfers.map((t) => ({
      id: t.id,
      date: t.createdAt,
      direction: t.fromUserId === userId ? "out" : "in",
      units: t.unitsTransferred,
      unitPrice: parseFloat(t.unitPrice.toString()),
      amount: parseFloat(t.amount.toString()),
      currency: t.currency,
      counterpartyType: t.toType,
      counterpartyName: t.fromUserId === userId ? (t.toName || "Buyer") : "Seller",
      spv: spvById[t.spvId],
      opportunity: oppById[t.opportunityId],
    })),

    holdings: holdings.map((h) => ({
      spv: spvById[h.spvId],
      opportunity: oppById[h.opportunityId],
      units: h.totalUnits,
      invested: parseFloat(h.totalInvested.toString()),
      ownershipPct: h.ownershipPct,
      currency: h.currency,
      firstInvestedAt: h.firstInvestedAt,
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// LEADS — public "Register Interest" / "Request Invitation" capture
// ════════════════════════════════════════════════════════════════════

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "archived"];

// Create a prospect record from the public marketing site. Email is stored
// lower-cased; everything else is trimmed by the caller's schema.
export async function createLead({
  name, email, location, message, source,
  investorType, budgetRange, interestType,
  ipAddress, userAgent, referer,
}) {
  return prisma.lead.create({
    data: {
      name,
      email: email.toLowerCase(),
      location,
      message: message || null,
      source: source || "website",
      investorType: investorType || null,
      budgetRange: budgetRange || null,
      interestType: interestType || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      referer: referer || null,
    },
  });
}

// How many times this email has submitted in the last `windowMs` — cheap
// anti-spam guard layered on top of the per-IP rate limiter.
export async function countRecentLeadsByEmail(email, windowMs) {
  const since = new Date(Date.now() - windowMs);
  return prisma.lead.count({
    where: { email: email.toLowerCase(), createdAt: { gte: since } },
  });
}

// Admin: paginated/filterable list for the Leads dashboard.
export async function getLeads({ status = null, search = null, limit = 200 } = {}) {
  const where = {};
  if (status && LEAD_STATUSES.includes(status)) where.status = status;
  if (search) {
    const q = search.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }
  }
  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Admin: counts per status for the dashboard header chips.
export async function getLeadStatusCounts() {
  const rows = await prisma.lead.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, archived: 0 };
  for (const r of rows) {
    counts[r.status] = r._count._all;
    counts.total += r._count._all;
  }
  return counts;
}

export async function countNewLeads() {
  return prisma.lead.count({ where: { status: "new" } });
}

export async function getLeadById(id) {
  return prisma.lead.findUnique({ where: { id } });
}

// Admin: update triage state and/or internal notes.
export async function updateLead(id, { status, notes, handledById } = {}) {
  const data = {};
  if (status !== undefined && LEAD_STATUSES.includes(status)) {
    data.status = status;
    data.handledById = handledById || null;
    data.handledAt = new Date();
  }
  if (notes !== undefined) data.notes = notes;
  return prisma.lead.update({ where: { id }, data });
}

export async function deleteLead(id) {
  return prisma.lead.delete({ where: { id } });
}

export { LEAD_STATUSES };