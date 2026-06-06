import LegalShell from "../_components/LegalShell";

export const metadata = {
  title: "Risk Warning · Brick & Wealth",
  description: "The key risks of investing in property through Brick & Wealth. Your capital is at risk.",
};

const doc = {
  slug: "risk",
  eyebrow: "Legal · Important",
  title: "Risk Warning",
  version: "v1.0",
  updated: "5 June 2026",
  contactEmail: "compliance@brickandwealth.com",
  summary:
    "Investing in property through Brick & Wealth puts your capital at risk. This warning explains the main risks so you can make an informed decision. Please read it in full before you subscribe to any opportunity. If anything is unclear, seek independent financial advice.",
  keyPoints: [
    "Don't invest unless you're prepared to lose all the money you invest.",
    "Past performance does not predict future results.",
    "Targeted yields and returns are estimates, not guarantees.",
    "These investments are illiquid — you may not be able to sell quickly.",
    "Property values and rental income can fall as well as rise.",
    "These products are not covered by the FSCS for investment losses.",
  ],
  sections: [
    {
      id: "summary",
      heading: "The headline risk",
      body: [
        { note: "Property investment is high-risk. You could lose some or all of the money you invest. You should not invest more than you can afford to lose, and you should build a diversified portfolio rather than concentrating your money in a single investment." },
        "Brick & Wealth offers co-investment in UK property through ring-fenced Special Purpose Vehicles (SPVs). These are long-term, illiquid investments designed for investors who understand and accept the risks set out below.",
      ],
    },
    {
      id: "capital",
      heading: "Capital at risk",
      body: [
        "The value of property can go down as well as up. If a property is sold for less than was paid for it — or if costs exceed income — the value of your units may fall, and you may get back less than you invested, or nothing at all.",
        "Returns depend on factors outside our control, including the property market, interest rates, the wider economy, tenant behaviour, and the performance of each individual asset.",
      ],
    },
    {
      id: "projections",
      heading: "Targets are not guarantees",
      body: [
        "Any yield, projected return, or timeline shown for an opportunity is a target based on assumptions and information available at the time. Actual results may be materially different.",
        { list: [
          "Rental income may be lower than projected, or interrupted by void periods;",
          "Costs — maintenance, management, financing, tax — may be higher than expected;",
          "A property may take longer to sell, or sell for less, than anticipated; and",
          "Distributions may be reduced, delayed, or suspended.",
        ] },
        "Past performance — of a property, an SPV, or the platform — is not a reliable indicator of future performance.",
      ],
    },
    {
      id: "liquidity",
      heading: "Illiquidity & exit",
      body: [
        "These are illiquid investments. There is no public market for SPV units, and you should expect to hold your investment for the full term of the opportunity — often several years.",
        "While the platform may, at times, facilitate a secondary sale of units between investors, this is not guaranteed. You may be unable to sell when you want to, you may have to accept a lower price, or you may not be able to exit at all until the SPV's underlying property is sold.",
      ],
    },
    {
      id: "structure",
      heading: "Structural & operational risks",
      body: [
        { h3: "Concentration" },
        "Each SPV typically holds a single property or a small portfolio. This means limited diversification within any one investment — the outcome depends heavily on that specific asset.",
        { h3: "Leverage" },
        "Where an SPV uses borrowing (a mortgage or other finance), gains and losses are magnified. If income does not cover financing costs, lenders rank ahead of investors, which can reduce or eliminate the value of your units.",
        { h3: "Operational dependence" },
        "Returns depend on the proper management of each property and SPV. Errors, delays, counterparty failures, or insolvency of a service provider could affect performance.",
      ],
    },
    {
      id: "tax",
      heading: "Tax",
      body: [
        "The tax treatment of your investment depends on your individual circumstances and may change. Tax reliefs, where available, are not guaranteed and depend on the SPV and the investor maintaining their status.",
        "We do not provide tax advice. You should consult a qualified tax adviser before investing.",
      ],
    },
    {
      id: "protection",
      heading: "Regulatory protection & advice",
      body: [
        "Brick & Wealth operates an execution-only platform and does not provide personal recommendations or financial advice. We do not assess whether an investment is suitable for you.",
        { note: "These investments are not protected by the Financial Services Compensation Scheme (FSCS) in respect of investment losses. If an SPV or the underlying property performs poorly, you will not be compensated for the resulting loss." },
        "If you are unsure whether an investment is right for you, you should seek advice from an independent financial adviser authorised by the Financial Conduct Authority.",
      ],
    },
    {
      id: "acknowledgement",
      heading: "Your acknowledgement",
      body: [
        "By subscribing to an opportunity, you confirm that you have read and understood this Risk Warning, that you are prepared to bear the risks described, and that you are investing money you can afford to lose.",
        "You also confirm that your investor classification is accurate and that you have considered whether the investment is appropriate for your circumstances.",
      ],
    },
  ],
};

export default function RiskPage() {
  return <LegalShell doc={doc} />;
}
