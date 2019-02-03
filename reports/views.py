import secrets

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from reports.serializers import ReportSerializer
from reports.tasks import generate_report, report_url


@api_view(["POST"])
def create_report(request: Request) -> Response:
    serializer = ReportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    file_id = secrets.token_urlsafe(16)
    generate_report(file_id=file_id, request_params=request.data)
    return Response({"url": report_url(file_id)})
