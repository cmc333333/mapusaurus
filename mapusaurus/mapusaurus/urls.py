from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import RedirectView


urlpatterns = [
    url(r'^$', RedirectView.as_view(url='/institutions/', permanent=False)),
    url(r'^api/', include('api.urls')),
    url(r'^institutions/', include('respondents.urls',
                                   namespace='respondents')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^shapes/', include('geo.urls', namespace='geo')),
    url(r'^hmda/', include('hmda.urls', namespace='hmda')),
    url(r'^map/', include('mapping.urls')),
    url(r'^census/', include('censusdata.urls', namespace='censusdata'))
]
