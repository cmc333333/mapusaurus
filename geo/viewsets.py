from rest_framework import viewsets

from geo.models import Geo
from geo.serializers import GeoSerializer


class GeoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Geo.objects.all()
    serializer_class = GeoSerializer
    filter_fields = {
        'geoid': ('in',)
    }
