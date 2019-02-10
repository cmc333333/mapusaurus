from django.conf import settings


def inject_app_title(request):
    return {
        "APP_TITLE": getattr(settings, "APP_TITLE", ""),
        "MAPBOX_TOKEN": getattr(settings, "MAPBOX_TOKEN", ""),
    }
