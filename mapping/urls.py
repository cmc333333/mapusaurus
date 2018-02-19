from django.conf.urls import url

from mapping import views

urlpatterns = [
    url(r'^$', views.map, {'template':'map.html'}, name='map'),
    url(r'^print/', views.map, {'template' :'print_map.html'}, name='printmap'),
    url(r'^faq/', views.map, {'template' :'faq.html'}, name='faq')
]
