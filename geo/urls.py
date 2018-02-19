from django.conf.urls import url

from geo import views

urlpatterns = [
    url(r'search/?$', views.search, name='search'),
]
