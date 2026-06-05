import LegalShell from "../_components/LegalShell";

export const metadata = {
  title: "Terms of Service · Bricks & Wealth",
  description: "The agreement governing your use of the Bricks & Wealth investment platform.",
};

const doc = {
  slug: "terms",
  eyebrow: "Legal · Agreement",
  title: "Terms of Service",
  version: "v1.0",
  updated: "5 June 2026",
  contactEmail: "legal@brickandwealth.com",
  summary:
    "These terms form a binding agreement between you and Bricks & Wealth Holdings Ltd. They explain what our platform does, the rules for using it, and the rights and responsibilities of both sides. Please read them carefully before creating an account or subscribing to an opportunity.",
  keyPoints: [
    "You must be 18+ and pass identity verification to invest.",
    "We operate property co-investment vehicles (SPVs) — not advice.",
    "Capital is at risk; returns are targets, never guarantees.",
    "Your account is personal to you and must be kept secure.",
    "We may suspend accounts that breach these terms or the law.",
    "English law governs this agreement.",
  ],
  sections: [
    {
      id: "about",
      heading: "Who we are",
      body: [
        "Bricks & Wealth is a property co-investment platform operated by Bricks & Wealth Holdings Ltd, a company registered in England & Wales under company number 14582930, with its registered office in London EC2M, United Kingdom (\"Bricks & Wealth\", \"we\", \"us\", or \"our\").",
        "We enable eligible investors to co-invest in UK residential property through ring-fenced Special Purpose Vehicles (\"SPVs\"). Each SPV is its own UK limited company with its own assets, records, and accounts.",
        { note: "These Terms of Service work alongside our Privacy Policy, Risk Warning, KYC Data Processing Notice, and Cookie Policy. Together they govern your relationship with us. Where an opportunity has its own subscription agreement, that document also applies to that specific investment." },
      ],
    },
    {
      id: "eligibility",
      heading: "Eligibility & accounts",
      body: [
        "To open an account and invest, you must:",
        { list: [
          "Be at least 18 years old and have legal capacity to enter contracts;",
          "Complete our registration, identity (KYC) and anti-money-laundering checks;",
          "Provide accurate, current and complete information about yourself; and",
          "Confirm your investor classification (retail, self-certified sophisticated, or self-certified high-net-worth) honestly.",
        ] },
        { h3: "Approval is not automatic" },
        "Registration creates an application, not a guarantee of access. We may decline, delay, or revoke access at our discretion, including where we cannot verify your identity or where we are required to by law.",
        { h3: "Keeping your account secure" },
        "You are responsible for keeping your password and account credentials confidential and for all activity that takes place under your account. Tell us immediately if you suspect unauthorised access. Do not share your login, and do not let anyone else invest through your account.",
      ],
    },
    {
      id: "platform",
      heading: "What the platform does — and doesn't",
      body: [
        "We provide an execution-only platform: tools to discover opportunities, subscribe to SPVs, manage your holdings, and access your documents.",
        { h3: "We do not provide financial advice" },
        "Nothing on the platform is a personal recommendation, financial advice, tax advice, or legal advice. We do not assess whether an investment is suitable or appropriate for your individual circumstances. If you are unsure, seek advice from an independent, suitably qualified professional before investing.",
        { h3: "Information is for your consideration" },
        "Yields, projected returns, timelines and valuations shown on the platform are targets and estimates based on information available at the time. They are not promises. Past performance does not predict future results. You should read every opportunity's materials in full before subscribing.",
      ],
    },
    {
      id: "subscriptions",
      heading: "Subscriptions & payments",
      body: [
        "When you subscribe to an opportunity, you make an application to acquire units in the relevant SPV. Your subscription is subject to verification, allocation, and the terms of that SPV's subscription agreement.",
        { ol: [
          "You select an opportunity and the number of units you wish to acquire.",
          "You self-certify your eligibility and acknowledge the risks at the point of subscribing.",
          "We review your subscription and confirm (or decline) your allocation.",
          "You fund the subscription by the accepted payment method; allocation is finalised on cleared funds.",
        ] },
        { note: "Identity verification (KYC) must be approved before you can subscribe to any opportunity. You may complete the rest of onboarding and explore the platform first, but subscriptions stay locked until your KYC documents are submitted and approved." },
        "We may reject or scale back a subscription — for example where an opportunity is oversubscribed, where eligibility checks are incomplete, or where required by law. If we cannot allocate your subscription, we will return any funds received for the unallocated portion.",
      ],
    },
    {
      id: "fees",
      heading: "Fees & charges",
      body: [
        "The fees that apply to each opportunity are disclosed within that opportunity's materials before you subscribe. These may include arrangement, management, or performance-related fees charged at the SPV level.",
        "We will always set out the applicable fees clearly before you commit. By subscribing, you agree to the fees disclosed for that opportunity. We will give reasonable notice of any change to platform-level fees that affect you.",
      ],
    },
    {
      id: "conduct",
      heading: "Acceptable use",
      body: [
        "When using the platform, you agree not to:",
        { list: [
          "Provide false, misleading, or fraudulent information;",
          "Use the platform for money laundering, terrorist financing, or any unlawful purpose;",
          "Attempt to gain unauthorised access to any account, system, or data;",
          "Interfere with, disrupt, scrape, or reverse-engineer the platform;",
          "Circumvent identity, eligibility, or security controls; or",
          "Infringe our intellectual property or that of any third party.",
        ] },
        "We may investigate suspected breaches and cooperate with law enforcement and regulators where appropriate.",
      ],
    },
    {
      id: "ip",
      heading: "Intellectual property",
      body: [
        "The platform, its content, branding, and software are owned by or licensed to Bricks & Wealth and are protected by intellectual-property laws. We grant you a limited, non-exclusive, non-transferable licence to use the platform for your own investment purposes.",
        "You may download and retain documents relating to your own holdings. You must not copy, republish, or commercially exploit any other platform content without our written permission.",
      ],
    },
    {
      id: "liability",
      heading: "Liability",
      body: [
        "We provide the platform with reasonable care and skill, but we do not guarantee that it will be uninterrupted, error-free, or that any investment will achieve its targets.",
        "Nothing in these terms limits liability that cannot lawfully be limited — including liability for death or personal injury caused by negligence, or for fraud. Subject to that, we are not liable for investment losses arising from market conditions, the performance of any SPV or underlying property, or decisions you make. We are not liable for indirect or consequential loss.",
        { note: "Property investment carries real and significant risk, including the risk of losing the capital you invest. Our Risk Warning explains this in full and forms part of your agreement with us." },
      ],
    },
    {
      id: "suspension",
      heading: "Suspension & termination",
      body: [
        "You may close your account at any time, subject to settling any open obligations and the terms of any SPV in which you hold units.",
        "We may suspend or terminate your access where you breach these terms, where we are required to by law or regulation, where we cannot verify your identity, or to protect the platform and other investors. Where we reasonably can, we will give you notice. Suspension of platform access does not, by itself, affect your existing legal interest in any SPV units you already hold.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      body: [
        "We may update these terms to reflect changes in our services, the law, or regulatory requirements. When we make material changes, we will notify you (for example, by email or an in-platform notice) and update the version and date at the top of this page.",
        "Continuing to use the platform after changes take effect means you accept the updated terms. If you do not agree, you should stop using the platform and may close your account.",
      ],
    },
    {
      id: "law",
      heading: "Governing law & contact",
      body: [
        "These terms are governed by the laws of England and Wales, and the courts of England and Wales have exclusive jurisdiction over any dispute, subject to any non-waivable rights you have as a consumer.",
        "If you have a question or complaint about these terms or our service, contact us at legal@brickandwealth.com and we will respond promptly.",
      ],
    },
  ],
};

export default function TermsPage() {
  return <LegalShell doc={doc} />;
}
