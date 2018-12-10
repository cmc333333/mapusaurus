"""This logic has been removed but will return soon.
import json
from typing import Dict, Iterator, Set

from django.core.management.base import BaseCommand
from django.core.paginator import Paginator
from tqdm import tqdm

from geo.models import CensusTract, TractProperty


def tracts(relations: Set[str]) -> Iterator[CensusTract]:
    # All census tracts, joined with property data and wrapped in a tqdm
    # progress bar.
    queryset = CensusTract.objects.all().order_by('pk')

    if relations:
        queryset = queryset.select_related(*relations)

    # Use pagination to reduce stutter when starting
    paginator = Paginator(queryset, 100)
    with tqdm(total=paginator.count) as pbar:
        for page_idx in range(paginator.num_pages):
            for tract in paginator.page(page_idx + 1):
                yield tract
                pbar.update()


def to_geojson(tract: CensusTract, properties: Set[str],
               bool_as_int: bool = False) -> Dict[str, str]:
    # Convert a CensusTract into GeoJSON, including requested properties.
    geojson = {
        'id': int(tract.pk),  # tippecanoe won't tolerate string pks
        'geometry': json.loads(tract.geom.simplify().geojson),
        'properties': {},
        'type': 'Feature',
    }
    for relation in properties:
        if hasattr(tract, relation):
            value = getattr(tract, relation).value
            if isinstance(value, bool) and bool_as_int:
                value = int(value)
            geojson['properties'][relation] = value
    return geojson


class Command(BaseCommand):
    help = "Output all census tracts and associated features as GeoJSON"

    def add_arguments(self, parser):
        parser.add_argument(
            '--bool-as-int', action='store_const', const=True, default=False,
            help='convert booleans to integers (helpful for mapbox filters)',
        )

    def handle(self, *args, **options):
        self.stdout.write('{')
        self.stdout.write('"type": "FeatureCollection",')
        self.stdout.write('"features": [')

        relations = set(
            TractProperty.objects.values_list('relation_field', flat=True))

        for idx, tract in enumerate(tracts(relations)):
            if idx != 0:    # end the previous tract's line
                self.stdout.write(',')
            geojson = to_geojson(tract, relations, options['bool_as_int'])
            self.stdout.write(json.dumps(geojson), ending='')

        self.stdout.write(']')
        self.stdout.write('}')
"""
