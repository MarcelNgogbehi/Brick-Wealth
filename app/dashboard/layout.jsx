// app/dashboard/layout.jsx
//
// Server-side auth gate for the investor dashboard.
// Verifies the session BEFORE rendering anything.
//
// Flow:
// - No session → redirect to /portal
// - Email not verified → redirect to /portal/verify
// - Suspended → redirect to /portal?reason=suspended
// - Otherwise → render dashboard

import { requireDashboardUser } from "@/lib/dashboard-auth";
import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({ children }) {
  // This will redirect if unauthorized — wraps the entire dashboard
  const user = await requireDashboardUser({ redirect: true });

  // Strip sensitive fields before passing to client component
  const safeUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    onboardingComplete: user.onboardingComplete,
    kycStatus: user.kycStatus,
    consentsComplete: user.consentsComplete,
    accountActivated: user.accountActivated,
    investorType: user.investorType,
  };

  return <DashboardShell user={safeUser}>{children}</DashboardShell>;
}