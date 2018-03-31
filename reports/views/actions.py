import webargs
from rest_framework.decorators import api_view
from rest_framework.response import Response

from reports.views.applicants import lar_query


def actions(request, actions, actions_name):
    try:
        query = lar_query(request)
    except webargs.ValidationError as err:
        return Response(err.messages, status=400)
    results = []
    total_white = query.white().count()
    subset_white = query.filter(action_taken__in=actions).white().count()

    for name, queryset in query.demographics():
        total = queryset.count()
        subset = queryset.filter(action_taken__in=actions).count()
        result = {
            'Applicant characteristics': name,
            actions_name: subset,
            'Percent': 0,
        }
        if total:
            result['Percent'] = subset / total
        disparity_denom = total * subset_white
        if disparity_denom:
            result['Disparity Index'] = subset * total_white / disparity_denom
        results.append(result)
    return Response({
        'fields': ['Applicant characteristics', actions_name, 'Percent',
                   'Disparity Index'],
        'data': results,
    })


@api_view()
def approvals(request):
    return actions(request, (1,), 'Approvals')


@api_view()
def denials(request):
    return actions(request, (3,), 'Denials')
