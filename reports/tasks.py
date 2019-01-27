from datetime import timedelta
from typing import List

from background_task import background
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.template.loader import render_to_string
from weasyprint import HTML

from geo.models import (
    CoreBasedStatisticalArea, County, Division, MetroDivision)


def divisions_for_metros(metro_ids: List[str]) -> List[Division]:
    metros: List[CoreBasedStatisticalArea] = []
    metdivs: List[MetroDivision] = []
    for metro in CoreBasedStatisticalArea.objects.filter(pk__in=metro_ids):
        if metro.metrodivision_set.exists():
            metdivs.extend(metro.metrodivision_set.all())
        else:
            metros.append(metro)

    metros = sorted(metros, key=lambda m: m.name)
    metdivs = sorted(metdivs, key=lambda m: m.name)
    return metros + metdivs


@background()
def generate_report(
        filename: str, county_ids: List[str], metro_ids: List[str], year: int):
    divisions = divisions_for_metros(metro_ids)
    divisions.extend(
        County.objects
        .filter(pk__in=county_ids)
        .select_related("cbsa", "metdiv", "state")
    )
    html = render_to_string(
        "reports/report.html",
        {"divisions": divisions, "year": year},
    )
    pdf = HTML(string=html).write_pdf()
    default_storage.save(f"{filename}.pdf", ContentFile(pdf))
    delete_report(filename)


@background(schedule=timedelta(days=7))
def delete_report(filename: str):
    default_storage.delete(f"{filename}.pdf")
