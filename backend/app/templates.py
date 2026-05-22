"""Load Common Paper templates from the repo and extract their cover-page variables.

Each template's markdown body contains inline placeholders such as
`<span class="coverpage_link">Customer</span>` (or the variants
`keyterms_link` / `orderform_link`) marking variables the parties fill in
on the cover page. We parse these out at startup so the chat can ask the
user about each one and the renderer can substitute values back in.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

def _find_root() -> Path:
    """Walk up from this file looking for catalog.json. Works both in the
    local repo (backend/app/templates.py → repo root) and in the Docker
    image where catalog.json lives next to the `app` package."""
    here = Path(__file__).resolve()
    for parent in (here.parent, *here.parents):
        if (parent / "catalog.json").exists():
            return parent
    raise FileNotFoundError("catalog.json not found in any parent directory")


_ROOT = _find_root()
_CATALOG_PATH = _ROOT / "catalog.json"

# Inline variable markers, e.g. <span class="coverpage_link">Customer</span>
_VAR_SPAN_RE = re.compile(
    r'<span class="(?:coverpage_link|keyterms_link|orderform_link)"[^>]*>([^<]+)</span>'
)

# Strip ASCII or curly possessive suffixes — "Customer's" and "Customer's"
# point at the same logical variable ("Customer").
_POSSESSIVE_RE = re.compile(r"[’']s$")


@dataclass(frozen=True)
class TemplateSpec:
    key: str
    name: str
    description: str
    filename: str
    content: str
    variables: tuple[str, ...]

    def to_public(self) -> dict[str, object]:
        return {
            "key": self.key,
            "name": self.name,
            "description": self.description,
            "variables": list(self.variables),
            "content": self.content,
        }


def _slugify(filename: str) -> str:
    stem = Path(filename).stem
    return stem.lower().replace(" ", "-")


def _extract_variables(content: str) -> tuple[str, ...]:
    seen: dict[str, None] = {}
    for match in _VAR_SPAN_RE.finditer(content):
        raw = match.group(1).strip()
        normalized = _POSSESSIVE_RE.sub("", raw)
        if normalized and normalized not in seen:
            seen[normalized] = None
    return tuple(seen.keys())


def _load() -> dict[str, TemplateSpec]:
    with _CATALOG_PATH.open() as f:
        catalog = json.load(f)
    specs: dict[str, TemplateSpec] = {}
    for entry in catalog["templates"]:
        filename = entry["filename"]
        path = _ROOT / filename
        content = path.read_text()
        key = _slugify(filename)
        specs[key] = TemplateSpec(
            key=key,
            name=entry["name"],
            description=entry["description"],
            filename=filename,
            content=content,
            variables=_extract_variables(content),
        )
    return specs


TEMPLATES: dict[str, TemplateSpec] = _load()


def public_catalog() -> list[dict[str, object]]:
    return [t.to_public() for t in TEMPLATES.values()]
