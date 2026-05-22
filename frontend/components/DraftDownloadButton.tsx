"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";

import { DraftPdfDocument } from "./DraftPdfDocument";
import type { TemplateSpec } from "@/lib/draft";

const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5e2d74] disabled:cursor-not-allowed disabled:bg-slate-400";

interface Props {
  template: TemplateSpec | null;
  values: Record<string, string>;
}

export function DraftDownloadButton({ template, values }: Props) {
  if (!template) {
    return (
      <span className="inline-flex items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
        Download PDF
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<DraftPdfDocument template={template} values={values} />}
      fileName={`${template.key}.pdf`}
      className={buttonClass}
    >
      {({ loading, error }) => {
        if (error) return `Error: ${error.message}`;
        return loading ? "Preparing PDF…" : "Download PDF";
      }}
    </PDFDownloadLink>
  );
}

export default DraftDownloadButton;
