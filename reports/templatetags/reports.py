from django import template

from geo.models import Division
from ffiec.models import AggDemographics
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


