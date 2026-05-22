from fastapi import APIRouter
from pydantic import BaseModel

from app.templates import public_catalog

router = APIRouter()


class TemplatePublic(BaseModel):
    key: str
    name: str
    description: str
    variables: list[str]
    content: str


class TemplateListResponse(BaseModel):
    templates: list[TemplatePublic]


@router.get("", response_model=TemplateListResponse)
def list_templates() -> TemplateListResponse:
    return TemplateListResponse(templates=public_catalog())  # type: ignore[arg-type]
