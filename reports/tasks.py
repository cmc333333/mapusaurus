from datetime import timedelta
from typing import Any, BinaryIO, Dict
from urllib.parse import urljoin

from background_task import background
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from weasyprint import HTML

from geo.models import CoreBasedStatisticalArea, County
from reports.serializers import ReportSerializer


def report_url(filename: str) -> str:
    return urljoin(settings.MEDIA_URL, f"{filename}.pdf")


def send_email(report: BinaryIO, file_id: str, serializer: ReportSerializer):
    context = {
        "county_names": (
            County.objects
            .filter(pk__in=serializer.validated_data["county"])
            .values_list("name", flat=True)
            .order_by("name")
        ),
        "metro_names": (
            CoreBasedStatisticalArea.objects
            .filter(pk__in=serializer.validated_data["metro"])
            .values_list("name", flat=True)
            .order_by("name")
        ),
        "url": report_url(file_id),
        "year": serializer.validated_data["year"],
    }
    email = EmailMultiAlternatives(
        body=render_to_string("reports/email.txt", context),
        to=[serializer.validated_data["email"]],
        attachments=[("report.pdf", report, "application/pdf")],
        **settings.REPORT_EMAIL_KWARGS,
    )
    email.attach_alternative(
        render_to_string("reports/email.html", context), "text/html")
    email.send()


@background()
def generate_report(file_id: str, request_params: Dict[str, Any]):
    serializer = ReportSerializer(data=request_params)
    serializer.is_valid(raise_exception=True)   # re-validate from the DB

    context = {
        "divisions": serializer.divisions(),
        "year": serializer.validated_data["year"],
    }
    report_html = render_to_string("reports/report.html", context)
    pdf = HTML(string=report_html).write_pdf()
    default_storage.save(f"{file_id}.pdf", ContentFile(pdf))
    delete_report(file_id)
    send_email(pdf, file_id, serializer)


@background(schedule=timedelta(days=7))
def delete_report(file_id: str):
    default_storage.delete(f"{file_id}.pdf")
