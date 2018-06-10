from unittest.mock import Mock

from geo.management.commands import save_to_mapbox


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
