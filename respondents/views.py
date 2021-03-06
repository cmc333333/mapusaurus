import json
import re
from datetime import date

from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Q
from django.http import HttpResponseBadRequest
from django.utils.html import escape
from rest_framework import serializers
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from respondents.models import Branch, Institution


class InstitutionSerializer(serializers.ModelSerializer):
    """Used in RESTful endpoints"""
    formatted_name = serializers.CharField()

    class Meta:
        model = Institution
        fields = (
            "year",
            "respondent_id",
            "institution_id",
            "tax_id",
            "name",
            "mailing_address",
            "zip_code",
            "assets",
            "rssd_id",
            "formatted_name",
        )


# 90123456789 (Agency Code + Respondent ID)
PREFIX_RE = re.compile(r"^(?P<agency>[0-9])(?P<respondent>[0-9-]{10})$")
# Some Bank (90123456789) - same format as InstitutionSerializer
PAREN_RE = re.compile(r"^.*\((?P<agency>[0-9])(?P<respondent>[0-9-]{10})\)$")
# 0123456789 (Respondent ID Only)
RESP_RE = re.compile(r"^(?P<respondent>[0-9-]{10})$")
LENDER_REGEXES = [PREFIX_RE, PAREN_RE]
SORT_WHITELIST = ("assets", "-assets", "num_loans", "-num_loans")


@api_view(["GET"])
@renderer_classes((JSONRenderer,))
def search_results(request):
    query_str = escape(request.GET.get("q", "")).strip()
    year = escape(request.GET.get("year", "")).strip()
    if not year:
        year = str(date.today().year)

    lender_id = False
    respondent_id = False
    for regex in LENDER_REGEXES:
        match = regex.match(query_str)
        if match:
            lender_id = (
                year + match.group("agency") + match.group("respondent"))
    resp_only_match = RESP_RE.match(query_str)
    if resp_only_match:
        respondent_id = resp_only_match.group("respondent")

    query = Institution.objects\
        .order_by("-assets")\
        .filter(num_loans__gt=0, year=year)

    if lender_id:
        query = query.filter(institution_id=lender_id)
    elif respondent_id:
        query = query.filter(respondent_id=respondent_id)
    elif query_str:
        query = query\
            .annotate(similarity=TrigramSimilarity("name", query_str))\
            .filter(similarity__gte=0.3)\
            .order_by("-similarity")
    else:
        query = query.none()

    if request.GET.get("sort") in SORT_WHITELIST:
        query = query.order_by(request.GET["sort"])
        sort = current_sort = request.GET["sort"]
    else:
        sort = current_sort = ""

    # number of results per page
    try:
        num_results = int(request.GET.get("num_results", "25"))
    except ValueError:
        num_results = 25

    # page number
    try:
        page = int(request.GET.get("page", "1"))
    except ValueError:
        page = 1

    # start and end results
    if page > 1:
        start_results = num_results * page - num_results
        end_results = num_results * page
    else:
        start_results = 0
        end_results = num_results

    total_results = len(query)

    # total number of pages
    if total_results <= num_results:
        total_pages = 1
    elif total_results % num_results:
        total_pages = total_results // num_results + 1
    else:
        total_pages = total_results // num_results

    query = query[start_results:end_results]

    # next page
    if total_results < num_results or page is total_pages:
        next_page = 0
        end_results = total_results
    else:
        next_page = page + 1

    # previous page
    prev_page = page - 1

    results = query

    if request.accepted_renderer.format != "html":
        results = InstitutionSerializer(results, many=True).data

    # to adjust for template
    start_results = start_results + 1

    return Response(
        {"institutions": results, "query_str": query_str,
         "num_results": num_results, "start_results": start_results,
         "end_results": end_results, "sort": sort,
         "page_num": page, "total_results": total_results,
         "next_page": next_page, "prev_page": prev_page,
         "total_pages": total_pages, "current_sort": current_sort,
         "year": year},
    )


def branch_locations_as_json(request):
    return json.loads(branch_locations(request))


def branch_locations(request):
    """This endpoint returns geocoded branch locations"""
    lender = escape(request.GET.get("lender"))
    ne_lat = escape(request.GET.get("neLat"))
    ne_lon = escape(request.GET.get("neLon"))
    sw_lat = escape(request.GET.get("swLat"))
    sw_lon = escape(request.GET.get("swLon"))
    try:
        maxlat = float(ne_lat)
        minlon = float(sw_lon)
        minlat = float(sw_lat)
        maxlon = float(ne_lon)
    except ValueError:
        return HttpResponseBadRequest(
            "Bad or missing values: neLat, neLon, swLat, swLon")
    query = Q(lat__gte=minlat, lat__lte=maxlat,
              lon__gte=minlon, lon__lte=maxlon)
    branches = Branch.objects.filter(institution_id=lender).filter(query)
    response = '{"crs": {"type": "link", "properties": {"href": '
    response += '"http://spatialreference.org/ref/epsg/4326/", "type": '
    response += '"proj4"}}, "type": "FeatureCollection", "features": [%s]}'
    return response % ", ".join(
        branch.branch_as_geojson() for branch in branches)
