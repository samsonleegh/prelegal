import type { MndaInput, PartyInfo } from "@/lib/types";
import {
  buildCoverPageRows,
  parseSpans,
  PARTY_SIGNATURE_FIELDS,
  resolvePartyField,
} from "@/lib/format";
import { coverPageBlurb, licenseNotice, standardTerms } from "@/lib/template";

interface Props {
  input: MndaInput;
}

export function MndaPreview({ input }: Props) {
  const rows = buildCoverPageRows(input);

  return (
    <article className="prose prose-slate max-w-none rounded-lg border border-slate-200 bg-white p-8 text-sm leading-relaxed text-slate-900 shadow-sm">
      <h1 className="!mb-2 text-2xl font-semibold">
        Mutual Non-Disclosure Agreement
      </h1>
      <p className="!mt-0 text-slate-700">{coverPageBlurb}</p>

      <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-1 gap-1 py-3 md:grid-cols-[12rem_1fr]">
            <dt>
              <span className="block font-semibold text-slate-900">{row.label}</span>
              {row.helper ? (
                <span className="block text-xs italic text-slate-500">{row.helper}</span>
              ) : null}
            </dt>
            <dd className="text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the
        Effective Date.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <PartyCard title="Party 1" party={input.party1} />
        <PartyCard title="Party 2" party={input.party2} />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Standard Terms</h2>
      <ol className="mt-2 list-none space-y-4 p-0">
        {standardTerms.map((clause) => (
          <li key={clause.number} className="text-slate-800">
            <span className="font-semibold">
              {clause.number}. {clause.heading}.
            </span>{" "}
            {parseSpans(clause.body).map((span, idx) =>
              span.kind === "ref" ? (
                <em key={idx} className="font-medium text-slate-700 underline decoration-dotted">
                  {span.text}
                </em>
              ) : (
                <span key={idx}>{span.text}</span>
              )
            )}
          </li>
        ))}
      </ol>

      <p className="mt-8 text-xs italic text-slate-500">{licenseNotice}</p>
    </article>
  );
}

function PartyCard({ title, party }: { title: string; party: PartyInfo }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <dl className="mt-2 space-y-1 text-sm">
        {PARTY_SIGNATURE_FIELDS.map((field) => (
          <div key={field.label} className="grid grid-cols-[7rem_1fr] gap-2">
            <dt className="text-slate-500">{field.label}</dt>
            <dd className="text-slate-900">{resolvePartyField(party, field)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
