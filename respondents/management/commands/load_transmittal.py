import argparse
import csv
import logging
from typing import Dict, Iterator, List

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand

from mapusaurus.batch_utils import save_batches
from respondents.models import Agency, Institution
from respondents.zipcode_utils import create_zipcode

logger = logging.getLogger(__name__)


def fixup(line):
    """Account for misformatted data from FFIEC with one-off fixups"""
    if line[0] == "2016" and line[1] == "0000021122" and len(line) == 23:
        return line[:6] + line[7:]
    return line


def load_from_csv(
        agencies: Dict[int, Agency], transmittal_reader: Iterator[List[str]]):
    for zero_line_number, line in enumerate(transmittal_reader):
        line_number = zero_line_number + 1
        line = fixup(line)
        if len(line) not in (15, 22):
            logger.warning(
                "Line %s is invalid, has length %s (expected 15 or 22)",
                line_number,
                len(line),
            )
            break
        year = int(line[0])
        zipcode_city = create_zipcode(
            city=line[6], state=line[7], year=year, zip_code=line[8])

        agency_id = line[2]
        if not agency_id.isdigit() or int(agency_id) not in agencies:
            logger.warning("Line %s has an invalid agency: %s",
                           line_number, agency_id)
            break

        if len(line) == 22 and not line[17].isdigit():
            logger.warning("Line %s has an invalid asset amount: %s",
                           line_number, line[17])
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
            assets=int(line[17]) if len(line) == 22 else None,
        )
        try:
            inst.full_clean(exclude=["agency"], validate_unique=False)
        except ValidationError:
            logger.exception("Line %s has invalid data:", line_number)
            break

        yield inst


class Command(BaseCommand):
    help = "Loads data from a HMDA Transmittal Sheet."

    def add_arguments(self, parser):
        parser.add_argument("file_name", type=argparse.FileType("r"))
        parser.add_argument("--replace", action="store_true")
        parser.add_argument("--delimiter", default="\t")

    def handle(self, *args, **options):
        agencies = Agency.objects.get_all_by_code()
        transmittal_reader = csv.reader(
            options["file_name"], delimiter=options["delimiter"])
        institutions = load_from_csv(agencies, transmittal_reader)
        save_batches(institutions, options["replace"], batch_size=1000)
        options["file_name"].close()
