from pathlib import Path
from unittest.mock import MagicMock, Mock, call

import pytest
import requests
import us
from django.core.management import call_command
from freezegun import freeze_time

from geo.management.commands import fetch_load_geos


def test_fetch_flags(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'all_years_urls', Mock())
    fetch_load_geos.all_years_urls.return_value = []
    call_command(
        'fetch_load_geos',
        '--shape', 'COUNTY', 'CBSA',
        '--state', '17', 'DC', 'Puerto Rico',
        '--year', '2014', '2016',
    )
    args = fetch_load_geos.all_years_urls.call_args[0]
    assert set(args[0]) == {'COUNTY', 'CBSA'}
    assert set(args[1]) == {us.states.IL, us.states.DC, us.states.PR}
    assert set(args[2]) == {2014, 2016}


def test_fetch_flags_default(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'all_years_urls', Mock())
    fetch_load_geos.all_years_urls.return_value = []
    with freeze_time('2017-01-01'):
        call_command('fetch_load_geos')
    args = fetch_load_geos.all_years_urls.call_args[0]
    assert set(args[0]) == {'TRACT', 'COUNTY', 'CBSA', 'METDIV'}
    assert len(args[1]) == 56   # States and territories
    assert us.states.lookup('IL') in args[1]
    assert us.states.lookup('Guam') in args[1]
    assert set(args[2]) == set(range(2013, 2017))


def test_fetch_passes_shapefile(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(fetch_load_geos, 'parse_models', Mock())
    monkeypatch.setattr(fetch_load_geos, 'save_batches', Mock())
    fetch_load_geos.fetch_and_unzip_dir.return_value.__enter__.return_value =\
        Path('/some/path/here')
    call_command(
        'fetch_load_geos',
        '--shape', 'TRACT',
        '--state', 'PA',
        '--year', '2013',
    )
    assert fetch_load_geos.parse_models.call_args == call(
        '/some/path/here/tl_2013_42_tract.shp', 2013)


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_fetch_handles_exceptions(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_geos, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(fetch_load_geos, 'logger', Mock())
    context = fetch_load_geos.fetch_and_unzip_dir.return_value.__enter__
    context.side_effect = exception
    call_command(
        'fetch_load_geos',
        '--shape', 'METDIV',
        '--year', '2014', '2016',
    )
    assert context.call_count == 2
    assert fetch_load_geos.logger.exception.call_count == 2


def test_all_years_urls_non_tract():
    result = set(fetch_load_geos.all_years_urls(
        ['NONTRACT', 'TRACT'],
        [us.states.IN, us.states.CA],
        [2011, 2012],
    ))
    prefix = 'https://www2.census.gov/geo/tiger/'
    assert us.states.IN.fips == '18'
    assert us.states.CA.fips == '06'
    assert result == {
        (2011, prefix + 'TIGER2011/NONTRACT/tl_2011_us_nontract.zip'),
        (2011, prefix + 'TIGER2011/TRACT/tl_2011_18_tract.zip'),
        (2011, prefix + 'TIGER2011/TRACT/tl_2011_06_tract.zip'),
        (2012, prefix + 'TIGER2012/NONTRACT/tl_2012_us_nontract.zip'),
        (2012, prefix + 'TIGER2012/TRACT/tl_2012_18_tract.zip'),
        (2012, prefix + 'TIGER2012/TRACT/tl_2012_06_tract.zip'),
    }
