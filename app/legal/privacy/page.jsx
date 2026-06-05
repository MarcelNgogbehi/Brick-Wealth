import LegalShell from "../_components/LegalShell";

export const metadata = {
  title: "Privacy Policy · Bricks & Wealth",
  description: "How Bricks & Wealth collects, uses, and protects your personal data under UK GDPR.",
};

const doc = {
  slug: "privacy",
  eyebrow: "Legal · Data Protection",
  title: "Privacy Policy",
  version: "v1.0",
  updated: "5 June 2026",
  contactEmail: "privacy@brickandwealth.com",
  summary:
    "This policy explains what personal data Bricks & Wealth Holdings Ltd collects about you, why we collect it, how we use and protect it, and the rights you have under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. We are the data controller for the information described here.",
  keyPoints: [
    "We are the data controller; our DPO can be reached at privacy@brickandwealth.com.",
    "We collect identity, contact, financial and usage data.",
    "We use it to verify you, run your account, and meet legal duties.",
    "We never sell your personal data.",
    "We keep KYC records as long as the law requires (typically 5+ years).",
    "You have rights to access, correct, and erase your data.",
  ],
  sections: [
    {
      id: "controller",
      heading: "Who controls your data",
      body: [
        "Bricks & Wealth Holdings Ltd (company number 14582930), registered office London EC2M, United Kingdom, is the \"data controller\" responsible for your personal data. That means we decide why and how your data is processed.",
        "You can contact our Data Protection Officer at privacy@brickandwealth.com or by writing to the Data Protection Officer at our registered office.",
      ],
    },
    {
      id: "collect",
      heading: "What we collect",
      body: [
        "Depending on how you use the platform, we collect:",
        { table: {
          head: ["Category", "Examples"],
          rows: [
            ["Identity data", "Full name, date of birth, nationality, photo ID, selfie"],
            ["Contact data", "Email, phone number, residential address, country"],
            ["Financial data", "Source of funds, estimated net worth, investor classification, subscription and payment records"],
            ["Account data", "Username, password (hashed), preferences, consents"],
            ["Usage data", "Pages visited, actions taken, device and browser information, IP address"],
            ["Communications", "Messages, support requests, and our responses"],
          ],
        } },
        { note: "Identity documents and verification data are \"special category\" / high-risk data and receive additional safeguards. Our KYC Data Processing Notice explains how we handle them specifically." },
      ],
    },
    {
      id: "why",
      heading: "Why we use it & our legal basis",
      body: [
        "We only process your data where we have a lawful basis under UK GDPR:",
        { table: {
          head: ["Purpose", "Lawful basis"],
          rows: [
            ["Create and operate your account; process subscriptions", "Performance of a contract with you"],
            ["Verify your identity and run AML / sanctions checks", "Legal obligation (Money Laundering Regulations 2017)"],
            ["Keep the platform secure and prevent fraud", "Legitimate interests"],
            ["Improve our services and understand usage", "Legitimate interests / consent (analytics cookies)"],
            ["Send investor updates and marketing", "Consent (which you can withdraw any time)"],
            ["Meet tax, accounting and regulatory duties", "Legal obligation"],
          ],
        } },
      ],
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: [
        "We never sell your personal data. We share it only where necessary, with:",
        { list: [
          "Identity-verification and AML providers who help us confirm who you are;",
          "Payment processors that handle subscription funding;",
          "Professional advisers (legal, accounting, audit) under duties of confidentiality;",
          "Cloud, hosting, and infrastructure providers that run our platform securely;",
          "Regulators, law enforcement, and authorities where we are legally required to disclose; and",
          "A successor entity in the event of a reorganisation, merger, or sale of our business.",
        ] },
        "Every processor we use is bound by a written agreement requiring them to protect your data and use it only on our instructions.",
      ],
    },
    {
      id: "transfers",
      heading: "International transfers",
      body: [
        "We aim to keep your data within the UK and the European Economic Area. Where data must be transferred outside these regions, we put appropriate safeguards in place — such as UK adequacy regulations or the International Data Transfer Agreement / Standard Contractual Clauses — so your data receives an equivalent level of protection.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      body: [
        "We keep personal data only as long as we need it for the purposes set out here, or as the law requires.",
        { list: [
          "KYC and AML records: at least 5 years after our relationship ends, as required by the Money Laundering Regulations 2017;",
          "Subscription, financial and tax records: typically 6–7 years to meet accounting and tax duties;",
          "Account and usage data: for as long as your account is active, then a limited period afterwards;",
          "Marketing preferences: until you withdraw consent.",
        ] },
        "When data is no longer needed, we securely delete or anonymise it.",
      ],
    },
    {
      id: "security",
      heading: "How we protect it",
      body: [
        "We use technical and organisational measures appropriate to the sensitivity of your data, including:",
        { list: [
          "Encryption in transit (TLS) and at rest;",
          "Strict access controls — only authorised staff can view sensitive records;",
          "Hashed passwords and protected session handling;",
          "Monitoring, logging, and regular review of our security posture; and",
          "Staff training on data protection and confidentiality.",
        ] },
        "No system is perfectly secure, but we work continuously to keep your data safe and to respond quickly to any incident.",
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      body: [
        "Under UK GDPR you have the right to:",
        { list: [
          "Access — request a copy of the personal data we hold about you;",
          "Rectification — ask us to correct inaccurate or incomplete data;",
          "Erasure — ask us to delete your data, where no legal duty requires us to keep it;",
          "Restriction — ask us to limit how we use your data in certain cases;",
          "Portability — receive your data in a portable format;",
          "Objection — object to processing based on legitimate interests or to direct marketing; and",
          "Withdraw consent — at any time, where we rely on consent.",
        ] },
        { note: "To exercise any right, email privacy@brickandwealth.com. We will respond within one month. Some rights are limited where we have a legal obligation to retain information — for example, KYC records we must keep under anti-money-laundering law." },
      ],
    },
    {
      id: "complaints",
      heading: "Complaints",
      body: [
        "We hope to resolve any concern you have directly — please contact us first at privacy@brickandwealth.com.",
        "You also have the right to complain to the UK's supervisory authority, the Information Commissioner's Office (ICO), at ico.org.uk or by calling 0303 123 1113.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: [
        "We may update this policy from time to time. When we make material changes, we will notify you and update the version and date above. Please review it periodically so you stay informed about how we protect your data.",
      ],
    },
  ],
};

export default function PrivacyPage() {
  return <LegalShell doc={doc} />;
}
