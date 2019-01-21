from typing import Iterator, List, NamedTuple, Optional, Tuple

from django.db.models import Count, Expression, F, Q, Sum
from django.db.models.functions import Coalesce

from ffiec.models import AggDemographics, TractDemographics
from geo.models import Division, Tract
from hmda.models import LoanApplicationRecord

lmi_filter = Q(income_indicator__in=["low", "mod"])
minority_filter = Q(non_hispanic_white__lt=F("persons") / 2)
non_hispanic_filter = Q(applicant_ethnicity="2")
white_filter = non_hispanic_filter & Q(applicant_race_1="5")


class PopulationReportRow(NamedTuple):
    title: str
    population: int
    percent: int

    @staticmethod
    def features() -> Tuple[Tuple[str, Expression], ...]:
        return (
            ("All Population", Coalesce(Sum("persons"), 0)),
            ("White", Coalesce(Sum("non_hispanic_white"), 0)),
            ("Hispanic/Latino", Coalesce(Sum("hispanic_only"), 0)),
            ("Black", Coalesce(Sum("black"), 0)),
            ("Asian", Coalesce(Sum("asian"), 0)),
            ("Minority",
                Coalesce(Sum("persons") - Sum("non_hispanic_white"), 0)),
            ("Unemployed 16+", Coalesce(
                Sum("male_adult") - Sum("male_employed")
                + Sum("female_adult") - Sum("female_employed"),
                0,)),
            ("People living in Poverty", Coalesce(Sum("poverty"), 0)),
        )

    @classmethod
    def generate_for(
            cls,
            division: Division,
            year: int) -> Iterator["PopulationReportRow"]:
        data = TractDemographics.objects\
            .filter(tract__in=division.tract_set.all(), year=year)\
            .aggregate(**dict(cls.features()))
        for title, _ in cls.features():
            total = data["All Population"]
            if total:
                yield cls(title, data[title], 100 * data[title] // total)
            else:
                yield cls(total, data[title], 0)


class IncomeHousingReportRow(NamedTuple):
    title: str
    total: int
    percent: int

    @staticmethod
    def home_features() -> Tuple[Tuple[str, Expression], ...]:
        return (
            ("Single Family Homes", Coalesce(Sum("single_family_homes"), 0)),
            ("Owner Occupied Homes",
                Coalesce(Sum("single_family_occupied"), 0)),
        )

    @staticmethod
    def tract_features() -> Tuple[Tuple[str, Expression], ...]:
        return (
            ("LMI Tracts in Geography", Count("pk", filter=lmi_filter)),
            ("Minority Tracts in Geography",
                Count("pk", filter=minority_filter)),
        )

    @staticmethod
    def pop_features() -> Tuple[Tuple[str, Expression], ...]:
        return (
            ("Population in LMI Tracts",
                Coalesce(Sum("persons", filter=lmi_filter), 0)),
            ("Population in Minority Tracts",
                Coalesce(Sum("persons", filter=minority_filter), 0)),
        )

    @classmethod
    def generate_for(
            cls,
            division: Division,
            year: int) -> Iterator["IncomeHousingReportRow"]:
        agg_args = dict(cls.home_features())
        agg_args.update(cls.tract_features())
        agg_args.update(cls.pop_features())
        agg_args.update(
            tract_total=Count("pk"), pop_total=Coalesce(Sum("persons"), 0))

        data = TractDemographics.objects\
            .filter(tract__in=division.tract_set.all(), year=year)\
            .aggregate(**agg_args)

        for title, _ in cls.home_features():
            yield cls(
                title,
                data[title],
                100 * data[title] // data["Single Family Homes"],
            )
        for title, _ in cls.tract_features():
            yield cls(
                title,
                data[title],
                100 * data[title] // data["tract_total"],
            )
        for title, _ in cls.pop_features():
            yield cls(
                title,
                data[title],
                100 * data[title] // data["pop_total"],
            )
