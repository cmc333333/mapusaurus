import json

from django.contrib.gis.geos import Point, Polygon
from django.contrib.postgres.search import TrigramSimilarity
from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework import serializers
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from geo.models import Geo
from geo.utils import check_bounds


def geo_as_json(geos):
    return json.loads(format_geo_to_geojson(geos))


def format_geo_to_geojson(geos):
    # We already have the json strings per model pre-computed, so just place
    # them inside a static response
    response = '{"crs": {"type": "link", "properties": {"href": '
    response += '"http://spatialreference.org/ref/epsg/4326/", "type": '
    response += '"proj4"}}, "type": "FeatureCollection", "features": [%s]}'
    return response % ', '.join(geo.tract_centroids_as_geojson() for geo in geos)


def get_censustract_geos(request):
    northEastLat = request.GET.get('neLat')
    northEastLon = request.GET.get('neLon')
    southWestLat = request.GET.get('swLat')
    southWestLon = request.GET.get('swLon')
    year = request.GET.get('year')
    metro = request.GET.get('metro')
    geo_type = request.GET.get('geoType')
    geos = []
    if northEastLat or northEastLon or southWestLat or southWestLon:
        bounds = check_bounds(northEastLat, northEastLon, southWestLat, southWestLon)
        if bounds:
            maxlat, minlon, minlat, maxlon = bounds
            if geo_type == "msa":
                #*bounds expands the set from check_bounds
                msas = get_geos_by_bounds_and_type(maxlat, minlon, minlat, maxlon, year, metro=True)
                geos = Geo.objects.filter(geo_type=Geo.TRACT_TYPE, cbsa__in=msas.values_list('cbsa', flat=True))
            else:
                geos = get_geos_by_bounds_and_type(maxlat, minlon, minlat, maxlon, year)
        else:
            raise Http404("Invalid bounds")
    elif metro:
        msa = get_object_or_404(Geo, geo_type=Geo.METRO_TYPE, geoid=metro) # metro includes year
        geos = msa.get_censustract_geos_by_msa()
    return geos


def get_geos_by_bounds_and_type(maxlat, minlon, minlat, maxlon, year, metro=False):
    """handles requests for tract-level ids or MSA ids"""
    if metro == False:
        geoTypeId = 3
    else:
        geoTypeId = 4
    #Create bound points 
    point_top_right = Point(maxlon, maxlat)
    point_top_left = Point(minlon, maxlat)
    point_bottom_left = Point(minlon, minlat)
    point_bottom_right = Point(maxlon, minlat)
    #Create a polygon of the entire map screen
    poly = Polygon (((point_top_left, point_bottom_left, point_bottom_right, point_top_right, point_top_left)))
    #check if geo polygon interects with the screen polygon. no get_object_or_404 since user can drag to alaska, pr, hawaii
    geos = Geo.objects.filter(geo_type=geoTypeId, year=year).filter(geom__intersects=poly)
    return geos


class GeoSerializer(serializers.ModelSerializer):
    """Used in RESTful endpoints to serialize Geo objects; used in search"""
    class Meta:
        model = Geo
        fields = ('geoid', 'geo_type', 'name', 'centlat', 'centlon', 'year')


@api_view(['GET'])
def search(request):
    query_str = request.GET.get('q', '').strip()
    year= request.GET.get('year', '').strip()
    query = Geo.objects\
        .filter(geo_type=Geo.METRO_TYPE, year=year)\
        .annotate(similarity=TrigramSimilarity('name', query_str))\
        .filter(similarity__gte=0.01)\
        .order_by('-similarity')
    query = query[:25]
    results = GeoSerializer(query, many=True).data

    return Response({'geos': results})
