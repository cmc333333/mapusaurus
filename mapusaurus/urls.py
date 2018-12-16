from django.conf.urls import include, url
from django.views.generic.base import RedirectView

from mapping.views import single_page_app


urlpatterns = [
    url(r'^$', single_page_app),
    url(r'^api/', include('api.urls')),
    url(r'^institutions/', include('respondents.urls',
                                   namespace='respondents')),
    url(r'^hmda/', include('hmda.urls', namespace='hmda')),
    url(r'^map/spa/$', RedirectView.as_view(url="/", permanent=False)),
    url(r'^census/', include('censusdata.urls', namespace='censusdata')),
    url(r'^reports/', include('reports.urls', namespace='reports')),
]
