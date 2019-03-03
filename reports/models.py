from typing import Iterator, List, NamedTuple, Tuple

from django.db import models
from django.db.models import Sum
from django.db.models.functions import Coalesce

from geo.models import County, Division
from mapusaurus.materialized_view import MaterializedView
from reports.serializers import ReportInput
from respondents.models import Institution


class PopulationReport(MaterializedView):
    compound_id = models.CharField(max_length=4 + 5, primary_key=True)
    year = models.SmallIntegerField()
    county = models.ForeignKey(County, on_delete=models.DO_NOTHING)
    total = models.IntegerField(verbose_name="All Population")
    white = models.IntegerField(verbose_name="White")
    hispanic = models.IntegerField(verbose_name="Hispanic/Latino")
    black = models.IntegerField(verbose_name="Black")
    asian = models.IntegerField(verbose_name="Asian")
    minority = models.IntegerField(verbose_name="Minority")
    poverty = models.IntegerField(verbose_name="People Living in Poverty")

    REPORT_COLUMNS = (
        "total", "white", "hispanic", "black", "asian", "minority", "poverty",
    )

    @classmethod
    def generate_for(
            cls,
            division: Division,
            year: int,
    ) -> Iterator[Tuple[str, int, int]]:
        data = cls.objects\
            .filter(county__in=division.counties, year=year)\
            .aggregate(
                **{col: Coalesce(Sum(col), 0) for col in cls.REPORT_COLUMNS},
            )
        for column in cls.REPORT_COLUMNS:
            yield (
                cls._meta.get_field(column).verbose_name,
                data[column],
                100 * data[column] // (data["total"] or 1),
            )


class IncomeHousingReport(MaterializedView):
    compound_id = models.CharField(max_length=4 + 5, primary_key=True)
    year = models.SmallIntegerField()
    county = models.ForeignKey(County, on_delete=models.DO_NOTHING)
    home_total = models.IntegerField(verbose_name="Single Family Homes")
    occupied = models.IntegerField(verbose_name="Owner Occupied Homes")
    tract_total = models.IntegerField(verbose_name="Total Tracts")
    lmi_tracts = models.IntegerField(verbose_name="LMI Tracts in Geography")
    min_tracts = models.IntegerField(
        verbose_name="Minority Tracts in Geography")
    pop_total = models.IntegerField(verbose_name="Total Population")
    pop_lmi = models.IntegerField(verbose_name="Population in LMI Tracts")
    pop_min = models.IntegerField(
        verbose_name="Population in Minority Tracts")

    GROUPED_COLUMNS = (
        ("home_total", ("home_total", "occupied")),
        ("tract_total", ("lmi_tracts", "min_tracts")),
        ("pop_total", ("pop_lmi", "pop_min")),
    )

    @classmethod
    def generate_for(
            cls,
            division: Division,
            year: int,
    ) -> Iterator[Tuple[str, int, int]]:
        columns = set()
        for cmp_field, fields in cls.GROUPED_COLUMNS:
            columns.add(cmp_field)
            columns.update(fields)

        data = cls.objects\
            .filter(county__in=division.counties, year=year)\
            .aggregate(**{field: Coalesce(Sum(field), 0) for field in columns})

        for cmp_field, fields in cls.GROUPED_COLUMNS:
            for field in fields:
                yield (
                    cls._meta.get_field(field).verbose_name,
                    data[field],
                    100 * data[field] // (data[cmp_field] or 1),
                )


