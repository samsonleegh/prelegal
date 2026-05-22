from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.llm import ChatTurn
from app.mnda_models import MndaInputPatch


def _default_input() -> dict[str, Any]:
    return {
        "purpose": "Evaluating a potential partnership.",
        "effectiveDate": "2026-01-15",
        "mndaTerm": {"kind": "years", "years": 1},
        "confidentialityTerm": {"kind": "years", "years": 1},
        "governingLaw": "Delaware",
        "jurisdiction": "New Castle, Delaware",
        "party1": {"company": "", "printName": "", "title": "", "noticeAddress": ""},
        "party2": {"company": "", "printName": "", "title": "", "noticeAddress": ""},
    }


def test_chat_returns_turn(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, Any] = {}

    def fake_run_chat_turn(messages, current_input):
        captured["messages"] = messages
        captured["current_input"] = current_input
        return ChatTurn(
            reply="Got it. What's the other company's name?",
            patch=MndaInputPatch(party1={"company": "Acme Inc."}),
        )

    monkeypatch.setattr("app.routes.mnda_chat.run_chat_turn", fake_run_chat_turn)

    res = client.post(
        "/api/mnda/chat",
        json={
            "messages": [{"role": "user", "content": "Party 1 is Acme Inc."}],
            "current_input": _default_input(),
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["reply"] == "Got it. What's the other company's name?"
    assert body["patch"]["party1"]["company"] == "Acme Inc."
    assert body["patch"]["governingLaw"] is None

    # Handler forwarded the user message and current state to the LLM wrapper.
    assert captured["messages"] == [
        {"role": "user", "content": "Party 1 is Acme Inc."}
    ]
    assert captured["current_input"].party1.company == ""


def test_chat_rejects_empty_messages(client: TestClient) -> None:
    res = client.post(
        "/api/mnda/chat",
        json={"messages": [], "current_input": _default_input()},
    )
    assert res.status_code == 422


def test_chat_rejects_assistant_last(client: TestClient) -> None:
    res = client.post(
        "/api/mnda/chat",
        json={
            "messages": [{"role": "assistant", "content": "Hi!"}],
            "current_input": _default_input(),
        },
    )
    assert res.status_code == 400


def test_chat_returns_502_on_llm_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(messages, current_input):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr("app.routes.mnda_chat.run_chat_turn", boom)

    res = client.post(
        "/api/mnda/chat",
        json={
            "messages": [{"role": "user", "content": "hello"}],
            "current_input": _default_input(),
        },
    )
    assert res.status_code == 502
    assert "provider unavailable" in res.json()["detail"]


def test_chat_rejects_malformed_term(client: TestClient) -> None:
    bad = _default_input()
    bad["mndaTerm"] = {"kind": "weeks", "weeks": 4}
    res = client.post(
        "/api/mnda/chat",
        json={
            "messages": [{"role": "user", "content": "hello"}],
            "current_input": bad,
        },
    )
    assert res.status_code == 422
