from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db import get_connection

router = APIRouter()

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class FakeLoginRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=200, pattern=EMAIL_PATTERN)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


@router.post("/fake-login", response_model=UserResponse)
def fake_login(req: FakeLoginRequest) -> UserResponse:
    name = req.name.strip()
    email = req.email.strip().lower()
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (name, email) VALUES (?, ?) "
            "ON CONFLICT(email) DO UPDATE SET name = excluded.name",
            (name, email),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, email FROM users WHERE email = ?", (email,)
        ).fetchone()
        return UserResponse(id=row["id"], name=row["name"], email=row["email"])
    finally:
        conn.close()
