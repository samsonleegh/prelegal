"""Cerebras-routed LLM call for the MNDA chat."""

import json

from litellm import completion
from pydantic import BaseModel

from app.mnda_models import MndaInput, MndaInputPatch

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class ChatTurn(BaseModel):
    """The LLM's structured output for one assistant turn."""

    reply: str
    patch: MndaInputPatch


SYSTEM_PROMPT = """You are a legal drafting assistant helping a user complete a Common Paper Mutual Non-Disclosure Agreement (MNDA). Your job is to gather the information needed to fill in the document by chatting with the user, then return any new values you learned this turn as a structured patch.

Fields to populate (all live in the MndaInput object the user is editing):

- purpose: free-text description of why the parties are sharing confidential information (e.g. "Evaluating a potential commercial partnership").
- effectiveDate: ISO date string "YYYY-MM-DD".
- mndaTerm: how long the MNDA is in effect. Either {"kind": "years", "years": N} where 1 <= N <= 99, or {"kind": "perpetual"} meaning it continues until terminated.
- confidentialityTerm: how long confidential information stays protected. Same shape as mndaTerm. "perpetual" means in perpetuity.
- governingLaw: U.S. state whose laws govern, e.g. "Delaware".
- jurisdiction: city/county and state where disputes are heard, e.g. "New Castle, Delaware".
- party1, party2: each has {company, printName, title, noticeAddress}. noticeAddress is an email or postal address.

Behavior rules:

1. Ask one focused question at a time. Group naturally related fields (e.g. ask for a party's company + signatory name + title + notice address together).
2. The user has already been greeted by the UI; do not re-introduce yourself. Jump straight into gathering missing information, starting with whichever required field is still empty.
3. Reply in a warm, concise tone. Confirm what you captured before moving on.
4. In every reply, populate the `patch` with ONLY the fields you learned from the user this turn. Leave fields you did not learn as null. Do not echo existing values back into the patch.
5. If the user gives a value but it's ambiguous (e.g. just a state for "Delaware" when you need governing law and jurisdiction), capture what you can and ask a clarifying question for the rest.
6. When all fields have plausible values, tell the user the draft is ready and they can review and download it from the panel on the right.
7. Never invent values the user did not provide. If they say "use sensible defaults", you may suggest values but ask them to confirm before placing them in the patch.

The current state of the user's MndaInput will be provided in the next message as JSON; use it to know which fields still need values.
"""


def run_chat_turn(
    messages: list[dict[str, str]],
    current_input: MndaInput,
) -> ChatTurn:
    """Run one chat turn. `messages` is the conversation so far (user/assistant only).

    Returns the parsed ChatTurn (reply + patch).
    """
    state_message = {
        "role": "system",
        "content": f"Current MndaInput state (JSON):\n{current_input.model_dump_json()}",
    }
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        state_message,
        *messages,
    ]

    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format=ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    content = response.choices[0].message.content
    # gpt-oss-120b occasionally appends prose after the JSON object;
    # raw_decode reads the first complete JSON value and ignores the rest.
    obj, _ = json.JSONDecoder().raw_decode(content.lstrip())
    return ChatTurn.model_validate(obj)
