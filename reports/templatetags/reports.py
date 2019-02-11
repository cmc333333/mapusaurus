from django import template

from ffiec.models import AggDemographics
from geo.models import Division
from reports.models import (
    DisparityRow, IncomeHousingReportRow, PopulationReportRow)
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
