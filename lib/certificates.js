// lib/certificates.js
//
// PHASE 5 MSG 4 — Share Certificate PDF generator.
//
// Reproduces the Bricks & Wealth share certificate template VERBATIM.
// A4 landscape (842 × 595 pt), Helvetica + Helvetica-Bold, single page.
//
// Built with @react-pdf/renderer (install: npm i @react-pdf/renderer).
//
// Usage (server-side only — Node runtime, not edge):
//   import { generateShareCertificatePdf } from "@/lib/certificates";
//   const buffer = await generateShareCertificatePdf({ ... });
//
// Returns a Node Buffer (PDF bytes). Upload it to UploadThing / storage
// and save the URL on Allocation.certificateUrl.
//
// 8 dynamic fields:
//   1. companyRegNumber       (env NEXT_PUBLIC_COMPANY_REG_NUMBER)
//   2. registeredOffice       (env COMPANY_REGISTERED_OFFICE)
//   3. certificateNumber      (Allocation.certificateNumber — BW-HC-NNNN)
//   4. shareholderName        (User.fullName)
//   5. shareholderAddress     (composed from User profile)
//   6. numberOfShares         (Allocation.unitsAllocated)
//   7. nominalValue           (Spv.nominalValue — typically £1.00)
//   8. dateOfIssue            (Allocation.confirmedAt → "DD Month YYYY")
//
// Static: payment status = "FULLY PAID" (proof verified before allocation).

import React from "react";
import {
  Document, Page, View, Text, StyleSheet, Font, pdf,
} from "@react-pdf/renderer";

// Brand colours
const NAVY = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const CREAM = "#F8F4EC";
const MUTED = "#6B7280";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 0,
    fontFamily: "Helvetica",
    color: INK,
  },
  // Outer decorative border
  outerBorder: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 2,
    borderColor: NAVY,
    borderStyle: "solid",
  },
  innerBorder: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 0.75,
    borderColor: GOLD,
    borderStyle: "solid",
  },
  content: {
    paddingTop: 44,
    paddingHorizontal: 56,
    paddingBottom: 40,
  },
  // Header
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  brand: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7,
    color: GOLD_DARK,
    letterSpacing: 2,
    marginTop: 2,
    textTransform: "uppercase",
  },
  certNumberBox: {
    alignItems: "flex-end",
  },
  certNumberLabel: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  certNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 2,
  },
  // Title
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    letterSpacing: 6,
    marginTop: 14,
    marginBottom: 4,
  },
  titleRule: {
    alignSelf: "center",
    width: 90,
    height: 1.5,
    backgroundColor: GOLD,
    marginBottom: 18,
  },
  // Company meta
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    width: 150,
  },
  metaValue: {
    fontSize: 8.5,
    color: INK,
    flex: 1,
  },
  // Body
  certifyLine: {
    fontSize: 9.5,
    color: INK,
    marginTop: 16,
    marginBottom: 8,
  },
  shareholderName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    marginVertical: 6,
  },
  shareholderAddress: {
    fontSize: 8.5,
    color: MUTED,
    textAlign: "center",
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  // Holdings highlight band
  holdingBand: {
    backgroundColor: CREAM,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
  },
  holdingText: {
    fontSize: 11,
    color: INK,
    lineHeight: 1.5,
  },
  // Footer
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
  },
  dateBlock: {},
  dateLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  signBlock: {
    alignItems: "center",
    width: 230,
  },
  signFor: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 26,
    textAlign: "center",
  },
  signLine: {
    width: 200,
    borderTopWidth: 0.75,
    borderTopColor: INK,
    paddingTop: 4,
  },
  signLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textAlign: "center",
  },
  // Seal
  seal: {
    position: "absolute",
    bottom: 70,
    left: 70,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  sealText: {
    fontSize: 6,
    color: GOLD_DARK,
    letterSpacing: 1,
    textAlign: "center",
  },
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatIssueDate(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function ShareCertificateDoc({
  companyRegNumber,
  registeredOffice,
  certificateNumber,
  shareholderName,
  shareholderAddress,
  numberOfShares,
  nominalValue,
  dateOfIssue,
}) {
  const sharesStr = Number(numberOfShares).toLocaleString("en-GB");
  const nominalStr = Number(nominalValue).toLocaleString("en-GB", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  return React.createElement(
    Document,
    { title: `Share Certificate ${certificateNumber}`, author: "Bricks & Wealth Holdings Ltd" },
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      React.createElement(View, { style: styles.outerBorder, fixed: true }),
      React.createElement(View, { style: styles.innerBorder, fixed: true }),

      React.createElement(
        View,
        { style: styles.content },

        // Header
        React.createElement(
          View,
          { style: styles.brandRow },
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.brand }, "BRICK & WEALTH"),
            React.createElement(Text, { style: styles.brandSub }, "Holdings · United Kingdom")
          ),
          React.createElement(
            View,
            { style: styles.certNumberBox },
            React.createElement(Text, { style: styles.certNumberLabel }, "Certificate No."),
            React.createElement(Text, { style: styles.certNumber }, certificateNumber)
          )
        ),

        // Title
        React.createElement(Text, { style: styles.title }, "SHARE CERTIFICATE"),
        React.createElement(View, { style: styles.titleRule }),

        // Company meta
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(Text, { style: styles.metaLabel }, "Company Name"),
          React.createElement(Text, { style: styles.metaValue }, "Bricks & Wealth Holdings Ltd")
        ),
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(Text, { style: styles.metaLabel }, "Company Registration Number"),
          React.createElement(Text, { style: styles.metaValue }, companyRegNumber || "—")
        ),
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(Text, { style: styles.metaLabel }, "Registered Office"),
          React.createElement(Text, { style: styles.metaValue }, registeredOffice || "—")
        ),

        // Certify
        React.createElement(Text, { style: styles.certifyLine }, "This is to certify that:"),
        React.createElement(Text, { style: styles.shareholderName }, shareholderName || "—"),
        React.createElement(
          Text,
          { style: styles.shareholderAddress },
          shareholderAddress ? `Address: ${shareholderAddress}` : ""
        ),

        // Holding band
        React.createElement(
          View,
          { style: styles.holdingBand },
          React.createElement(
            Text,
            { style: styles.holdingText },
            "is the registered holder of ",
            React.createElement(Text, { style: styles.bold }, `${sharesStr} Ordinary Shares of £${nominalStr} each`),
            ", which are ",
            React.createElement(Text, { style: styles.bold }, "FULLY PAID"),
            ", in Bricks & Wealth Holdings Ltd."
          )
        ),

        // Legal text
        React.createElement(
          Text,
          { style: styles.bodyText },
          "The shares rank pari passu with all other Ordinary Shares in the Company and are subject to the Articles of Association and any Shareholders' Agreement."
        ),
        React.createElement(
          Text,
          { style: styles.bodyText },
          "This certificate constitutes prima facie evidence of title to the shares pursuant to the Companies Act 2006."
        ),

        // Footer
        React.createElement(
          View,
          { style: styles.footerRow },
          React.createElement(
            View,
            { style: styles.dateBlock },
            React.createElement(Text, { style: styles.dateLabel }, "Date of Issue"),
            React.createElement(Text, { style: styles.dateValue }, formatIssueDate(dateOfIssue))
          ),
          React.createElement(
            View,
            { style: styles.signBlock },
            React.createElement(Text, { style: styles.signFor }, "For and on behalf of Bricks & Wealth Holdings Ltd"),
            React.createElement(
              View,
              { style: styles.signLine },
              React.createElement(Text, { style: styles.signLabel }, "Director")
            )
          )
        )
      ),

      // Decorative seal
      React.createElement(
        View,
        { style: styles.seal, fixed: true },
        React.createElement(Text, { style: styles.sealText }, "B&W\nSEAL")
      )
    )
  );
}

