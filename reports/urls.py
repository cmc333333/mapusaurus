from django.conf.urls import url

from reports.report_list import report_list
from reports.views.as_xls import as_xls

urlpatterns = [
    url(rf'^{report.slug}/$', report.fn) for report in report_list
] + [url(r'^all/$', as_xls, name='as_xls')]
