import dj_database_url

from mapusaurus.settings.settings import *

DATABASES = {
    'default': dj_database_url.config(),
}

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': 'http://search:9200/',
        'INDEX_NAME': 'mapusaurus',
    },
}

CONTACT_US_EMAIL = 'example@example.com'

