import localFont from "next/font/local";
import "./globals.css";
import ClientLayoutWrapper from "@/app/ClientLayoutWrapper";
import { AppContextProvider } from "@/context/AppContext";
import FooterWrapper from "@/app/FooterWrapper";
import { DialogProvider } from "@/components/ConfirmDialog";
import { RegisterInterestProvider } from "@/components/RegisterInterestModal";

// ─── Fonts (self-hosted) ───────────────────────────────────────────────────────
// Served from app/fonts/*.woff2 (latin subset) rather than fetched from Google
// Fonts at build time. This removes the external network dependency entirely, so
// the build never fails or falls back when fonts.googleapis.com is unreachable.
const montserrat = localFont({
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
  src: [
    { path: "./fonts/montserrat-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/montserrat-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/montserrat-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/montserrat-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/montserrat-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/montserrat-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/montserrat-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/montserrat-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/montserrat-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/montserrat-700-italic.woff2", weight: "700", style: "italic" },
    { path: "./fonts/montserrat-800-normal.woff2", weight: "800", style: "normal" },
    { path: "./fonts/montserrat-800-italic.woff2", weight: "800", style: "italic" },
    { path: "./fonts/montserrat-900-normal.woff2", weight: "900", style: "normal" },
    { path: "./fonts/montserrat-900-italic.woff2", weight: "900", style: "italic" },
  ],
});

const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
  adjustFontFallback: "Times New Roman",
  src: [
    { path: "./fonts/cormorant-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/cormorant-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorant-600-italic.woff2", weight: "600", style: "italic" },
  ],
});

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata = {
  title: {
    default:
      "Brick & Wealth — Own UK Property. Build Wealth. Brick by Brick.",
    template: "%s | Brick & Wealth",
  },
  description:
    "A trust-first private property co-investment platform for invited individuals. Participate in carefully selected UK property opportunities through ring-fenced Special Purpose Vehicles. From £500 per share.",
  keywords: [
    "UK property investment",
    "property co-investment platform",
    "SPV property investment",
    "buy-to-let investment UK",
    "fractional property ownership",
    "diaspora property investment UK",
    "private property investment",
    "Brick and Wealth Holdings",
    "FCA-aligned property platform",
  ],
  authors: [{ name: "Brick & Wealth Holdings Ltd" }],
  creator: "Brick & Wealth Holdings Ltd",
  publisher: "Brick & Wealth Holdings Ltd",
  metadataBase: new URL("https://brickandwealth.com"),
  alternates: {
    canonical: "https://brickandwealth.com",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://brickandwealth.com",
    siteName: "Brick & Wealth",
    title:
      "Brick & Wealth — Own UK Property. Build Wealth. Brick by Brick.",
    description:
      "Private property co-investment in the UK. Ring-fenced SPVs, FCA-aligned framework, full documentation. By invitation only.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Brick & Wealth — Building Wealth, Brick by Brick",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brick & Wealth — Building Wealth, Brick by Brick",
    description:
      "Private UK property co-investment for invited individuals. From £500 per share.",
    images: ["/og-image.jpg"],
    creator: "@brickandwealth",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  category: "finance",
};

export const viewport = {
  themeColor: "#0A1F44", // Brick & Wealth navy for browser chrome
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable}`}
    >
      <body
        className="antialiased overflow-x-hidden"
        style={{
          fontFamily: "var(--font-montserrat), sans-serif",
          backgroundColor: "#F8F4EC",
          color: "#0B1220",
        }}
        suppressHydrationWarning
      >
        {/* ══ GLOBAL JSON-LD: FinancialService + Organization ═════════════ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              name: "Brick & Wealth Holdings Ltd",
              alternateName: "Brick & Wealth",
              url: "https://brickandwealth.com",
              logo: "https://brickandwealth.com/logo.png",
              image: "https://brickandwealth.com/og-image.jpg",
              description:
                "Private property co-investment platform enabling invited individuals to participate in carefully selected UK property opportunities through ring-fenced Special Purpose Vehicles.",
              telephone: "+44-20-1234-5678",
              email: "investors@brickandwealth.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "London",
                addressCountry: "GB",
              },
              areaServed: {
                "@type": "Country",
                name: "United Kingdom",
              },
              currenciesAccepted: "GBP",
              priceRange: "From £500 per share",
              foundingDate: "2026",
              founder: {
                "@type": "Person",
                name: "Marcel Ngogbehei",
              },
              sameAs: [
                "https://x.com/brickandwealth",
                "https://linkedin.com/company/brickandwealth",
                "https://youtube.com/@brickandwealth",
                "https://instagram.com/brickandwealth",
              ],
            }),
          }}
        />

        {/* ══ Skip-to-main-content link for accessibility ═════════════════ */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-[#0A1F44] focus:font-bold"
        >
          Skip to main content
        </a>

        <AppContextProvider>
          <DialogProvider>
            <RegisterInterestProvider>
              {/* ══ Navigation ══════════════════════════════════════════════════ */}
              <ClientLayoutWrapper />

              {/* ══ Page content ════════════════════════════════════════════════ */}
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>

              {/* ══ Footer ══════════════════════════════════════════════════════ */}
              <FooterWrapper />
            </RegisterInterestProvider>
          </DialogProvider>
        </AppContextProvider>
      </body>
    </html>
  );
}