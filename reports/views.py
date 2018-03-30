from collections import OrderedDict

import webargs
from django.db.models import Count, Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response
from webargs.djangoparser import parser

from geo.models import Geo
from hmda.models import HMDARecord


geo_args = {
    'metro': webargs.fields.Str(required=True),
    'year': webargs.fields.Int(required=True),
}


@api_view()
def population_demographics(request):
    try:
        args = parser.parse(geo_args, request)
    except webargs.ValidationError as err:
        return Response(err.messages, status=400)
    aggregates = OrderedDict()
    aggregates['Total Population'] = Sum('census2010race__total_pop')
    aggregates['White'] = Sum('census2010race__white_alone')
    aggregates['Black'] = Sum('census2010race__black_alone')
    aggregates['Hispanic/Latino'] = Sum('census2010hispanicorigin__hispanic')
    aggregates['Native American'] = Sum('census2010race__amind_alone')
    aggregates['Asian'] = Sum('census2010race__asian_alone')
    aggregates['HOPI'] = Sum('census2010race__pacis_alone')
    aggregates['Other Races'] = Sum('census2010race__other_alone')
    aggregates['Two or More Races'] = Sum('census2010race__two_or_more')
    aggregates['Total Minority'] = (
        Sum('census2010racestats__total_pop')
        - Sum('census2010racestats__non_hisp_white_only')
    )
    aggregates['Females'] = Sum('census2010sex__female')

    query_result = Geo.objects\
        .filter(geo_type=Geo.TRACT_TYPE, cbsa=args['metro'],
                year=args['year'])\
        .aggregate(**aggregates)
    total_pop = query_result['Total Population']

    rows = []
    for field_name in aggregates:
        row = {
            'Population Demographics': field_name,
            'Number': query_result[field_name],
            'Percent': 0,
        }
        if total_pop:
            row['Percent'] = row['Number'] / total_pop
        rows.append(row)
    return Response({
        'fields': ['Population Demographics', 'Number', 'Percent'],
        'data': rows,
    })


lar_args = {
    'lender': webargs.fields.Str(required=True),
    **geo_args
}


def lar_query(request):
    args = parser.parse(lar_args, request)
    return HMDARecord.objects.filter(
        geo__geo_type=Geo.TRACT_TYPE,
        geo__cbsa=args['metro'],
        geo__year=args['year'],
        institution_id=args['lender'],
    )


def demographic_rows(query):
    yield 'White', query.white()
    yield 'Black', query.black()
    yield 'Hispanic/Latino', query.hispanic()
    yield 'Native American', query.native_american()
    yield 'Asian', query.asian()
    yield 'HOPI', query.hopi()
    yield 'Minority', query.minority()
    yield 'No Demographic Data', query.no_demographic_data()
    yield 'Female', query.female()


@api_view()
def applicants(request, actions, actions_name):
    try:
        query = lar_query(request)
    except webargs.ValidationError as err:
        return Response(err.messages, status=400)
    results = []
    query = query.filter(action_taken__in=actions)
    totals = query.aggregate(count=Count('*'), volume=Sum('loan_amount_000s'))

    for name, queryset in demographic_rows(query):
        characteristic_totals = queryset.aggregate(
            count=Count('*'), volume=Sum('loan_amount_000s'))
        result = {
            'Applicant characteristics': name,
            actions_name: characteristic_totals['count'],
            'Volume of Loans': characteristic_totals['volume'],
            f'Percent of {actions_name}': 0,
            'Percent of Volume': 0,
        }
        if totals['count']:
            result[f'Percent of {actions_name}'] = \
                characteristic_totals['count'] / totals['count']
        if totals['volume']:
            result['Percent of Volume'] = \
                characteristic_totals['volume'] / totals['volume']
        results.append(result)
    return Response({
        'fields': ['Applicant characteristics', actions_name,
                   f'Percent of {actions_name}', 'Volume of Loans',
                   'Percent of Volume'],
        'data': results,
    })


@api_view()
def lar_status(request, actions, actions_name):
    try:
        query = lar_query(request)
    except webargs.ValidationError as err:
        return Response(err.messages, status=400)
    results = []
    total_white = query.white().count()
    subset_white = query.filter(action_taken__in=actions).white().count()

    for name, queryset in demographic_rows(query):
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
