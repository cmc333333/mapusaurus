from unittest.mock import Mock

import pytest
from model_mommy import mommy

from geo.management.commands import save_to_mapbox
from geo.models import TractProperty


def test_get_or_create_dataset_id_get():
    datasets = Mock()
    datasets.list.return_value.json.return_value = [
        {'name': 'something_else', 'id': 'one'},
        {'name': 'censustracts', 'id': 'two'},
        {'name': 'one_more', 'id': 'three'},
    ]
    assert save_to_mapbox.get_or_create_dataset_id(datasets) == 'two'


def test_get_or_create_dataset_id_create():
    datasets = Mock()
    datasets.list.return_value.json.return_value = [
        {'name': 'something_else', 'id': 'one'},
        {'name': 'one_more', 'id': 'three'},
    ]
    datasets.create.return_value.json.return_value = {'id': 'new-thing'}
    assert save_to_mapbox.get_or_create_dataset_id(datasets) == 'new-thing'


@pytest.mark.django_db
def test_tracts(monkeypatch):
    monkeypatch.setattr(save_to_mapbox, 'CensusTract', Mock())
    mommy.make(TractProperty, relation_field='aaa')
    mommy.make(TractProperty, relation_field='bbb')
    mommy.make(TractProperty, relation_field='ccc')
    all_fn = save_to_mapbox.CensusTract.objects.all.return_value
    select_related_fn = all_fn.select_related
    select_related_fn.return_value.iterator.return_value = []
    select_related_fn.return_value.count.return_value = 0

    save_to_mapbox.tracts({'aaa', 'bbb'})

    assert set(select_related_fn.call_args[0]) == {'aaa', 'bbb'}


def test_to_geojson():
    tract = Mock(spec=['aaa', 'bbb', 'geom', 'pk'])
    tract.geom.simplify.return_value.geojson = '{"a": 3}'
    tract.aaa.value = 'v1'
    tract.bbb.value = 2
    tract.pk = 'some-id'

    result = save_to_mapbox.to_geojson(tract, {'aaa', 'bbb', 'ccc'})

    assert result == {
        'id': 'some-id',
        'geometry': {'a': 3},
        'properties': {'aaa': 'v1', 'bbb': 2},
        'type': 'Feature',
    }
