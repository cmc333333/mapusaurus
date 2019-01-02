from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from respondents import views

app_name = "respondents"


urlpatterns = [
    url(r'^search/$', views.search_results, name='search_results'),
    url(
        r'/'.join([
            r'^branchLocations',
            r'(?P<northEastLat>-?\d+\.\d{6})',
            r'(?P<northEastLon>-?\d+\.\d{6})',
            r'(?P<southWestLat>-?\d+\.\d{6})',
            r'(?P<southWestLon>-?\d+\.\d{6})$',
        ]),
        views.branch_locations_as_json,
        name='branch_locations',
    ),
]

urlpatterns = format_suffix_patterns(urlpatterns)
