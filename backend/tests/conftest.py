import os
import tempfile
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.unlink(path)
    monkeypatch.setenv("PRELEGAL_DB_PATH", path)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    if os.path.exists(path):
        os.unlink(path)
