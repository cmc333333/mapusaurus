from django import template

from ffiec.models import AggDemographics
from geo.models import Division
from reports.models import (
    DisparityRow, IncomeHousingReportRow, PopulationReportRow)

register = template.Library()


@register.inclusion_tag("reports/population.html")
def population(division: Division, year: int):
    return {
        "rows": PopulationReportRow.generate_for(division, year),
    }


@register.inclusion_tag("reports/median_income.html")
def median_income(division: Division, year: int):
    return {"demographics": AggDemographics.for_division(division, year)}


@register.inclusion_tag("reports/income_housing.html")
def income_housing(division: Division, year: int):
    return {
        "rows": IncomeHousingReportRow.generate_for(division, year),
    }


@register.inclusion_tag("reports/tract_lar_report.html")
def tract_lar_report(division: Division, year: int):
    return {
        "row_groups": DisparityRow.groups_for(division, year),
        "year": year,
    }
