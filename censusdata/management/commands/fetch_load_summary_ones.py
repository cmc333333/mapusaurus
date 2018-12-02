import logging
from contextlib import contextmanager
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import cast, Iterator, NamedTuple, TextIO
from zipfile import ZipFile

import requests
import us
from django.core.management.base import BaseCommand

from geo.models import Geo
from censusdata.management.commands.load_summary_one import (
    load_file_three, load_file_four, load_file_five, load_state_tracts)

ZIP_TPL = ('https://www2.census.gov/census_2010/04-Summary_File_1/'
           '{underscore}/{abbr}2010.sf1.zip')
logger = logging.getLogger(__name__)


def relevant_years(state: us.states.State) -> Iterator[int]:
    """We'll only load summary data for state-years which we have census
    tracts."""
    query = Geo.objects\
        .filter(state=state.fips, geo_type=Geo.TRACT_TYPE)\
        .values_list('year', flat=True)\
        .distinct()
    yield from query


class Summary1Files(NamedTuple):
    geofile: Path
    file3: Path
    file4: Path
    file5: Path

    def load_data(self, replace: bool, year: int):
        """Insert the associated summary data into the db, attaching it to
        year-specific geos."""
        with self.geofile.open(encoding='latin') as geofile:
            state_fips, tracts = load_state_tracts(
                cast(TextIO, geofile), year)

        geo_query = Geo.objects.filter(state=state_fips, year=year)

        with self.file3.open() as file3:
            load_file_three(file3, geo_query, replace, tracts)
        with self.file4.open() as file4:
            load_file_four(file4, geo_query, replace, tracts)
        with self.file5.open() as file5:
            load_file_five(file5, geo_query, replace, tracts)


@contextmanager
def fetch_and_unzip(state: us.states.State) -> Iterator[Summary1Files]:
    """Fetch an archive containing all of the summary data for a specific
    state. Unzip the files we care about and yield their Summary1Files
    wrapper."""
    abbr = state.abbr.lower()
    file_names = (
        f"{abbr}geo2010.sf1",
        f"{abbr}000032010.sf1",
        f"{abbr}000042010.sf1",
        f"{abbr}000052010.sf1",
    )
    url = ZIP_TPL.format(underscore=state.name.replace(' ', '_'), abbr=abbr)
    with TemporaryDirectory() as tmp_dir:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        resp_buffer = BytesIO(response.content)
        with ZipFile(resp_buffer) as archive:
            for file_name in file_names:
                archive.extract(file_name, tmp_dir)
        yield Summary1Files(*(Path(tmp_dir) / file_name
                              for file_name in file_names))


class Command(BaseCommand):
    help = "Fetches and loads 2010 census data."

    def add_arguments(self, parser):
        parser.add_argument('--state', type=us.states.lookup, nargs='*',
                            default=us.STATES, choices=us.STATES)
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        for state in options['state']:
            years = list(relevant_years(state))
            if not years:
                logger.info('No geos for %s; skipping', state)
                continue
            logger.info('Loading data for %s', state)
            try:
                with fetch_and_unzip(state) as summary_files:
                    for year in years:
                        summary_files.load_data(options['replace'], year)
            except requests.exceptions.RequestException:
                logger.exception('Problem retrieving %s', state)
