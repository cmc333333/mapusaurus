from pathlib import Path
from unittest.mock import MagicMock, Mock, call

import pytest
import requests
import requests_mock
import us
from django.contrib.gis.gdal import OGRGeometry
from django.contrib.gis.geos import GEOSGeometry
from django.core.management import call_command
from freezegun import freeze_time

from geo.management.commands import fetch_load_geos
from geo.models import CoreBasedStatisticalArea, County, State, Tract


def test_load_shapes_shapefile(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(fetch_load_geos, 'parse_layer', Mock())
    monkeypatch.setattr(fetch_load_geos, 'save_batches', Mock())
    fetch_load_geos.fetch_and_unzip_dir.return_value.__enter__.return_value =\
        Path('/path/here')

    fetch_load_geos.load_shapes(
        "https://example.com/some/sort/of.zip", Mock(), False, 100, Mock())

    assert fetch_load_geos.parse_layer.call_args == call("/path/here/of.shp")


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_load_shapes_handles_exceptions(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_geos, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(fetch_load_geos, 'logger', Mock())
    context = fetch_load_geos.fetch_and_unzip_dir.return_value.__enter__
    context.side_effect = exception

    fetch_load_geos.load_shapes(
        "http://example.com/", Mock(), False, 100, Mock())

    assert fetch_load_geos.logger.exception.called


def test_load_geometry():
    result = fetch_load_geos.load_geometry(
        Mock(geom=OGRGeometry('POLYGON((0 0, 0 2, -1 2, 0 0))')))
    points = [pt for polygon in result.coords for ln in polygon for pt in ln]
    lons, lats = zip(*points)
    assert min(lats) == 0
    assert max(lats) == 2
    assert min(lons) == -1
    assert max(lons) == 0


def test_parse_cbsa(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, "load_geometry", Mock(
        return_value=GEOSGeometry('MULTIPOLYGON(((0 0, 0 2, -1 2, 0 0)))')))
    layer = [
        {
            "GEOID": "12345",
            "INTPTLAT": "11.11",
            "INTPTLON": "22.22",
            "LSAD": "M1",
            "NAME": "MetroMetro",
        }, {
            "GEOID": "23456",
            "INTPTLAT": "33.33",
            "INTPTLON": "44.44",
            "LSAD": "M2",
            "NAME": "MicroMicro",
        }
    ]

    result = list(fetch_load_geos.parse_cbsas(layer))
    assert len(result) == 2
    metro, micro = result
    assert metro.geom
    assert metro.interior_lat == 11.11
    assert metro.interior_lon == 22.22
    assert metro.metro is True
    assert metro.name == "MetroMetro"
    assert metro.pk == "12345"
    assert micro.geom
    assert micro.interior_lat == 33.33
    assert micro.interior_lon == 44.44
    assert micro.metro is False
    assert micro.name == "MicroMicro"
    assert micro.pk == "23456"


def test_parse_states(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, "load_geometry", Mock(
        return_value=GEOSGeometry('MULTIPOLYGON(((0 0, 0 2, -1 2, 0 0)))')))
    layer = [{
        "GEOID": "12",
        "INTPTLAT": "11.11",
        "INTPTLON": "22.22",
        "NAME": "A State",
    }]

    result = list(fetch_load_geos.parse_states(layer, only_states=["12"]))
    assert len(result) == 1
    assert result[0].geom
    assert result[0].interior_lat == 11.11
    assert result[0].interior_lon == 22.22
    assert result[0].name == "A State"
    assert result[0].pk == "12"


def test_parse_counties(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, "load_geometry", Mock(
        return_value=GEOSGeometry('MULTIPOLYGON(((0 0, 0 2, -1 2, 0 0)))')))
    layer = [
        {
            "CBSAFP": "",
            "COUNTYFP": "345",
            "GEOID": "12345",
            "INTPTLAT": "11.11",
            "INTPTLON": "22.22",
            "NAME": "A County",
            "STATEFP": "12",
        }, {
            "CBSAFP": "54321",
            "COUNTYFP": "333",
            "GEOID": "22333",
            "INTPTLAT": "33.33",
            "INTPTLON": "44.44",
            "NAME": "Another",
            "STATEFP": "22",
        }
    ]

    result = list(
        fetch_load_geos.parse_counties(layer, only_states=["12", "22"]))
    assert len(result) == 2
    metroless, metroful = result
    assert metroless.cbsa is None
    assert metroless.county_only == "345"
    assert metroless.geom
    assert metroless.interior_lat == 11.11
    assert metroless.interior_lon == 22.22
    assert metroless.name == "A County"
    assert metroless.pk == "12345"
    assert metroless.state_id == "12"
    assert metroful.cbsa_id == "54321"
    assert metroful.county_only == "333"
    assert metroful.geom
    assert metroful.interior_lat == 33.33
    assert metroful.interior_lon == 44.44
    assert metroful.name == "Another"
    assert metroful.pk == "22333"
    assert metroful.state_id == "22"


def test_parse_tracts(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, "load_geometry", Mock(
        return_value=GEOSGeometry('MULTIPOLYGON(((0 0, 0 2, -1 2, 0 0)))')))
    layer = [{
        "COUNTYFP": "222",
        "GEOID": "11222333333",
        "INTPTLAT": "11.11",
        "INTPTLON": "22.22",
        "NAME": "A Tract",
        "STATEFP": "11",
        "TRACTCE": "333333",
    }]

    result = list(fetch_load_geos.parse_tracts(layer, us.states.lookup("11")))
    assert len(result) == 1
    assert result[0].county_id == "11222"
    assert result[0].geom
    assert result[0].interior_lat == 11.11
    assert result[0].interior_lon == 22.22
    assert result[0].name == "A Tract"
    assert result[0].pk == "11222333333"
    assert result[0].tract_only == "333333"


def test_default_year_now():
    with freeze_time('2017-02-03'), requests_mock.mock() as r_mock:
        r_mock.head(
            'https://www2.census.gov/geo/tiger/TIGER2017/STATE/'
            'tl_2017_us_state.zip')
        assert fetch_load_geos.default_year() == 2017


def test_default_year_past():
    with freeze_time('2017-02-03'), requests_mock.mock() as r_mock:
        r_mock.head(
            'https://www2.census.gov/geo/tiger/TIGER2017/STATE/'
            'tl_2017_us_state.zip',
            status_code=404)
        assert fetch_load_geos.default_year() == 2016


def test_fetch_flags(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'load_shapes', Mock())
    call_command(
        'fetch_load_geos',
        '--state', '17', 'DC', 'Puerto Rico',
        '--year', '2014',
        '--no-cbsas',
    )
    assert fetch_load_geos.load_shapes.call_count == 5
    calls = fetch_load_geos.load_shapes.call_args_list
    urls, models = zip(*(call[0][:2] for call in calls))
    assert all("2014" in url for url in urls)
    assert models == (State, County, Tract, Tract, Tract)


def test_fetch_flags_default(monkeypatch):
    monkeypatch.setattr(fetch_load_geos, 'load_shapes', Mock())
    monkeypatch.setattr(
        fetch_load_geos, 'default_year', Mock(return_value=2016))

    call_command('fetch_load_geos')

    calls = fetch_load_geos.load_shapes.call_args_list
    urls, models = zip(*(call[0][:2] for call in calls))
    assert all("2016" in url for url in urls)
    assert models == \
        (State, CoreBasedStatisticalArea, County) + tuple([Tract] * 59)
