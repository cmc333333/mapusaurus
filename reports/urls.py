from django.conf.urls import url

from reports.views.demographics import demographics

urlpatterns = [
    url(r'^demographics/$', demographics),
]
