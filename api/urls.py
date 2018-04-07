from django.conf.urls import url

from api import views


urlpatterns = [
    url(r'^all/', views.all, name='all'),
    url(r'^hmda/', views.hmda, name='hmda'),
    url(r'^census/', views.census, name='census'),
    url(r'^tables/', views.tables, name='tables'),
    url(r'^tables_csv/', views.tables_csv, name='tables_csv'),
    url(r'^branchLocations/', views.branch_locations, name='branchLocations'),
]
