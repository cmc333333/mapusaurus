from django.core.management.base import BaseCommand, CommandError
from hmda.models import Year


class Command(BaseCommand):
    help = """Record year time-stamps for data."""

    def add_arguments(self, parser):
        parser.add_argument('hmda_year', type=int)
        parser.add_argument('census_year', type=int)
        parser.add_argument('geo_year', type=int)

    def handle(self, *args, **options):
        Year.objects.create(
            hmda_year=options['hmda_year'],
            census_year=options['census_year'],
            geo_year=options['geo_year'],
        )
