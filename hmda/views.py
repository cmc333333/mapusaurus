import json
from typing import Tuple

import django_filters
import webargs
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.http import HttpResponse
from webargs.djangoparser import parser as webargs_parser

from geo.models import Geo
from geo.views import TractFilters
from hmda.models import (
    ACTION_TAKEN_CHOICES, HMDARecord, LIEN_STATUS_CHOICES,
    LOAN_PURPOSE_CHOICES, OWNER_OCCUPANCY_CHOICES, PROPERTY_TYPE_CHOICES,
)
from respondents.models import Institution


class ChoiceInFilter(django_filters.BaseInFilter,
                     django_filters.ChoiceFilter):
    """We're renaming "action_taken__in", so have to explicitly create a
    combined "In" and "Choice" filter."""


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class LARFilters(django_filters.FilterSet):
    action_taken = ChoiceInFilter(choices=ACTION_TAKEN_CHOICES,
                                  lookup_expr='in')
    lien_status = ChoiceInFilter(choices=LIEN_STATUS_CHOICES,
                                 lookup_expr='in')
    loan_purpose = ChoiceInFilter(choices=LOAN_PURPOSE_CHOICES,
                                  lookup_expr='in')
    owner_occupancy = ChoiceInFilter(choices=OWNER_OCCUPANCY_CHOICES,
                                     lookup_expr='in')
    property_type = ChoiceInFilter(choices=PROPERTY_TYPE_CHOICES,
                                   lookup_expr='in')

    class Meta:
        model = HMDARecord
        fields: Tuple[str, ...] = tuple()

    @property
    def qs(self):
        queryset = super().qs\
            .values(    # implicitly group by these fields
                    'geo_id', 'geo__census2010households__total',
                    'geo__centlat', 'geo__centlon', 'geo__state',
                    'geo__county', 'geo__tract')\
            .annotate(volume=Count('geo_id'))\
            .order_by('geo_id')
        queryset = self.filter_to_tracts(queryset)
        return queryset

    def filter_to_tracts(self, queryset):
        tracts = TractFilters(
            getattr(self.request, 'GET', {}),
            request=self.request,
        ).qs
        return queryset.filter(geo__in=tracts)


class LARMultipleLenderFilters(LARFilters):
    lender = CharInFilter(name="institution_id", lookup_expr="in")


class LARSingleLenderFilters(LARFilters):
    institution_args = {
        'lender': webargs.fields.Function(
            deserialize=lambda pk: get_object_or_404(Institution, pk=pk),
            missing=None,
        ),
        'lh': webargs.fields.Bool(missing=False),
        'metro': webargs.fields.Function(
            deserialize=lambda pk: get_object_or_404(
                Geo, pk=pk, geo_type=Geo.METRO_TYPE),
            missing=None,
        ),
        'peers': webargs.fields.Bool(missing=False),

    }

    @property
    def qs(self):
        return self.filter_to_institutions(super().qs)

    def filter_to_institutions(self, queryset):
        if not self.request:
            return queryset

        try:
            args = webargs_parser.parse(self.institution_args, self.request)
        except webargs.ValidationError:
            return queryset

        if args['lender']:
            institutions = Institution.objects.filter(pk=args['lender'].pk)
            if args['lh']:
                hierarchy = args['lender'].get_lender_hierarchy(False, False)
                if hierarchy.exists():
                    institutions = hierarchy
            elif args['peers'] and args['metro']:
                peer_list = args['lender'].get_peer_list(
                    args['metro'], True, False)
                if peer_list.exists():
                    institutions = peer_list
            queryset = queryset.filter(institution__in=institutions)

        return queryset


def loan_originations_as_json(request):
    records = LARSingleLenderFilters(request.GET, request=request).qs
    data = {}
    if records:
        for row in records:
            tract_id = row['geo__state']+row['geo__county']+row['geo__tract']
            row_as_dict = {
                'geoid': row['geo_id'],
                'tractid': tract_id,
                'volume': row['volume'],
                'num_households': row['geo__census2010households__total'],
                'centlat': row['geo__centlat'],
                'centlon': row['geo__centlon'],
            }
            if row_as_dict['num_households']:
                row_as_dict['per_thousand_households'] = \
                    1000 * row_as_dict['volume'] \
                    / row_as_dict['num_households']
            else:
                row_as_dict['per_thousand_households'] = 0
            data[row['geo_id']] = row_as_dict
    return data


def loan_originations_http(request):
    json_data = loan_originations_as_json(request)
    if json_data:
        return HttpResponse(json.dumps(json_data))
