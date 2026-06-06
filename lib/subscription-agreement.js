// lib/subscription-agreement.js
//
// PHASE 5 MSG 4 — Subscription Agreement PDF.
//
// A plain-language record of the investor's subscription terms, generated
// when a subscription is fully allocated (or on demand). A4 portrait,
// Helvetica. Not legal advice — a record document for the investor.
//
// Usage:
//   import { generateSubscriptionAgreementPdf } from "@/lib/subscription-agreement";
//   const buffer = await generateSubscriptionAgreementPdf({ ... });

import React from "react";
import {
  Document, Page, View, Text, StyleSheet, pdf,
} from "@react-pdf/renderer";

const NAVY = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const MUTED = "#6B7280";
const LINE = "#E4E4E7";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    color: INK,
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 10,
    marginBottom: 14,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 6.5,
    color: GOLD_DARK,
    letterSpacing: 2,
    marginTop: 2,
    textTransform: "uppercase",
  },
  docMeta: {
    alignItems: "flex-end",
  },
  docMetaLabel: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  docMetaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginTop: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 11,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  rowLabel: {
    width: 180,
    color: MUTED,
    fontSize: 9,
  },
  rowValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  para: {
    fontSize: 9,
    color: INK,
    marginBottom: 7,
    lineHeight: 1.55,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletDot: {
    width: 12,
    fontSize: 9,
    color: GOLD_DARK,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: INK,
    lineHeight: 1.45,
  },
  ackBox: {
    backgroundColor: "#FBF8F1",
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    padding: 10,
    marginTop: 6,
  },
  ackItem: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  tick: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F6E56",
    width: 14,
  },
  ackText: {
    flex: 1,
    fontSize: 8.5,
    color: INK,
    lineHeight: 1.45,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 8,
    fontSize: 7,
    color: MUTED,
    textAlign: "center",
    lineHeight: 1.4,
  },
  recital: {
    flexDirection: "row",
    marginBottom: 4,
  },
  recitalLabel: {
    width: 20,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GOLD_DARK,
  },
  recitalText: {
    flex: 1,
    fontSize: 9,
    color: INK,
    lineHeight: 1.5,
  },
  execRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  execBlock: {
    width: 215,
  },
  execFor: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 30,
  },
  execLine: {
    borderTopWidth: 0.75,
    borderTopColor: INK,
    paddingTop: 4,
  },
  execName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  execLabel: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 1,
  },
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function fmtDate(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Row(label, value) {
  return React.createElement(
    View, { style: styles.row },
    React.createElement(Text, { style: styles.rowLabel }, label),
    React.createElement(Text, { style: styles.rowValue }, value || "—")
  );
}

function Bullet(text) {
  return React.createElement(
    View, { style: styles.bullet },
    React.createElement(Text, { style: styles.bulletDot }, "•"),
    React.createElement(Text, { style: styles.bulletText }, text)
  );
}

function Ack(text) {
  return React.createElement(
    View, { style: styles.ackItem },
    React.createElement(Text, { style: styles.tick }, "✓"),
    React.createElement(Text, { style: styles.ackText }, text)
  );
}

function Recital(letter, text) {
  return React.createElement(
    View, { style: styles.recital },
    React.createElement(Text, { style: styles.recitalLabel }, `(${letter})`),
    React.createElement(Text, { style: styles.recitalText }, text)
  );
}

function Clause(heading) {
  return React.createElement(Text, { style: styles.sectionTitle }, heading);
}

function Para(text) {
  return React.createElement(Text, { style: styles.para }, text);
}

function AgreementDoc({
  agreementRef, dateOfIssue, investorName, investorAddress, investorEmail,
  opportunityTitle, spvName, companyNumber, units, unitPrice, totalAmount,
  currencySymbol, selfCertifiedAt, riskAcknowledgedAt,
}) {
  const unitsStr = Number(units).toLocaleString("en-GB");
  const priceStr = `${currencySymbol}${Number(unitPrice).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
  const totalStr = `${currencySymbol}${Number(totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

  return React.createElement(
    Document,
    { title: `Subscription Agreement ${agreementRef}`, author: "Brick & Wealth Holdings Ltd" },
    React.createElement(
      Page, { size: "A4", style: styles.page },

      // Header
      React.createElement(
        View, { style: styles.header },
        React.createElement(
          View, null,
          React.createElement(Text, { style: styles.brand }, "BRICK & WEALTH"),
          React.createElement(Text, { style: styles.brandSub }, "Holdings · United Kingdom")
        ),
        React.createElement(
          View, { style: styles.docMeta },
          React.createElement(Text, { style: styles.docMetaLabel }, "Reference"),
          React.createElement(Text, { style: styles.docMetaValue }, agreementRef),
          React.createElement(Text, { style: [styles.docMetaLabel, { marginTop: 6 }] }, "Date"),
          React.createElement(Text, { style: styles.docMetaValue }, fmtDate(dateOfIssue))
        )
      ),

      React.createElement(Text, { style: styles.title }, "Share Subscription Agreement"),
      React.createElement(
        Text, { style: styles.subtitle },
        "Recording the terms on which the Investor subscribes for shares in connection with a Brick & Wealth special purpose vehicle."
      ),

      // Date + Parties
      Para(`This Agreement is made on ${fmtDate(dateOfIssue)} BETWEEN:`),
      React.createElement(
        View, { style: styles.recital },
        React.createElement(Text, { style: styles.recitalLabel }, "(1)"),
        React.createElement(
          Text, { style: styles.recitalText },
          React.createElement(Text, { style: styles.bold }, "Brick & Wealth Holdings Ltd"),
          ", a company incorporated in England & Wales with registered number 14582930, whose registered office is at London EC2M, United Kingdom (the \"Company\"); and"
        )
      ),
      React.createElement(
        View, { style: styles.recital },
        React.createElement(Text, { style: styles.recitalLabel }, "(2)"),
        React.createElement(
          Text, { style: styles.recitalText },
          React.createElement(Text, { style: styles.bold }, investorName || "The Investor"),
          investorAddress ? ` of ${investorAddress}` : "",
          " (the \"Investor\")."
        )
      ),

      // Background / recitals
      Clause("Background"),
      Recital("A", `The Company arranges co-investment in UK property through ring-fenced special purpose vehicles (each an "SPV"). This subscription relates to ${spvName}${opportunityTitle && opportunityTitle !== "—" ? ` (the "${opportunityTitle}" opportunity)` : ""}.`),
      Recital("B", "The Investor wishes to subscribe for the shares described in the Schedule, and the Company is willing to procure the allotment and issue of those shares to the Investor, on the terms of this Agreement."),
      Recital("C", "The Investor has been given access to the relevant offering materials and to the Company's Risk Warning, Terms of Service and Privacy Policy."),

      // Operative clauses
      Clause("1.  Subscription"),
      Para("1.1  The Investor agrees to subscribe for the number of Ordinary Shares set out in the Schedule (the \"Shares\") at the price per share stated in the Schedule, for the total subscription amount stated in the Schedule (the \"Subscription Amount\")."),
      Para("1.2  The Shares rank pari passu with all other Ordinary Shares of the same class and are subject to the Articles of Association of the relevant company and to any Shareholders' Agreement in force from time to time."),

      Clause("2.  Completion"),
      Para("2.1  Completion of this subscription is conditional upon the Company's receipt and verification of the Subscription Amount in cleared funds and the satisfactory completion of the Investor's identity (KYC) and anti-money-laundering checks."),
      Para("2.2  On completion, the Company shall procure that the Shares are allotted and issued to the Investor, that the Investor is entered in the register of members, and that a share certificate is issued as evidence of title pursuant to the Companies Act 2006."),

      Clause("3.  Investor's Representations and Warranties"),
      Para("The Investor represents, warrants and undertakes to the Company that:"),
      Bullet("the Investor has the legal capacity and authority to enter into and perform this Agreement;"),
      Bullet("all information provided by the Investor, including for identity and anti-money-laundering purposes, is true, accurate and not misleading;"),
      Bullet("the Subscription Amount derives from legitimate sources and does not represent the proceeds of any unlawful activity;"),
      Bullet("the Investor has had the opportunity to obtain independent professional advice and is not relying on the Company for investment, legal or tax advice; and"),
      Bullet("the Investor's investor classification, as confirmed during onboarding, is accurate and complete."),

      Clause("4.  Acknowledgement of Risk"),
      Para("The Investor acknowledges and accepts that:"),
      Bullet("the value of the investment may fall as well as rise and the Investor may receive back less than the Subscription Amount, including the loss of the entire amount invested;"),
      Bullet("any yields, projected returns and timelines are targets only and are not guaranteed, and past performance is not a reliable indicator of future results;"),
      Bullet("the Shares are illiquid, there is no public market for them, and the Investor may be unable to realise the investment when desired; and"),
      Bullet("these investments are not covered by the Financial Services Compensation Scheme in respect of investment losses."),

      Clause("5.  Data Protection"),
      Para("The Company processes the Investor's personal data in accordance with the UK GDPR and the Data Protection Act 2018, as described in the Company's Privacy Policy and KYC Data Processing Notice."),

      Clause("6.  General"),
      Para("6.1  Entire agreement. This Agreement, together with the documents referred to in it, constitutes the entire agreement between the parties relating to its subject matter and supersedes any prior arrangement."),
      Para("6.2  Execution-only; no advice. The Company acts on an execution-only basis and gives no personal recommendation or financial advice in relation to this subscription."),
      Para("6.3  Governing law and jurisdiction. This Agreement, and any dispute or claim arising out of or in connection with it, is governed by and construed in accordance with the laws of England and Wales, and the parties submit to the exclusive jurisdiction of the courts of England and Wales."),
      Para("6.4  Electronic execution. This Agreement may be accepted and executed electronically, and such acceptance has the same legal effect as a manuscript signature."),

      // Schedule
      Clause("Schedule — Subscription Particulars"),
      Row("Investor", investorName),
      Row("Investor address", investorAddress),
      Row("Investor email", investorEmail),
      Row("Opportunity", opportunityTitle),
      Row("Special purpose vehicle (SPV)", spvName),
      Row("SPV company number", companyNumber),
      Row("Number of Ordinary Shares", unitsStr),
      Row("Price per share", priceStr),
      Row("Total subscription amount", totalStr),
      Row("Payment method", "Bank transfer"),
      Row("Payment status", "Received & verified"),

      // Electronic acknowledgements
      Clause("Investor's Electronic Acknowledgements"),
      React.createElement(
        View, { style: styles.ackBox },
        Ack(`Self-certification confirmed${selfCertifiedAt ? ` on ${fmtDate(selfCertifiedAt)}` : ""}: the Investor confirmed eligibility to invest and the accuracy of the information provided.`),
        Ack(`Risk acknowledged${riskAcknowledgedAt ? ` on ${fmtDate(riskAcknowledgedAt)}` : ""}: the Investor confirmed understanding that capital is at risk, returns are not guaranteed and the investment is illiquid.`)
      ),

      // Execution
      Clause("Execution"),
      React.createElement(
        View, { style: styles.execRow },
        React.createElement(
          View, { style: styles.execBlock },
          React.createElement(Text, { style: styles.execFor }, "Signed for and on behalf of"),
          React.createElement(
            View, { style: styles.execLine },
            React.createElement(Text, { style: styles.execName }, "Brick & Wealth Holdings Ltd"),
            React.createElement(Text, { style: styles.execLabel }, "Director, duly authorised")
          )
        ),
        React.createElement(
          View, { style: styles.execBlock },
          React.createElement(Text, { style: styles.execFor }, "Accepted electronically by"),
          React.createElement(
            View, { style: styles.execLine },
            React.createElement(Text, { style: styles.execName }, investorName || "The Investor"),
            React.createElement(Text, { style: styles.execLabel }, `Investor · ${fmtDate(dateOfIssue)}`)
          )
        )
      ),

      React.createElement(
        Text, { style: [styles.para, { marginTop: 8, fontSize: 7.5, color: MUTED }] },
        "This Agreement is a record of the Investor's subscription and does not constitute financial, legal or tax advice. If the Investor is unsure whether this investment is suitable, the Investor should seek independent professional advice."
      ),

      // Footer
      React.createElement(
        Text, { style: styles.footer, fixed: true },
        "Brick & Wealth Holdings Ltd · Registered in England & Wales No. 14582930 · Registered office: London EC2M, United Kingdom\nElectronically generated record. Capital is at risk. Property values can fall as well as rise."
      )
    )
  );
}

export async function generateSubscriptionAgreementPdf(fields) {
  const doc = React.createElement(AgreementDoc, fields);
  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  if (Buffer.isBuffer(buffer)) return buffer;
  if (buffer && typeof buffer.on === "function") return await streamToBuffer(buffer);
  return buffer;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export function buildAgreementFields({ subscription, user, spv, opportunity }) {
  const address = [
    user.addressLine1, user.addressLine2, user.city,
    user.region, user.postcode, user.country,
  ].filter(Boolean).join(", ");
  const currencySymbol = subscription.currency === "USD" ? "$"
    : subscription.currency === "EUR" ? "€" : "£";

  return {
    agreementRef: `BW-SA-${subscription.id.slice(-8).toUpperCase()}`,
    dateOfIssue: new Date(),
    investorName: user.fullName,
    investorAddress: address,
    investorEmail: user.email,
    opportunityTitle: opportunity?.title || "—",
    spvName: spv?.spvName || "—",
    companyNumber: spv?.companyNumber || "—",
    units: subscription.unitsRequested,
    unitPrice: parseFloat(subscription.unitPriceAtSub?.toString() || "0"),
    totalAmount: parseFloat(subscription.totalAmount?.toString() || "0"),
    currencySymbol,
    selfCertifiedAt: user.selfCertifiedAt,
    riskAcknowledgedAt: user.riskAcknowledgedAt,
  };
}