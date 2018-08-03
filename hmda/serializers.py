from rest_framework import serializers


class LARSerializer(serializers.Serializer):
    centlat = serializers.FloatField(source='geo__centlat')
    centlon = serializers.FloatField(source='geo__centlon')
    geo_id = serializers.CharField()
    num_households = serializers.IntegerField(
        source='geo__census2010households__total')
    volume = serializers.IntegerField()
