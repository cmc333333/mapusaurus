from rest_framework import viewsets

from hmda.filters import LARFilters
from hmda.models import LoanApplicationRecord
from hmda.serializers import LARSerializer


class LARViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LoanApplicationRecord.objects.order_by("pk")
    serializer_class = LARSerializer
    pagination_class = None
    filterset_class = LARFilters
