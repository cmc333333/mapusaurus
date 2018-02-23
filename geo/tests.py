from unittest.mock import MagicMock, Mock

import pytest
from django.core.management import call_command
from django.core.urlresolvers import reverse
from django.contrib.gis.geos import Polygon
from model_mommy import mommy

from geo.management.commands import load_geos_from
from geo.models import Geo
from geo.utils import check_bounds


@pytest.mark.django_db
def test_search_name(client):
    call_command('loaddata', 'many_tracts', 'test_counties')
    mommy.make(Geo, geo_type=Geo.METRO_TYPE, name='Chicago', year=2013)
    result = client.get(
        reverse('geo:search'),
        {'format': 'json', 'q': 'cago', 'year': '2013'},
    ).json()
    assert len(result['geos']) == 1
    assert result['geos'][0]['name'] == 'Chicago'


def test_check_bounds():
    assert check_bounds('100', '100', '100', '') is None
    assert check_bounds('-100', '100', '200', 'asdf') is None
    expected_bounds = (
        float('10.0'),
        float('40.1234'),
        float('20.20'),
        float('-10.123456'),
    )
    actual_bounds = check_bounds('10.0', '-10.123456', '20.20', '40.1234')
    assert actual_bounds == expected_bounds


@pytest.mark.django_db
def test_set_tract_cbsa():
    mommy.make(Geo, geoid='11222', geo_type=Geo.COUNTY_TYPE, state='11',
               county='222', csa='987', year='2012')
    mommy.make(Geo, geoid='11223', geo_type=Geo.COUNTY_TYPE, state='11',
               county='223', cbsa='88776', year='2012')
    mommy.make(Geo, geoid='88776', geo_type=Geo.METRO_TYPE, cbsa='88776',
               year='2012')
    mommy.make(Geo, geoid='1122233333', geo_type=Geo.TRACT_TYPE, state='11',
               year='2012', county='222', tract='33333')
    mommy.make(Geo, geoid='1122333333', geo_type=Geo.TRACT_TYPE, state='11',
               year='2012', county='223', tract='33333')
    call_command('set_tract_csa_cbsa')
    tract1 = Geo.objects.filter(geoid='1122233333').get()
    tract2 = Geo.objects.filter(geoid='1122333333').get()
    assert tract1.csa == '987'
    assert tract1.cbsa is None
    assert tract2.csa is None
    assert tract2.cbsa == '88776'


def test_parse_models(monkeypatch):
    monkeypatch.setattr(load_geos_from, 'DataSource', Mock())
    mock_data = {
        'GEOID': '1122233333',
        'NAME': 'Tract 33333',
        'STATEFP': '11',
        'COUNTYFP': '222',
        'TRACTCE': '33333',
        'INTPTLAT': '-45',
        'INTPTLON': '45',
    }
    feature = Mock(
        geom=Polygon(((0, 0), (0, 2), (-1, 2), (0, 0))),
        get=mock_data.get,
    )
    load_geos_from.DataSource.return_value = MagicMock(layer_count=1)
    load_geos_from.DataSource.return_value.__getitem__ = lambda s, i: [feature]
    [geo] = list(load_geos_from.parse_models('', 2013))

    assert geo.cbsa is None
    assert geo.centlat == -45
    assert geo.centlon == 45
    assert geo.county == '222'
    assert geo.csa is None
    assert geo.geo_type == Geo.TRACT_TYPE
    assert geo.geoid == '20131122233333'
    assert geo.maxlat == 2
    assert geo.maxlon == 0
    assert geo.minlat == 0
    assert geo.minlon == -1
    assert geo.name == 'Tract 33333'
    assert geo.state == '11'
    assert geo.tract == '33333'
    assert geo.year == 2013


@pytest.mark.parametrize('row, geo_type', [
    ({'TRACTCE': '33333'}, Geo.TRACT_TYPE),
    ({'COUNTYFP': '11', 'STATEFP': '222'}, Geo.COUNTY_TYPE),
    ({'LSAD': 'M1'}, Geo.METRO_TYPE),
    ({'LSAD': 'M2'}, Geo.MICRO_TYPE),
    ({'LSAD': 'M3'}, Geo.METDIV_TYPE),
])
def test_geo_type_county(row, geo_type):
    assert load_geos_from.geo_type(row) == geo_type
