"use client";

// app/company/contact/page.jsx
//
// Contact & Book a Call — the destination for every "Book a Call" / "Contact"
// CTA across the site. Offers the three ways to reach the team (book a call,
// email, phone) and a request form that lands in the admin Leads dashboard
// (source: "contact") so nothing slips through the cracks.

import Link from "next/link";
import { Calendar, Mail, Phone, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import RegisterInterestForm from "@/components/RegisterInterestForm";

const NAVY_900 = "#0A1F44";
const NAVY_950 = "#06142F";
const GOLD = "#C9A24A";
const GOLD_LIGHT = "#D9B560";
const INK = "#0B1220";
const INK_MID = "#4A5468";
const WHITE = "#FFFFFF";
const GREEN = "#0F6E56";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const SANS = "var(--font-montserrat), 'Montserrat', sans-serif";

const METHODS = [
  {
    icon: Calendar,
    title: "Book a Discovery Call",
    short: "30 minutes · No commitment",
    body: "The fastest way to understand if Brick & Wealth fits your goals. Speak directly with our investor team — no sales pressure, just a conversation.",
    cta: "Request a call below",
    href: "#contact-form",
    accent: GOLD,
  },
  {
    icon: Mail,
    title: "Send Us a Message",
    short: "Reply within 24 hours",
    body: "For specific questions about an opportunity, our structure, or your circumstances. Every message is reviewed personally — no chatbots, no auto-responders.",
    cta: "investors@brickandwealth.com",
    href: "mailto:investors@brickandwealth.com",
    accent: NAVY_900,
  },
  {
    icon: Phone,
    title: "Call Our Office",
    short: "Mon–Fri · 09:00–18:00 GMT",
    body: "For time-sensitive matters or if you'd prefer a phone conversation. Our investor line is staffed by our team directly — no call centres, no scripts.",
    cta: "+44 (0) 20 1234 5678",
    href: "tel:+442012345678",
    accent: GREEN,
  },
];

export default function ContactPage() {
  return (
    <main style={{ background: "#F8F4EC", minHeight: "100vh" }}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: NAVY_950, paddingTop: 148, paddingBottom: 72 }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(201,162,74,0.18) 0%, transparent 60%)" }}
          aria-hidden="true"
        />
        <div className="relative max-w-[1180px] mx-auto px-5 sm:px-8">
          <Link href="/company" className="inline-flex items-center gap-1.5 mb-7 text-[12px] font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)", fontFamily: SANS, textDecoration: "none" }}>
            <ArrowLeft size={13} /> Company
          </Link>
          <span className="block mb-4 text-[10.5px] font-bold tracking-[0.3em] uppercase" style={{ color: GOLD_LIGHT, fontFamily: SANS }}>
            Contact &amp; Book a Call
          </span>
          <h1 className="mb-5 max-w-3xl" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.04, color: WHITE }}>
            Let&apos;s start a{" "}
            <em style={{ fontStyle: "italic", color: GOLD_LIGHT }}>conversation</em>.
          </h1>
          <p className="max-w-2xl" style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.74)" }}>
            Whether you&apos;re ready to invest or just exploring, our team is here to help.
            Book a no-pressure discovery call, send us a message, or call the office directly.
          </p>
        </div>
      </section>

      {/* ── Contact methods ────────────────────────────────────────────── */}
      <section className="max-w-[1180px] mx-auto px-5 sm:px-8 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          {METHODS.map(({ icon: Icon, title, short, body, cta, href, accent }) => (
            <a key={title} href={href} className="block group">
              <div
                className="h-full flex flex-col p-7 transition-all duration-200 group-hover:-translate-y-1"
                style={{ background: WHITE, borderRadius: 16, border: "1px solid rgba(10,31,68,0.08)", boxShadow: "0 24px 60px -28px rgba(6,20,47,0.28)" }}
              >
                <div className="flex items-center justify-center mb-5" style={{ width: 48, height: 48, borderRadius: 12, background: `${accent}14`, border: `1px solid ${accent}33` }}>
                  <Icon size={21} style={{ color: accent }} />
                </div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 23, color: NAVY_900, lineHeight: 1.15 }}>{title}</h3>
                <p className="mt-1 mb-3 text-[11.5px] font-bold tracking-[0.1em] uppercase" style={{ color: accent, fontFamily: SANS }}>{short}</p>
                <p className="flex-1 text-[14px]" style={{ fontFamily: SANS, lineHeight: 1.65, color: INK_MID }}>{body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: NAVY_900, fontFamily: SANS }}>
                  {cta}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Request form ───────────────────────────────────────────────── */}
      <section id="contact-form" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 scroll-mt-28">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 lg:gap-16 items-start">
          <div className="pt-2">
            <h2 className="mb-5" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(32px, 4.5vw, 50px)", lineHeight: 1.08, color: NAVY_900 }}>
              Request a call back
            </h2>
            <p className="mb-8 max-w-md" style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.7, color: INK_MID }}>
              Leave your details and our investor team will reach out to arrange a
              30-minute discovery call at a time that suits you. No commitment, no pressure.
            </p>
            <ul className="space-y-4">
              {[
                { icon: Clock, text: "We respond within one business day." },
                { icon: ShieldCheck, text: "Your details are private and never shared." },
                { icon: Calendar, text: "Calls are 30 minutes — at a time that suits you." },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(201,162,74,0.12)", border: "1px solid rgba(201,162,74,0.3)" }}>
                    <Icon size={15} style={{ color: GOLD }} />
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 14, color: INK }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: WHITE, borderRadius: 16, border: "1px solid rgba(201,162,74,0.25)", boxShadow: "0 40px 80px -24px rgba(6,20,47,0.3)", overflow: "hidden" }}>
            <div className="px-7 pt-7 pb-6" style={{ background: `linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 100%)`, borderBottom: `2px solid ${GOLD}` }}>
              <span className="block mb-2 text-[10.5px] font-bold tracking-[0.28em] uppercase" style={{ color: GOLD_LIGHT, fontFamily: SANS }}>
                Book a Discovery Call
              </span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 26, lineHeight: 1.1, color: WHITE }}>
                Tell us how to reach you
              </h3>
            </div>
            <div className="px-7 py-7">
              <RegisterInterestForm source="contact" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
