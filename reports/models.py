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


class DisparityRow(NamedTuple):
    feature: str
    feature_total: int
    feature_approved: int
    total: int

    compare_total: int
    compare_approved: int

    @staticmethod
    def race_features() -> Tuple[Tuple[str, Q], ...]:
        return (
            ("White", white_filter),
            ("Black", non_hispanic_filter & Q(applicant_race_1="3")),
            ("Hispanic/Latino", Q(applicant_ethnicity="1")),
            ("Asian", non_hispanic_filter & Q(applicant_race_1="2")),
            ("Minority", ~white_filter),
        )

    @staticmethod
    def other_features(
            year: int,
            demographics: Optional[AggDemographics],
            ) -> List[Tuple[str, Q, str, Q]]:
        tract_dem_qs = TractDemographics.objects.filter(year=year)
        result: List[Tuple[str, Q, str, Q]] = []
        if demographics is not None:
            mui_boundary = (demographics.ffiec_est_med_fam_income * .8) // 1000
            result.append((
                "LMI Applicant",
                Q(applicant_income_000s__lt=mui_boundary),
                "MUI Borrowers",
                Q(applicant_income_000s__gte=mui_boundary),
            ))

        return result + [
            ("Female", Q(applicant_sex=2), "Male", Q(applicant_sex=1)),
            (
                "Applicant in LMI Tract",
                Q(tract__in=Tract.objects.filter(
                    demographics__in=tract_dem_qs.filter(lmi_filter))),
                "MUI Tracts",
                Q(tract__in=Tract.objects.filter(
                    demographics__in=tract_dem_qs.filter(~lmi_filter))),
            ),
            (
                "Applicant in Minority Tract",
                Q(tract__in=Tract.objects.filter(
                    demographics__in=tract_dem_qs.filter(minority_filter))),
                "White Majority Tracts",
                Q(tract__in=Tract.objects.filter(
                    demographics__in=tract_dem_qs.filter(~minority_filter))),
            ),
        ]

    def disparity_ratio(self) -> str:
        feature_denial = 1 - self.feature_approved / self.feature_total
        compare_denial = 1 - self.compare_approved / self.compare_total
        ratio = feature_denial / compare_denial
        return f"{ratio:.1f}"

    @classmethod
    def groups_for(
            cls,
            division: Division,
            year: int) -> Iterator[Tuple[str, List["DisparityRow"]]]:
        queryset = LoanApplicationRecord.objects.filter(
            action_taken__lte=5,
            tract__in=division.tract_set.all(),
            as_of_year=year,
        )
        demographics = AggDemographics.for_division(division, year)

        agg_args = {
            name: Count("pk", filter=filter)
            for name, filter in cls.race_features()
        }
        others = list(cls.other_features(year, demographics))
        for l_name, l_filter, r_name, r_filter in others:
            agg_args[l_name] = Count("pk", filter=l_filter)
            agg_args[r_name] = Count("pk", filter=r_filter)
        agg_args["all"] = Count("pk")
        totals = queryset.aggregate(**agg_args)
        approvals = queryset.filter(action_taken=1).aggregate(**agg_args)

        yield (
            "White borrowers",
            [
                DisparityRow(
                    name, totals[name], approvals[name],
                    totals["all"],
                    totals["White"], approvals["White"],
                )
                for name, _ in cls.race_features()
            ],
        )
        for l_name, _, r_name, _ in others:
            yield (
                r_name,
                [DisparityRow(
                    l_name, totals[l_name], approvals[l_name],
                    totals["all"],
                    totals[r_name], approvals[r_name])],
            )
