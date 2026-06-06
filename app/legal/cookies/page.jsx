import LegalShell from "../_components/LegalShell";

export const metadata = {
  title: "Cookie Policy · Brick & Wealth",
  description: "The cookies and similar technologies Brick & Wealth uses, and how you can control them.",
};

const doc = {
  slug: "cookies",
  eyebrow: "Legal · Tracking",
  title: "Cookie Policy",
  version: "v1.0",
  updated: "5 June 2026",
  contactEmail: "privacy@brickandwealth.com",
  summary:
    "This policy explains what cookies and similar technologies Brick & Wealth uses, what they do, and how you can control them. Cookies are small text files placed on your device that help our platform work, keep you signed in securely, and — with your consent — help us understand how the platform is used.",
  keyPoints: [
    "Essential cookies keep you signed in and the platform secure.",
    "Essential cookies don't need consent; analytics cookies do.",
    "You control non-essential cookies and can change your mind any time.",
    "We don't use cookies to sell your data.",
    "Blocking essential cookies may stop parts of the platform working.",
    "You can manage cookies in your account settings and your browser.",
  ],
  sections: [
    {
      id: "what",
      heading: "What cookies are",
      body: [
        "Cookies are small text files stored on your device when you visit a website. They let the site remember your actions and preferences over time. We also use similar technologies — such as local storage and pixels — and refer to all of them as \"cookies\" in this policy.",
        "Cookies can be \"session\" cookies (deleted when you close your browser) or \"persistent\" cookies (which remain for a set period). They can be set by us (\"first-party\") or by a service we use (\"third-party\").",
      ],
    },
    {
      id: "types",
      heading: "The cookies we use",
      body: [
        { table: {
          head: ["Type", "What it does", "Consent"],
          rows: [
            ["Strictly necessary", "Sign-in sessions, security, CSRF protection, load balancing, remembering your cookie choices", "Not required"],
            ["Functional", "Remembering preferences such as language or display settings", "Required"],
            ["Analytics / performance", "Understanding how the platform is used so we can improve it", "Required"],
          ],
        } },
        { note: "Strictly necessary cookies are essential for the platform to work — for example, to keep you securely signed in. They cannot be switched off, and we set them under our legitimate interest in providing a secure service. All other cookies are only set with your consent." },
      ],
    },
    {
      id: "essential",
      heading: "Essential cookies in detail",
      body: [
        "We use a small set of essential cookies to run the platform securely. These typically include:",
        { list: [
          "A session cookie that keeps you signed in as you move between pages;",
          "A CSRF-protection token that helps prevent malicious cross-site requests;",
          "A cookie that records your cookie preferences so we don't ask you repeatedly.",
        ] },
        "Without these, core features — such as logging in, subscribing, or accessing your documents — will not work.",
      ],
    },
    {
      id: "analytics",
      heading: "Analytics cookies",
      body: [
        "With your consent, we use analytics cookies to understand how investors use the platform — which pages are visited, where people encounter difficulty, and how features perform. This helps us improve the experience.",
        "Analytics data is used in aggregate to improve our service. You can decline analytics cookies without affecting your ability to use the platform, and you can withdraw your consent at any time.",
      ],
    },
    {
      id: "control",
      heading: "How to control cookies",
      body: [
        { h3: "In your account" },
        "You can review and change your cookie consent at any time from your account settings. Withdrawing consent stops us setting non-essential cookies going forward.",
        { h3: "In your browser" },
        "Most browsers let you see what cookies are stored, delete them, and block them — either entirely or by site. Look in your browser's privacy or security settings. Note that blocking essential cookies will prevent parts of the platform from working.",
        { list: [
          "Chrome: Settings → Privacy and security → Cookies and other site data",
          "Safari: Settings → Privacy",
          "Firefox: Settings → Privacy & Security → Cookies and Site Data",
          "Edge: Settings → Cookies and site permissions",
        ] },
      ],
    },
    {
      id: "thirdparty",
      heading: "Third-party services",
      body: [
        "Some cookies may be set by trusted providers we use to deliver the platform — for example, infrastructure, payment, and analytics partners. These providers process data under their own policies and our data-processing agreements. We do not permit them to use cookies on our platform to sell your personal data.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: [
        "We may update this Cookie Policy as our platform and the technologies we use evolve. When we make material changes, we will update the version and date above and, where appropriate, ask for your consent again.",
        "For anything cookie- or privacy-related, contact privacy@brickandwealth.com. See our Privacy Policy for the full picture of how we handle your personal data.",
      ],
    },
  ],
};

export default function CookiesPage() {
  return <LegalShell doc={doc} />;
}
