import type { MndaInput, PartyInfo, TermChoice } from "./types";

export type Span =
  | { kind: "text"; text: string }
  | { kind: "ref"; text: string };

const REF_RE = /\{([^}]+)\}/g;

export function parseSpans(body: string): Span[] {
  const spans: Span[] = [];
  let lastIndex = 0;
  for (const match of body.matchAll(REF_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      spans.push({ kind: "text", text: body.slice(lastIndex, start) });
    }
    spans.push({ kind: "ref", text: match[1] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < body.length) {
    spans.push({ kind: "text", text: body.slice(lastIndex) });
  }
  return spans;
}

export function formatEffectiveDate(iso: string): string {
  if (!iso) return "[Effective Date]";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMndaTerm(term: TermChoice): string {
  if (term.kind === "perpetual") {
    return "Continues until terminated in accordance with the terms of the MNDA.";
  }
  const unit = term.years === 1 ? "year" : "years";
  return `Expires ${term.years} ${unit} from the Effective Date.`;
}

export function formatConfidentialityTerm(term: TermChoice): string {
  if (term.kind === "perpetual") {
    return "In perpetuity.";
  }
  const unit = term.years === 1 ? "year" : "years";
  return `${term.years} ${unit} from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`;
}

export interface CoverPageRow {
  label: string;
  helper?: string;
  value: string;
}

export function buildCoverPageRows(input: MndaInput): CoverPageRow[] {
  return [
    {
      label: "Purpose",
      helper: "How Confidential Information may be used",
      value: input.purpose || "[Purpose]",
    },
    {
      label: "Effective Date",
      value: formatEffectiveDate(input.effectiveDate),
    },
    {
      label: "MNDA Term",
      helper: "The length of this MNDA",
      value: formatMndaTerm(input.mndaTerm),
    },
    {
      label: "Term of Confidentiality",
      helper: "How long Confidential Information is protected",
      value: formatConfidentialityTerm(input.confidentialityTerm),
    },
    {
      label: "Governing Law",
      value: input.governingLaw || "[Fill in state]",
    },
    {
      label: "Jurisdiction",
      helper: "Courts where disputes are heard",
      value: input.jurisdiction || "[Fill in city or county and state]",
    },
  ];
}

export function partyFieldDisplay(value: string, placeholder: string): string {
  return value.trim() === "" ? placeholder : value;
}

export interface PartySignatureField {
  label: string;
  key: keyof PartyInfo | null;
  placeholder: string;
}

export const PARTY_SIGNATURE_FIELDS: PartySignatureField[] = [
  { label: "Signature", key: null, placeholder: "____________________" },
  { label: "Print Name", key: "printName", placeholder: "[Print Name]" },
  { label: "Title", key: "title", placeholder: "[Title]" },
  { label: "Company", key: "company", placeholder: "[Company]" },
  {
    label: "Notice Address",
    key: "noticeAddress",
    placeholder: "[Email or postal address]",
  },
];

export function resolvePartyField(
  party: PartyInfo,
  field: PartySignatureField,
): string {
  return field.key === null
    ? field.placeholder
    : partyFieldDisplay(party[field.key], field.placeholder);
}
