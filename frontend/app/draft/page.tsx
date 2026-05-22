"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { DraftChat } from "@/components/DraftChat";
import { DraftPreview } from "@/components/DraftPreview";
import { clearStoredUser, getStoredUser, type User } from "@/lib/auth";
import {
  fetchTemplates,
  type DraftState,
  type TemplateSpec,
} from "@/lib/draft";

const DraftDownloadButton = dynamic(
  () =>
    import("@/components/DraftDownloadButton").then((m) => ({
      default: m.DraftDownloadButton,
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

export default function DraftPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<TemplateSpec[] | null>(null);
  const [state, setState] = useState<DraftState>({
    templateKey: null,
    values: {},
  });

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/");
      return;
    }
    setUser(stored);
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [router]);

  const selected = useMemo<TemplateSpec | null>(() => {
    if (!templates || !state.templateKey) return null;
    return templates.find((t) => t.key === state.templateKey) ?? null;
  }, [templates, state.templateKey]);

  function handleSignOut() {
    clearStoredUser();
    router.replace("/");
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6 lg:p-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#032147]">Draft an Agreement</h1>
          <p className="text-sm text-slate-600">
            Chat with the AI on the left to draft a document. Review the live preview on the right, then download a PDF.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs text-slate-500">
            <div className="font-medium text-slate-700">{user.name}</div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[#209dd7] hover:underline"
            >
              Sign out
            </button>
          </div>
          <DraftDownloadButton template={selected} values={state.values} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-label="Chat">
          <DraftChat state={state} onChange={setState} />
        </section>
        <section aria-label="Preview" className="lg:sticky lg:top-6 lg:self-start">
          <DraftPreview template={selected} values={state.values} />
        </section>
      </div>

      <footer className="pt-6 text-center text-xs text-slate-500">
        Documents based on Common Paper templates, released under CC BY 4.0.
      </footer>
    </main>
  );
}
