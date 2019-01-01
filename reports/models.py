from typing import List, NamedTuple, Tuple

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import Coalesce

from ffiec.models import TractDemographics

lmi_filter = Q(income_indicator__in=["low", "mod"])
minority_filter = Q(non_hispanic_white__lte=F("persons") / 2)


class PopulationReport(NamedTuple):
    total: int
    white: int
    hispanic: int
    black: int
    asian: int
    unemployed: int
    poverty: int

    def features(self) -> List[Tuple[str, int]]:
        return [
            ("White", self.white),
            ("Hispanic/Latino", self.hispanic),
            ("Black", self.black),
            ("Asian", self.asian),
            ("Minority", self.total - self.white),
            ("Unemployed 16+", self.unemployed),
            ("People living in Poverty", self.poverty),
        ]

    @classmethod
    def load(cls, tract_qs, year: int) -> "PopulationReport":
        result = TractDemographics.objects\
            .filter(tract__in=tract_qs, year=year)\
            .aggregate(
                total=Coalesce(Sum("persons"), 0),
                white=Coalesce(Sum("non_hispanic_white"), 0),
                hispanic=Coalesce(Sum("hispanic_only"), 0),
                black=Coalesce(Sum("black"), 0),
                asian=Coalesce(Sum("asian"), 0),
                unemployed=Coalesce(
                    Sum("male_adult")
                    - Sum("male_employed")
                    + Sum("female_adult")
                    - Sum("female_employed"),
                    0,
                ),
                poverty=Coalesce(Sum("poverty"), 0),
            )
        return cls(**result)


class HomeReport(NamedTuple):
    single_family_homes: int
    single_family_occupied: int

    @classmethod
    def load(cls, tract_qs, year: int) -> "HomeReport":
        result = TractDemographics.objects\
            .filter(tract__in=tract_qs, year=year)\
            .aggregate(
                single_family_homes=Coalesce(Sum("single_family_homes"), 0),
                single_family_occupied=Coalesce(
                    Sum("single_family_occupied"), 0),
            )
        return cls(**result)


class TractReport(NamedTuple):
    total: int
    lmi: int
    minority: int

    @classmethod
    def load(cls, tract_qs, year: int) -> "TractReport":
        result = TractDemographics.objects\
            .filter(tract__in=tract_qs, year=year)\
            .aggregate(
                total=Count("pk"),
                lmi=Count("pk", filter=lmi_filter),
                minority=Count("pk", filter=minority_filter),
            )
        return cls(**result)


class PopulationByTractReport(NamedTuple):
    total: int
    in_lmi: int
    in_minority: int

    @classmethod
    def load(cls, tract_qs, year: int) -> "PopulationByTractReport":
        result = TractDemographics.objects\
            .filter(tract__in=tract_qs, year=year)\
            .aggregate(
                total=Coalesce(Sum("persons"), 0),
                in_lmi=Coalesce(Sum("persons", filter=lmi_filter), 0),
                in_minority=Coalesce(
                    Sum("persons", filter=minority_filter), 0),
            )
        return cls(**result)
