import django_filters
from django.contrib.gis.geos import Point, Polygon
from django.contrib.postgres.search import TrigramSimilarity
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from geo.models import Geo


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

    class Meta:
        model = Geo
        fields = ('year',)

    def filter_to_metro(self, queryset, name, value):
        msa = get_object_or_404(Geo, geo_type=Geo.METRO_TYPE, geoid=value)
        return queryset.filter(cbsa=msa.cbsa, year=msa.year)

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


class GeoSerializer(serializers.ModelSerializer):
    """Used in RESTful endpoints to serialize Geo objects; used in search"""
    class Meta:
        model = Geo
        fields = ('geoid', 'geo_type', 'name', 'centlat', 'centlon', 'year')


@api_view(['GET'])
def search(request):
    query_str = request.GET.get('q', '').strip()
    year = request.GET.get('year', '').strip()
    query = Geo.objects\
        .filter(geo_type=Geo.METRO_TYPE, year=year)\
        .annotate(similarity=TrigramSimilarity('name', query_str))\
        .filter(similarity__gte=0.01)\
        .order_by('-similarity')
    query = query[:25]
    results = GeoSerializer(query, many=True).data

    return Response({'geos': results})
