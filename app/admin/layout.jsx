// app/admin/layout.jsx
//
// Root layout for all /admin/* pages.
// Server-side checks admin auth — redirects unauthorized users to /portal.

import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import AdminShell from "./_components/AdminShell";

export const metadata = {
  title: "Admin Console — Bricks & Wealth",
  description: "Internal administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  // Server-side auth check
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/portal");
  }

  return (
    <div className="admin-root">
      <AdminShell admin={admin}>{children}</AdminShell>
    </div>
  );
}