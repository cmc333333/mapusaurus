from collections import OrderedDict

from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from geo.views import TractFilters

_aggregates = OrderedDict()
_aggregates['Total Population'] = Sum('census2010race__total_pop')
_aggregates['White'] = Sum('census2010race__white_alone')
_aggregates['Black'] = Sum('census2010race__black_alone')
_aggregates['Hispanic/Latino'] = Sum('census2010hispanicorigin__hispanic')
_aggregates['Native American'] = Sum('census2010race__amind_alone')
_aggregates['Asian'] = Sum('census2010race__asian_alone')
_aggregates['HOPI'] = Sum('census2010race__pacis_alone')
_aggregates['Other Races'] = Sum('census2010race__other_alone')
_aggregates['Two or More Races'] = Sum('census2010race__two_or_more')
_aggregates['Total Minority'] = (
    Sum('census2010racestats__total_pop')
    - Sum('census2010racestats__non_hisp_white_only')
)
_aggregates['Females'] = Sum('census2010sex__female')


@api_view()
def demographics(request):
    """Demographic data about a particular metro."""
    tracts = TractFilters(request.GET, request=request).qs
    query_result = tracts.aggregate(**_aggregates)
    total_pop = query_result['Total Population']

    rows = []
    for field_name in _aggregates:
        row = {
            'Population Demographics': field_name,
            'Number': query_result[field_name] or 0,
            'Percent': 0,
        }
        if total_pop:
            row['Percent'] = row['Number'] / total_pop
        rows.append(row)
    return Response({
        'fields': ['Population Demographics', 'Number', 'Percent'],
        'data': rows,
    })
