from django.conf.urls import url

from reports.views.actions import approvals, denials
from reports.views.applicants import applications, originations
from reports.views.demographics import demographics

urlpatterns = [
    url(r'^applications/$', applications),
    url(r'^approvals/$', approvals),
    url(r'^demographics/$', demographics),
    url(r'^denials/$', denials),
    url(r'^originations/$', originations),
]
