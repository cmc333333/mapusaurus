from unittest.mock import MagicMock, Mock, call

import pytest
import requests
import requests_mock
import us
from django.core.management import call_command
from model_mommy import mommy

from censusdata.management.commands import fetch_load_summary_ones
from geo.models import Geo


@pytest.mark.django_db
def test_relevant_years():
    mommy.make(Geo, state=us.states.IA.fips, geo_type=Geo.TRACT_TYPE,
               year=2010)
    mommy.make(Geo, state=us.states.IA.fips, geo_type=Geo.METRO_TYPE,
               year=2011)
    mommy.make(Geo, state=us.states.AK.fips, geo_type=Geo.TRACT_TYPE,
               year=2012)
    mommy.make(Geo, state=us.states.IA.fips, geo_type=Geo.TRACT_TYPE,
               year=2013)
    assert list(fetch_load_summary_ones.relevant_years(us.states.IA)) ==\
        [2010, 2013]
    assert list(fetch_load_summary_ones.relevant_years(us.states.AK)) ==\
        [2012]
    assert list(fetch_load_summary_ones.relevant_years(us.states.ND)) ==\
        []


@pytest.mark.django_db
def test_summary1_load(monkeypatch):
    monkeypatch.setattr(fetch_load_summary_ones, 'load_state_tracts', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'load_file_three', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'load_file_four', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'load_file_five', Mock())
    fips = '01'
    tracts = {'tracts': 'here'}
    fetch_load_summary_ones.load_state_tracts.return_value = (fips, tracts)

    summary = fetch_load_summary_ones.Summary1Files(
        MagicMock(), MagicMock(), MagicMock(), MagicMock())
    summary.load_data(True, 2099)

    assert fetch_load_summary_ones.load_state_tracts.call_args == call(
        summary.geofile.open.return_value.__enter__.return_value,
        2099,
    )
    assert fetch_load_summary_ones.load_file_three.call_args[0][0] ==\
        summary.file3.open.return_value.__enter__.return_value
    assert fetch_load_summary_ones.load_file_three.call_args[0][2]
    assert fetch_load_summary_ones.load_file_three.call_args[0][3] == tracts

    assert fetch_load_summary_ones.load_file_four.call_args[0][0] ==\
        summary.file4.open.return_value.__enter__.return_value
    assert fetch_load_summary_ones.load_file_four.call_args[0][2]
    assert fetch_load_summary_ones.load_file_four.call_args[0][3] == tracts

    assert fetch_load_summary_ones.load_file_five.call_args[0][0] ==\
        summary.file5.open.return_value.__enter__.return_value
    assert fetch_load_summary_ones.load_file_five.call_args[0][2]
    assert fetch_load_summary_ones.load_file_five.call_args[0][3] == tracts


def test_fetch_and_unzip(monkeypatch):
    monkeypatch.setattr(fetch_load_summary_ones, 'ZipFile', MagicMock())
    with requests_mock.mock() as r_mock:
        r_mock.get(
            'https://www2.census.gov/census_2010/04-Summary_File_1/'
            'Florida/fl2010.sf1.zip',
            content=b'',
        )
        with fetch_load_summary_ones.fetch_and_unzip(us.states.FL) as summary:
            assert summary.geofile.name == 'flgeo2010.sf1'
            assert summary.file3.name == 'fl000032010.sf1'
            assert summary.file4.name == 'fl000042010.sf1'
            assert summary.file5.name == 'fl000052010.sf1'

    archive = fetch_load_summary_ones.ZipFile.return_value.__enter__\
        .return_value
    assert archive.extract.call_count == 4
    file_names = {c[0][0] for c in archive.extract.call_args_list}
    assert file_names == {
        'flgeo2010.sf1', 'fl000032010.sf1', 'fl000042010.sf1',
        'fl000052010.sf1',
    }


def test_fetch_load_summary_ones_default_states(monkeypatch):
    monkeypatch.setattr(fetch_load_summary_ones, 'relevant_years', Mock())
    fetch_load_summary_ones.relevant_years.return_value = []
    call_command('fetch_load_summary_ones')
    assert fetch_load_summary_ones.relevant_years.call_count == 51


def test_fetch_load_summary_ones_skips(monkeypatch):
    monkeypatch.setattr(fetch_load_summary_ones, 'relevant_years', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'fetch_and_unzip',
                        MagicMock())
    fetch_load_summary_ones.relevant_years.return_value = []
    call_command('fetch_load_summary_ones')
    assert not fetch_load_summary_ones.fetch_and_unzip.called


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_fetch_load_summary_ones_exceptions(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_summary_ones, 'relevant_years', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'fetch_and_unzip',
                        MagicMock())
    fetch_load_summary_ones.relevant_years.return_value = [2000]
    fetch_load_summary_ones.fetch_and_unzip.side_effect = exception
    call_command('fetch_load_summary_ones')
    assert fetch_load_summary_ones.fetch_and_unzip.call_count == 51


def test_fetch_load_summary_ones(monkeypatch):
    monkeypatch.setattr(fetch_load_summary_ones, 'relevant_years', Mock())
    monkeypatch.setattr(fetch_load_summary_ones, 'fetch_and_unzip',
                        MagicMock())
    fetch_load_summary_ones.relevant_years.return_value = [2001, 2020]
    summary_files = fetch_load_summary_ones.fetch_and_unzip.return_value\
        .__enter__.return_value

    call_command('fetch_load_summary_ones', '--state', 'Mississippi')

    assert fetch_load_summary_ones.fetch_and_unzip.call_args_list == [
        call(us.states.MS)]
    assert summary_files.load_data.call_args_list == [call(False, 2001),
                                                      call(False, 2020)]
