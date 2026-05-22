from fastapi.testclient import TestClient

from app.templates import TEMPLATES, _extract_variables


def test_catalog_loaded() -> None:
    assert "mutual-nda" in TEMPLATES
    mnda = TEMPLATES["mutual-nda"]
    assert mnda.name == "Mutual NDA"
    assert "Effective Date" in mnda.variables
    assert "Governing Law" in mnda.variables
    assert "Jurisdiction" in mnda.variables


def test_extract_variables_dedupes_possessives() -> None:
    content = (
        '<span class="coverpage_link">Customer</span> agreed. '
        '<span class="coverpage_link">Customer’s</span> obligations remain. '
        "<span class=\"coverpage_link\">Customer's</span> rights apply. "
        '<span class="keyterms_link">Provider</span> will deliver.'
    )
    vars_ = _extract_variables(content)
    assert vars_ == ("Customer", "Provider")


def test_extract_variables_handles_orderform_link() -> None:
    content = '<span class="orderform_link">Target Uptime</span> applies.'
    vars_ = _extract_variables(content)
    assert vars_ == ("Target Uptime",)


def test_list_templates_endpoint(client: TestClient) -> None:
    res = client.get("/api/templates")
    assert res.status_code == 200
    body = res.json()
    keys = {t["key"] for t in body["templates"]}
    assert "mutual-nda" in keys
    assert "csa" in keys
    assert len(body["templates"]) == 12
    mnda = next(t for t in body["templates"] if t["key"] == "mutual-nda")
    assert "Effective Date" in mnda["variables"]
