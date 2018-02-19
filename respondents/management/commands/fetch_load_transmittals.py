import logging
from contextlib import contextmanager
from datetime import date
from io import BytesIO, TextIOWrapper
from zipfile import ZipFile

import requests
from django.core.management.base import BaseCommand

from respondents.management.commands.load_transmittal import load_save_batches
from respondents.models import Agency

ZIP_TPL = ('http://www.ffiec.gov/hmdarawdata/OTHER/'
           '{year}HMDAInstitutionRecords.zip')
logger = logging.getLogger(__name__)


@contextmanager
def fetch_and_unzip_file(url: str):
    response = requests.get(url, stream=True, timeout=120)
    response.raise_for_status()
    resp_buffer = BytesIO(response.content)
    with ZipFile(resp_buffer) as archive:
        file_name = archive.namelist().pop()
        with archive.open(file_name) as unzipped_file:
            yield unzipped_file


class Command(BaseCommand):
    help = "Download and load HMDA Transmittal Sheets."

    def add_arguments(self, parser):
        this_year = date.today().year
        choices = list(range(2013, this_year))
        parser.add_argument('--year', type=int, nargs='*', default=choices,
                            choices=choices,
                            help="Years to download. Defaults to >=2013")
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        agencies = Agency.objects.get_all_by_code()
        for year in options['year']:
            logger.info("Loading Transmittal Sheet for %s", year)
            url = ZIP_TPL.format(year=year)
            try:
                with fetch_and_unzip_file(url) as transmittal_file:
                    load_save_batches(
                        agencies,
                        TextIOWrapper(transmittal_file, 'utf-8'),
                        options['replace'],
                    )
            except requests.exceptions.RequestException:
                logger.exception("Couldn't process year %s", year)
