import os
from collections import Counter

import pytest
from django.conf import settings
from django.core.management import call_command

from geo.tests.factories import TractFactory
from hmda.management.commands import load_hmda
from hmda.models import LoanApplicationRecord


@pytest.fixture(autouse=True)
def tract_fixtures(db):
    call_command("loaddata", "agency", "fake_respondents")
    TractFactory(geoid="11222333300")
    TractFactory(geoid="11222333400")
    TractFactory(geoid="11223333300")
    TractFactory(geoid="12222333300")


def test_handle():
    call_command(
        "load_hmda",
        os.path.join(settings.BASE_DIR, "hmda", "tests", "mock_2013.csv"),
    )

    # The mock data file contains 10 records, 8 for known states
    assert LoanApplicationRecord.objects.count() == 8
    lenders = {r.institution_id for r in LoanApplicationRecord.objects.all()}
    tracts = Counter(r.tract_id for r in LoanApplicationRecord.objects.all())
    assert lenders == {
        "2013" + "9" + "1000000001",
        "2013" + "9" + "1000000002",
        "2013" + "9" + "0000451965",
    }
    assert tracts["11222333400"] == 1  # compare to test_handle_errors_dict
    assert set(tracts.keys()) == \
        {"11222333300", "11222333400", "11223333300", "12222333300"}


def test_handle_errors_dict(monkeypatch):
    monkeypatch.setattr(load_hmda.errors, "changes",
                        {2013: {"11222333300": "11222333400"}})
    call_command(
        "load_hmda",
        os.path.join(settings.BASE_DIR, "hmda", "tests", "mock_2013.csv"),
    )

    tracts = Counter(r.tract_id for r in LoanApplicationRecord.objects.all())
    assert len(tracts) == 3
    # 11222333300 got replaced
    assert "11222333300" not in tracts
    assert tracts["11222333400"] == 4
