from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.llm import ChatTurn, DraftPatch


def test_chat_selects_template(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, Any] = {}

    def fake_run(messages, current_template_key, current_values):
        captured["template_key"] = current_template_key
        captured["values"] = current_values
        return ChatTurn(
            reply="Great, I'll draft a Mutual NDA. Who are the two parties?",
            patch=DraftPatch(template_key="mutual-nda"),
        )

    monkeypatch.setattr("app.routes.draft_chat.run_chat_turn", fake_run)

    res = client.post(
        "/api/draft/chat",
        json={
            "messages": [{"role": "user", "content": "I need an NDA."}],
            "current_template_key": None,
            "current_values": {},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["patch"]["template_key"] == "mutual-nda"
    assert captured["template_key"] is None
    assert captured["values"] == {}


def test_chat_fills_values(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_run(messages, current_template_key, current_values):
        return ChatTurn(
            reply="Got it, Acme. What's the Effective Date?",
            patch=DraftPatch(values={"Customer": "Acme Inc."}),
        )

    monkeypatch.setattr("app.routes.draft_chat.run_chat_turn", fake_run)

    res = client.post(
        "/api/draft/chat",
        json={
            "messages": [{"role": "user", "content": "Customer is Acme Inc."}],
            "current_template_key": "csa",
            "current_values": {},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["patch"]["values"] == {"Customer": "Acme Inc."}
    assert body["patch"]["template_key"] is None


def test_chat_rejects_unknown_template_key(client: TestClient) -> None:
    res = client.post(
        "/api/draft/chat",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "current_template_key": "not-a-real-template",
            "current_values": {},
        },
    )
    assert res.status_code == 400


def test_chat_rejects_empty_messages(client: TestClient) -> None:
    res = client.post(
        "/api/draft/chat",
        json={"messages": [], "current_values": {}},
    )
    assert res.status_code == 422


def test_chat_rejects_assistant_last(client: TestClient) -> None:
    res = client.post(
        "/api/draft/chat",
        json={
            "messages": [{"role": "assistant", "content": "Hi"}],
            "current_values": {},
        },
    )
    assert res.status_code == 400


def test_chat_returns_502_on_llm_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(messages, current_template_key, current_values):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr("app.routes.draft_chat.run_chat_turn", boom)

    res = client.post(
        "/api/draft/chat",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "current_values": {},
        },
    )
    assert res.status_code == 502
    assert "provider unavailable" in res.json()["detail"]
