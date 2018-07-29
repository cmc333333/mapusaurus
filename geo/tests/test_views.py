import pytest
from django.core.management import call_command
from django.core.urlresolvers import reverse
from model_mommy import mommy

from geo import views
from geo.models import Geo


@pytest.mark.django_db
def test_search_name(client):
    call_command('loaddata', 'many_tracts', 'test_counties')
    mommy.make(Geo, geo_type=Geo.METRO_TYPE, name='Chicago', year=2013)
    result = client.get(
        reverse('geo:metro-search'),
        {'format': 'json', 'q': 'cago', 'year': '2013'},
    ).json()
    assert len(result['geos']) == 1
    assert result['geos'][0]['name'] == 'Chicago'


@pytest.mark.django_db
def test_filter_to_metro():
    first = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='11111', year=2010)
    second = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='22222', year=2010)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa='11111', year=2010,
               _quantity=5)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa='22222', year=2010,
               _quantity=3)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa='11111', year=2009,
               _quantity=7)

    result = views.TractFilters({'metro': first.pk, 'year': '2010'}).qs
    assert result.count() == 5

    result = views.TractFilters({'metro': second.pk, 'year': '2010'}).qs
    assert result.count() == 3

    result = views.TractFilters({'metro': f"{first.pk},{second.pk}",
                                 'year': '2010'}).qs
    assert result.count() == 8


@pytest.mark.django_db
def test_filter_to_county():
    first = mommy.make(
        Geo, geo_type=Geo.COUNTY_TYPE, state='11', county='111', year=2010)
    second = mommy.make(
        Geo, geo_type=Geo.COUNTY_TYPE, state='22', county='222', year=2010)
    mommy.make(Geo, geo_type=Geo.COUNTY_TYPE, state='33', county='333',
               year=2010)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, state='11', county='111',
               year=2010, _quantity=1)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, state='22', county='222',
               year=2010, _quantity=3)
    mommy.make(Geo, geo_type=Geo.TRACT_TYPE, state='33', county='333',
               year=2010, _quantity=5)

    result = views.TractFilters({'county': second.pk, 'year': '2010'}).qs
    assert result.count() == 3

    result = views.TractFilters({'county': f"{first.pk},{second.pk}",
                                 'year': '2010'}).qs
    assert result.count() == 4
