from django.conf.urls import url

from reports import views

urlpatterns = [
    url(r'^population-demographics/$', views.population_demographics),
    url(r'^applications/$', views.applicants,
        kwargs={'actions': (1, 2, 3, 4, 5), 'actions_name': 'Applications'}),
    url(r'^originations/$', views.applicants,
        kwargs={'actions': (1,), 'actions_name': 'Originations'}),
    url(r'^approvals/$', views.lar_status,
        kwargs={'actions': (1,), 'actions_name': 'Approvals'}),
    url(r'^denials/$', views.lar_status,
        kwargs={'actions': (3,), 'actions_name': 'Denials'}),
]
