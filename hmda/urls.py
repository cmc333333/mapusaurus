from django.conf.urls import url

from hmda import views

urlpatterns = [
    url(r'^volume/', views.loan_originations_http, name='volume'),
]
