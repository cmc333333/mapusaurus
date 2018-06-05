import json
from urllib.parse import urlencode
from typing import Any, Dict

from django.conf import settings
from django.core.exceptions import SuspiciousOperation
from django.db import connection
from django.db.models.query import Prefetch, QuerySet
from django.forms.models import model_to_dict
from django.shortcuts import render

from geo.models import Geo
from hmda.models import Year
from mapping.models import Category, Layer
from reports.report_list import report_list
from respondents.models import Institution


def add_layer_attrs(context: Dict[str, any], year: int) -> None:
    """Layers are loaded from the database. This function retrieves them and
    adds them to the template context."""
    layer_qs = Layer.objects.filter(active_years__contains=year)
    categories = Category.objects\
        .filter(pk__in=layer_qs.values_list('category_id', flat=True))\
        .prefetch_related(Prefetch('layer_set', queryset=layer_qs))
    context['layer_categories'] = []
    context['layer_attrs'] = {}
    for category in categories:
        as_dict = model_to_dict(category)
        as_dict['layers'] = list(category.layer_set.all().values())
        for layer in as_dict['layers']:
            del layer['active_years']   # Ranges aren't easily JSON-able
            context['layer_attrs'][layer['short_name']] = layer
        context['layer_categories'].append(as_dict)
    context['layer_attrs'] = json.dumps(context['layer_attrs'])

    base_layers = list(Layer.objects.filter(interaction='base').values())
    for layer in base_layers:
        del layer['active_years']   # Skip these ranges, too
    context['base_layer_attrs'] = json.dumps(base_layers)


def add_county_attrs(context: Dict[str, Any], county: str):
    """Inject geography_names and calculate a center point for one or more
    counties."""
    counties = Geo.objects\
        .filter(geo_type=Geo.COUNTY_TYPE, geoid__in=county.split(','))\
        .order_by('name')
    context['geography_names'] = ', '.join(geo.name for geo in counties)
    county_count = counties.count()
    if county_count:
        context['map_center'] = {
            'centlat': sum(geo.centlat for geo in counties) / county_count,
            'centlon': sum(geo.centlon for geo in counties) / county_count,
        }


def map(request, template):
    """Display the map. If lender info is present, provide it to the
    template"""
    lender_selected = request.GET.get('lender', '')
    metro_selected = request.GET.get('metro')
    year_selected = request.GET.get('year',
                                    str(Year.objects.latest().hmda_year))
    if not year_selected.isdigit():
        raise SuspiciousOperation('year must be an integer')
    year_selected = int(year_selected)
    context = {}
    lender = Institution.objects\
        .filter(institution_id=lender_selected)\
        .select_related('agency', 'zip_code')\
        .prefetch_related('lenderhierarchy_set')\
        .first()
    metro = Geo.objects.filter(
        geo_type=Geo.METRO_TYPE, geoid=metro_selected).first()
    # default to Chicago
    context['map_center'] = {'centlat': 40, 'centlon': -74.50}
    if metro:
        context['geography_names'] = metro.name
        context['map_center'] = {'centlat': metro.centlat,
                                 'centlon': metro.centlon}
    elif 'county' in request.GET:
        add_county_attrs(context, request.GET['county'])

    context['report_list'] = report_list
    if lender:
        context['lender'] = lender
        hierarchy_list = lender.get_lender_hierarchy(True, True)
        context['institution_hierarchy'] = hierarchy_list
    if metro:
        context['metro'] = metro
    context['year'] = year_selected
    if lender and metro:
        peer_list = lender.get_peer_list(metro, True, True)
        context['institution_peers'] = peer_list
        context['download_url'] = make_download_url(lender, metro)
        context['hierarchy_download_url'] = make_download_url(
            hierarchy_list, metro)
        context['peer_download_url'] = make_download_url(peer_list, metro)
        context['avg_per_thousand_households'] = \
            avg_per_thousand_households(lender, metro)

    add_layer_attrs(context, year_selected)

    return render(request, template, context)


def make_download_url(lender, metro):
    """Create a link to CFPB's HMDA explorer, either linking to all of this
    lender's records, or to just those relevant for an MSA. MSA's are broken
    into divisions in that tool, so make sure the query uses the proper ids"""
    where = ""
    if lender:
        where = ''
        count = 0
        if type(lender) is QuerySet:
            for item in lender:
                query = '(agency_code=%s AND respondent_id="%s" AND year=%s)'
                where += query % (item.agency_id, item.respondent_id,
                                  item.year)
                count += 1
                if(count < len(lender)):
                    where += "OR"
        else:
            query = '(agency_code=%s AND respondent_id="%s" AND as_of_year=%s)'
            where += query % (lender.agency_id, lender.respondent_id,
                              lender.year)
    if metro:
        divisions = [div.metdiv for div in
                     Geo.objects.filter(
                         geo_type=Geo.METDIV_TYPE,
                         cbsa=metro.cbsa,
                         year=metro.year,
                     ).order_by('cbsa')]
        if divisions:
            where += ' AND msamd IN ("' + '","'.join(divisions) + '")'
        else:   # no divisions, so just use the MSA
            where += ' AND msamd="' + metro.cbsa + '"'

    query = urlencode({
        '$where': where,
        '$limit': 0
    })
    base_url = 'https://api.consumerfinance.gov/data/hmda/slice/'
    return base_url + 'hmda_lar.csv?' + query


def avg_per_thousand_households(lender: Institution, metro: Geo) -> float:
    """As a simple method of normalizing our circle size across different
    lenders, we'll calculate an average number of loans/thousand households
    across all the tracts a lender has made loans to."""
    num_households_query = """
        SELECT sum(total)
        FROM censusdata_census2010households
        INNER JOIN geo_geo
        ON censusdata_census2010households.geoid_id = geo_geo.geoid
        WHERE geo_geo.geo_type = %s
        AND geo_geo.cbsa = %s
        AND geo_geo.year = %s
        AND censusdata_census2010households.geoid_id IN (
            SELECT hmda_hmdarecord.geo_id FROM hmda_hmdarecord
            WHERE institution_id = %s
        )
    """
    num_loans_query = """
        SELECT count(*)
        FROM hmda_hmdarecord
        INNER JOIN geo_geo
        ON hmda_hmdarecord.geo_id = geo_geo.geoid
        WHERE institution_id = %s
        AND geo_geo.geo_type = %s
        AND geo_geo.cbsa = %s
        AND geo_geo.year = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(num_households_query,
                       (Geo.TRACT_TYPE, metro.cbsa, metro.year, lender.pk))
        num_households = cursor.fetchone()[0]
        cursor.execute(num_loans_query,
                       (lender.pk, Geo.TRACT_TYPE, metro.cbsa, metro.year))
        num_loans = cursor.fetchone()[0]
    return num_loans * 1000 / num_households


def single_page_app(request):
    """This page is managed almost exclusively by React"""
    return render(request, 'new-map.html', {
        'MAPBOX_TOKEN': settings.MAPBOX_TOKEN,
        'MAPBOX_STYLE': settings.MAPBOX_STYLE,
    })
