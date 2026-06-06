// lib/tax-statement.js
//
// PHASE 8 MSG 3 — Annual Statement of Activity PDF generator.
//
// A formal A4 portrait record of an investor's activity in a chosen tax
// year. NOT tax advice — a summary of what happened, designed so the
// investor (or their accountant) can transcribe figures onto their Self
// Assessment.
//
// Sections:
//   1. Brand header + statement reference
//   2. Investor block + period block (tax year + system)
//   3. Summary box (gross dividends, withholding, net, disposals, holdings)
//   4. Dividend allocations table
//   5. Title transfers table (acquisitions + disposals)
//   6. Subscriptions table
//   7. Year-end holdings table
//   8. Disclaimer footer
//
// Usage (server-side, Node runtime, NOT edge):
//   import { generateAnnualStatementPdf, buildStatementFields } from "@/lib/tax-statement";
//   const fields = buildStatementFields({ statement });   // statement = buildInvestorTaxStatement(...)
//   const buffer = await generateAnnualStatementPdf(fields);

import React from "react";
import {
  Document, Page, View, Text, StyleSheet, pdf,
} from "@react-pdf/renderer";

// ─── Brand palette ──────────────────────────────────────────────────
const NAVY = "#0A1F44";
const GOLD = "#C9A24A";
const GOLD_DARK = "#9A7A2E";
const INK = "#0B1220";
const MUTED = "#6B7280";
const LINE = "#E4E4E7";
const CREAM = "#FBF8F1";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 42,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    color: INK,
    fontSize: 9.5,
    lineHeight: 1.5,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 10,
    marginBottom: 14,
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 1 },
  brandSub: { fontSize: 7.5, color: GOLD_DARK, letterSpacing: 1.5, marginTop: 2 },
  headerRight: { fontSize: 8, color: MUTED, textAlign: "right" },
  headerRightStrong: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 1 },

  // ── Title ──
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 4,
  },
  titleAccent: { color: GOLD_DARK },
  subtitle: { fontSize: 9.5, color: MUTED, marginBottom: 18 },

  // ── Section ──
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 14,
  },

  // ── Two-column blocks (investor / period) ──
  blockRow: { flexDirection: "row", marginBottom: 14, gap: 16 },
  block: {
    flex: 1,
    backgroundColor: CREAM,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
  },
  blockLabel: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  blockValue: { fontSize: 10, color: INK, fontFamily: "Helvetica-Bold" },
  blockValueLine: { fontSize: 9, color: INK, marginTop: 2 },

  // ── Summary box ──
  summary: {
    borderWidth: 1,
    borderColor: NAVY,
    padding: 12,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryRowBordered: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: NAVY,
  },
  summaryLabel: { fontSize: 9, color: INK },
  summaryValue: { fontSize: 9.5, color: INK, fontFamily: "Helvetica-Bold" },
  summaryTotalLabel: { fontSize: 10, color: NAVY, fontFamily: "Helvetica-Bold" },
  summaryTotalValue: { fontSize: 11, color: NAVY, fontFamily: "Helvetica-Bold" },

  // ── Tables ──
  table: { borderWidth: 0.5, borderColor: LINE, marginBottom: 8 },
  tHead: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 7.5,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  tRowAlt: { backgroundColor: "#FAFAFA" },
  td: { fontSize: 8.5, color: INK },
  tdMuted: { fontSize: 8.5, color: MUTED },
  tdBold: { fontSize: 8.5, color: INK, fontFamily: "Helvetica-Bold" },
  tdRight: { textAlign: "right" },

  empty: {
    fontSize: 8.5,
    color: MUTED,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 14,
  },

  // ── Disclaimer ──
  disclaimer: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.55,
  },
  disclaimerStrong: { fontFamily: "Helvetica-Bold", color: INK },

  // ── Footer (each page) ──
  pageFooter: {
    position: "absolute",
    bottom: 22,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 6,
  },
});

