from typing import Union

from django import template

from geo.models import CoreBasedStatisticalArea, County, Tract
from reports.models import (
    HomeReport, PopulationByTractReport, PopulationReport, TractReport)

CBSAOrCounty = Union[CoreBasedStatisticalArea, County]
register = template.Library()


@register.inclusion_tag("reports/population.html")
def population(cbsa_or_county: CBSAOrCounty, year: int):
    if isinstance(cbsa_or_county, County):
        tract_qs = cbsa_or_county.tract_set.all()
    else:
        tract_qs = Tract.objects.filter(county__cbsa=cbsa_or_county)
    return {"report": PopulationReport.load(tract_qs, year)}


@register.inclusion_tag("reports/income_housing.html")
def income_housing(cbsa_or_county: CBSAOrCounty, year: int):
    if isinstance(cbsa_or_county, County):
        tract_qs = cbsa_or_county.tract_set.all()
    else:
        tract_qs = Tract.objects.filter(county__cbsa=cbsa_or_county)
    return {
        "home_report": HomeReport.load(tract_qs, year),
        "poptract_report": PopulationByTractReport.load(tract_qs, year),
        "tract_report": TractReport.load(tract_qs, year),
    }


@register.inclusion_tag("reports/msa_median_income.html")
def msa_median_income(cbsa: CoreBasedStatisticalArea, year: int):
    stats = cbsa.demographics.filter(year=year).first()
    return {"income": stats.median_family_income if stats else 0}
