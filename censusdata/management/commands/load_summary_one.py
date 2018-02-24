import csv
from typing import BinaryIO, Dict, Iterator, List, NewType, Tuple, Type

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Model, QuerySet

from censusdata.models import (
    Census2010Age, Census2010HispanicOrigin, Census2010Households,
    Census2010Race, Census2010RaceStats, Census2010Sex)
from geo import errors
from geo.models import Geo

RecordId = NewType('RecordId', str)
TractId = NewType('TractId', str)
TractByRecord = Dict[RecordId, TractId]
File3Models = Tuple[Census2010Race, Census2010HispanicOrigin,
                    Census2010RaceStats]
File4Models = Tuple[Census2010Sex, Census2010Age]
File5Models = Tuple[Census2010Households]
AGE_FIELDS = (
    'under_five', 'five_nine', 'ten_fourteen', 'fifteen_seventeen',
    'eighteen_nineteen', 'twenty', 'twentyone', 'twentytwo_twentyfour',
    'twentyfive_twentynine', 'thirty_thirtyfour', 'thirtyfive_thirtynine',
    'forty_fortyfour', 'fortyfive_fortynine', 'fifty_fiftyfour',
    'fiftyfive_fiftynine', 'sixty_sixtyone', 'sixtytwo_sixtyfour',
    'sixtyfive_sixtysix', 'sixtyseven_sixynine', 'seventy_seventyfour',
    'seventyfive_seventynine', 'eighty_eightyfour', 'eightyfive_up',
)
HOUSEHOLD_FIELDS = (
    'total', 'total_family', 'husband_wife', 'total_family_other',
    'male_no_wife', 'female_no_husband', 'total_nonfamily', 'living_alone',
    'not_living_alone',
)


def make_file_loader(model_classes: List[Type[Model]], parser):
    """Bulk create Census2010 stat models using the parser function. Skip if
    data's already loaded."""
    @transaction.atomic
    def load_file(datafile: BinaryIO, geo_query: QuerySet, replace: bool,
                  tracts: TractByRecord):
        skip = all(model_class.objects.filter(geoid__in=geo_query).exists()
                   for model_class in model_classes)

        if replace or not skip:
            for model_class in model_classes:
                model_class.objects.filter(geoid__in=geo_query).delete()

            untupled_models = zip(*list(parser(datafile, tracts)))
            for model_class, models in zip(model_classes, untupled_models):
                models = list(models)
                model_class.objects.bulk_create(models)
    return load_file


def file3_models(datafile: BinaryIO,
                 tracts: TractByRecord) -> Iterator[File3Models]:
    """File three contains race and ethnicity summaries. Documentation starts
    at page 6-22"""
    for row in csv.reader(datafile):
        recordnum = RecordId(row[4])
        geoid_id = tracts.get(recordnum)
        if geoid_id:
            race = Census2010Race(
                total_pop=row[5],
                white_alone=row[6],
                black_alone=row[7],
                amind_alone=row[8],
                asian_alone=row[9],
                pacis_alone=row[10],
                other_alone=row[11],
                two_or_more=row[12],
                geoid_id=geoid_id,
            )
            race.clean_fields()

            hisp = Census2010HispanicOrigin(
                total_pop=row[13],
                non_hispanic=row[14],
                hispanic=row[15],
                geoid_id=geoid_id,
            )
            hisp.clean_fields()

            stat = Census2010RaceStats(
                total_pop=int(row[16]),
                hispanic=int(row[25]),
                non_hisp_white_only=int(row[18]),
                non_hisp_black_only=int(row[19]),
                non_hisp_asian_only=int(row[21]),
                geoid_id=geoid_id,
            )
            stat.auto_fields()
            stat.clean_fields()

            yield (race, hisp, stat)


def file4_models(datafile: BinaryIO,
                 tracts: TractByRecord) -> Iterator[File4Models]:
    """File four contains age demographics and correlations with race,
    ethnicity, and sex. Documentation starts at page 6-30"""
    for row in csv.reader(datafile):
        recordnum = RecordId(row[4])
        geoid_id = tracts.get(recordnum)
        if geoid_id:
            sex = Census2010Sex(
                total_pop=row[149],
                male=row[150],
                female=row[174],
                geoid_id=geoid_id,
            )
            sex.clean_fields()

            age = Census2010Age(total_pop=row[149], geoid_id=geoid_id)
            for idx, field_name in enumerate(AGE_FIELDS):
                male_count = int(row[151 + idx])
                female_count = int(row[175 + idx])
                setattr(age, field_name, male_count + female_count)
            age.clean_fields()

            yield (sex, age)


def file5_models(datafile: BinaryIO,
                 tracts: TractByRecord) -> Iterator[File5Models]:
    """File five contains household metrics, including divisions by household
    type, household size, etc. Documentation starts at page 6-38"""
    for row in csv.reader(datafile):
        recordnum = RecordId(row[4])
        geoid_id = tracts.get(recordnum)
        if geoid_id:
            household = Census2010Households(geoid_id=geoid_id)
            for idx, field_name in enumerate(HOUSEHOLD_FIELDS):
                setattr(household, field_name, row[28 + idx])
            household.clean_fields()

            yield (household,)


load_file_three = make_file_loader(File3Models.__args__, file3_models)
load_file_four = make_file_loader(File4Models.__args__, file4_models)
load_file_five = make_file_loader(File5Models.__args__, file5_models)


def load_state_tracts(datafile: BinaryIO,
                      year: int) -> Tuple[str, TractByRecord]:
    # As each file covers one state, all tracts will have the same state id
    state = ''
    tracts = {}
    for line in datafile:
        if line[8:11] == '140':    # Aggregated by Census Tract
            recordnum = RecordId(line[18:25])
            censustract = line[27:32] + line[54:60]
            censustract = errors.in_2010.get(censustract, censustract)
            censustract = errors.change_specific_year(censustract,
                                                      year)
            if censustract is not None:
                tracts[recordnum] = TractId(f"{year}{censustract}")
            state = line[27:29]
    return (state, tracts)


class Command(BaseCommand):
    """Loads Summary File 1 data from the decennial census. Official
    documentation for fields at
    http://www.census.gov/prod/cen2010/doc/sf1.pdf"""
    help = """
        Load Decennial Census data for a state.
        Assumes XX#####2010.sf1 files are in the same directory."""

    def add_arguments(self, parser):
        parser.add_argument('file_name')
        parser.add_argument('year', type=int)
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        year = options['year']
        geofile_name = options['file_name']
        with open(geofile_name, 'r') as geofile:
            state, tracts = load_state_tracts(geofile, year)

        geo_query = Geo.objects.filter(state=state, year=year)
        replace = options['replace']

        with open(geofile_name[:-11] + '000032010.sf1') as file3:
            load_file_three(file3, geo_query, replace, tracts)
        with open(geofile_name[:-11] + "000042010.sf1") as file4:
            load_file_four(file4, geo_query, replace, tracts)
        with open(geofile_name[:-11] + "000052010.sf1") as file5:
            load_file_five(file5, geo_query, replace, tracts)