// ─── Helpers ────────────────────────────────────────────────────────
function fmtMoney(n, cs) {
  const num = Number(n || 0);
  return `${cs}${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtNumber(n) {
  return Number(n || 0).toLocaleString("en-GB");
}
function trunc(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ─── Header (top of page 1) ─────────────────────────────────────────
function Header({ statementRef, generatedAt }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>BRICK &amp; WEALTH</Text>
        <Text style={styles.brandSub}>HOLDINGS · UK PROPERTY</Text>
      </View>
      <View>
        <Text style={styles.headerRightStrong}>Ref. {statementRef}</Text>
        <Text style={styles.headerRight}>Generated {fmtDate(generatedAt)}</Text>
        <Text style={styles.headerRight}>Companies House No. 14582930</Text>
      </View>
    </View>
  );
}

// ─── Investor + period blocks ───────────────────────────────────────
function InvestorPeriodBlocks({ investor, address, taxYear, system, period }) {
  const systemLabel = system === "UK_SA" ? "UK Self Assessment" : "Calendar year";
  return (
    <View style={styles.blockRow}>
      <View style={styles.block}>
        <Text style={styles.blockLabel}>Investor</Text>
        <Text style={styles.blockValue}>{investor.fullName}</Text>
        {address ? <Text style={styles.blockValueLine}>{address}</Text> : null}
        <Text style={styles.blockValueLine}>{investor.email}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.blockLabel}>Reporting Period</Text>
        <Text style={styles.blockValue}>{systemLabel} {taxYear}</Text>
        <Text style={styles.blockValueLine}>
          {fmtDate(period.from)} — {fmtDate(new Date(new Date(period.to).getTime() - 86400000))}
        </Text>
      </View>
    </View>
  );
}

// ─── Summary box ────────────────────────────────────────────────────
function Summary({ summary, cs }) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryRowBordered}>
        <Text style={styles.summaryLabel}>Gross dividends received</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.dividendGross, cs)}</Text>
      </View>
      <View style={styles.summaryRowBordered}>
        <Text style={styles.summaryLabel}>Less: tax withheld</Text>
        <Text style={styles.summaryValue}>{summary.dividendWithholding > 0 ? `(${fmtMoney(summary.dividendWithholding, cs)})` : fmtMoney(0, cs)}</Text>
      </View>
      <View style={styles.summaryRowTotal}>
        <Text style={styles.summaryTotalLabel}>Net dividend income</Text>
        <Text style={styles.summaryTotalValue}>{fmtMoney(summary.dividendNet, cs)}</Text>
      </View>
      <View style={[styles.summaryRow, { marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: LINE }]}>
        <Text style={styles.summaryLabel}>Subscriptions committed in period</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.subscriptionsCommitted, cs)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Disposals (units sold) in period</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.disposalsTotal, cs)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Holdings cost basis at year end</Text>
        <Text style={styles.summaryValue}>{fmtMoney(summary.holdingsValue, cs)}  ·  {fmtNumber(summary.holdingsUnits)} unit{summary.holdingsUnits === 1 ? "" : "s"}</Text>
      </View>
    </View>
  );
}

// ─── Tables ─────────────────────────────────────────────────────────
function DividendsTable({ dividends, cs }) {
  return (
    <View style={styles.table}>
      <View style={styles.tHead}>
        <Text style={[styles.th, { width: "16%" }]}>Payment Date</Text>
        <Text style={[styles.th, { width: "30%" }]}>SPV / Property</Text>
        <Text style={[styles.th, { width: "22%" }]}>Distribution</Text>
        <Text style={[styles.th, { width: "10%", textAlign: "right" }]}>Units</Text>
        <Text style={[styles.th, { width: "11%", textAlign: "right" }]}>Gross</Text>
        <Text style={[styles.th, { width: "11%", textAlign: "right" }]}>Net</Text>
      </View>
      {dividends.length === 0 ? (
        <Text style={styles.empty}>No dividend income in this period.</Text>
      ) : dividends.map((d, i) => (
        <View key={d.id} style={[styles.tRow, i % 2 ? styles.tRowAlt : {}]}>
          <Text style={[styles.td, { width: "16%" }]}>{fmtDate(d.paymentDate)}</Text>
          <Text style={[styles.td, { width: "30%" }]}>{trunc(d.spv?.spvName || "—", 32)}</Text>
          <Text style={[styles.tdMuted, { width: "22%" }]}>{trunc(d.label, 26)}</Text>
          <Text style={[styles.td, { width: "10%", textAlign: "right" }]}>{fmtNumber(d.unitsHeld)}</Text>
          <Text style={[styles.td, { width: "11%", textAlign: "right" }]}>{fmtMoney(d.grossAmount, cs)}</Text>
          <Text style={[styles.tdBold, { width: "11%", textAlign: "right" }]}>{fmtMoney(d.netAmount, cs)}</Text>
        </View>
      ))}
    </View>
  );
}

function TransfersTable({ transfers, cs }) {
  return (
    <View style={styles.table}>
      <View style={styles.tHead}>
        <Text style={[styles.th, { width: "16%" }]}>Date</Text>
        <Text style={[styles.th, { width: "10%" }]}>Direction</Text>
        <Text style={[styles.th, { width: "34%" }]}>SPV / Property</Text>
        <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Units</Text>
        <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Unit Price</Text>
        <Text style={[styles.th, { width: "16%", textAlign: "right" }]}>Amount</Text>
      </View>
      {transfers.length === 0 ? (
        <Text style={styles.empty}>No transfers in this period.</Text>
      ) : transfers.map((t, i) => (
        <View key={t.id} style={[styles.tRow, i % 2 ? styles.tRowAlt : {}]}>
          <Text style={[styles.td, { width: "16%" }]}>{fmtDate(t.date)}</Text>
          <Text style={[styles.tdBold, { width: "10%", color: t.direction === "out" ? "#9B2C2C" : "#0F6E56" }]}>
            {t.direction === "out" ? "Disposal" : "Acquired"}
          </Text>
          <Text style={[styles.td, { width: "34%" }]}>{trunc(t.spv?.spvName || "—", 38)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{fmtNumber(t.units)}</Text>
          <Text style={[styles.tdMuted, { width: "12%", textAlign: "right" }]}>{fmtMoney(t.unitPrice, cs)}</Text>
          <Text style={[styles.tdBold, { width: "16%", textAlign: "right" }]}>{fmtMoney(t.amount, cs)}</Text>
        </View>
      ))}
    </View>
  );
}

function SubscriptionsTable({ subscriptions, cs }) {
  return (
    <View style={styles.table}>
      <View style={styles.tHead}>
        <Text style={[styles.th, { width: "14%" }]}>Submitted</Text>
        <Text style={[styles.th, { width: "40%" }]}>Opportunity</Text>
        <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Units</Text>
        <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Unit Price</Text>
        <Text style={[styles.th, { width: "20%", textAlign: "right" }]}>Total</Text>
      </View>
      {subscriptions.length === 0 ? (
        <Text style={styles.empty}>No subscriptions in this period.</Text>
      ) : subscriptions.map((s, i) => (
        <View key={s.id} style={[styles.tRow, i % 2 ? styles.tRowAlt : {}]}>
          <Text style={[styles.td, { width: "14%" }]}>{fmtDate(s.submittedAt)}</Text>
          <Text style={[styles.td, { width: "40%" }]}>{trunc(s.opportunity?.title || "—", 44)}</Text>
          <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{fmtNumber(s.units)}</Text>
          <Text style={[styles.tdMuted, { width: "14%", textAlign: "right" }]}>{fmtMoney(s.unitPrice, cs)}</Text>
          <Text style={[styles.tdBold, { width: "20%", textAlign: "right" }]}>{fmtMoney(s.totalAmount, cs)}</Text>
        </View>
      ))}
    </View>
  );
}

function HoldingsTable({ holdings, cs }) {
  return (
    <View style={styles.table}>
      <View style={styles.tHead}>
        <Text style={[styles.th, { width: "40%" }]}>SPV / Property</Text>
        <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Units</Text>
        <Text style={[styles.th, { width: "14%", textAlign: "right" }]}>Ownership %</Text>
        <Text style={[styles.th, { width: "16%", textAlign: "right" }]}>Cost Basis</Text>
        <Text style={[styles.th, { width: "16%", textAlign: "right" }]}>Held Since</Text>
      </View>
      {holdings.length === 0 ? (
        <Text style={styles.empty}>No active holdings at the end of this period.</Text>
      ) : holdings.map((h, i) => (
        <View key={`${h.spv?.id || i}`} style={[styles.tRow, i % 2 ? styles.tRowAlt : {}]}>
          <Text style={[styles.td, { width: "40%" }]}>{trunc(h.spv?.spvName || "—", 44)}</Text>
          <Text style={[styles.tdBold, { width: "14%", textAlign: "right" }]}>{fmtNumber(h.units)}</Text>
          <Text style={[styles.td, { width: "14%", textAlign: "right" }]}>{(Number(h.ownershipPct) || 0).toFixed(2)}%</Text>
          <Text style={[styles.tdBold, { width: "16%", textAlign: "right" }]}>{fmtMoney(h.invested, cs)}</Text>
          <Text style={[styles.tdMuted, { width: "16%", textAlign: "right" }]}>{fmtDate(h.firstInvestedAt)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Disclaimer ─────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <View style={styles.disclaimer}>
      <Text>
        <Text style={styles.disclaimerStrong}>This statement is a summary of activity, not tax advice.</Text>
        {" "}It records dividends, subscriptions, transfers and holdings for the period shown and is provided for reference only. Brick &amp; Wealth Holdings Ltd is not a tax adviser or accountant. Investors are responsible for the correct reporting of their own tax affairs and should consult a qualified professional if in any doubt.
        {" "}Capital is at risk and past performance is not a reliable indicator of future results.
      </Text>
    </View>
  );
}

// ─── Document ───────────────────────────────────────────────────────
function StatementDoc(props) {
  const {
    statementRef, generatedAt, investor, address,
    taxYear, system, period, summary,
    dividends, transfers, subscriptions, holdings,
    cs,
  } = props;

  return (
    <Document title={`Annual Statement ${taxYear} — ${investor.fullName}`} author="Brick & Wealth Holdings Ltd">
      <Page size="A4" style={styles.page}>
        <Header statementRef={statementRef} generatedAt={generatedAt} />

        <Text style={styles.title}>Annual Statement <Text style={styles.titleAccent}>of Activity</Text></Text>
        <Text style={styles.subtitle}>{system === "UK_SA" ? "UK Self Assessment" : "Calendar"} year {taxYear}</Text>

        <InvestorPeriodBlocks
          investor={investor} address={address}
          taxYear={taxYear} system={system} period={period}
        />

        <Text style={styles.sectionTitle}>Summary</Text>
        <Summary summary={summary} cs={cs} />

        <Text style={styles.sectionTitle}>Dividend Income</Text>
        <DividendsTable dividends={dividends} cs={cs} />

        <Text style={styles.sectionTitle}>Transfers</Text>
        <TransfersTable transfers={transfers} cs={cs} />

        <Text style={styles.sectionTitle}>Subscriptions</Text>
        <SubscriptionsTable subscriptions={subscriptions} cs={cs} />

        <Text style={styles.sectionTitle}>Holdings at Year End</Text>
        <HoldingsTable holdings={holdings} cs={cs} />

        <Disclaimer />

        <View style={styles.pageFooter} fixed>
          <Text>Brick &amp; Wealth Holdings Ltd · No. 14582930</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─── Stream → Buffer fallback (some envs return a stream) ───────────
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// ─── Public API ─────────────────────────────────────────────────────
export async function generateAnnualStatementPdf(fields) {
  const doc = React.createElement(StatementDoc, fields);
  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  if (Buffer.isBuffer(buffer)) return buffer;
  if (buffer && typeof buffer.on === "function") return await streamToBuffer(buffer);
  return buffer;
}

// Turn the buildInvestorTaxStatement payload into PDF-ready fields.
export function buildStatementFields({ statement }) {
  const s = statement;
  const cs = s.summary?.currency === "USD" ? "$" : s.summary?.currency === "EUR" ? "€" : "£";
  const address = [
    s.investor.addressLine1, s.investor.addressLine2, s.investor.city,
    s.investor.region, s.investor.postcode, s.investor.country,
  ].filter(Boolean).join(", ");

  // Reference: BW-AS-YEAR-USERID4
  const yearRef = String(s.taxYear).replace(/[^0-9A-Z/]/g, "");
  const userTag = s.investor.id.slice(-4).toUpperCase();
  const statementRef = `BW-AS-${yearRef}-${userTag}`;

  return {
    statementRef,
    generatedAt: s.generatedAt,
    investor: s.investor,
    address,
    taxYear: s.taxYear,
    system: s.system,
    period: s.period,
    summary: s.summary,
    dividends: s.dividends || [],
    transfers: s.transfers || [],
    subscriptions: s.subscriptions || [],
    holdings: s.holdings || [],
    cs,
  };
}