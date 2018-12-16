import django_filters
from django.contrib.postgres.search import TrigramSimilarity

from geo.models import CoreBasedStatisticalArea, County


def filter_to_search_term(queryset, name, value):
    return queryset\
        .annotate(similarity=TrigramSimilarity('name', value))\
        .filter(similarity__gte=0.01)\
        .order_by('-similarity')


class CBSAFilters(django_filters.FilterSet):
    q = django_filters.CharFilter(method=filter_to_search_term)

    class Meta:
        model = CoreBasedStatisticalArea
        fields = {"geoid": ["in"]}


class CountyFilters(django_filters.FilterSet):
    q = django_filters.CharFilter(method=filter_to_search_term)

    class Meta:
        model = County
        fields = {"geoid": ["in"], "state": ["exact"]}
