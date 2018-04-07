import webargs
from django.db.models import Count, Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response
from webargs.djangoparser import parser

from geo.views import TractFilters
from hmda.models import HMDARecord
from respondents.models import Institution


def valid_lender(lender: str) -> Institution:
    institution = Institution.objects.filter(pk=lender).first()
    if not institution:
        raise webargs.ValidationError('Unknown institution')
    return institution


user_args = {
    'lender': webargs.fields.Function(deserialize=valid_lender, required=True),
}


def lar_query(request):
    args = parser.parse(user_args, request)
    return HMDARecord.objects.filter(
        geo__in=TractFilters(request.GET, request=request).qs,
        institution=args['lender'],
    )


def applicants(request, actions, actions_name):
    """Data about the applicants for a given lender and metro."""
    try:
        query = lar_query(request)
    except webargs.ValidationError as err:
        return Response(err.messages, status=400)

    results = []
    query = query.filter(action_taken__in=actions)
    totals = query.aggregate(count=Count('*'), volume=Sum('loan_amount_000s'))

    for name, queryset in query.demographics():
        characteristic_totals = queryset.aggregate(
            count=Count('*'), volume=Sum('loan_amount_000s'))
        result = {
            'Applicant characteristics': name,
            actions_name: characteristic_totals['count'] or 0,
            'Volume of Loans': characteristic_totals['volume'] or 0,
            f'Percent of {actions_name}': 0,
            'Percent of Volume': 0,
        }
        if totals['count']:
            result[f'Percent of {actions_name}'] = \
                result[actions_name] / totals['count']
        if totals['volume']:
            result['Percent of Volume'] = \
                result['Volume of Loans'] / totals['volume']
        results.append(result)
    return Response({
        'fields': ['Applicant characteristics', actions_name,
                   f'Percent of {actions_name}', 'Volume of Loans',
                   'Percent of Volume'],
        'data': results,
    })


@api_view()
def applications(request):
    return applicants(request, (1, 2, 3, 4, 5), 'Applications')


@api_view()
def originations(request):
    return applicants(request, (1,), 'Originations')
