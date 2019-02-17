from typing import Iterator, List, NamedTuple, Optional, Tuple

from django.db.models import Count, Expression, Q, Sum
from django.db.models.functions import Coalesce

from ffiec.models import AggDemographics, TractDemographics
from geo.models import Division
from hmda.models import LoanApplicationRecord
from reports.serializers import ReportInput


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
            ("LMI Tracts in Geography",
                Count("pk", filter=TractDemographics.FILTERS.LMI)),
            ("Minority Tracts in Geography",
                Count("pk", filter=TractDemographics.FILTERS.MINORITY)),
        )

    @staticmethod
    def pop_features() -> Tuple[Tuple[str, Expression], ...]:
        return (
            (
                "Population in LMI Tracts",
                Coalesce(
                    Sum("persons", filter=TractDemographics.FILTERS.LMI),
                    0,
                ),
            ),
            (
                "Population in Minority Tracts",
                Coalesce(
                    Sum("persons", filter=TractDemographics.FILTERS.MINORITY),
                    0,
                ),
            ),
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
            ("White", LoanApplicationRecord.FILTERS.WHITE),
            ("Black", LoanApplicationRecord.FILTERS.BLACK),
            ("Hispanic/Latino", LoanApplicationRecord.FILTERS.HISPANIC),
            ("Asian", LoanApplicationRecord.FILTERS.ASIAN),
            ("Minority", LoanApplicationRecord.FILTERS.MINORITY),
        )

    @staticmethod
    def other_features(
            year: int,
            demographics: Optional[AggDemographics],
            ) -> List[Tuple[str, Q, str, Q]]:
        tract_dem_qs = TractDemographics.objects\
            .values("tract_id")\
            .filter(year=year)
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
            (
                "Female",
                LoanApplicationRecord.FILTERS.FEMALE,
                "Male",
                LoanApplicationRecord.FILTERS.MALE,
            ),
            (
                "Applicant in LMI Tract",
                Q(tract__in=tract_dem_qs.filter(
                    TractDemographics.FILTERS.LMI)),
                "MUI Tracts",
                Q(tract__in=tract_dem_qs.filter(
                    ~TractDemographics.FILTERS.LMI)),
            ),
            (
                "Applicant in Minority Tract",
                Q(tract__in=tract_dem_qs.filter(
                        TractDemographics.FILTERS.MINORITY)),
                "White Majority Tracts",
                Q(tract__in=tract_dem_qs.filter(
                        ~TractDemographics.FILTERS.MINORITY)),
            ),
        ]

    def disparity_ratio(self) -> str:
        if not self.feature_total or not self.compare_total:
            return "N/A"
        feature_denial = 1 - self.feature_approved / self.feature_total
        compare_denial = 1 - self.compare_approved / self.compare_total
        if not compare_denial:
            return "N/A"
        ratio = feature_denial / compare_denial
        return f"{ratio:.1f}"

    @classmethod
    def groups_for(
            cls,
            division: Division,
            report_input: ReportInput) -> Iterator["GroupedDisparityRows"]:
        lar_queryset = report_input.lar_queryset(division)
        demographics = AggDemographics.for_division(
            division, report_input.year)

        agg_args = {
            name: Count("pk", filter=filter)
            for name, filter in cls.race_features()
        }
        others = list(cls.other_features(report_input.year, demographics))
        for l_name, l_filter, r_name, r_filter in others:
            agg_args[l_name] = Count("pk", filter=l_filter)
            agg_args[r_name] = Count("pk", filter=r_filter)
        agg_args["all"] = Count("pk")
        totals = lar_queryset.aggregate(**agg_args)
        approvals = lar_queryset\
            .filter(LoanApplicationRecord.FILTERS.APPROVED)\
            .aggregate(**agg_args)

        yield GroupedDisparityRows(
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
            yield GroupedDisparityRows(
                r_name,
                [DisparityRow(
                    l_name, totals[l_name], approvals[l_name],
                    totals["all"],
                    totals[r_name], approvals[r_name])],
            )


class GroupedDisparityRows(NamedTuple):
    comparison_label: str
    rows: List[DisparityRow]


class TopLenderRow(NamedTuple):
    lender_rank: int
    name: str
    applications: int
    approval_rate: int
    lmit_pct: int
    lmib_pct: int
    mint_pct: int
    minb_pct: int

    @classmethod
    def generate_for(
            cls,
            division: Division,
            report_input: ReportInput,
            count: int = 20) -> Iterator["TopLenderRow"]:
        demographics = AggDemographics.for_division(
            division, report_input.year)
        if demographics:
            mui_boundary = (demographics.ffiec_est_med_fam_income * .8) // 1000
        else:
            mui_boundary = 0
        lmi_app_filter = Q(applicant_income_000s__lt=mui_boundary)
        tract_dem_qs = TractDemographics.objects\
            .values("tract_id")\
            .filter(tract__in=division.tract_set.all(), year=report_input.year)
        lmi_tracts = Q(tract__in=tract_dem_qs.filter(
            TractDemographics.FILTERS.LMI))
        min_tracts = Q(tract__in=tract_dem_qs.filter(
            TractDemographics.FILTERS.MINORITY))

        rows = report_input.lar_queryset(division)\
            .values("institution_id", "institution__name")\
            .annotate(
                applications=Count("pk"),
                approved=Count(
                    "pk", filter=LoanApplicationRecord.FILTERS.APPROVED),
                lmit_approved=Count(
                    "pk",
                    filter=lmi_tracts & LoanApplicationRecord.FILTERS.APPROVED,
                ),
                lmib_approved=Count(
                    "pk",
                    filter=(
                        lmi_app_filter
                        & LoanApplicationRecord.FILTERS.APPROVED
                    ),
                ),
                mint_approved=Count(
                    "pk",
                    filter=min_tracts & LoanApplicationRecord.FILTERS.APPROVED,
                ),
                minb_approved=Count(
                    "pk",
                    filter=(
                        LoanApplicationRecord.FILTERS.MINORITY
                        & LoanApplicationRecord.FILTERS.APPROVED
                    ),
                ),
            )\
            .order_by("-applications")
        for idx, row in enumerate(rows):
            if idx < count or row["institution_id"] in report_input.lender_ids:
                yield cls(
                    idx + 1,
                    row["institution__name"],
                    row["applications"],
                    100 * row["approved"] // (row["applications"] or 1),
                    100 * row["lmit_approved"] // (row["approved"] or 1),
                    100 * row["lmib_approved"] // (row["approved"] or 1),
                    100 * row["mint_approved"] // (row["approved"] or 1),
                    100 * row["minb_approved"] // (row["approved"] or 1),
                )
