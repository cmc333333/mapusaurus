import json

from django.http import HttpResponse

from respondents.views import branch_locations_as_json


def branch_locations(request):
    return HttpResponse(
        json.dumps(branch_locations_as_json(request)),
        content_type='application/json',
    )
