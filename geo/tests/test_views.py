import pytest
from django.core.management import call_command
from django.core.urlresolvers import reverse
from model_mommy import mommy

from geo.models import Geo


@pytest.mark.django_db
def test_search_name(client):
    call_command('loaddata', 'many_tracts', 'test_counties')
    mommy.make(Geo, geo_type=Geo.METRO_TYPE, name='Chicago', year=2013)
    result = client.get(
        reverse('geo:search'),
        {'format': 'json', 'q': 'cago', 'year': '2013'},
    ).json()
    assert len(result['geos']) == 1
    assert result['geos'][0]['name'] == 'Chicago'
