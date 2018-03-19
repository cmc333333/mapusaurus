import json
from urllib.parse import urlencode
from typing import Dict

from django.core.exceptions import SuspiciousOperation
from django.db.models.query import Prefetch, QuerySet
from django.forms.models import model_to_dict
from django.shortcuts import render

from geo.models import Geo
from hmda.models import LendingStats, Year
from hmda.management.commands.calculate_loan_stats import (
    calculate_median_loans)
from mapping.models import Category, Layer
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

    if lender:
        context['lender'] = lender
        hierarchy_list = lender.get_lender_hierarchy(True, True, year_selected)
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
        context['median_loans'] = lookup_median(lender, metro) or 0
        if context['median_loans']:
            # 50000 is an arbitrary constant; should be altered if we want to
            # change how big the median circle size is
            context['scaled_median_loans'] = 50000 / context['median_loans']
        else:
            context['scaled_median_loans'] = 0

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


def lookup_median(lender, metro):
    """Look up median. If not present, calculate it."""
    if lender:
        lender_str = lender.institution_id
        if metro:
            stat = LendingStats.objects.filter(
                institution_id=lender_str, geo_id=metro.geoid).first()
            if stat:
                return stat.lar_median
        return calculate_median_loans(lender_str, metro)
