import json

from django.conf import settings
from django.shortcuts import render
from us import STATES_AND_TERRITORIES

from hmda.models import LoanApplicationRecord


def single_page_app(request):
    """This page is managed almost exclusively by React"""

    years = LoanApplicationRecord.objects\
        .order_by('-as_of_year')\
        .distinct('as_of_year')\
        .values_list('as_of_year', flat=True)
    config = dict(
        states=[{"abbr": s.abbr, "fips": s.fips, "name": s.name}
                for s in STATES_AND_TERRITORIES
                if s.fips],
        token=settings.MAPBOX_TOKEN,
        years=list(years),
    )
    return render(request, 'new-map.html', {
        'SPA_CONFIG': json.dumps(config),
    })
