from unittest.mock import Mock

import pytest
from model_mommy import mommy

from geo.models import CoreBasedStatisticalArea, County, MetroDivision
from reports import tasks


@pytest.mark.django_db
def test_divisions_for_metros():
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=3)
    metdivs = mommy.make(MetroDivision, metro=metros[1], _quantity=6)
    divisions = tasks.divisions_for_metros(["123456"] + [m.pk for m in metros])
    assert set(divisions) == {metros[0], metros[2]} | set(metdivs)


@pytest.mark.django_db
def test_generate_report(monkeypatch):
    counties = mommy.make(County, _quantity=6)
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=2)
    monkeypatch.setattr(tasks, "render_to_string", Mock(return_value=""))
    monkeypatch.setattr(tasks, "default_storage", Mock())
    monkeypatch.setattr(tasks, "delete_report", Mock())

    tasks.generate_report.now(
        "abcdef", [c.pk for c in counties[:3]], [m.pk for m in metros], 2008)

    assert set(tasks.render_to_string.call_args[0][1]) == {"divisions", "year"}
    assert tasks.render_to_string.call_args[0][1]["year"] == 2008
    assert set(tasks.render_to_string.call_args[0][1]["divisions"])\
        == set(metros) | set(counties[:3])
