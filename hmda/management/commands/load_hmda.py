import argparse
import csv
import logging
from typing import BinaryIO, Iterator, List

from django.core.management.base import BaseCommand
from django.db.models.expressions import RawSQL

from geo import errors
from geo.models import Geo
from hmda.models import HMDARecord
from respondents.models import Institution
from respondents.management.utils import save_batches

logger = logging.getLogger(__name__)


def load_from_csv(csv_file: BinaryIO) -> Iterator[HMDARecord]:
    for row in csv.reader(csv_file):
        record = HMDARecord(
            as_of_year=row[0],
            respondent_id=row[1],
            agency_code=row[2],
            loan_type=row[3],
            property_type=row[4],
            loan_purpose=row[5],
            owner_occupancy=row[6],
            loan_amount_000s=row[7],
            preapproval=row[8],
            action_taken=row[9],
            msamd=row[10],
            statefp=row[11],
            countyfp=row[12],
            census_tract_number=row[13],
            applicant_ethnicity=row[14],
            co_applicant_ethnicity=row[15],
            applicant_race_1=row[16],
            applicant_race_2=row[17],
            applicant_race_3=row[18],
            applicant_race_4=row[19],
            applicant_race_5=row[20],
            co_applicant_race_1=row[21],
            co_applicant_race_2=row[22],
            co_applicant_race_3=row[23],
            co_applicant_race_4=row[24],
            co_applicant_race_5=row[25],
            applicant_sex=row[26],
            co_applicant_sex=row[27],
            applicant_income_000s=row[28],
            purchaser_type=row[29],
            denial_reason_1=row[30],
            denial_reason_2=row[31],
            denial_reason_3=row[32],
            rate_spread=row[33],
            hoepa_status=row[34],
            lien_status=row[35],
            edit_status=row[36],
            sequence_number=row[37],
            population=row[38],
            minority_population=row[39],
            ffieic_median_family_income=row[40],
            tract_to_msamd_income=row[41],
            number_of_owner_occupied_units=row[42],
            number_of_1_to_4_family_units=row[43],
            application_date_indicator=row[44],
        )
        censustract = row[11] + row[12] + row[13].replace('.', '')
        censustract = errors.change_specific_year(censustract,
                                                  record.as_of_year)
        record.geo_id = f"{record.as_of_year}{censustract}"
        record.institution_id = f"{record.as_of_year}{record.agency_code}"
        record.institution_id += record.respondent_id
        record.hmda_record_id = record.institution_id + record.sequence_number
        yield record


def filter_by_fks(batch: List[HMDARecord]) -> List[HMDARecord]:
    """We don't want to insert records with no associated census tract or no
    associated bank."""
    geo_ids = set(Geo.objects.filter(pk__in={m.geo_id for m in batch})
                  .values_list('pk', flat=True).distinct())
    inst_ids = set(Institution.objects
                   .filter(pk__in={m.institution_id for m in batch})
                   .values_list('pk', flat=True).distinct())
    return [m for m in batch
            if m.geo_id in geo_ids and m.institution_id in inst_ids]


def update_num_loans():
    Institution.objects.update(num_loans=RawSQL("""
        SELECT count(*)
        FROM hmda_hmdarecord
        WHERE hmda_hmdarecord.institution_id =
            respondents_institution.institution_id
    """, tuple()))


class Command(BaseCommand):
    help = """ Load HMDA data (for all states)."""

    def add_arguments(self, parser):
        parser.add_argument('file_name', type=argparse.FileType('r'))
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        models = load_from_csv(options['file_name'])
        save_batches(models, HMDARecord, options['replace'], filter_by_fks,
                     batch_size=10000)
        options['file_name'].close()
        update_num_loans()
