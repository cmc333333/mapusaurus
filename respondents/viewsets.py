from rest_framework import viewsets

from respondents.models import Institution
from respondents.serializers import RespondentSerializer


class RespondentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = RespondentSerializer
    filterset_fields = {
        "institution_id": ("in",)
    }