// ════════════════════════════════════════════════════════════════════
// PUBLIC: generate the PDF as a Node Buffer
// ════════════════════════════════════════════════════════════════════

export async function generateShareCertificatePdf(fields) {
  const doc = React.createElement(ShareCertificateDoc, fields);
  const instance = pdf(doc);
  const buffer = await instance.toBuffer();

  // toBuffer() may return a stream in some versions — normalise to Buffer
  if (Buffer.isBuffer(buffer)) return buffer;
  if (buffer && typeof buffer.on === "function") {
    return await streamToBuffer(buffer);
  }
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

// ════════════════════════════════════════════════════════════════════
// HELPER: compose certificate fields from an allocation context
//
// Pass the hydrated allocation + user + spv. Pulls env vars for the
// company registration number + registered office.
// ════════════════════════════════════════════════════════════════════

export function buildCertificateFields({ allocation, user, spv }) {
  const address = [
    user.addressLine1, user.addressLine2, user.city,
    user.region, user.postcode, user.country,
  ].filter(Boolean).join(", ");

  return {
    companyRegNumber: process.env.NEXT_PUBLIC_COMPANY_REG_NUMBER || "14582930",
    registeredOffice: process.env.COMPANY_REGISTERED_OFFICE || "",
    certificateNumber: allocation.certificateNumber,
    shareholderName: user.fullName,
    shareholderAddress: address,
    numberOfShares: allocation.unitsAllocated,
    nominalValue: spv?.nominalValue ? parseFloat(spv.nominalValue.toString()) : 1.0,
    dateOfIssue: allocation.confirmedAt || new Date(),
  };
}