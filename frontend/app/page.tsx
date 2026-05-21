"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { MndaForm } from "@/components/MndaForm";
import { MndaPreview } from "@/components/MndaPreview";
import { makeDefaultInput, todayIso } from "@/lib/defaults";

const MndaDownloadButton = dynamic(
  () =>
    import("@/components/MndaDownloadButton").then((m) => ({
      default: m.MndaDownloadButton,
    })),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center justify-center rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
        Preparing PDF…
      </span>
    ),
  },
);

export default function HomePage() {
  const [input, setInput] = useState(() => makeDefaultInput());

  useEffect(() => {
    setInput((prev) =>
      prev.effectiveDate === "" ? { ...prev, effectiveDate: todayIso() } : prev,
    );
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6 lg:p-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mutual NDA Creator</h1>
          <p className="text-sm text-slate-600">
            Fill out the fields on the left, review the document on the right, then download a PDF.
          </p>
        </div>
        <MndaDownloadButton input={input} />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-label="Form">
          <MndaForm value={input} onChange={setInput} />
        </section>
        <section aria-label="Preview" className="lg:sticky lg:top-6 lg:self-start">
          <MndaPreview input={input} />
        </section>
      </div>

      <footer className="pt-6 text-center text-xs text-slate-500">
        Based on the Common Paper Mutual NDA (Version 1.0), released under CC BY 4.0.
      </footer>
    </main>
  );
}
