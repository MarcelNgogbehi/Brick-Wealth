import LegalShell from "../_components/LegalShell";

export const metadata = {
  title: "KYC Data Processing Notice · Brick & Wealth",
  description: "How Brick & Wealth processes your identity-verification (KYC) data for anti-money-laundering checks.",
};

const doc = {
  slug: "data-processing",
  eyebrow: "Legal · Identity & AML",
  title: "KYC Data Processing Notice",
  version: "v1.0",
  updated: "5 June 2026",
  contactEmail: "compliance@brickandwealth.com",
  summary:
    "To meet our legal obligations and protect all investors, we verify your identity and the source of your funds before you can invest. This notice explains exactly what verification data we collect, why, how it is processed and protected, and how long we keep it. It complements our Privacy Policy.",
  keyPoints: [
    "We must verify you under the Money Laundering Regulations 2017.",
    "We collect ID documents, a selfie, proof of address and source of funds.",
    "Only authorised compliance staff can access these documents.",
    "Documents are encrypted in transit and at rest.",
    "We keep KYC records for at least 5 years after our relationship ends.",
    "You can defer upload, but cannot subscribe until KYC is approved.",
  ],
  sections: [
    {
      id: "why",
      heading: "Why we verify your identity",
      body: [
        "As an operator of investment vehicles, we are legally required to know who our investors are. Identity verification — \"Know Your Customer\" (KYC) — and anti-money-laundering (AML) checks protect the platform, comply with the law, and keep the investor community safe from financial crime.",
        "Our checks are designed to align with the UK Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 and applicable financial-crime guidance.",
        { note: "You may complete the rest of your onboarding and explore the platform before uploading your documents. However, your KYC must be submitted and approved before you can subscribe to any opportunity — this requirement cannot be waived." },
      ],
    },
    {
      id: "what",
      heading: "What we collect",
      body: [
        "To verify you, we ask for:",
        { table: {
          head: ["Document", "Purpose"],
          rows: [
            ["Government-issued photo ID (front & back)", "Confirm your identity and date of birth"],
            ["Selfie photo", "Confirm you are the genuine holder of the ID (liveness / likeness check)"],
            ["Proof of address", "Confirm your residential address (dated within 3 months)"],
            ["Source-of-funds evidence", "Confirm the legitimate origin of the money you invest"],
          ],
        } },
        "We may also screen your details against sanctions, politically-exposed-person (PEP), and adverse-media lists, and may ask for further information where our checks require it.",
      ],
    },
    {
      id: "basis",
      heading: "Our legal basis",
      body: [
        "We process your KYC data on two lawful bases under UK GDPR:",
        { list: [
          "Legal obligation — to comply with the Money Laundering Regulations 2017 and related financial-crime law; and",
          "Performance of a contract — to enable you to subscribe to opportunities through the platform.",
        ] },
        "Because identity and verification data is sensitive, we apply additional safeguards beyond those for ordinary personal data, and we collect only what is necessary for the checks.",
      ],
    },
    {
      id: "how",
      heading: "How your documents are handled",
      body: [
        { h3: "Encryption" },
        "Your documents are encrypted in transit (TLS) and at rest. They are stored separately from general account data, with access tightly controlled.",
        { h3: "Restricted access" },
        "Only authorised compliance staff and the verification partners who help us run the checks can access your documents. Access is logged, reviewed, and limited to what each role needs.",
        { h3: "Verification partners" },
        "We may use specialist identity-verification and screening providers to perform or support our checks. They act on our instructions under written data-processing agreements and may not use your data for any other purpose.",
      ],
    },
    {
      id: "review",
      heading: "Review, decisions & resubmission",
      body: [
        "After you upload your documents, our compliance team reviews them — typically within 24–72 hours. The possible outcomes are:",
        { table: {
          head: ["Status", "What it means"],
          rows: [
            ["Pending review", "Documents received and awaiting compliance review"],
            ["Approved", "Verification passed — you can now subscribe to opportunities"],
            ["Rejected", "We need clearer or additional documents — you'll be asked to resubmit"],
          ],
        } },
        "If a document is rejected, we will tell you why and invite you to upload a replacement. Verification decisions are made by our team, with support from automated tools; you can ask us to review any decision.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep KYC data",
      body: [
        "We are legally required to retain KYC and AML records for at least five years after the end of our business relationship with you, and sometimes longer where the law or a competent authority requires it.",
        "We keep these records even if you close your account, because our retention obligation is set by law. Once the retention period ends, we securely delete or anonymise the data.",
      ],
    },
    {
      id: "sharing",
      heading: "Who we may share it with",
      body: [
        "We keep your verification data confidential and share it only where necessary:",
        { list: [
          "With identity-verification and screening providers acting on our behalf;",
          "With regulators, the National Crime Agency, or law enforcement where we are legally required to report or disclose; and",
          "With professional advisers and auditors under duties of confidentiality.",
        ] },
        { note: "In limited circumstances, the law prevents us from telling you if we are required to make a report about your account (for example, a suspicious-activity report). This is a legal restriction we must follow." },
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      body: [
        "Your data-protection rights — including access, rectification, and erasure — apply to your KYC data, as described in our Privacy Policy. These rights are limited where we have a legal duty to retain the records.",
        "To ask a question about how we process your identity data, contact compliance@brickandwealth.com or our Data Protection Officer at privacy@brickandwealth.com.",
      ],
    },
  ],
};

export default function DataProcessingPage() {
  return <LegalShell doc={doc} />;
}
