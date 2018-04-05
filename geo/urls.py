from django.conf.urls import url

from geo import views
from geo.models import Geo

urlpatterns = [
    url(r'search/metro/$', views.search, name='metro-search',
        kwargs={'geo_type': Geo.METRO_TYPE}),
]
