import argparse
import csv

from django.core.management.base import BaseCommand

from respondents.models import LenderHierarchy


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('year', type=int)
        parser.add_argument('file_name', type=argparse.FileType('r'))

    def handle(self, *args, **options):
        year = str(options['year'])

        hierarchy_reader = csv.reader(options['file_name'], delimiter=',')
        hierarchy = []
        for hierarchy_line in hierarchy_reader:
            record = LenderHierarchy(
                organization_id=int(hierarchy_line[2]),
            )
            record.institution_id = (
                year + hierarchy_line[0] + hierarchy_line[1].replace("'", ""))
            hierarchy.append(record)
        LenderHierarchy.objects.bulk_create(hierarchy)
        options['file_name'].close()
