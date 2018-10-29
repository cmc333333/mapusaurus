from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from respondents import views


urlpatterns = [
    url(r'^search/$', views.search_results, name='search_results'),
    url(r'^branchLocations/(?P<northEastLat>-?\d+\.\d{6})/(?P<northEastLon>-?\d+\.\d{6})/(?P<southWestLat>-?\d+\.\d{6})/(?P<southWestLon>-?\d+\.\d{6})$',
        views.branch_locations_as_json, name='branch_locations'),
]

urlpatterns = format_suffix_patterns(urlpatterns)
