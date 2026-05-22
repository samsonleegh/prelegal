import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import {
  buildCoverPageRows,
  parseSpans,
  PARTY_SIGNATURE_FIELDS,
  resolvePartyField,
} from "@/lib/format";
import { coverPageBlurb, licenseNotice, standardTerms } from "@/lib/template";
import type { MndaInput, PartyInfo } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#111827",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    marginBottom: 8,
  },
  intro: {
    marginBottom: 18,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginTop: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginVertical: 4,
  },
  rowLabel: {
    width: 130,
    paddingRight: 8,
    fontFamily: "Times-Bold",
  },
  rowHelper: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: "#64748b",
  },
  rowValue: {
    flex: 1,
  },
  signatureGrid: {
    flexDirection: "row",
    marginTop: 14,
    gap: 16,
  },
  signatureCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
    padding: 10,
  },
  partyTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#475569",
  },
  partyRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  partyLabel: {
    width: 75,
    color: "#475569",
  },
  partyValue: {
    flex: 1,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    marginTop: 24,
    marginBottom: 8,
  },
  clause: {
    marginBottom: 8,
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  refSpan: {
    fontFamily: "Times-Italic",
  },
  license: {
    marginTop: 18,
    fontSize: 9,
    fontFamily: "Times-Italic",
    color: "#64748b",
  },
});

export function MndaPdfDocument({ input }: { input: MndaInput }) {
  const rows = buildCoverPageRows(input);

  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="Prelegal"
      creator="Prelegal"
      producer="Prelegal"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.intro}>{coverPageBlurb}</Text>

        <View style={styles.divider} />
        {rows.map((row) => (
          <View key={row.label} style={styles.row} wrap={false}>
            <View style={styles.rowLabel}>
              <Text>{row.label}</Text>
              {row.helper ? <Text style={styles.rowHelper}>{row.helper}</Text> : null}
            </View>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
        <View style={styles.divider} />

        <Text style={{ marginTop: 14 }}>
          By signing this Cover Page, each party agrees to enter into this MNDA as of the
          Effective Date.
        </Text>

        <View style={styles.signatureGrid} wrap={false}>
          <PartyCard title="Party 1" party={input.party1} />
          <PartyCard title="Party 2" party={input.party2} />
        </View>

        <Text style={styles.sectionHeading}>Standard Terms</Text>
        {standardTerms.map((clause) => (
          <Text key={clause.number} style={styles.clause}>
            <Text style={styles.bold}>
              {clause.number}. {clause.heading}.
            </Text>
            <Text> </Text>
            {parseSpans(clause.body).map((span, idx) =>
              span.kind === "ref" ? (
                <Text key={idx} style={styles.refSpan}>
                  {span.text}
                </Text>
              ) : (
                <Text key={idx}>{span.text}</Text>
              )
            )}
          </Text>
        ))}

        <Text style={styles.license}>{licenseNotice}</Text>
      </Page>
    </Document>
  );
}

function PartyCard({ title, party }: { title: string; party: PartyInfo }) {
  return (
    <View style={styles.signatureCard}>
      <Text style={styles.partyTitle}>{title}</Text>
      {PARTY_SIGNATURE_FIELDS.map((field) => (
        <View key={field.label} style={styles.partyRow}>
          <Text style={styles.partyLabel}>{field.label}</Text>
          <Text style={styles.partyValue}>{resolvePartyField(party, field)}</Text>
        </View>
      ))}
    </View>
  );
}
