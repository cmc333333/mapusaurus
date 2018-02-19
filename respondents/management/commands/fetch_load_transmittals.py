import logging
from datetime import date
from io import TextIOWrapper

import requests
from django.core.management.base import BaseCommand

from respondents.management.commands.load_transmittal import load_save_batches
from respondents.management.utils import fetch_and_unzip_file
from respondents.models import Agency

ZIP_TPL = ('http://www.ffiec.gov/hmdarawdata/OTHER/'
           '{year}HMDAInstitutionRecords.zip')
logger = logging.getLogger(__name__)


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
