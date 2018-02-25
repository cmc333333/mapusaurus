from unittest.mock import MagicMock, Mock

import pytest
from django.contrib.gis.gdal import OGRGeometry

from geo.management.commands import load_geos_from
from geo.models import Geo


def test_parse_models(monkeypatch):
    monkeypatch.setattr(load_geos_from, 'DataSource', Mock())
    mock_data = {
        'COUNTYFP': '222',
        'GEOID': '1122233333',
        'INTPTLAT': '-45',
        'INTPTLON': '45',
        'NAME': 'Tract 33333',
        'STATEFP': '11',
        'TRACTCE': '33333',
    }
    feature = Mock(
        fields=mock_data.keys(),
        geom=OGRGeometry('POLYGON((0 0, 0 2, -1 2, 0 0))'),
        get=mock_data.__getitem__,
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
    feature = Mock(fields=row.keys(), get=row.__getitem__)
    assert load_geos_from.geo_type(feature) == geo_type
