import django_filters
from django.contrib.gis.geos import Point, Polygon
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from geo.models import Geo
from geo.serializers import GeoSerializer


class BoundarySerializer(serializers.Serializer):
    neLat = serializers.FloatField()
    neLon = serializers.FloatField()
    swLat = serializers.FloatField()
    swLon = serializers.FloatField()

    def save(self):
        ne = Point(self.validated_data['neLon'], self.validated_data['neLat'])
        se = Point(self.validated_data['neLon'], self.validated_data['swLat'])
        sw = Point(self.validated_data['swLon'], self.validated_data['swLat'])
        nw = Point(self.validated_data['swLon'], self.validated_data['neLat'])
        return Polygon((ne, se, sw, nw, ne))


class TractFilters(django_filters.FilterSet):
    metro = django_filters.CharFilter(method='filter_to_metro')
    county = django_filters.CharFilter(method='filter_to_county')

    class Meta:
        model = Geo
        fields = ('year',)

    def filter_to_metro(self, queryset, name, value):
        msa = get_object_or_404(Geo, geo_type=Geo.METRO_TYPE, geoid=value)
        return queryset.filter(cbsa=msa.cbsa, year=msa.year)

    def filter_to_county(self, queryset, name, value):
        counties = Geo.objects.filter(geo_type=Geo.COUNTY_TYPE,
                                      geoid__in=value.split(','))
        filter_clause = Q()
        for county in counties:
            filter_clause = filter_clause \
                | Q(state=county.state, county=county.county, year=county.year)
        return queryset.filter(filter_clause)

    @property
    def qs(self):
        """Filter geos by coordinates, if applicable."""
        queryset = super().qs.filter(geo_type=Geo.TRACT_TYPE)
        request_data = getattr(self.request, 'GET', {})
        boundary_serializer = BoundarySerializer(data=request_data)
        if boundary_serializer.is_valid():
            queryset = queryset.filter(
                geom__intersects=boundary_serializer.save())
        return queryset


class SearchFilters(django_filters.FilterSet):
    q = django_filters.CharFilter(method='filter_to_search_term')

    class Meta:
        model = Geo
        fields = ('state', 'year')

    def filter_to_search_term(self, queryset, name, value):
        return queryset\
            .annotate(similarity=TrigramSimilarity('name', value))\
            .filter(similarity__gte=0.01)\
            .order_by('-similarity')


@api_view(['GET'])
def search(request, geo_type):
    queryset = SearchFilters(
        request.GET,
        queryset=Geo.objects.filter(geo_type=geo_type),
        request=request
    ).qs
    results = GeoSerializer(queryset[:25], many=True).data

    return Response({'geos': results})
