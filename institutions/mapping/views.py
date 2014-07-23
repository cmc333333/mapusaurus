from urllib import urlencode

from django.db import connection
from django.shortcuts import render

from geo.models import Geo
from hmda.models import HMDARecord
from respondants.models import Institution


def home(request):
    """Display the map. If lender info is present, provide it to the
    template"""
    lender = request.GET.get('lender', '')
    metro = request.GET.get('metro')
    context = {}
    if lender and len(lender) > 1 and lender[0].isdigit():
        query = Institution.objects.filter(agency_id=int(lender[0]))
        query = query.filter(ffiec_id=lender[1:])
        query = query.select_related('agency', 'zip_code')
        lender = query.first()
        if lender:
            context['lender'] = lender
    else:
        lender = None
    if metro:
        query = Geo.objects.filter(geo_type=Geo.METRO_TYPE,
                                   geoid=metro)
        metro = query.first()
        if metro:
            context['metro'] = metro

    context['download_url'] = make_download_url(lender, metro)
    context['median_loans'] = calculate_median_loans(lender, metro) or 0
    if context['median_loans']:
        # 50000 is an arbitrary constant; should be altered if we want to
        # change how big the median circle size is
        context['scaled_median_loans'] = 50000 / context['median_loans']
    else:
        context['scaled_median_loans'] = 0

    return render(request, 'index.html', context)


def make_download_url(lender, metro):
    """Create a link to CFPB's HMDA explorer, either linking to all of this
    lender's records, or to just those relevant for an MSA. MSA's are broken
    into divisions in that tool, so make sure the query uses the proper ids"""
    if lender:
        where = 'as_of_year=2012 AND agency_code=%d AND respondent_id="%s"'
        where = where % (lender.agency_id, lender.ffiec_id)
        if metro:
            divisions = [div.metdiv for div in
                         Geo.objects.filter(
                             geo_type=Geo.METDIV_TYPE, cbsa=metro.geoid
                         ).order_by('geoid')]
            if divisions:
                where += ' AND msamd IN ("' + '","'.join(divisions) + '")'
            else:   # no divisions, so just use the MSA
                where += ' AND msamd="' + metro.geoid + '"'

        query = urlencode({
            '$where': where,
            '$limit': 0
        })
        base_url = 'https://api.consumerfinance.gov/data/hmda/slice/'
        return base_url + 'hmda_lar.csv?' + query


def calculate_median_loans(lender, metro):
    """For a given lender, find the median loans per census tract. Limit to
    metro if present. The ORM makes these aggregations ugly, so we use raw
    SQL."""
    if lender:
        lender_str = str(lender.agency_id) + lender.ffiec_id
        # First, count how many tracts this lender operates in
        query = HMDARecord.objects.filter(
            lender=lender_str, geoid__geo_type=Geo.TRACT_TYPE)
        if metro:
            query = query.filter(geoid__cbsa=metro.geoid)
        num_tracts = query.values('geoid').distinct('geoid').count()

        cursor = connection.cursor()
        # Next, aggregate the # of loans per tract. This query will *not*
        # include zeros
        query = """
            SELECT COUNT(hmda_hmdarecord.id) AS loan_count
            FROM geo_geo LEFT JOIN hmda_hmdarecord ON (geoid=geoid_id)
            WHERE geo_type = %s
            AND lender = %s
        """
        params = [Geo.TRACT_TYPE, lender_str]
        if metro:
            query = query + "AND cbsa = %s\n"
            params.append(metro.geoid)
        query += """
            GROUP BY geo_geo.geoid
            ORDER BY loan_count
            LIMIT 1
            OFFSET %s
        """
        params.append(num_tracts // 2)     # median
        cursor.execute(query, params)
        result = cursor.fetchone()
        if result:
            return result[0]
