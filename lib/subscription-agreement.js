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
    { title: `Subscription Agreement ${agreementRef}`, author: "Bricks & Wealth Holdings Ltd" },
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

      React.createElement(Text, { style: styles.title }, "Subscription Agreement"),
      React.createElement(
        Text, { style: styles.subtitle },
        "A record of your subscription for shares in a Bricks & Wealth special purpose vehicle."
      ),

      // Parties
      React.createElement(Text, { style: styles.sectionTitle }, "Parties"),
      Row("Investor", investorName),
      Row("Investor address", investorAddress),
      Row("Investor email", investorEmail),
      Row("Issuer", "Bricks & Wealth Holdings Ltd"),
      Row("Special purpose vehicle", spvName),
      Row("SPV company number", companyNumber),

      // Subscription
      React.createElement(Text, { style: styles.sectionTitle }, "Subscription"),
      Row("Opportunity", opportunityTitle),
      Row("Number of units / shares", unitsStr),
      Row("Price per unit", priceStr),
      Row("Total subscription amount", totalStr),
      Row("Payment method", "Bank transfer"),
      Row("Payment status", "Received & verified"),

      // Key terms
      React.createElement(Text, { style: styles.sectionTitle }, "Key Terms"),
      Bullet("Your shares rank pari passu with all other Ordinary Shares in the relevant SPV and are subject to its Articles of Association and any Shareholders' Agreement."),
      Bullet("Your investment is in shares of the SPV, which holds the underlying property. You do not own the property directly."),
      Bullet("Property investments are illiquid. There is no public market for these shares and you may not be able to sell them readily."),
      Bullet("Returns are not guaranteed. The value of your investment can fall as well as rise, and you may get back less than you invested."),
      Bullet("A share certificate is issued upon allocation of your units as evidence of title pursuant to the Companies Act 2006."),

      // Acknowledgements
      React.createElement(Text, { style: styles.sectionTitle }, "Your Acknowledgements"),
      React.createElement(
        View, { style: styles.ackBox },
        Ack(`Self-certification confirmed${selfCertifiedAt ? ` on ${fmtDate(selfCertifiedAt)}` : ""}: you confirmed your eligibility to invest and that your profile information is accurate.`),
        Ack(`Risk acknowledged${riskAcknowledgedAt ? ` on ${fmtDate(riskAcknowledgedAt)}` : ""}: you understand your capital is at risk, returns are not guaranteed, and the investment is illiquid.`)
      ),

      React.createElement(
        Text, { style: [styles.para, { marginTop: 10 }] },
        "This document is a record of your subscription and does not constitute financial, legal, or tax advice. Bricks & Wealth Holdings Ltd does not provide investment advice. If you are unsure whether this investment is suitable for you, seek independent professional advice."
      ),

      // Footer
      React.createElement(
        Text, { style: styles.footer, fixed: true },
        "Bricks & Wealth Holdings Ltd · Companies House No. 14582930\nThis is an electronically generated record. Capital is at risk. Property values can fall as well as rise."
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