export type TermChoice =
  | { kind: "years"; years: number }
  | { kind: "perpetual" };

export interface PartyInfo {
  company: string;
  printName: string;
  title: string;
  noticeAddress: string;
}

export interface MndaInput {
  purpose: string;
  effectiveDate: string;
  mndaTerm: TermChoice;
  confidentialityTerm: TermChoice;
  governingLaw: string;
  jurisdiction: string;
  party1: PartyInfo;
  party2: PartyInfo;
}
