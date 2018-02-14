import dj_database_url

from mapusaurus.settings.settings import *

DATABASES = {
    'default': dj_database_url.config(),
}

CONTACT_US_EMAIL = 'example@example.com'

