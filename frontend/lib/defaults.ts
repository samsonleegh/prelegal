import type { MndaInput } from "./types";

const emptyParty = {
  company: "",
  printName: "",
  title: "",
  noticeAddress: "",
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeDefaultInput(): MndaInput {
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: "",
    mndaTerm: { kind: "years", years: 1 },
    confidentialityTerm: { kind: "years", years: 1 },
    governingLaw: "Delaware",
    jurisdiction: "New Castle, Delaware",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}
