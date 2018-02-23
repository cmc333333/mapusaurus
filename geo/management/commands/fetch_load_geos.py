import logging
from contextlib import contextmanager
from datetime import date
from io import BytesIO
from os.path import basename
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Iterator, List, Tuple
from zipfile import ZipFile

import requests
import us
from django.core.management.base import BaseCommand

from geo.management.commands.load_geos_from import parse_models
from geo.models import Geo
from respondents.management.utils import save_batches

ZIP_TPL = ('https://www2.census.gov/geo/tiger/TIGER{year}/{shape}/'
           'tl_{year}_{fips}_{shape_lower}.zip')
logger = logging.getLogger(__name__)


def all_years_urls(shapes: List[str], states: List[us.states.State],
                   years: List[int]) -> Iterator[Tuple[int, str]]:
    for shape in shapes:
        fips = [s.fips for s in states] if shape == 'TRACT' else ['us']
        for fips_number in fips:
            for year in years:
                yield (
                    year,
                    ZIP_TPL.format(fips=fips_number, shape=shape,
                                   shape_lower=shape.lower(), year=year),
                )


@contextmanager
def fetch_and_unzip_dir(url: str) -> Path:
    with TemporaryDirectory() as tmp_dir:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        resp_buffer = BytesIO(response.content)
        with ZipFile(resp_buffer) as archive:
            archive.extractall(tmp_dir)
        yield Path(tmp_dir)


class Command(BaseCommand):
    help = "Fetches and loads shape files from TIGER."

    def add_arguments(self, parser):
        this_year = date.today().year
        year_choices = list(range(2013, this_year))
        parser.add_argument('--year', type=int, nargs='*',
                            default=year_choices, choices=year_choices,
                            help="Years to download. Defaults to >= 2013")

        shape_choices = ('TRACT', 'COUNTY', 'CBSA', 'METDIV')
        parser.add_argument('--shape', nargs='*', default=shape_choices,
                            choices=shape_choices, help="Defaults to all")

        parser.add_argument('--state', type=us.states.lookup, nargs='*',
                            default=us.STATES + us.TERRITORIES),
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        for year, url in all_years_urls(options['shape'], options['state'],
                                        options['year']):
            file_name = basename(url)
            logger.info('Loading data for %s', file_name)
            try:
                with fetch_and_unzip_dir(url) as dir_path:
                    shp_name = file_name[:-4] + '.shp'
                    geos = parse_models(str(dir_path / shp_name), year)
                    save_batches(geos, Geo, options['replace'])
            except requests.exceptions.RequestException:
                logger.exception('Problem retrieving %s', url)
