from django.conf.urls import url

from reports.views.applicants import applications, originations
from reports.views.demographics import demographics

urlpatterns = [
    url(r'^applications/$', applications),
    url(r'^demographics/$', demographics),
    url(r'^originations/$', originations),
]
