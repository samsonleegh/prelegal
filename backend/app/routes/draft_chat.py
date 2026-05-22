from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm import ChatTurn, run_chat_turn
from app.templates import TEMPLATES

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    current_template_key: str | None = None
    current_values: dict[str, str] = Field(default_factory=dict)


@router.post("", response_model=ChatTurn)
def draft_chat(req: ChatRequest) -> ChatTurn:
    if req.messages[-1].role != "user":
        raise HTTPException(
            status_code=400,
            detail="The last message must be from the user.",
        )
    if req.current_template_key and req.current_template_key not in TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown template_key: {req.current_template_key}",
        )

    messages = [m.model_dump() for m in req.messages]
    try:
        return run_chat_turn(
            messages, req.current_template_key, req.current_values
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM call failed: {exc}",
        ) from exc
