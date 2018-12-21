import argparse
import csv
import logging
from typing import Iterator, List, TextIO

from django.core.management.base import BaseCommand
from django.db.models.expressions import RawSQL

from geo import errors
from geo.models import Tract
from hmda.models import LARYear, LoanApplicationRecord
from mapusaurus.batch_utils import save_batches
from respondents.models import Institution
from tqdm import tqdm

logger = logging.getLogger(__name__)


def load_from_csv(csv_file: TextIO) -> Iterator[LoanApplicationRecord]:
    pbar = tqdm(csv.reader(csv_file), unit=" records")
    for idx, row in enumerate(pbar):
        record = LoanApplicationRecord(
            as_of_year=int(row[0]),
            respondent_id=row[1].strip(),
            agency_code=row[2].strip(),
            loan_type=row[3].strip(),
            property_type=int(row[4]),
            loan_purpose=int(row[5]),
            owner_occupancy=int(row[6]),
            loan_amount_000s=int(row[7] or '0'),
            preapproval=row[8].strip(),
            action_taken=int(row[9]),
            applicant_ethnicity=row[14].strip(),
            co_applicant_ethnicity=row[15].strip(),
            applicant_race_1=row[16].strip(),
            applicant_race_2=row[17].strip(),
            applicant_race_3=row[18].strip(),
            applicant_race_4=row[19].strip(),
            applicant_race_5=row[20].strip(),
            co_applicant_race_1=row[21].strip(),
            co_applicant_race_2=row[22].strip(),
            co_applicant_race_3=row[23].strip(),
            co_applicant_race_4=row[24].strip(),
            co_applicant_race_5=row[25].strip(),
            applicant_sex=int(row[26]),
            co_applicant_sex=int(row[27]),
            applicant_income_000s=row[28].strip(),
            purchaser_type=row[29].strip(),
            denial_reason_1=row[30].strip(),
            denial_reason_2=row[31].strip(),
            denial_reason_3=row[32].strip(),
            rate_spread=row[33].strip(),
            hoepa_status=row[34].strip(),
            lien_status=row[35].strip(),
            edit_status=row[36].strip(),
            sequence_number=(row[37] or str(idx)).zfill(8),
            application_date_indicator=0,
        )
        tract_id = row[11] + row[12] + row[13].replace('.', '')
        tract_id = errors.change_specific_year(tract_id, record.as_of_year)
        record.tract_id = tract_id
        record.institution_id = f"{record.as_of_year}{record.agency_code}"
        record.institution_id += record.respondent_id
        record.hmda_record_id = record.institution_id + record.sequence_number
        record.full_clean(
            exclude=['tract', 'institution'], validate_unique=False)
        yield record


def filter_by_fks(
        batch: List[LoanApplicationRecord]) -> List[LoanApplicationRecord]:
    """We don't want to insert records with no associated census tract or no
    associated bank."""
    tract_ids = set(
        Tract.objects.filter(pk__in={m.tract_id for m in batch})
        .values_list('pk', flat=True).distinct()
    )
    inst_ids = set(Institution.objects
                   .filter(pk__in={m.institution_id for m in batch})
                   .values_list('pk', flat=True).distinct())
    return [m for m in batch
            if m.tract_id in tract_ids and m.institution_id in inst_ids]


def update_num_loans():
    Institution.objects.update(num_loans=RawSQL("""
        SELECT count(*)
        FROM hmda_loanapplicationrecord
        WHERE hmda_loanapplicationrecord.institution_id =
            respondents_institution.institution_id
    """, tuple()))


class Command(BaseCommand):
    help = """ Load HMDA data (for all states)."""

    def add_arguments(self, parser):
        parser.add_argument('file_name', type=argparse.FileType('r'))
        parser.add_argument('--replace', action='store_true')

    def handle(self, *args, **options):
        models = load_from_csv(options['file_name'])
        save_batches(models, options['replace'], filter_by_fks,
                     batch_size=10000)
        options['file_name'].close()
        update_num_loans()
        LARYear.rebuild_all()
