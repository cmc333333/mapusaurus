import logging
from typing import Iterator

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.feature import Feature
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand

from geo.models import Geo
from respondents.management.utils import save_batches

logger = logging.getLogger(__name__)
optional_feature_fields = {
    'state': 'STATEFP',
    'county': 'COUNTYFP',
    'tract': 'TRACTCE',
    'csa': 'CSAFP',
    'cbsa': 'CBSAFP',
    'metdiv': 'METDIVFP',
}


def geo_type(feature: Feature):
    """Inspect the feature to determine which type of geometry it represents"""
    if b'TRACTCE' in feature.fields and feature.get('TRACTCE'):
        return Geo.TRACT_TYPE
    if (b'COUNTYFP' in feature.fields and b'STATEFP' in feature.fields
            and feature.get('COUNTYFP') and feature.get('STATEFP')):
        return Geo.COUNTY_TYPE
    if b'LSAD' in feature.fields and feature.get('LSAD') == 'M1':
        return Geo.METRO_TYPE
    if b'LSAD' in feature.fields and feature.get('LSAD') == 'M2':
        return Geo.MICRO_TYPE
    if b'LSAD' in feature.fields and feature.get('LSAD') == 'M3':
        return Geo.METDIV_TYPE


def parse_models(file_name: str, year: int) -> Iterator[Geo]:
    data_source = DataSource(file_name, encoding='iso-8859-1')
    if data_source.layer_count > 1:
        logger.warning('More than one layer in %s. Using first', file_name)
    layer = data_source[0]

    for feature in layer:
        # Convert everything into multi polygons
        geom = GEOSGeometry(feature.geom.wkb)
        if isinstance(geom, Polygon):
            geom = MultiPolygon(geom)

        model = Geo(
            geoid=f"{year}{feature.get('GEOID')}",
            geo_type=geo_type(feature),
            name=feature.get('NAME'),
            centlat=float(feature.get('INTPTLAT')),
            centlon=float(feature.get('INTPTLON')),
            geom=geom,
            year=year,
        )
        for model_field, feature_field in optional_feature_fields.items():
            if feature_field.encode('utf-8') in feature.fields:
                # Use "or None" to convert '' into None
                setattr(model, model_field, feature.get(feature_field) or None)
            else:
                setattr(model, model_field, None)

        model.update_from_geom()
        model.full_clean(validate_unique=False)
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
