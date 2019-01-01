from django.http.response import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML

from reports.serializers import ReportSerializer


def report(request, pdf: str) -> HttpResponse:
    serializer = ReportSerializer(data=request.GET)
    serializer.is_valid(raise_exception=True)

    html = render_to_string(
        "reports/report.html",
        {
            "counties": serializer.validated_data["county"],
            "metros": serializer.validated_data["metro"],
            "year": serializer.validated_data["year"],
        },
    )
    if pdf:
        response = HttpResponse(
            HTML(string=html).write_pdf(),
            content_type="application/pdf",
        )
        response["Content-Disposition"] = "attachment; filename=report.pdf"
    else:
        response = HttpResponse(html)
    return response
