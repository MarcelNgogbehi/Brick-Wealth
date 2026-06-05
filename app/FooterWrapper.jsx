"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { Suspense } from "react";

function FooterContent() {
  const pathname = usePathname();
  const isPortalPage = pathname?.startsWith("/portal");
  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboardPage = pathname?.startsWith("/dashboard");

  if (isPortalPage || isAdminPage || isDashboardPage) {
    return null;
  }

  return <Footer />;
}

export default function FooterWrapper() {
  return (
    <Suspense fallback={null}>
      <FooterContent />
    </Suspense>
  );
}
