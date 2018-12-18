import csv
import logging
from contextlib import contextmanager
from datetime import date
from typing import cast, Iterator, List, Set, TextIO

import requests
from django.core.management.base import BaseCommand
from tqdm import tqdm

from geo.models import CoreBasedStatisticalArea, Tract
from ffiec.models import CBSADemographics, INCOME_CHOICES, TractDemographics
from mapusaurus.batch_utils import save_batches
from mapusaurus.fetch_zip import fetch_and_unzip_dir

ZIP_TPL = "https://www.ffiec.gov/Census/Census_Flat_Files/Census{year}.zip"
logger = logging.getLogger(__name__)


def parse_tract_demographics(
        rows: Iterator[List[str]]) -> Iterator[TractDemographics]:
    for row in tqdm(rows, desc="Tracts Pass"):
        if row[1] == "99999":   # Small counties
            continue
        model = TractDemographics(
            year=int(row[0]),
            tract_id=row[2] + row[3] + row[4],
            persons=int(row[14]),
            families=int(row[15]),
            households=int(row[16]),
            females=int(row[17]),
            males=int(row[18]),
            non_white=int(row[19]),
            hispanic_only=int(row[22]),
            non_hispanic=int(row[23]),
            black=int(row[56]),
            american_indian=int(row[57]),
            asian=int(row[58]),
            pacific_islander=int(row[59]),
            in_households=int(row[83]),
            female_median_age=int(row[230]),
            male_median_age=int(row[231]),
            median_age=int(row[232]),
            male_adult=int(row[345]),
            male_employed=int(row[349]),
            female_adult=int(row[352]),
            female_employed=int(row[356]),
            median_household_income=int(row[376]),
            households_with_employment=int(row[540]),
            self_employed_households=int(row[543]),
            public_assistance=int(row[555]),
            median_family_income=int(row[580]),
            avg_family_income=int(row[744]),
            poverty=int(row[750]),
            poverty_households=int(row[809]),
            poverty_families=int(row[810]),
            occupied=int(row[876]),
            owner_occupied=int(row[879]),
            one_to_four_households=int(row[899]),
            median_year_house_built=int(row[952]),
            median_gross_rent=int(row[1002]),
            median_oo_housing_value=int(row[1086]),
            poverty_distressed=row[1205] == "X",
            unemployment_distressed=row[1206] == "X",
            population_distressed=row[1207] == "X",
            rural_underserved=row[1208] == "X",
            previous_distressed=row[1209] == "X",
            previous_underserved=row[1210] == "X",
            income_indicator=INCOME_CHOICES[int(row[1204])-1][0],
        )
        model.composite_key = str(model.year) + model.tract_id
        model.full_clean(exclude=["tract"], validate_unique=False)
        yield model


def existing_tracts(
        batch: List[TractDemographics]) -> List[TractDemographics]:
    """Only save demographics for Tracts that are in the DB."""
    tract_ids = set(
        Tract.objects.filter(pk__in={m.tract_id for m in batch})
        .values_list('pk', flat=True).distinct()
    )
    return [m for m in batch if m.tract_id in tract_ids]


def parse_cbsa_demographics(
        rows: Iterator[List[str]]) -> Iterator[CBSADemographics]:
    for row in tqdm(rows, desc="CBSA Pass"):
        model = CBSADemographics(
            year=int(row[0]),
            cbsa_id=row[1],
            median_family_income=int(row[10]),
            median_household_income=int(row[11]),
            ffiec_est_med_fam_income=int(row[13]),
        )
        model.composite_key = str(model.year) + model.cbsa_id
        model.full_clean(exclude=["cbsa"], validate_unique=False)
        yield model


def cbsa_rows(rows: Iterator[List[str]]) -> Iterator[List[str]]:
    """Find and yield the first FFIEC row for each CBSA. The FFIEC data has
    one tract per row, but repeats data about the mtro/micropolitan."""
    seen: Set[str] = set()
    for row in rows:
        cbsa = row[1].strip()
        if cbsa and cbsa not in seen:
            seen.add(cbsa)
            yield row


def existing_cbsas(batch: List[CBSADemographics]) -> List[CBSADemographics]:
    """Only save demographics for CBSAs that are in the DB."""
    cbsa_ids = set(
        CoreBasedStatisticalArea.objects.filter(
            pk__in={m.cbsa_id for m in batch})
        .values_list('pk', flat=True).distinct()
    )
    return [m for m in batch if m.cbsa_id in cbsa_ids]


@contextmanager
def fetch_csv(year: int) -> Iterator[TextIO]:
    """Fetch the zipped data directory, find the csv it contains and yield it.
    Clean up afterwards."""
    url = ZIP_TPL.format(year=year)
    with fetch_and_unzip_dir(url) as dir_path:
        csvs = (filename for filename in dir_path.iterdir()
                if filename.suffix.lower() == ".csv")
        with next(csvs).open() as csv_file:
            yield cast(TextIO, csv_file)


def load_demographics(
        year: int, load_tracts: bool, load_cbsas: bool, replace: bool):
    """Fetch CSV of demographic data and parse + load tracts/CBSAs from it."""
    with fetch_csv(year) as csv_file:
        if load_tracts:
            save_batches(
                parse_tract_demographics(csv.reader(csv_file)), replace,
                filter_fn=existing_tracts, batch_size=1000,
            )
            csv_file.seek(0)  # Reset for CBSAs

        if load_cbsas:
            rows = cbsa_rows(csv.reader(csv_file))
            save_batches(
                parse_cbsa_demographics(rows), replace,
                filter_fn=existing_cbsas, batch_size=1000,
            )


class Command(BaseCommand):
    help = "Fetches and loads FFIEC demographics data"

    def add_arguments(self, parser):
        parser.add_argument(
            '--years', type=int, nargs='*', help="FFIEC Demographics Years",
            default=range(2012, date.today().year + 1),
        )
        parser.add_argument("--replace", action="store_true",
                            help="Replace existing records")
        parser.add_argument(
            "--no-tracts", dest="load_tracts", action="store_false",
            help="Do not load tract-level data",
        )
        parser.add_argument(
            "--no-cbsas", dest="load_cbsas", action="store_false",
            help="Do not load CBSA-level data",
        )
        parser.set_defaults(load_cbsas=True, load_tracts=True)

    def handle(self, *args, **options):
        pbar = tqdm(options["years"])
        for year in pbar:
            pbar.set_description(str(year))
            try:
                load_demographics(
                    year, options["load_tracts"], options["load_cbsas"],
                    options["replace"],
                )
            except requests.exceptions.RequestException:
                logger.exception("Problem retrieving %s", year)
