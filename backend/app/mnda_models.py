"""Pydantic models that mirror the frontend MndaInput shape.

These are shared by the chat request/response models and the LLM
structured-output schema, so the AI's patch deserializes cleanly into the
same JSON the frontend already produces.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class TermYears(BaseModel):
    kind: Literal["years"]
    years: int = Field(ge=1, le=99)


class TermPerpetual(BaseModel):
    kind: Literal["perpetual"]


TermChoice = Annotated[TermYears | TermPerpetual, Field(discriminator="kind")]


class PartyInfo(BaseModel):
    company: str = ""
    printName: str = ""
    title: str = ""
    noticeAddress: str = ""


class MndaInput(BaseModel):
    purpose: str
    effectiveDate: str
    mndaTerm: TermChoice
    confidentialityTerm: TermChoice
    governingLaw: str
    jurisdiction: str
    party1: PartyInfo
    party2: PartyInfo


class PartyInfoPatch(BaseModel):
    company: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class MndaInputPatch(BaseModel):
    """Optional updates to apply to MndaInput. All fields are nullable;
    null means the AI did not produce an update for that field this turn."""

    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTerm: TermChoice | None = None
    confidentialityTerm: TermChoice | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    party1: PartyInfoPatch | None = None
    party2: PartyInfoPatch | None = None
