from rest_framework import serializers


class LARSerializer(serializers.Serializer):
    geoid = serializers.CharField(source="tract_id")
    lat = serializers.FloatField(source="tract__interior_lat")
    lon = serializers.FloatField(source="tract__interior_lon")
    volume = serializers.IntegerField()
    num_households = serializers.IntegerField()
