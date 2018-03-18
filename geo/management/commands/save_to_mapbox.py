import json
from typing import Dict, Iterator, Set

from django.core.management.base import BaseCommand
from mapbox import Datasets
from tqdm import tqdm

from geo.models import CensusTract, TractProperty

DATASET_NAME = 'censustracts'


def get_or_create_dataset_id(datasets: Datasets) -> str:
    """If a dataset with the right name exists, use it. Otherwise, create one.
    In either case, return the dataset id."""
    for dataset in datasets.list().json():
        if dataset['name'] == DATASET_NAME:
            return dataset['id']

    response = datasets.create(name=DATASET_NAME).json()
    return response['id']


def tracts(relations: Set[str]) -> Iterator[CensusTract]:
    """All census tracts, joined with property data and wrapped in a tqdm
    progress bar."""
    queryset = CensusTract.objects.all()

    if relations:
        queryset = queryset.select_related(*relations)
    return tqdm(queryset.iterator(), total=queryset.count())


def to_geojson(tract: CensusTract, properties: Set[str]) -> Dict[str, str]:
    """Convert a CensusTract into GeoJSON, including requested properties."""
    geojson = {
        'id': tract.pk,
        'geometry': json.loads(tract.geom.simplify().geojson),
        'properties': {},
        'type': 'Feature',
    }
    for relation in properties:
        if hasattr(tract, relation):
            geojson['properties'][relation] = getattr(tract, relation).value
    return geojson


class Command(BaseCommand):
    help = "Write all census tracts and associated features to Mapbox"

    def add_arguments(self, parser):
        parser.add_argument('access_token')

    def handle(self, *args, **options):
        datasets = Datasets(access_token=options['access_token'])
        dataset_id = get_or_create_dataset_id(datasets)
        relations = set(
            TractProperty.objects.values_list('relation_field', flat=True))

        for tract in tracts(relations):
            geojson = to_geojson(tract, relations)
            datasets.update_feature(dataset_id, tract.pk, geojson)
