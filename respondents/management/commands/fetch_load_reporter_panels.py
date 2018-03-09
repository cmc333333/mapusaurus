import logging
from datetime import date

import requests
from django.core.management.base import BaseCommand

from respondents.management.commands.load_reporter_panel import ReporterRow
from respondents.management.utils import fetch_and_unzip_file

ZIP_TPL = 'http://www.ffiec.gov/hmdarawdata/OTHER/{year}HMDAReporterPanel.zip'
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Download and load HMDA Reporter relationship files."

    def add_arguments(self, parser):
        this_year = date.today().year
        choices = list(range(2012, this_year))
        parser.add_argument('--year', type=int, nargs='*', default=choices,
                            choices=choices,
                            help="Years to download. Defaults to >=2012")

    def handle(self, *args, **options):
        for year in options['year']:
            logger.info("Loading Reporter Panel for %s", year)
            url = ZIP_TPL.format(year=year)
            try:
                with fetch_and_unzip_file(url) as panel_file:
                    for line in panel_file:
                        ReporterRow.from_line(line).update_institution()
            except requests.exceptions.RequestException:
                logger.exception("Couldn't process year %s", year)
