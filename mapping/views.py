import json

from analytical.templatetags.analytical import AnalyticalNode
from django.conf import settings
from django.http import HttpResponse
from django.template import RequestContext
from django.templatetags.static import static
from yattag import Doc

from hmda.models import LARYear


def single_page_app(request):
    """This page is managed almost exclusively by React"""
    app_config = json.dumps({
        "token": settings.MAPBOX_TOKEN,
        "years": list(LARYear.objects.all().values_list("year", flat=True)),
    })

    context = RequestContext(request)

    doc = Doc()
    doc.asis("<!DOCTYPE html>")
    with doc.tag("html", lang="en", style="height: 100%; overflow-y: auto;"):
        with doc.tag("head"):
            doc.asis(AnalyticalNode("head_top").render(context))
            doc.stag("meta", charset="utf-8")
            doc.stag(
                "meta", ("http-equiv", "X-UA-Compatible"), content="IE=edge")
            doc.line("title", settings.APP_TITLE)
            doc.stag(
                "meta",
                name="viewport",
                content="initial-scale=1,maximum-scale=1,user-scalable=no",
            )
            doc.stag(
                "link", rel="stylesheet", href=static("new-map-style.css"))
            doc.asis(AnalyticalNode("head_bottom").render(context))
        with doc.tag("body", style="height: 100%;"):
            doc.asis(AnalyticalNode("body_top").render(context))
            doc.stag("div", id="spa", style="height: 100%;")
            doc.line(
                "script",
                f"window['__SPA_CONFIG__'] = {app_config};",
                type="text/javascript",
            )
            with doc.tag(
                "script",
                type="text/javascript",
                src=static("new-map.js"),
            ):
                pass    # has no content, but isn't self-closing
            doc.asis(AnalyticalNode("body_bottom").render(context))

    return HttpResponse(doc.getvalue())
