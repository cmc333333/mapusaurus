import csv
import logging
from io import TextIOWrapper

import requests
from django.core.management.base import BaseCommand

from respondents.management.commands.load_reporter_panel import ReporterRow
from respondents.management.utils import fetch_and_unzip_file

logger = logging.getLogger(__name__)


def fetch_pre_2017(year: int):
    """Update institutions from a pre-2017 file format."""
    url = f"http://www.ffiec.gov/hmdarawdata/OTHER/{year}HMDAReporterPanel.zip"
    with fetch_and_unzip_file(url) as panel_file:
        for line in panel_file:
            ReporterRow.from_line(line).update_institution()


def fetch_post_2016(year: int):
    """Update institution from a CSV."""
    url = ("https://s3.amazonaws.com/cfpb-hmda-public/prod/snapshot-data/"
           f"{year}_public_panel_csv.zip")
    with fetch_and_unzip_file(url) as panel_file:
        csv_file = csv.reader(TextIOWrapper(panel_file, 'utf-8'))
        for line in csv_file:
            ReporterRow.from_csv_row(line).update_institution()


class Command(BaseCommand):
    help = "Download and load HMDA Reporter relationship files."

    def add_arguments(self, parser):
        choices = list(range(2012, 2018))
        parser.add_argument('--year', type=int, nargs='*', default=choices,
                            choices=choices,
                            help="Years to download. Defaults to >=2012")

    def handle(self, *args, **options):
        for year in options['year']:
            logger.info("Loading Reporter Panel for %s", year)
            try:
                if year > 2016:
                    fetch_post_2016(year)
                else:
                    fetch_pre_2017(year)
            except requests.exceptions.RequestException:
                logger.exception("Couldn't process year %s", year)
