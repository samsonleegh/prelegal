import type { MndaInputPatch, PartyInfoPatch } from "./chat";
import type { MndaInput, PartyInfo } from "./types";

function mergeParty(party: PartyInfo, patch: PartyInfoPatch | null | undefined): PartyInfo {
  if (!patch) return party;
  return {
    company: patch.company ?? party.company,
    printName: patch.printName ?? party.printName,
    title: patch.title ?? party.title,
    noticeAddress: patch.noticeAddress ?? party.noticeAddress,
  };
}

export function mergePatch(input: MndaInput, patch: MndaInputPatch): MndaInput {
  return {
    purpose: patch.purpose ?? input.purpose,
    effectiveDate: patch.effectiveDate ?? input.effectiveDate,
    mndaTerm: patch.mndaTerm ?? input.mndaTerm,
    confidentialityTerm: patch.confidentialityTerm ?? input.confidentialityTerm,
    governingLaw: patch.governingLaw ?? input.governingLaw,
    jurisdiction: patch.jurisdiction ?? input.jurisdiction,
    party1: mergeParty(input.party1, patch.party1),
    party2: mergeParty(input.party2, patch.party2),
  };
}
