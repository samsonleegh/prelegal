"""Cerebras-routed LLM call for the document drafting chat."""

import json

from litellm import completion
from pydantic import BaseModel, Field

from app.templates import TEMPLATES, TemplateSpec

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class DraftPatch(BaseModel):
    template_key: str | None = Field(
        default=None,
        description=(
            "Set on the turn where the user picks (or confirms) which document to draft. "
            "Must be one of the keys from the catalog. Leave null on later turns."
        ),
    )
    # The model occasionally emits `null` for unknown values, so accept
    # `str | None` here and filter nulls out in run_chat_turn.
    values: dict[str, str | None] = Field(
        default_factory=dict,
        description=(
            "Variables learned this turn for the selected template. "
            "Keys must match the template's variable list verbatim. "
            "Only include variables you learned this turn; never echo existing values."
        ),
    )


class ChatTurn(BaseModel):
    # `reply` is sometimes omitted by gpt-oss-120b under structured outputs;
    # default to empty and substitute a fallback in run_chat_turn.
    reply: str = ""
    patch: DraftPatch = Field(default_factory=DraftPatch)


def _catalog_summary() -> str:
    return "\n".join(
        f"- `{t.key}` — {t.name}: {t.description}" for t in TEMPLATES.values()
    )


_SELECTION_SYSTEM_PROMPT = f"""You are a legal drafting assistant for a SaaS that drafts agreements based on Common Paper templates.

Your job in this stage is to figure out WHICH document the user wants to draft and set `patch.template_key` to the matching catalog key. The catalog of supported templates:

{_catalog_summary()}

Rules:

1. If the user's request maps to one of the catalog entries, set `patch.template_key` to that key and acknowledge what you're drafting in your reply.
2. If the user's request is for a document NOT in the catalog (e.g. an employment contract, will, lease), do NOT pick a key. Instead, apologise that you can't draft that, and offer the closest supported alternative from the catalog as a suggestion. Wait for the user to confirm before setting `template_key`.
3. If the user's request is vague (e.g. "I need an agreement"), ask a clarifying question.
4. Never set `patch.values` at this stage — variables come after the user has selected a document.
5. Reply in a warm, concise tone. Your reply MUST end with a question (either a clarifying question or asking the user to confirm a suggested template).
6. The `reply` field is REQUIRED — never leave it empty. Always include a natural-language message even when you set `patch.template_key`. After picking a template, your reply should confirm the choice and ask the first question to begin filling in variables.
"""


def _filling_system_prompt(spec: TemplateSpec) -> str:
    variables_block = "\n".join(f"- {v}" for v in spec.variables)
    return f"""You are a legal drafting assistant helping the user complete a Common Paper {spec.name}.

The document has the following cover-page variables (each is referenced inline in the template body):

{variables_block}

Rules:

1. Read the user's latest message and copy any variable values you find into `patch.values`. Keys MUST match the variable list above exactly. Only include variables the user explicitly mentioned this turn — never invent values, and never write "N/A" or other placeholders for variables the user did not address.
2. Write a `reply`: a natural-language message that confirms what you captured (if anything) and asks ONE focused follow-up question about the next variable that still needs a value. The reply must never be empty.
3. Once every variable has a value, tell the user the draft is ready and they can download it from the right-hand panel.
4. Never set `patch.template_key`; the document is already chosen.

The current state of the user's filled-in variables will be provided in the next message as JSON. Use it to know which variables still need values.
"""


def run_chat_turn(
    messages: list[dict[str, str]],
    current_template_key: str | None,
    current_values: dict[str, str],
) -> ChatTurn:
    if current_template_key and current_template_key in TEMPLATES:
        system_prompt = _filling_system_prompt(TEMPLATES[current_template_key])
        state = {
            "template_key": current_template_key,
            "values": current_values,
        }
    else:
        system_prompt = _SELECTION_SYSTEM_PROMPT
        state = {"template_key": None}

    full_messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Current state (JSON):\n{json.dumps(state)}",
        },
        *messages,
    ]

    # gpt-oss-120b occasionally returns null content under structured outputs;
    # retry once before giving up.
    content: str | None = None
    for _ in range(2):
        response = completion(
            model=MODEL,
            messages=full_messages,
            response_format=ChatTurn,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        content = response.choices[0].message.content
        if content:
            break
    if not content:
        raise RuntimeError("LLM returned empty content")

    # gpt-oss-120b occasionally appends prose after the JSON object;
    # raw_decode reads the first complete JSON value and ignores the rest.
    obj, _ = json.JSONDecoder().raw_decode(content.lstrip())
    turn = ChatTurn.model_validate(obj)

    # Filter out null values the model occasionally emits inside `values`.
    turn.patch.values = {
        k: v for k, v in turn.patch.values.items() if v is not None and v != ""
    }
    if not turn.reply.strip():
        turn.reply = "Got it. What would you like to add next?"
    return turn
