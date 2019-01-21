from unittest.mock import Mock

import pytest
from model_mommy import mommy

from geo.models import CoreBasedStatisticalArea, County, MetroDivision
from reports import views


@pytest.mark.django_db
def test_correct_context(client, monkeypatch):
    counties = mommy.make(County, _quantity=6)
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=2)
    metro_with_div = mommy.make(CoreBasedStatisticalArea)
    metdivs = mommy.make(MetroDivision, metro=metro_with_div, _quantity=3)
    monkeypatch.setattr(views, "render_to_string", Mock())

    client.get(
        "/report/",
        {
            "county": ",".join(county.pk for county in counties[:3]),
            "metro": ",".join(metro.pk for metro in metros + [metro_with_div]),
            "year": "2008",
        },
    )

    args = views.render_to_string.call_args[0][1]
    assert set(args) == {"divisions", "year"}
    assert set(args["divisions"]) == set(counties[:3] + metros + metdivs)
    assert args["year"] == 2008


@pytest.mark.django_db
def test_renders_markup(client):
    result = client.get("/report/", {"year": "2010"})
    assert "text/html" in result["Content-type"]


@pytest.mark.django_db
def test_renders_pdf(client):
    result = client.get("/report.pdf", {"year": "2012"})
    assert "application/pdf" in result["Content-type"]
