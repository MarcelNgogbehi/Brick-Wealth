import Link from "next/link";
import { ShieldCheck, FileText, Users } from "lucide-react";
import RegisterInterestForm from "@/components/RegisterInterestForm";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-montserrat), 'Montserrat', sans-serif";

export const metadata = {
  title: "Register Your Interest",
  description:
    "Register your interest in Brick & Wealth — private, FCA-aligned UK property co-investment through ring-fenced SPVs. By invitation only.",
};

const POINTS = [
  { icon: ShieldCheck, title: "FCA-aligned framework", body: "Every opportunity is structured through a ring-fenced SPV with full documentation." },
  { icon: FileText, title: "Full transparency", body: "Subscription packs, legal opinions and quarterly updates — nothing hidden." },
  { icon: Users, title: "By invitation only", body: "We review every request personally and onboard a small, considered group." },
];

export default function RegisterInterestPage() {
  return (
    <main style={{ background: "#F8F4EC", minHeight: "100vh" }}>
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-[140px] pb-24">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-start">
          {/* ── Left: editorial intro ───────────────────────────────── */}
          <div className="pt-2">
            <span
              className="inline-block mb-5 text-[10.5px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "#9A7A2E", fontFamily: SANS }}
            >
              Private · Invitation Only · Est. 2026
            </span>
            <h1
              className="mb-6"
              style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1.05, color: NAVY_900 }}
            >
              Register your{" "}
              <em style={{ fontStyle: "italic", color: "#9A7A2E" }}>interest</em>.
            </h1>
            <p
              className="mb-10 max-w-xl"
              style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.7, color: "#4A5468" }}
            >
              Private, FCA-aligned UK property co-investment through ring-fenced SPVs —
              fully documented, fully transparent, fully on your terms. Tell us where to
              reach you and our investor team will be in touch with next steps.
            </p>

            <ul className="space-y-5">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(201,162,74,0.12)", border: "1px solid rgba(201,162,74,0.32)" }}
                  >
                    <Icon size={19} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: NAVY_900 }}>{title}</p>
                    <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: "#5A6478" }}>{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-[13.5px]" style={{ fontFamily: SANS, color: "#5A6478" }}>
              Already have an account?{" "}
              <Link href="/portal" style={{ color: "#9A7A2E", fontWeight: 700, textDecoration: "underline" }}>
                Sign in to the investor portal
              </Link>
            </p>
          </div>

          {/* ── Right: form card ─────────────────────────────────────── */}
          <div
            className="w-full"
            style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(201,162,74,0.25)", boxShadow: "0 40px 80px -24px rgba(6,20,47,0.35)", overflow: "hidden" }}
          >
            <div
              className="px-7 pt-7 pb-6"
              style={{ background: `linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 100%)`, borderBottom: `2px solid ${GOLD}` }}
            >
              <span className="block mb-2 text-[10.5px] font-bold tracking-[0.28em] uppercase" style={{ color: GOLD_LIGHT, fontFamily: SANS }}>
                Request an Invitation
              </span>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 28, lineHeight: 1.1, color: "#fff" }}>
                Tell us about yourself
              </h2>
            </div>
            <div className="px-7 py-7">
              <RegisterInterestForm source="register-interest-page" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
