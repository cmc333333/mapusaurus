import os
from collections import Counter

import pytest
from django.core.management import call_command

from hmda.management.commands import load_hmda
from hmda.models import HMDARecord


@pytest.mark.django_db
def test_handle(settings):
    call_command('loaddata', 'dummy_tracts', 'agency', 'fake_respondents')
    call_command(
        'load_hmda',
        os.path.join(settings.BASE_DIR, "hmda", "tests", "mock_2013.csv"),
    )

    # The mock data file contains 10 records, 8 for known states
    assert HMDARecord.objects.count() == 8
    lenders = {r.institution_id for r in HMDARecord.objects.all()}
    geos = Counter(r.geo_id for r in HMDARecord.objects.all())
    assert lenders == {
        '2013' + '9' + '1000000001',
        '2013' + '9' + '1000000002',
        '2013' + '9' + '0000451965',
    }
    assert geos['20131122233400'] == 1  # compare to test_handle_errors_dict
    assert set(geos.keys()) == {
        '20131122233300',
        '20131122233400',
        '20131122333300',
        '20131222233300',
    }


@pytest.mark.django_db
def test_handle_errors_dict(monkeypatch, settings):
    monkeypatch.setattr(load_hmda.errors, 'changes',
                        {2013: {'1122233300': '1122233400'}})
    call_command('loaddata', 'dummy_tracts', 'agency', 'fake_respondents')
    call_command(
        'load_hmda',
        os.path.join(settings.BASE_DIR, "hmda", "tests", "mock_2013.csv"),
    )

    geos = Counter(r.geo_id for r in HMDARecord.objects.all())
    assert len(geos) == 3
    # 1122233300 got replaced
    assert '20131122233300' not in geos
    assert geos['20131122233400'] == 4
