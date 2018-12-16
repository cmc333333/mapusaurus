from django.conf.urls import include, url
from rest_framework.routers import DefaultRouter

from api import views
from geo.viewsets import CountyViewSet, MetroViewSet
from hmda.viewsets import LARViewSet
from respondents.viewsets import RespondentViewSet

api_router = DefaultRouter()
api_router.register(r'county', CountyViewSet)
api_router.register(r'metro', MetroViewSet)
api_router.register(r'lar', LARViewSet, base_name='LAR')
api_router.register(r'respondents', RespondentViewSet)


urlpatterns = [
    url(r'^all/', views.all, name='all'),
    url(r'^hmda/', views.hmda, name='hmda'),
    url(r'^census/', views.census, name='census'),
    url(r'^tables/', views.tables, name='tables'),
    url(r'^tables_csv/', views.tables_csv, name='tables_csv'),
    url(r'^branchLocations/', views.branch_locations, name='branchLocations'),
    url(r'^', include(api_router.urls)),
]
