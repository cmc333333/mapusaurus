from typing import List, NamedTuple, Set

from django.db.models import Q, QuerySet
from rest_framework import serializers

from geo.models import (
    CoreBasedStatisticalArea, County, Division, MetroDivision, Tract)
from hmda.models import LoanApplicationRecord


class ReportInput(NamedTuple):
    county_ids: Set[str]
    email: str
    metro_ids: Set[str]
    year: int

    def divisions(self) -> List[Division]:
        """Order the geographic divisions by type, then name."""
        metros: List[CoreBasedStatisticalArea] = []
        metdivs: List[MetroDivision] = []
        requested_cbsas = CoreBasedStatisticalArea.objects\
            .filter(pk__in=self.metro_ids)
        for metro in requested_cbsas:
            if metro.metrodivision_set.exists():
                metdivs.extend(metro.metrodivision_set.all())
            else:
                metros.append(metro)

        metros = sorted(metros, key=lambda m: m.name)
        metdivs = sorted(metdivs, key=lambda m: m.name)
        return metros + metdivs + list(
            County.objects
            .filter(pk__in=self.county_ids)
            # Useful to prefetch these -- they'll speed up the report
            .select_related("cbsa", "metdiv", "state")
            .order_by("name"),
        )

    @property
    def tractset(self) -> QuerySet:
        county_q = Q(county_id__in=self.county_ids)
        metro_q = Q(county__cbsa_id__in=self.metro_ids)
        if self.county_ids and self.metro_ids:
            return Tract.objects.filter(county_q | metro_q)
        elif self.county_ids:
            return Tract.objects.filter(county_q)
        elif self.metro_ids:
            return Tract.objects.filter(metro_q)
        return Tract.objects.all()

    @property
    def lar_queryset(self) -> QuerySet:
        return LoanApplicationRecord.objects.filter(
            action_taken__lte=5,
            tract__in=self.tractset,
            as_of_year=self.year,
        )


class ReportSerializer(serializers.Serializer):
    county = serializers.ListField(child=serializers.CharField(), default=list)
    email = serializers.EmailField()
    metro = serializers.ListField(child=serializers.CharField(), default=list)
    year = serializers.IntegerField()

    def save(self) -> ReportInput:
        return ReportInput(
            set(self.validated_data["county"]),
            self.validated_data["email"],
            set(self.validated_data["metro"]),
            self.validated_data["year"],
        )
