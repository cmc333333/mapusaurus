from rest_framework import serializers

from geo.models import CoreBasedStatisticalArea, County


class PointsSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()

    def get_points(self, obj):
        return {
            "interior": {
                "lat": obj.interior_lat,
                "lon": obj.interior_lon,
            },
            "northeast": {
                "lat": obj.max_lat,
                "lon": obj.max_lon,
            },
            "southwest": {
                "lat": obj.min_lat,
                "lon": obj.min_lon,
            },
        }


class CBSASerializer(PointsSerializer):
    class Meta:
        model = CoreBasedStatisticalArea
        fields = ("geoid", "name", "points")


class CountySerializer(PointsSerializer):
    class Meta:
        model = County
        fields = ("geoid", "name", "points", "state")
