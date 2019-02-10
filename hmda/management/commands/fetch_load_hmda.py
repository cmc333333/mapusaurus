import logging
from io import TextIOWrapper

import requests
from django.core.management.base import BaseCommand
from tqdm import tqdm

from hmda.management.commands.load_hmda import (filter_by_fks, load_from_csv,
                                                update_num_loans)
from hmda.models import LARYear
from mapusaurus.batch_utils import save_batches
from mapusaurus.fetch_zip import fetch_and_unzip_file

logger = logging.getLogger(__name__)
FILE_URLS = {}
for year in range(2012, 2017):
    FILE_URLS[year] = (
        "https://www.ffiec.gov/hmdarawdata/LAR/National/"
        f"{year}HMDALAR%20-%20National.zip"
    )
FILE_URLS[2017] = (
    "https://s3.amazonaws.com/cfpb-hmda-public/prod/snapshot-data/"
    "2017_public_lar_csv.zip"
)


class Command(BaseCommand):
    help = "Download and load HMDA LARs."""

    def add_arguments(self, parser):
        choices = list(range(2012, 2018))
        parser.add_argument("--year", type=int, nargs="*", default=choices,
                            choices=choices,
                            help="Years to download. Defaults to >=2012")
        parser.add_argument("--replace", action="store_true")

    def handle(self, *args, **options):
        year_pbar = tqdm(options["year"])
        for year in year_pbar:
            year_pbar.set_description(f"{year}")
            try:
                with fetch_and_unzip_file(FILE_URLS[year]) as lar_file:
                    models = load_from_csv(TextIOWrapper(lar_file, "utf-8"))
                    save_batches(models, options["replace"], filter_by_fks,
                                 batch_size=10000)
            except requests.exceptions.RequestException:
                logger.exception("Couldn't process year %s", year)
        update_num_loans()
        LARYear.rebuild_all()
