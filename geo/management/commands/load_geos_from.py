import logging
from typing import Iterator

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.feature import Feature
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from geo.models import Geo
from respondents.management.utils import save_batches

logger = logging.getLogger(__name__)


def geo_type(feature: Feature):
    """Inspect the feature to determine which type of geometry it represents"""
    return (
        (feature.get('TRACTCE') and Geo.TRACT_TYPE)
        or (feature.get('COUNTYFP') and feature.get('STATEFP')
            and Geo.COUNTY_TYPE)
        or (feature.get('LSAD') == 'M1' and Geo.METRO_TYPE)
        or (feature.get('LSAD') == 'M2' and Geo.MICRO_TYPE)
        or (feature.get('LSAD') == 'M3' and Geo.METDIV_TYPE)
    )


def parse_models(file_name: str, year: int) -> Iterator[Geo]:
    data_source = DataSource(file_name, encoding='iso-8859-1')
    if data_source.layer_count > 1:
        logger.warning('More than one layer in %s. Using first', file_name)
    layer = data_source[0]

    for feature in layer:
        # Convert everything into multi polygons
        if isinstance(feature.geom, Polygon):
            geom = MultiPolygon(feature.geom)
        else:
            geom = feature.geom

        model = Geo(
            geoid=f"{year}{feature.get('GEOID')}",
            geo_type=geo_type(feature),
            name=feature.get('NAME'),
            # Use ".get('field') or None" to convert empty strings into Nones
            state=feature.get('STATEFP') or None,
            county=feature.get('COUNTYFP') or None,
            tract=feature.get('TRACTCE') or None,
            csa=feature.get('CSAFP') or None,
            cbsa=feature.get('CBSAFP') or None,
            metdiv=feature.get('METDIVFP') or None,
            centlat=float(feature.get('INTPTLAT')),
            centlon=float(feature.get('INTPTLON')),
            geom=geom,
            year=year,
        )
        model.update_from_geom()
        model.clean_fields()
        yield model


class Command(BaseCommand):
    help = "Load shapes (tracts, counties, msas) from a shape file."

    def add_arguments(self, parser):
        parser.add_argument('year', type=int)
        parser.add_argument('file_name')
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        geos = parse_models(options['file_name'], options['year'])
        save_batches(geos, Geo, options['replace'])
