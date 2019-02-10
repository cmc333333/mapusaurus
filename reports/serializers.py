from typing import List

from rest_framework import serializers

from geo.models import (
    CoreBasedStatisticalArea, County, Division, MetroDivision)


class ReportSerializer(serializers.Serializer):
    county = serializers.ListField(child=serializers.CharField(), default=list)
    email = serializers.EmailField()
    metro = serializers.ListField(child=serializers.CharField(), default=list)
    year = serializers.IntegerField()

    def divisions(self) -> List[Division]:
        """Order the geographic divisions by type, then name. Assumes valid
        data."""
        metros: List[CoreBasedStatisticalArea] = []
        metdivs: List[MetroDivision] = []
        requested_cbsas = CoreBasedStatisticalArea.objects\
            .filter(pk__in=self.validated_data["metro"])
        for metro in requested_cbsas:
            if metro.metrodivision_set.exists():
                metdivs.extend(metro.metrodivision_set.all())
            else:
                metros.append(metro)

        metros = sorted(metros, key=lambda m: m.name)
        metdivs = sorted(metdivs, key=lambda m: m.name)
        return metros + metdivs + list(
            County.objects
            .filter(pk__in=self.validated_data["county"])
            # Useful to prefetch these -- they'll speed up the report
            .select_related("cbsa", "metdiv", "state")
            .order_by("name"),
        )