class DisparityReport(MaterializedView):
    compound_id = models.CharField(max_length=4 + 5 + 1 + 4, primary_key=True)
    year = models.SmallIntegerField()
    county = models.ForeignKey(County, on_delete=models.DO_NOTHING)
    approved = models.BooleanField()
    lien_status = models.CharField(max_length=1)
    loan_purpose = models.CharField(max_length=1)
    owner_occupancy = models.CharField(max_length=1)
    property_type = models.CharField(max_length=1)
    all_records = models.IntegerField()
    white = models.IntegerField(verbose_name="White borrowers")
    black = models.IntegerField(verbose_name="Black")
    hispanic = models.IntegerField(verbose_name="Hispanic/Latino")
    asian = models.IntegerField(verbose_name="Asian")
    minb = models.IntegerField(verbose_name="Minority")
    lmib = models.IntegerField(verbose_name="LMI Applicant")
    muib = models.IntegerField(verbose_name="MUI Borrowers")
    female = models.IntegerField(verbose_name="Female")
    male = models.IntegerField(verbose_name="Male")
    lmit = models.IntegerField(verbose_name="Applicant in LMI Tract")
    muit = models.IntegerField(verbose_name="MUI Tracts")
    mint = models.IntegerField(verbose_name="Applicant in Minority Tract")
    whitet = models.IntegerField(verbose_name="White Majority Tracts")

    GROUPED_COLUMNS = (
        ("white", ["white", "black", "hispanic", "asian", "minb"]),
        ("muib", ["lmib"]),
        ("male", ["female"]),
        ("muit", ["lmit"]),
        ("whitet", ["mint"]),
    )

    @classmethod
    def groups_for(
            cls,
            division: Division,
            report_input: ReportInput,
    ) -> Iterator["GroupedDisparityRows"]:
        columns = {"all_records"}
        for cmp_field, fields in cls.GROUPED_COLUMNS:
            columns.add(cmp_field)
            columns.update(fields)

        queryset = cls.objects\
            .filter(
                county__in=division.counties,
                year=report_input.year,
                lien_status__in=report_input.lien_status_ids,
                loan_purpose__in=report_input.loan_purpose_ids,
                owner_occupancy__in=report_input.owner_occupancy_ids,
                property_type__in=report_input.property_type_ids,
            )
        aggs = {field: Coalesce(Sum(field), 0) for field in columns}
        totals = queryset.aggregate(**aggs)
        approved = queryset.filter(approved=True).aggregate(**aggs)

        for cmp_field, fields in cls.GROUPED_COLUMNS:
            yield GroupedDisparityRows(
                cls._meta.get_field(cmp_field).verbose_name,
                [
                    DisparityRow(
                        "White" if field == "white"
                        else cls._meta.get_field(field).verbose_name,
                        totals[field], approved[field],
                        totals["all_records"],
                        totals[cmp_field], approved[cmp_field],
                    )
                    for field in fields
                ],
            )


class DisparityRow(NamedTuple):
    feature: str
    feature_total: int
    feature_approved: int
    total: int

    compare_total: int
    compare_approved: int

    def disparity_ratio(self) -> str:
        if not self.feature_total or not self.compare_total:
            return "N/A"
        feature_denial = 1 - self.feature_approved / self.feature_total
        compare_denial = 1 - self.compare_approved / self.compare_total
        if not compare_denial:
            return "N/A"
        ratio = feature_denial / compare_denial
        return f"{ratio:.1f}"


class GroupedDisparityRows(NamedTuple):
    comparison_label: str
    rows: List[DisparityRow]


class LenderReport(MaterializedView):
    compound_id = models.CharField(max_length=4 + 5 + 4 + 15, primary_key=True)
    year = models.SmallIntegerField()
    county = models.ForeignKey(County, on_delete=models.DO_NOTHING)
    lien_status = models.CharField(max_length=1)
    loan_purpose = models.CharField(max_length=1)
    owner_occupancy = models.CharField(max_length=1)
    property_type = models.CharField(max_length=1)
    lender = models.ForeignKey(Institution, on_delete=models.DO_NOTHING)
    lender_name = models.CharField(max_length=128)
    applications = models.IntegerField()
    approved = models.IntegerField()
    lmit_approved = models.IntegerField()
    lmib_approved = models.IntegerField()
    mint_approved = models.IntegerField()
    minb_approved = models.IntegerField()

    AGG_COLUMNS = (
        "applications", "approved", "lmit_approved", "lmib_approved",
        "mint_approved", "minb_approved",
    )

    @classmethod
    def generate_for(
            cls,
            division: Division,
            report_input: ReportInput,
            count: int = 20,
    ) -> Iterator["TopLenderRow"]:
        data = cls.objects\
            .filter(
                county__in=division.counties,
                year=report_input.year,
                lien_status__in=report_input.lien_status_ids,
                loan_purpose__in=report_input.loan_purpose_ids,
                owner_occupancy__in=report_input.owner_occupancy_ids,
                property_type__in=report_input.property_type_ids,
            )\
            .values("lender_id", "lender_name")\
            .annotate(**{f: Coalesce(Sum(f), 0) for f in cls.AGG_COLUMNS})\
            .order_by("-applications")

        for idx, row in enumerate(data):
            if idx < count or row["lender_id"] in report_input.lender_ids:
                yield TopLenderRow(
                    idx + 1,
                    row["lender_id"] in report_input.lender_ids,
                    row["lender_name"],
                    row["applications"],
                    100 * row["approved"] // (row["applications"] or 1),
                    100 * row["lmit_approved"] // (row["approved"] or 1),
                    100 * row["lmib_approved"] // (row["approved"] or 1),
                    100 * row["mint_approved"] // (row["approved"] or 1),
                    100 * row["minb_approved"] // (row["approved"] or 1),
                )


class TopLenderRow(NamedTuple):
    lender_rank: int
    requested: bool
    name: str
    applications: int
    approval_rate: int
    lmit_pct: int
    lmib_pct: int
    mint_pct: int
    minb_pct: int
