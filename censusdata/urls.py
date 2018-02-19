from django.conf.urls import url

from censusdata import views

urlpatterns = [
    url(r'^race_summary/', views.race_summary_http, name='race_summary'),
    url(r'^race_summary_csv/', views.race_summary_csv, name='race_summary_csv'),
]
