import type { MndaInput, TermChoice } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PartyInfoPatch {
  company?: string | null;
  printName?: string | null;
  title?: string | null;
  noticeAddress?: string | null;
}

export interface MndaInputPatch {
  purpose?: string | null;
  effectiveDate?: string | null;
  mndaTerm?: TermChoice | null;
  confidentialityTerm?: TermChoice | null;
  governingLaw?: string | null;
  jurisdiction?: string | null;
  party1?: PartyInfoPatch | null;
  party2?: PartyInfoPatch | null;
}

export interface ChatTurn {
  reply: string;
  patch: MndaInputPatch;
}

export async function sendChat(
  messages: ChatMessage[],
  currentInput: MndaInput,
): Promise<ChatTurn> {
  const res = await fetch(`${API_BASE}/api/mnda/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, current_input: currentInput }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Chat failed (${res.status})`);
  }
  return res.json() as Promise<ChatTurn>;
}
