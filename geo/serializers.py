from rest_framework import serializers

from geo.models import Geo


class GeoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Geo
        fields = (
            'centlat',
            'centlon',
            'geo_type',
            'geoid',
            'name',
            'year',
        )
