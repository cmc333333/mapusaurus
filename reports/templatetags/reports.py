from typing import List

import us
from django import template

from ffiec.models import AggDemographics
from geo.models import County, Division
from hmda.models import (
    ACTION_TAKEN_CHOICES, LIEN_STATUS_CHOICES, LOAN_PURPOSE_CHOICES,
    OWNER_OCCUPANCY_CHOICES, PROPERTY_TYPE_CHOICES,
)
from reports.models import (
    DisparityRow, IncomeHousingReportRow, PopulationReportRow, TopLenderRow)
from reports.serializers import ReportInput

register = template.Library()


@register.inclusion_tag("reports/population.html")
def population(division: Division, year: int):
    return {"rows": PopulationReportRow.generate_for(division, year)}


@register.inclusion_tag("reports/median_income.html")
def median_income(division: Division, year: int):
    return {"demographics": AggDemographics.for_division(division, year)}


@register.inclusion_tag("reports/income_housing.html")
def income_housing(division: Division, year: int):
    return {"rows": IncomeHousingReportRow.generate_for(division, year)}


@register.inclusion_tag("reports/tract_lar_report.html")
def tract_lar_report(division: Division, report_input: ReportInput):
    return {
        "row_groups": DisparityRow.groups_for(division, report_input),
        "year": report_input.year,
    }


@register.inclusion_tag("reports/top_lenders.html")
def top_lenders(division: Division, report_input: ReportInput):
    return {"rows": TopLenderRow.generate_for(division, report_input)}


@register.inclusion_tag("reports/sidebar.html")
def sidebar(division: Division, report_input: ReportInput):
    if isinstance(division, County):
        counties: List[str] = []
        state = us.states.lookup(division.state_id).abbr
        name = f"{division.name} County, {state}"
    else:
        counties = division.county_set\
            .values_list("name", flat=True)\
            .order_by("name")
        name = division.name
    return {
        "counties": counties,
        "lar_filter_descs": [
            (
                "Action Taken",
                [name for key, name in ACTION_TAKEN_CHOICES if key <= 5],
            ), (
                "Loan Purpose",
                [name for key, name in LOAN_PURPOSE_CHOICES
                 if key in report_input.loan_purpose_ids],
            ), (
                "Property Type",
                [name for key, name in PROPERTY_TYPE_CHOICES
                 if key in report_input.property_type_ids],
            ), (
                "Owner Occupancy",
                [name for key, name in OWNER_OCCUPANCY_CHOICES
                 if key in report_input.owner_occupancy_ids],
            ), (
                "Lien Status",
                [name for key, name in LIEN_STATUS_CHOICES
                 if key in report_input.lien_status_ids],
            ),
        ],
        "name": name,
        "year": report_input.year,
    }
