"use client";

import { useEffect, useRef, useState } from "react";

import { sendChat, type ChatMessage } from "@/lib/chat";
import { makeDefaultInput, todayIso } from "@/lib/defaults";
import { mergePatch } from "@/lib/mergePatch";
import type { MndaInput } from "@/lib/types";

interface Props {
  value: MndaInput;
  onChange: (next: MndaInput) => void;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a Mutual NDA. To start, what are the names of the two companies entering into this agreement?",
};

export function MndaChat({ value, onChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || pending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setPending(true);
    setError(null);

    try {
      // Strip the hardcoded UI greeting; the LLM only sees real exchanges.
      const turn = await sendChat(next.slice(1), value);
      setMessages((prev) => [...prev, { role: "assistant", content: turn.reply }]);
      onChange(mergePatch(value, turn.patch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  function handleReset() {
    setMessages([GREETING]);
    setDraft("");
    setError(null);
    onChange({ ...makeDefaultInput(), effectiveDate: todayIso() });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Chat
        </h2>
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="text-xs text-[#209dd7] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Reset
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {pending && (
          <div className="text-xs italic text-slate-500">AI is thinking…</div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <textarea
            className="form-input min-h-12 flex-1 resize-none"
            placeholder="Type your message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={pending}
            rows={2}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={pending || draft.trim() === ""}
            className="self-stretch rounded-md bg-[#753991] px-4 text-sm font-semibold text-white hover:bg-[#5e2d74] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-[#209dd7] text-white"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
