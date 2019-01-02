import json
import os

import dj_database_url
from django.utils.crypto import get_random_string

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', get_random_string(50))

DEBUG = os.environ.get('DEBUG', 'FALSE').upper() == 'TRUE'

ALLOWED_HOSTS = json.loads(os.environ.get('ALLOWED_HOSTS', '[]'))

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'django.contrib.humanize',
    'django.contrib.postgres',
    'localflavor',
    'analytical',
    'rest_framework',
    'django_filters',
    'basestyle',
    'mapping',
    'respondents',
    'geo',
    'hmda',
    'api',
    'ffiec',
    'reports',
)

MIDDLEWARE = (
    'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',
)

CSRF_COOKIE_HTTPONLY = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
USING_SSL = os.environ.get('USING_SSL', 'TRUE').upper() == 'TRUE'
SESSION_COOKIE_SECURE = USING_SSL
CSRF_COOKIE_SECURE = USING_SSL
SECURE_SSL_REDIRECT = USING_SSL
X_FRAME_OPTIONS = 'DENY'


ROOT_URLCONF = 'mapusaurus.urls'

WSGI_APPLICATION = 'mapusaurus.wsgi.application'


DATABASES = {'default': dj_database_url.config(default=(
    f"postgis://{os.environ.get('DATABASE_USER')}"
    f":{os.environ.get('DATABASE_PASS')}"
    f"@{os.environ.get('DATABASE_HOST')}"
    f"/{os.environ.get('DATABASE_NAME')}"
))}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True


STATIC_ROOT = os.path.join(BASE_DIR, 'out')
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'frontend', 'dist'),
]

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_PAGINATION_CLASS':
        'rest_framework.pagination.PageNumberPagination',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'PAGE_SIZE': 20,
}

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
            'mapusaurus.context_processors.inject_app_title',
        ],
        'loaders': [
            'django.template.loaders.filesystem.Loader',
            'django.template.loaders.app_directories.Loader',
        ],
    },
}]

CONTACT_US_EMAIL = os.environ.get('CONTACT_US_EMAIL', '')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
    },
}


APP_TITLE = 'Redlining Risk Assessment Mapper'
MAPBOX_TOKEN = os.environ.get(
    'MAPBOX_TOKEN',
    'pk.eyJ1IjoiY2ZwYiIsImEiOiJodmtiSk5zIn0.VkCynzmVYcLBxbyHzlvaQw',
)

GOOGLE_ANALYTICS_ANONYMIZE_IP = True
GOOGLE_ANALYTICS_SITE_SPEED = True
