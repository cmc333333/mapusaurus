import json

from django.conf import settings
from django.shortcuts import render
from us import STATES_AND_TERRITORIES

from hmda.models import LARYear


def single_page_app(request):
    """This page is managed almost exclusively by React"""
    config = dict(
        states=[{"abbr": s.abbr, "fips": s.fips, "name": s.name}
                for s in STATES_AND_TERRITORIES
                if s.fips],
        token=settings.MAPBOX_TOKEN,
        years=list(LARYear.objects.all().values_list("year", flat=True)),
    )
    return render(request, "new-map.html", {
        "SPA_CONFIG": json.dumps(config),
    })
