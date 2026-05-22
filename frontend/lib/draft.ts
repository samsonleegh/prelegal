const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface TemplateSpec {
  key: string;
  name: string;
  description: string;
  variables: string[];
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DraftPatch {
  template_key?: string | null;
  values?: Record<string, string> | null;
}

export interface ChatTurn {
  reply: string;
  patch: DraftPatch;
}

export interface DraftState {
  templateKey: string | null;
  values: Record<string, string>;
}

export function mergePatch(state: DraftState, patch: DraftPatch): DraftState {
  return {
    templateKey: patch.template_key ?? state.templateKey,
    values: { ...state.values, ...(patch.values ?? {}) },
  };
}

export async function fetchTemplates(): Promise<TemplateSpec[]> {
  const res = await fetch(`${API_BASE}/api/templates`);
  if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
  const body = (await res.json()) as { templates: TemplateSpec[] };
  return body.templates;
}

export async function sendChat(
  messages: ChatMessage[],
  state: DraftState,
): Promise<ChatTurn> {
  const res = await fetch(`${API_BASE}/api/draft/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      current_template_key: state.templateKey,
      current_values: state.values,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Chat failed (${res.status})`);
  }
  return res.json() as Promise<ChatTurn>;
}
