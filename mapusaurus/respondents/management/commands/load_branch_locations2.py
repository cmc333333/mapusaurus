import csv
from django.core.management.base import BaseCommand
from respondents.models import Branch, Institution

mapping = {
    'OCC': '1',
    'FED': '2',
    'FDIC': '3',
}


def normalize(s):
    return s.strip().upper()


class Command(BaseCommand):
    args = "<filename>"

    def handle(self, *args, **options):
        branch_location_filename = args[0]
        count = 0; 
        year = '2016'
        with open(branch_location_filename, 'rU') as branch_location_txt:
            branch_location_reader = csv.DictReader(branch_location_txt)
            branch_location = []
            for branch_location_line in branch_location_reader:
                record = Branch(
                    year=year, #branch_location_line['YEAR'],
                    name=normalize(branch_location_line['NAMEBR']),
                    street=normalize(branch_location_line['ADDRESBR']),
                    city=normalize(branch_location_line['CITYBR']),
                    state=normalize(branch_location_line['STALPBR']),
                    zipcode=normalize(branch_location_line['ZIPBR']),
                    lat=branch_location_line['SIMS_LATITUDE'],
                    lon=branch_location_line['SIMS_LONGITUDE'],
                )

                record.institution_id = (
                    year #branch_location_line['YEAR']
                    + mapping[branch_location_line['REGAGNT']]
                    + branch_location_line['RSSDID'].zfill(10)
                )
                if Institution.objects.filter(institution_id=record.institution_id).count() > 0:
                    branch_location.append(record)
                else:
                    print "Can't find institution_id"
                    print '{}\t{}\t{}'.format(record.institution_id, record.name, record.street)
                if len(branch_location) > 9999:
                    count += len(branch_location)
                    Branch.objects.bulk_create(branch_location, batch_size=1000)
                    print "Record count: " + str(count)
                    branch_location[:] = []
            if len(branch_location) > 0:
                count += len(branch_location)
                Branch.objects.bulk_create(branch_location, batch_size=1000)
                print "Record count: " + str(count)
                branch_location[:] = []
