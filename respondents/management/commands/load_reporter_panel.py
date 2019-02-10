import argparse
import logging
from typing import List, NamedTuple

from django.core.management.base import BaseCommand

from respondents.models import Institution, ParentInstitution

logger = logging.getLogger(__name__)


class ReporterRow(NamedTuple):
    year: str
    respondent_id: str
    agency_code: int
    parent_id: str
    parent_name: str
    parent_city: str
    parent_state: str
    region: str
    assets: str
    lender_code: str
    respondent_name: str
    filler_1: str
    respondent_city: str
    respondent_state: str
    filler_2: str
    filler_3: str
    top_holder_rssd_id: str
    top_holder_name: str
    top_holder_city: str
    top_holder_state: str
    top_holder_country: str
    respondent_rssd_id: str
    parent_rssd_id: str
    respondent_fips_state: str

    @classmethod
    def from_line(cls, line: str) -> "ReporterRow":
        """Parse a line from the FFIEC HMDA reporterpanel.dat file. The format
        of this file is pre-determined by the FFIEC."""
        return cls(
            year=line[0:4],
            respondent_id=line[4:14],
            agency_code=int(line[14:15]),
            parent_id=line[15:25].strip(),
            parent_name=line[25:55].strip(),
            parent_city=line[55:80].strip(),
            parent_state=line[80:82],
            region=line[82:84],
            assets=line[84:94],
            lender_code=line[94:95],
            respondent_name=line[95:125],
            filler_1=line[125:165],
            respondent_city=line[165:190],
            respondent_state=line[190:192],
            filler_2=line[192:202],
            filler_3=line[202:212],
            top_holder_rssd_id=line[212:222],
            top_holder_name=line[222:252].strip(),
            top_holder_city=line[252:277].strip(),
            top_holder_state=line[277:279].strip(),
            top_holder_country=line[279:319].strip(),
            respondent_rssd_id=line[319:329],
            parent_rssd_id=line[329:339],
            respondent_fips_state=line[339:341],
        )

    @classmethod
    def from_csv_row(cls, line: List[str]) -> "ReporterRow":
        """Parse a line from the CFPB HMDA CSV."""
        transformed = [cell.strip() for cell in line]
        # fillers
        transformed.insert(11, "")
        transformed.insert(14, "")
        transformed.insert(15, "")
        return cls(transformed[0], transformed[1], int(transformed[2]),
                   *transformed[3:])

    def institution(self):
        """Get the Institution object that corresonds to this ReporterRow."""
        return Institution.objects.filter(
            year=self.year,
            agency__hmda_id=self.agency_code,
            respondent_id=self.respondent_id,
        ).first()

    def parent(self):
        """Get the parent institution based on either the HMDA ID or the RSSD
        ID."""
        parent = Institution.objects.filter(
            year=self.year,
            respondent_id=self.parent_id,
            zip_code__state=self.parent_state,
        ).first()
        if parent:
            return parent
        else:
            # Use the RSSD ID to look for the parent. There"s at least one
            # case where the RSSD ID matches, but the FFIEC ID does not. Also,
            # in cases where the RSSD ID matches, the state does not. We"ll go
            # based on RSSD ID - but that still indicates weirdness in the
            # data.
            return Institution.objects.filter(
                year=self.year,
                rssd_id=self.parent_rssd_id,
            ).first()

    def non_reporting_parent(self):
        parent, _ = ParentInstitution.objects.get_or_create(
            rssd_id=self.parent_rssd_id,
            year=self.year,
            defaults={
                "year": self.year,
                "name": self.parent_name,
                "city": self.parent_city,
                "state": self.parent_state,
                "rssd_id": self.parent_rssd_id,
            },
        )
        return parent

    def top_holder(self):
        state = self.top_holder_state if self.top_holder_state != "0" else None
        parent, _ = ParentInstitution.objects.get_or_create(
            rssd_id=self.top_holder_rssd_id,
            year=self.year,
            defaults={
                "year": self.year,
                "name": self.top_holder_name,
                "city": self.top_holder_city,
                "rssd_id": self.top_holder_rssd_id,
                "country": self.top_holder_country,
                "state": state,
            },
        )
        return parent

    def assign_parent(self, bank):
        if self.parent_id == "":
            bank.parent = None
        else:
            parent = self.parent()
            if parent:
                bank.parent = parent
            else:
                bank.non_reporting_parent = self.non_reporting_parent()
        return bank

    def assign_top_holder(self, bank):
        if self.top_holder_name == "":
            bank.top_holder = None
        else:
            bank.top_holder = self.top_holder()
        return bank

    def update_institution(self):
        """Add the National Information Center RSSD ID to each institution."""
        bank = self.institution()
        if not bank:
            logger.warning("Missing institution %s %s %s",
                           self.year, self.agency_code, self.respondent_id)
            return

        if self.respondent_rssd_id == "0000000000":
            bank.rssd_id = None
        else:
            bank.rssd_id = self.respondent_rssd_id

        self.assign_parent(bank)
        self.assign_top_holder(bank)
        bank.save()


class Command(BaseCommand):
    help = "Reporter panel contains parent information. Loads that."

    def add_arguments(self, parser):
        parser.add_argument("file_name", type=argparse.FileType("r"))

    def handle(self, *args, **options):
        for line in options["file_name"]:
            ReporterRow.from_line(line).update_institution()
