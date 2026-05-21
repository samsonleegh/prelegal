"use client";

import { useState } from "react";

import type { MndaInput, PartyInfo, TermChoice } from "@/lib/types";

interface Props {
  value: MndaInput;
  onChange: (next: MndaInput) => void;
}

export function MndaForm({ value, onChange }: Props) {
  function patch(partial: Partial<MndaInput>) {
    onChange({ ...value, ...partial });
  }
  function patchParty(which: "party1" | "party2", partial: Partial<PartyInfo>) {
    onChange({ ...value, [which]: { ...value[which], ...partial } });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Mutual NDA inputs"
    >
      <Section title="Agreement">
        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className="form-input min-h-24"
            value={value.purpose}
            onChange={(e) => patch({ purpose: e.target.value })}
          />
        </Field>

        <Field label="Effective Date">
          <input
            type="date"
            className="form-input"
            value={value.effectiveDate}
            onChange={(e) => patch({ effectiveDate: e.target.value })}
          />
        </Field>

        <TermField
          label="MNDA Term"
          hint="How long this MNDA stays in effect"
          value={value.mndaTerm}
          onChange={(mndaTerm) => patch({ mndaTerm })}
          perpetualLabel="Continues until terminated"
        />

        <TermField
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
          value={value.confidentialityTerm}
          onChange={(confidentialityTerm) => patch({ confidentialityTerm })}
          perpetualLabel="In perpetuity"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Governing Law" hint="State whose laws govern">
            <input
              className="form-input"
              value={value.governingLaw}
              onChange={(e) => patch({ governingLaw: e.target.value })}
              placeholder="Delaware"
            />
          </Field>
          <Field label="Jurisdiction" hint="City or county, and state">
            <input
              className="form-input"
              value={value.jurisdiction}
              onChange={(e) => patch({ jurisdiction: e.target.value })}
              placeholder="New Castle, Delaware"
            />
          </Field>
        </div>
      </Section>

      <PartySection
        title="Party 1"
        party={value.party1}
        onChange={(partial) => patchParty("party1", partial)}
      />
      <PartySection
        title="Party 2"
        party={value.party2}
        onChange={(partial) => patchParty("party2", partial)}
      />
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      {children}
    </label>
  );
}

function TermField({
  label,
  hint,
  value,
  onChange,
  perpetualLabel,
}: {
  label: string;
  hint?: string;
  value: TermChoice;
  onChange: (v: TermChoice) => void;
  perpetualLabel: string;
}) {
  const isYears = value.kind === "years";
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={isYears}
            onChange={() => onChange({ kind: "years", years: 1 })}
          />
          <span>Years from Effective Date:</span>
          <YearsInput
            disabled={!isYears}
            years={isYears ? value.years : 1}
            onChange={(years) => onChange({ kind: "years", years })}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value.kind === "perpetual"}
            onChange={() => onChange({ kind: "perpetual" })}
          />
          <span>{perpetualLabel}</span>
        </label>
      </div>
    </Field>
  );
}

function YearsInput({
  years,
  disabled,
  onChange,
}: {
  years: number;
  disabled: boolean;
  onChange: (years: number) => void;
}) {
  const [draft, setDraft] = useState(String(years));

  return (
    <input
      type="number"
      min={1}
      max={99}
      className="form-input w-20"
      disabled={disabled}
      value={disabled ? years : draft}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        const parsed = Number.parseInt(next, 10);
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 99) {
          onChange(parsed);
        }
      }}
      onBlur={() => {
        const parsed = Number.parseInt(draft, 10);
        const clamped = Number.isFinite(parsed)
          ? Math.min(99, Math.max(1, parsed))
          : 1;
        setDraft(String(clamped));
        if (clamped !== years) onChange(clamped);
      }}
    />
  );
}

function PartySection({
  title,
  party,
  onChange,
}: {
  title: string;
  party: PartyInfo;
  onChange: (partial: Partial<PartyInfo>) => void;
}) {
  return (
    <Section title={title}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company">
          <input
            className="form-input"
            value={party.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />
        </Field>
        <Field label="Print Name">
          <input
            className="form-input"
            value={party.printName}
            onChange={(e) => onChange({ printName: e.target.value })}
          />
        </Field>
        <Field label="Title">
          <input
            className="form-input"
            value={party.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Notice Address" hint="Email or postal address">
          <input
            className="form-input"
            value={party.noticeAddress}
            onChange={(e) => onChange({ noticeAddress: e.target.value })}
          />
        </Field>
      </div>
    </Section>
  );
}
