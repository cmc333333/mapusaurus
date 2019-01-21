import csv
import logging
from contextlib import contextmanager
from datetime import date
from typing import cast, Iterator, List, Set, TextIO

import requests
from django.core.management.base import BaseCommand
from tqdm import tqdm

from geo.models import CoreBasedStatisticalArea, MetroDivision, State, Tract
from ffiec.models import (
    CBSADemographics, INCOME_CHOICES, LowPopulationDemographics,
    MetDivDemographics, TractDemographics,
)
from mapusaurus.batch_utils import make_filter_fn, save_batches
from mapusaurus.fetch_zip import fetch_and_unzip_dir

ZIP_TPL = "https://www.ffiec.gov/Census/Census_Flat_Files/Census{year}.zip"
logger = logging.getLogger(__name__)
CSV_ROW = List[str]
CSV_ROWS = Iterator[CSV_ROW]


def parse_tract_demographics(rows: CSV_ROWS) -> Iterator[TractDemographics]:
    for row in tqdm(rows, desc="Tracts Pass"):
        if row[4] == "999999" or not row[14] or not row[17]:
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
            non_hispanic_white=int(row[25]),
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
            median_family_income=int(row[580]),
            avg_family_income=int(row[744]),
            poverty=int(row[750]),
            poverty_households=int(row[809]),
            poverty_families=int(row[810]),
            single_family_homes=int(row[889]) + int(row[890]),
            one_to_four_households=int(row[899]),
            single_family_occupied=int(row[916]) + int(row[917]),
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


def parse_cbsa_demographics(rows: CSV_ROWS) -> Iterator[CBSADemographics]:
    seen: Set[str] = set()
    for row in tqdm(rows, desc="CBSA Pass"):
        cbsa_id = row[1]
        if cbsa_id == "99999" or cbsa_id in seen:
            continue
        seen.add(cbsa_id)
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


def parse_metdiv_demographics(rows: CSV_ROWS) -> Iterator[MetDivDemographics]:
    seen: Set[str] = set()
    for row in tqdm(rows, desc="Metro Division Pass"):
        metdiv_id = row[1]
        if metdiv_id == "99999" or metdiv_id in seen:
            continue
        seen.add(metdiv_id)
        model = MetDivDemographics(
            year=int(row[0]),
            metdiv_id=row[1],
            median_family_income=int(row[10]),
            median_household_income=int(row[11]),
            ffiec_est_med_fam_income=int(row[13]),
        )
        model.composite_key = str(model.year) + model.metdiv_id
        model.full_clean(exclude=["metdiv"], validate_unique=False)
        yield model


def parse_low_pop_demographics(
        rows: CSV_ROWS) -> Iterator[LowPopulationDemographics]:
    seen: Set[str] = set()
    for row in tqdm(rows, desc="Low-population Pass"):
        state_id = row[2]
        if row[1] != "99999" or state_id in seen or not row[10]:
            continue
        seen.add(state_id)
        model = LowPopulationDemographics(
            year=int(row[0]),
            state_id=state_id,
            median_family_income=int(row[10]),
            median_household_income=int(row[11]),
            ffiec_est_med_fam_income=int(row[13]),
        )
        model.composite_key = str(model.year) + model.state_id
        model.full_clean(exclude=["state"], validate_unique=False)
        yield model


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
        year: int, load_tracts: bool, load_cbsas: bool, load_metdivs: bool,
        load_low_pops: bool, replace: bool):
    """Fetch CSV of demographic data and parse + load tracts/CBSAs from it."""
    with fetch_csv(year) as csv_file:
        if load_tracts:
            rows = cast(CSV_ROWS, csv.reader(csv_file))
            save_batches(
                parse_tract_demographics(rows), replace,
                filter_fn=make_filter_fn(Tract, "tract_id"), batch_size=1000,
            )
            csv_file.seek(0)  # Reset

        if load_cbsas:
            rows = cast(CSV_ROWS, csv.reader(csv_file))
            save_batches(
                parse_cbsa_demographics(rows), replace,
                filter_fn=make_filter_fn(CoreBasedStatisticalArea, "cbsa_id"),
                batch_size=1000,
            )
            csv_file.seek(0)  # Reset

        if load_metdivs:
            rows = cast(CSV_ROWS, csv.reader(csv_file))
            save_batches(
                parse_metdiv_demographics(rows), replace,
                filter_fn=make_filter_fn(MetroDivision, "metdiv_id"),
                batch_size=1000,
            )
            csv_file.seek(0)  # Reset

        if load_low_pops:
            rows = cast(CSV_ROWS, csv.reader(csv_file))
            save_batches(
                parse_low_pop_demographics(rows), replace,
                filter_fn=make_filter_fn(State, "state_id"), batch_size=1000,
            )
            csv_file.seek(0)  # Reset


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
        parser.add_argument(
            "--no-metdivs", dest="load_metdivs", action="store_false",
            help="Do not load Metro Division-level data",
        )
        parser.add_argument(
            "--no-low-pops", dest="load_low_pops", action="store_false",
            help="Do not load Low-Population data",
        )
        parser.set_defaults(
            load_cbsas=True, load_metdivs=True, load_tracts=True,
            load_low_pop=True)

    def handle(self, *args, **options):
        pbar = tqdm(options["years"])
        for year in pbar:
            pbar.set_description(str(year))
            try:
                load_demographics(
                    year, options["load_tracts"], options["load_cbsas"],
                    options["load_metdivs"], options["load_low_pops"],
                    options["replace"],
                )
            except requests.exceptions.RequestException:
                logger.exception("Problem retrieving %s", year)
