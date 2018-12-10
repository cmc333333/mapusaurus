"""This logic has been removed but will return soon.
from unittest.mock import Mock

import pytest
from model_mommy import mommy

from geo.management.commands import as_geojson
from geo.models import CensusTract, TractProperty


@pytest.mark.django_db
def test_tracts_relations(monkeypatch):
    monkeypatch.setattr(as_geojson, 'CensusTract', Mock())
    mommy.make(TractProperty, relation_field='aaa')
    mommy.make(TractProperty, relation_field='bbb')
    mommy.make(TractProperty, relation_field='ccc')
    all_fn_result = as_geojson.CensusTract.objects.all.return_value
    order_by_fn_result = all_fn_result.order_by.return_value
    select_related_fn = order_by_fn_result.select_related
    select_related_fn.return_value = []

    # as tracts() is a generator, ensure it's executed by calling list()
    list(as_geojson.tracts({'aaa', 'bbb'}))

    assert set(select_related_fn.call_args[0]) == {'aaa', 'bbb'}


@pytest.mark.django_db
def test_tracts(monkeypatch):
    mommy.make(CensusTract, pk='aaaaaa')
    mommy.make(CensusTract, pk='bbbbbb')
    result = list(as_geojson.tracts(set()))

    assert len(result) == 2
    assert result[0].pk == 'aaaaaa'
    assert result[1].pk == 'bbbbbb'


def test_to_geojson():
    tract = Mock(spec=['aaa', 'bbb', 'geom', 'pk'])
    tract.geom.simplify.return_value.geojson = '{"a": 3}'
    tract.aaa.value = 'v1'
    tract.bbb.value = 2
    tract.pk = '00120022'

    result = as_geojson.to_geojson(tract, {'aaa', 'bbb', 'ccc'})

    assert result == {
        'id': 120022,
        'geometry': {'a': 3},
        'properties': {'aaa': 'v1', 'bbb': 2},
        'type': 'Feature',
    }


def test_to_geojson_ints():
    # The bool_as_int parameter should convert boolean values to ints
    tract = Mock(spec=['aaa', 'geom', 'pk'])
    tract.geom.simplify.return_value.geojson = '{}'
    tract.aaa.value = True
    tract.pk = '1234'

    assert as_geojson.to_geojson(tract, {'aaa'}) == {
        'id': 1234,
        'geometry': {},
        'properties': {'aaa': True},
        'type': 'Feature',
    }
    assert as_geojson.to_geojson(tract, {'aaa'}, bool_as_int=True) == {
        'id': 1234,
        'geometry': {},
        'properties': {'aaa': 1},
        'type': 'Feature',
    }

    tract.aaa.value = False

    assert as_geojson.to_geojson(tract, {'aaa'}) == {
        'id': 1234,
        'geometry': {},
        'properties': {'aaa': False},
        'type': 'Feature',
    }
    assert as_geojson.to_geojson(tract, {'aaa'}, bool_as_int=True) == {
        'id': 1234,
        'geometry': {},
        'properties': {'aaa': 0},
        'type': 'Feature',
    }
"""
