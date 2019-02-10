from typing import Tuple

import django_filters
from django.db.models import Count, Sum

from hmda.models import (
    ACTION_TAKEN_CHOICES, LIEN_STATUS_CHOICES, LOAN_PURPOSE_CHOICES,
    LoanApplicationRecord, OWNER_OCCUPANCY_CHOICES, PROPERTY_TYPE_CHOICES,
)


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
    lender = CharInFilter(field_name="institution_id", lookup_expr="in")
    year = django_filters.NumberFilter(method="filter_year")
    county = CharInFilter(field_name="tract__county_id", lookup_expr="in")
    metro = CharInFilter(field_name="tract__county__cbsa_id", lookup_expr="in")

    class Meta:
        model = LoanApplicationRecord
        fields: Tuple[str, ...] = tuple()

    @property
    def qs(self):
        queryset = super().qs\
            .values('tract_id', 'tract__interior_lat', 'tract__interior_lon')\
            .annotate(
                volume=Count('tract_id'),
                num_households=Sum('tract__demographics__households'),
            )\
            .order_by('tract_id')
        return queryset

    def filter_year(self, queryset, field, value):
        return queryset.filter(
            as_of_year=value, tract__demographics__year=value)
