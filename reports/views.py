import secrets
from urllib.parse import urljoin

from django.conf import settings
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from reports.tasks import generate_report


class ReportSerializer(serializers.Serializer):
    county = serializers.ListField(child=serializers.CharField(), default=list)
    metro = serializers.ListField(child=serializers.CharField(), default=list)
    year = serializers.IntegerField()


@api_view(["POST"])
def create_report(request: Request) -> Response:
    serializer = ReportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    filename = secrets.token_urlsafe(16)
    generate_report(
        filename=filename,
        county_ids=serializer.data["county"],
        metro_ids=serializer.data["metro"],
        year=serializer.data["year"],
    )
    return Response({"url": urljoin(settings.MEDIA_URL, f"{filename}.pdf")})
