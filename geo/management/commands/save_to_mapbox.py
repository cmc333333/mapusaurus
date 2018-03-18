import json
from typing import Dict, Iterator, List, Tuple

from django.core.management.base import BaseCommand
from mapbox import Datasets
from tqdm import tqdm

from geo.models import CensusTract, TractFeature

DATASET_NAME = 'censustracts'


def get_or_create_dataset_id(datasets: Datasets) -> str:
    """If a dataset with the right name exists, use it. Otherwise, create one.
    In either case, return the dataset id."""
    for dataset in datasets.list().json():
        if dataset['name'] == DATASET_NAME:
            return dataset['id']

    response = datasets.create(name=DATASET_NAME).json()
    return response['id']


def tracts() -> Iterator[CensusTract]:
    """All census tracts, joined with feature data and wrapped in a tqdm
    progress bar."""
    queryset = CensusTract.objects.all()
    feature_fields = set(
        TractFeature.objects.values_list('field_name', flat=True))

    if feature_fields:
        queryset = queryset.select_related(*feature_fields)
    return tqdm(queryset.iterator(), total=queryset.count())


def to_geojson(tract: CensusTract, feature_pairs: List[Tuple[str, str]]) \
               -> Dict[str, str]:
    """Convert a CensusTract into GeoJSON, including requested features."""
    geojson = {
        'id': tract.pk,
        'geometry': json.loads(tract.geom.simplify().geojson),
        'properties': {},
        'type': 'Feature',
    }
    for field_name, value_field in feature_pairs:
        if hasattr(tract, field_name):
            related = getattr(tract, field_name)
            geojson['properties'][f"{field_name}__{value_field}"] = \
                getattr(related, value_field)
    return geojson


class Command(BaseCommand):
    help = "Write all census tracts and associated features to Mapbox"

    def add_arguments(self, parser):
        parser.add_argument('access_token')

    def handle(self, *args, **options):
        datasets = Datasets(access_token=options['access_token'])
        dataset_id = get_or_create_dataset_id(datasets)
        feature_pairs = TractFeature.objects.values_list(
            'field_name', 'value_field')

        for tract in tracts():
            geojson = to_geojson(tract, feature_pairs)
            datasets.update_feature(dataset_id, tract.pk, geojson)
