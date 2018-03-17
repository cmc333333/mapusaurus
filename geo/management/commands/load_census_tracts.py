import logging
from datetime import date
from os.path import basename
from typing import Iterator

import requests
import us
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.layer import Layer
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand
from tqdm import tqdm

from geo.management.commands.fetch_load_geos import fetch_and_unzip_dir
from geo.models import CensusTract
from respondents.management.utils import save_batches

ZIP_TPL = ('https://www2.census.gov/geo/tiger/TIGER{year}/TRACT/'
           'tl_{year}_{fips}_tract.zip')
logger = logging.getLogger(__name__)


def default_year() -> int:
    """Try the current year of TIGER files, but use last year if it's not
    published yet."""
    this_year = date.today().year
    response = requests.head(ZIP_TPL.format(year=this_year, fips='01'))
    if response.status_code == requests.codes.ok:
        return this_year
    else:
        return this_year - 1


def parse_layer(file_name: str) -> Layer:
    """Pull single Layer out of DataSource."""
    data_source = DataSource(file_name, encoding='iso-8859-1')
    if data_source.layer_count > 1:
        logger.warning('More than one layer in %s. Using first', file_name)
    return data_source[0]


def parse_models(layer: Layer) -> Iterator[CensusTract]:
    """Generate a CensusTract for each feature in the Layer."""
    for feature in tqdm(layer, leave=False, desc='Tracts'):
        # Convert everything into multi polygons
        geom = GEOSGeometry(feature.geom.wkb)
        if isinstance(geom, Polygon):
            geom = MultiPolygon(geom)

        model = CensusTract(
            geoid=feature.get('GEOID'),
            name=feature.get('NAME'),
            interior_lat=float(feature.get('INTPTLAT')),
            interior_lon=float(feature.get('INTPTLON')),
            state=int(feature.get('STATEFP')),
            county=int(feature.get('COUNTYFP')),
            tract=int(feature.get('TRACTCE')),
            geom=geom,
        )
        model.full_clean(validate_unique=False)
        yield model


def load_tracts_for_state(state: us.states.State, year: int, replace: bool):
    """Fetch zip file of census tracts for a single state. Parse it and save
    the embedded geos to the database."""
    url = ZIP_TPL.format(year=year, fips=state.fips)
    file_name = basename(url)
    try:
        with fetch_and_unzip_dir(url) as dir_path:
            shp_name = file_name[:-4] + '.shp'
            layer = parse_layer(str(dir_path / shp_name))
            tracts = parse_models(layer)
            save_batches(tracts, CensusTract, replace, log=False)
    except requests.exceptions.RequestException:
        logger.exception('Problem retrieving %s', url)


class Command(BaseCommand):
    help = "Fetches and loads census tracts from TIGER."

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, default=default_year(),
                            help="TIGER source year")

        choices = us.STATES + us.TERRITORIES
        parser.add_argument('--state', type=us.states.lookup, nargs='*',
                            default=choices, choices=choices)
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        year = options['year']
        states_pbar = tqdm(options['state'])
        for state in states_pbar:
            states_pbar.set_description(f"{state}")
            load_tracts_for_state(state, year, options['replace'])
