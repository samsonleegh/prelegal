from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm import ChatTurn, run_chat_turn
from app.mnda_models import MndaInput

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    current_input: MndaInput


@router.post("", response_model=ChatTurn)
def mnda_chat(req: ChatRequest) -> ChatTurn:
    if req.messages[-1].role != "user":
        raise HTTPException(
            status_code=400,
            detail="The last message must be from the user.",
        )
    messages = [m.model_dump() for m in req.messages]
    try:
        return run_chat_turn(messages, req.current_input)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM call failed: {exc}",
        ) from exc
