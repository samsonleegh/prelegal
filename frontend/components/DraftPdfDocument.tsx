import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  parseTemplate,
  summariseVariables,
  type Block,
  type Span,
} from "@/lib/templateRender";
import type { TemplateSpec } from "@/lib/draft";

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
    marginBottom: 12,
  },
  coverPanel: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    marginBottom: 18,
  },
  coverPanelTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#475569",
  },
  coverRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  coverLabel: {
    width: 130,
    color: "#475569",
  },
  coverValue: {
    flex: 1,
  },
  coverMissing: {
    flex: 1,
    color: "#94a3b8",
    fontFamily: "Times-Italic",
  },
  heading: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  paragraph: {
    marginVertical: 3,
  },
  variable: {
    fontFamily: "Times-Italic",
  },
  variableFilled: {
    fontFamily: "Times-Bold",
  },
  bold: {
    fontFamily: "Times-Bold",
  },
});

interface Props {
  template: TemplateSpec;
  values: Record<string, string>;
}

export function DraftPdfDocument({ template, values }: Props) {
  const blocks = parseTemplate(template.content, values);
  return (
    <Document title={template.name} author="Prelegal">
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{template.name}</Text>

        {template.variables.length > 0 && (
          <View style={styles.coverPanel} wrap={false}>
            <Text style={styles.coverPanelTitle}>Cover page values</Text>
            {summariseVariables(template.variables, values).map((row) => (
              <View key={row.name} style={styles.coverRow}>
                <Text style={styles.coverLabel}>{row.name}</Text>
                <Text style={row.filled ? styles.coverValue : styles.coverMissing}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {blocks.map((block, i) => (
          <BlockText key={i} block={block} />
        ))}
      </Page>
    </Document>
  );
}

function BlockText({ block }: { block: Block }) {
  const indent = block.indent * 12;
  const inline = block.spans.map((span, i) => <SpanText key={i} span={span} />);

  switch (block.kind) {
    case "heading":
      return <Text style={[styles.heading, { marginLeft: indent }]}>{inline}</Text>;
    case "subheading":
      return <Text style={[styles.subheading, { marginLeft: indent }]}>{inline}</Text>;
    case "list-item":
    case "paragraph":
    default:
      return (
        <Text style={[styles.paragraph, { marginLeft: indent }]}>{inline}</Text>
      );
  }
}

function SpanText({ span }: { span: Span }) {
  switch (span.kind) {
    case "bold":
      return <Text style={styles.bold}>{span.text}</Text>;
    case "variable":
      return span.value ? (
        <Text style={styles.variableFilled}>{span.value}</Text>
      ) : (
        <Text style={styles.variable}>[{span.name}]</Text>
      );
    case "text":
    default:
      return <Text>{span.text}</Text>;
  }
}
