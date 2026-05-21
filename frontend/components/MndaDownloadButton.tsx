"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";

import { MndaPdfDocument } from "./MndaPdfDocument";
import type { MndaInput } from "@/lib/types";

const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";

export function MndaDownloadButton({ input }: { input: MndaInput }) {
  return (
    <PDFDownloadLink
      document={<MndaPdfDocument input={input} />}
      fileName="mutual-nda.pdf"
      className={buttonClass}
    >
      {({ loading, error }) => {
        if (error) return `Error: ${error.message}`;
        return loading ? "Preparing PDF…" : "Download PDF";
      }}
    </PDFDownloadLink>
  );
}

export default MndaDownloadButton;
