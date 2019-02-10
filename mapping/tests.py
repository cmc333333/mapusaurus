import json
from unittest.mock import Mock

import pytest

from hmda.models import LARYear
from mapping import views


@pytest.mark.django_db
def test_spa_contains_years(monkeypatch):
    monkeypatch.setattr(views, "render", Mock())
    LARYear.objects.create(year=2010)
    LARYear.objects.create(year=2011)
    LARYear.objects.create(year=2013)

    views.single_page_app(Mock())
    context = views.render.call_args[0][2]
    assert json.loads(context["SPA_CONFIG"])["years"] == [2013, 2011, 2010]


@pytest.mark.django_db
def test_spa_contains_states(monkeypatch):
    monkeypatch.setattr(views, "render", Mock())
    views.single_page_app(Mock())
    context = views.render.call_args[0][2]
    states = json.loads(context["SPA_CONFIG"])["states"]
    assert len(states) >= 50
    assert {"abbr": "IL", "fips": "17", "name": "Illinois"} in states
    assert {"abbr": "NY", "fips": "36", "name": "New York"} in states
