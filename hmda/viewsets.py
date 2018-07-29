from rest_framework import viewsets

from hmda.views import LARMultipleLenderFilters
from hmda.serializers import LARSerializer


class LARViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LARSerializer
    pagination_class = None

    def get_queryset(self):
        return LARMultipleLenderFilters(
            self.request.GET, request=self.request
        ).qs
