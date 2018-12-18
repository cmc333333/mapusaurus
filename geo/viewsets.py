from rest_framework import viewsets

from geo.filters import CBSAFilters, CountyFilters
from geo.models import CoreBasedStatisticalArea, County
from geo.serializers import CBSASerializer, CountySerializer


class MetroViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CoreBasedStatisticalArea.objects\
        .filter(metro=True)\
        .order_by("name")
    serializer_class = CBSASerializer
    filter_class = CBSAFilters


class CountyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = County.objects.order_by("name")
    serializer_class = CountySerializer
    filter_class = CountyFilters
