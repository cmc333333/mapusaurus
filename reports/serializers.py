from typing import List, NamedTuple, Set

from django.db.models import QuerySet
from rest_framework import serializers

from geo.models import (
    CoreBasedStatisticalArea, County, Division, MetroDivision)
from hmda.models import (
    LIEN_STATUS_CHOICES, LOAN_PURPOSE_CHOICES, LoanApplicationRecord,
    OWNER_OCCUPANCY_CHOICES, PROPERTY_TYPE_CHOICES,
)


class ReportInput(NamedTuple):
    county_ids: Set[str]
    email: str
    lender_ids: Set[str]
    lien_status: Set[str]
    loan_purpose: Set[int]
    metro_ids: Set[str]
    owner_occupancy: Set[int]
    property_type: Set[str]
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
    def lien_status_ids(self) -> Set[str]:
        return self.lien_status or {k for k, _ in LIEN_STATUS_CHOICES}

    @property
    def loan_purpose_ids(self) -> Set[int]:
        return self.loan_purpose or {k for k, _ in LOAN_PURPOSE_CHOICES}

    @property
    def owner_occupancy_ids(self) -> Set[int]:
        return self.owner_occupancy or {k for k, _ in OWNER_OCCUPANCY_CHOICES}

    @property
    def property_type_ids(self) -> Set[str]:
        return self.property_type or {k for k, _ in PROPERTY_TYPE_CHOICES}

    def lar_queryset(self, division: Division) -> QuerySet:
        return LoanApplicationRecord.objects.filter(
            action_taken__lte=5,
            as_of_year=self.year,
            lien_status__in=self.lien_status_ids,
            loan_purpose__in=self.loan_purpose_ids,
            owner_occupancy__in=self.owner_occupancy_ids,
            property_type__in=self.property_type_ids,
            tract__in=division.tract_set.all(),
        )


class ReportSerializer(serializers.Serializer):
    county = serializers.ListField(child=serializers.CharField(), default=list)
    email = serializers.EmailField()
    lender = serializers.ListField(child=serializers.CharField(), default=list)
    lienStatus = serializers.ListField(     # noqa
        child=serializers.CharField(), default=list)
    loanPurpose = serializers.ListField(    # noqa
        child=serializers.IntegerField(), default=list)
    metro = serializers.ListField(child=serializers.CharField(), default=list)
    ownerOccupancy = serializers.ListField(     # noqa
        child=serializers.IntegerField(), default=list)
    propertyType = serializers.ListField(    # noqa
        child=serializers.CharField(), default=list)
    year = serializers.IntegerField()

    def save(self) -> ReportInput:
        return ReportInput(
            set(self.validated_data["county"]),
            self.validated_data["email"],
            set(self.validated_data["lender"]),
            set(self.validated_data["lienStatus"]),
            set(self.validated_data["loanPurpose"]),
            set(self.validated_data["metro"]),
            set(self.validated_data["ownerOccupancy"]),
            set(self.validated_data["propertyType"]),
            self.validated_data["year"],
        )
