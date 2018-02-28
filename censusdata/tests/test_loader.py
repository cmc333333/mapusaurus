from pathlib import Path

import pytest
from django.core.management import call_command

from censusdata.management.commands import load_summary_one
from censusdata.models import Census2010Households, Census2010RaceStats
from geo.models import Geo


@pytest.fixture
def mock_data_dir(db, settings):
    call_command('loaddata', 'mock_geo')
    yield Path(settings.BASE_DIR) / 'censusdata' / 'tests'


def test_load_state_tracts_errors_dict(mock_data_dir, monkeypatch):
    monkeypatch.setattr(load_summary_one.errors, 'changes', {
        2000: {'11001000100': '22002000200', '11001000902': None},
    })
    with (mock_data_dir / 'mock_geo.txt').open() as datafile:
        _, tracts = load_summary_one.load_state_tracts(datafile, 2001)

        # The None causes us to skip 11001000902
        assert len(tracts) == 1
        # This entry was converted
        assert tracts['0007159'] == '200122002000200'


def test_handle_filethree(mock_data_dir):
    tracts = {'0007159': '11001000100', '0007211': '11001000902'}
    with (mock_data_dir / 'mock_file3.txt').open() as datafile:
        load_summary_one.load_file_three(datafile, [], False, tracts)
    assert Census2010RaceStats.objects.count() == 2

    model = Census2010RaceStats.objects.get(pk='11001000100')
    assert model.total_pop == 4890
    assert model.hispanic == 296
    assert model.non_hisp_white_only == 4202
    assert model.non_hisp_black_only == 101
    assert model.non_hisp_asian_only == 198

    model = Census2010RaceStats.objects.get(pk='11001000902')
    assert model.total_pop == 2092
    assert model.hispanic == 107
    assert model.non_hisp_white_only == 1776
    assert model.non_hisp_black_only == 63
    assert model.non_hisp_asian_only == 77


def test_handle_filethree_replace(mock_data_dir):
    geo_query = Geo.objects.all()
    tracts = {'0007159': '11001000100', '0007211': '11001000902'}
    file_path = mock_data_dir / 'mock_file3.txt'

    with file_path.open() as datafile:
        load_summary_one.load_file_three(datafile, geo_query, False, tracts)

    assert Census2010RaceStats.objects.count() == 2
    Census2010RaceStats.objects.first().delete()
    assert Census2010RaceStats.objects.count() == 1

    # Importing again should do nothing
    with file_path.open() as datafile:
        load_summary_one.load_file_three(datafile, geo_query, False, tracts)

    assert Census2010RaceStats.objects.count() == 1

    # Importing with replacement, however, should
    with file_path.open() as datafile:
        load_summary_one.load_file_three(datafile, geo_query, True, tracts)

    assert Census2010RaceStats.objects.count() == 2


def test_load_file_five(mock_data_dir):
    tracts = {'0007159': '11001000100', '0007211': '11001000902'}
    with (mock_data_dir / 'mock_file5.txt').open() as datafile:
        load_summary_one.load_file_five(datafile, [], False, tracts)
    assert Census2010Households.objects.count() == 2

    model = Census2010Households.objects.get(pk='11001000100')
    assert model.total == 1853624
    assert model.total_family == 1067203
    assert model.total_nonfamily == 786421

    model = Census2010Households.objects.get(pk='11001000902')
    assert model.total == 2738936
    assert model.total_family == 1951351
    assert model.total_nonfamily == 787585
