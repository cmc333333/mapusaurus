from unittest.mock import MagicMock, Mock

import pytest
import requests
import requests_mock
import us
from django.contrib.gis.gdal import OGRGeometry
from freezegun import freeze_time

from geo.management.commands import load_census_tracts


def test_default_year_now():
    with freeze_time('2017-02-03'), requests_mock.mock() as r_mock:
        r_mock.head(
            'https://www2.census.gov/geo/tiger/TIGER2017/TRACT/'
            'tl_2017_01_tract.zip')
        assert load_census_tracts.default_year() == 2017


def test_default_year_past():
    with freeze_time('2017-02-03'), requests_mock.mock() as r_mock:
        r_mock.head(
            'https://www2.census.gov/geo/tiger/TIGER2017/TRACT/'
            'tl_2017_01_tract.zip',
            status_code=404)
        assert load_census_tracts.default_year() == 2016


def test_parse_models():
    features = [
        {"GEOID": "01001000001", "NAME": "One", "INTPTLAT": "0.01",
         "INTPTLON": "0.01", "STATEFP": "01", "COUNTYFP": "001",
         "TRACTCE": "000001"},
        {"GEOID": "01001000002", "NAME": "Two", "INTPTLAT": "0.02",
         "INTPTLON": "0.02", "STATEFP": "01", "COUNTYFP": "001",
         "TRACTCE": "000002"},
        {"GEOID": "03003000003", "NAME": "Three", "INTPTLAT": "0.03",
         "INTPTLON": "0.03", "STATEFP": "03", "COUNTYFP": "003",
         "TRACTCE": "000003"},
    ]
    layer = [
        Mock(geom=OGRGeometry('POLYGON((0 0, 0 2, -1 2, 0 0))'), get=f.get)
        for f in features
    ]
    models = list(load_census_tracts.parse_models(layer))
    assert models[0].pk == '01001000001'
    assert models[1].name == 'Two'
    assert models[2].interior_lat == 0.03
    assert models[0].interior_lon == 0.01
    assert models[1].state == 1
    assert models[2].county == 3
    assert models[0].tract == 1
    assert set(models[1].geom.coords[0][0]) == {(0, 0), (0, 2), (-1, 2)}


def test_load_tracts_for_state(monkeypatch):
    monkeypatch.setattr(load_census_tracts, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(load_census_tracts, 'parse_layer', Mock())
    monkeypatch.setattr(load_census_tracts, 'parse_models', Mock())
    monkeypatch.setattr(load_census_tracts, 'save_batches', Mock())

    load_census_tracts.load_tracts_for_state(us.states.FL, 2014, False)
    assert load_census_tracts.parse_layer.called
    assert load_census_tracts.parse_models.called
    assert load_census_tracts.save_batches.called
    assert not load_census_tracts.save_batches.call_args[1]['log']


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_load_tracts_for_state_handles_exceptions(monkeypatch, exception):
    monkeypatch.setattr(load_census_tracts, 'fetch_and_unzip_dir', MagicMock())
    monkeypatch.setattr(load_census_tracts, 'logger', Mock())
    monkeypatch.setattr(load_census_tracts, 'parse_layer', Mock())
    context = load_census_tracts.fetch_and_unzip_dir.return_value.__enter__
    context.side_effect = exception

    load_census_tracts.load_tracts_for_state(us.states.DE, 2015, False)
    assert not load_census_tracts.parse_layer.called
    assert load_census_tracts.logger.exception.called
