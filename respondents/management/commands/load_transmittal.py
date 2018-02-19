import argparse
import csv
import logging
from typing import BinaryIO, Dict, Iterator, List, TypeVar

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.db import transaction

from respondents.models import Institution, Agency
from respondents.zipcode_utils import create_zipcode

logger = logging.getLogger(__name__)


def fixup(line):
    """Account for misformatted data from FFIEC with one-off fixups"""
    if line[0] == '2016' and line[1] == '0000021122' and len(line) == 23:
        return line[:6] + line[7:]
    return line


def load_from_csv(agencies: Dict[int, Agency], csv_file: BinaryIO):
    transmittal_reader = csv.reader(csv_file, delimiter='\t')
    for zero_line_number, line in enumerate(transmittal_reader):
        line_number = zero_line_number + 1
        line = fixup(line)
        if len(line) != 22:
            logger.warning("Line %s is invalid, has length %s (expected 22)",
                           line_number, len(line))
            break
        year = line[0]
        zipcode_city = create_zipcode(
            city=line[6], state=line[7], year=year, zip_code=line[8])

        agency_id = line[2]
        if not agency_id.isdigit() or int(agency_id) not in agencies:
            logger.warning("Line %s has an invalid agency: %s",
                           line_number, agency_id)
            break

        assets = line[17]
        if not assets.isdigit():
            logger.warning("Line %s has an invalid asset amount: %s",
                           line_number, assets)
            break

        respondent_id = line[1]

        inst = Institution(
            year=year,
            respondent_id=line[1],
            agency=agencies[int(agency_id)],
            institution_id=f"{year}{agency_id}{respondent_id}",
            tax_id=line[3],
            name=line[4],
            mailing_address=line[5],
            zip_code=zipcode_city,
            assets=int(assets),
        )
        try:
            inst.clean_fields()
        except ValidationError:
            logger.exception('Line %s has invalid data:', line_number)
            break

        yield inst


T = TypeVar('T')


def batches(elts: Iterator[T], batch_size: int=100) -> Iterator[List[T]]:
    """Split an iterator of elements into an iterator of batches."""
    batch = []
    for elt in elts:
        if len(batch) == batch_size:
            yield batch
            batch = []
        batch.append(elt)
    yield batch


def load_save_batches(
        agencies: Dict[int, Agency], csv_file: BinaryIO, replace: bool=False):
    """Load Institutions from csv, replace duplicates if desired, then
    save."""
    institutions = load_from_csv(agencies, csv_file)
    count_saved, count_skipped = 0, 0
    for batch in batches(institutions):
        ids = {inst.institution_id for inst in batch}
        existing = Institution.objects.filter(institution_id__in=ids)
        if replace:
            existing.delete()
        else:
            existing_ids = {
                inst_id for inst_id
                in existing.values_list('institution_id', flat=True)
            }
            original_batch_size = len(batch)
            batch = [inst for inst in batch
                     if inst.institution_id not in existing_ids]
            count_skipped += original_batch_size - len(batch)
        Institution.objects.bulk_create(batch)
        count_saved += len(batch)
    logger.info('%s new respondents, %s skipped', count_saved, count_skipped)


class Command(BaseCommand):
    help = "Loads data from a HMDA Transmittal Sheet."

    def add_arguments(self, parser):
        parser.add_argument('file_name', type=argparse.FileType('r'))
        parser.add_argument('--replace', action='store_true')

    @transaction.atomic
    def handle(self, *args, **options):
        agencies = Agency.objects.get_all_by_code()
        load_save_batches(agencies, options['file_name'], options['replace'])
        options['file_name'].close()
