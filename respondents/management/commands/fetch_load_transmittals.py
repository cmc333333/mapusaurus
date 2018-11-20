import csv
import logging
from io import TextIOWrapper

import requests
from django.core.management.base import BaseCommand

from respondents.management.commands.load_transmittal import load_from_csv
from respondents.management.utils import fetch_and_unzip_file, save_batches
from respondents.models import Agency, Institution

logger = logging.getLogger(__name__)
FILE_URLS = {}
for year in range(2012, 2017):
    FILE_URLS[year] = (
        "http://www.ffiec.gov/hmdarawdata/OTHER/"
        f"{year}HMDAInstitutionRecords.zip"
    )
FILE_URLS[2017] = (
    "https://s3.amazonaws.com/cfpb-hmda-public/prod/snapshot-data/"
    "2017_public_ts_csv.zip"
)


class Command(BaseCommand):
    help = "Download and load HMDA Transmittal Sheets."

    def add_arguments(self, parser):
        choices = list(range(2012, 2018))
        parser.add_argument('--year', type=int, nargs='*', default=choices,
                            choices=choices,
                            help="Years to download. Defaults to >=2012")
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        agencies = Agency.objects.get_all_by_code()
        for year in options['year']:
            delimiter = ',' if year >= 2017 else '\t'
            logger.info("Loading Transmittal Sheet for %s", year)
            try:
                with fetch_and_unzip_file(FILE_URLS[year]) as transmittal_file:
                    csv_file = csv.reader(
                        TextIOWrapper(transmittal_file, 'utf-8'),
                        delimiter=delimiter,
                    )
                    institutions = load_from_csv(agencies, csv_file)
                    save_batches(institutions, Institution, options['replace'])
            except requests.exceptions.RequestException:
                logger.exception("Couldn't process year %s", year)
