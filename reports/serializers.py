from typing import List

from rest_framework import serializers

from geo.models import (
    CoreBasedStatisticalArea, County, Division, MetroDivision)


class CountyField(serializers.CharField):
    def to_representation(self, value: List[County]) -> str:
        return ",".join(county.pk for county in value)

    def to_internal_value(self, data: str) -> List[County]:
        return list(
            County.objects
            .select_related("cbsa", "metdiv", "state")
            .filter(pk__in=data.split(","))
        )


class CBSAField(serializers.CharField):
    def to_representation(
            self, value: List[CoreBasedStatisticalArea]) -> str:
        return ",".join(cbsa.pk for cbsa in value)

    def to_internal_value(
            self, data: str) -> List[CoreBasedStatisticalArea]:
        return list(
            CoreBasedStatisticalArea.objects.filter(pk__in=data.split(",")))


class ReportSerializer(serializers.Serializer):
    county = CountyField(default=list)
    metro = CBSAField(default=list)
    year = serializers.IntegerField()

    def create(self, validated_data) -> List[Division]:
        metros: List[CoreBasedStatisticalArea] = []
        metdivs: List[MetroDivision] = []
        for metro in validated_data["metro"]:
            if metro.metrodivision_set.exists():
                metdivs.extend(metro.metrodivision_set.all())
            else:
                metros.append(metro)

        metros = sorted(metros, key=lambda m: m.name)
        metdivs = sorted(metdivs, key=lambda m: m.name)
        counties = sorted(validated_data["county"], key=lambda m: m.name)
        return metros + metdivs + counties
