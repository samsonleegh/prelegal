/**
 * Parses a Common Paper template's markdown into a flat list of blocks and
 * substitutes user-supplied variable values into inline span markers.
 *
 * Designed to be rendered by both the on-screen preview (React/Tailwind)
 * and the PDF document (@react-pdf/renderer), so the output is a plain
 * data structure with no styling decisions baked in.
 */

const VAR_SPAN_PATTERN =
  /<span [^>]*class="(?:[^"]*\s)?(?:coverpage_link|keyterms_link|orderform_link)(?:\s[^"]*)?"[^>]*>([^<]+)<\/span>/;

const HEADER_SPAN_PATTERN =
  /<span [^>]*class="(?:[^"]*\s)?(?:header_2|header_3)(?:\s[^"]*)?"[^>]*>([^<]+)<\/span>/g;

// Strip any remaining span wrapper that isn't a variable. Variable spans
// are extracted via VAR_SPAN_PATTERN first, so this only runs over what's
// left.
const ANY_SPAN_PATTERN = /<span [^>]*>([^<]*)<\/span>/g;

const POSSESSIVE_RE = /[’']s$/;

const BOLD_PATTERN = /\*\*(.+?)\*\*/;

export type Span =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "variable"; name: string; value: string | null };

export interface Block {
  kind: "heading" | "subheading" | "paragraph" | "list-item";
  indent: number; // 0 for top-level
  spans: Span[];
}

function normaliseVarName(raw: string): string {
  return raw.trim().replace(POSSESSIVE_RE, "");
}

function lookupValue(
  name: string,
  values: Record<string, string>,
): string | null {
  const normalised = normaliseVarName(name);
  const value = values[normalised];
  if (value === undefined || value === "") return null;
  // Preserve the possessive suffix if the original used one.
  const suffix = name.trim().slice(normalised.length);
  return value + suffix;
}

function parseInline(
  raw: string,
  values: Record<string, string>,
): Span[] {
  const spans: Span[] = [];

  // Walk the string; find the earliest of (variable span, bold marker),
  // emit the prefix as plain text, then emit the marker.
  let remaining = raw;
  while (remaining.length > 0) {
    const varMatch = VAR_SPAN_PATTERN.exec(remaining);
    const boldMatch = BOLD_PATTERN.exec(remaining);

    let next: { index: number; len: number; span: Span } | null = null;
    if (
      varMatch &&
      (!boldMatch || (varMatch.index ?? 0) <= (boldMatch.index ?? 0))
    ) {
      const name = varMatch[1];
      next = {
        index: varMatch.index ?? 0,
        len: varMatch[0].length,
        span: {
          kind: "variable",
          name: normaliseVarName(name),
          value: lookupValue(name, values),
        },
      };
    } else if (boldMatch) {
      next = {
        index: boldMatch.index ?? 0,
        len: boldMatch[0].length,
        span: { kind: "bold", text: boldMatch[1] },
      };
    }

    if (!next) {
      // No more markers — strip any leftover non-variable span wrappers
      // (keep the inner text) and emit as plain text.
      const tail = remaining.replace(ANY_SPAN_PATTERN, (_, inner: string) => inner);
      if (tail !== "") spans.push({ kind: "text", text: tail });
      break;
    }

    if (next.index > 0) {
      const prefix = remaining
        .slice(0, next.index)
        .replace(ANY_SPAN_PATTERN, (_, inner: string) => inner);
      if (prefix !== "") spans.push({ kind: "text", text: prefix });
    }
    spans.push(next.span);
    remaining = remaining.slice(next.index + next.len);
  }

  return spans;
}

export interface VariableSummaryRow {
  name: string;
  value: string;
  filled: boolean;
}

export function summariseVariables(
  variables: readonly string[],
  values: Record<string, string>,
  placeholder = "[not set]",
): VariableSummaryRow[] {
  return variables.map((name) => {
    const v = values[name];
    const filled = !!v && v.trim() !== "";
    return { name, value: filled ? v : placeholder, filled };
  });
}

const LIST_ITEM_RE = /^(\s*)(\d+\.|[a-z]\.|[ivx]+\.)\s+(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;

export function parseTemplate(
  content: string,
  values: Record<string, string>,
): Block[] {
  const blocks: Block[] = [];

  // Pre-strip header spans so they show as plain emphasised text inside the
  // line they're on (they typically contain "1. Foo" which the list-item
  // pattern below will pick up correctly).
  const cleaned = content.replace(
    HEADER_SPAN_PATTERN,
    (_, inner: string) => inner,
  );

  for (const rawLine of cleaned.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (line.trim() === "") continue;

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({
        kind: level <= 2 ? "heading" : "subheading",
        indent: 0,
        spans: parseInline(headingMatch[2], values),
      });
      continue;
    }

    const listMatch = LIST_ITEM_RE.exec(line);
    if (listMatch) {
      const leading = listMatch[1];
      const marker = listMatch[2];
      const rest = listMatch[3];
      // 4-space indent per level; treat tabs as 4 spaces.
      const indent = Math.floor(
        leading.replace(/\t/g, "    ").length / 4,
      );
      blocks.push({
        kind: "list-item",
        indent,
        spans: [
          { kind: "text", text: `${marker} ` },
          ...parseInline(rest, values),
        ],
      });
      continue;
    }

    blocks.push({
      kind: "paragraph",
      indent: 0,
      spans: parseInline(line, values),
    });
  }

  return blocks;
}
