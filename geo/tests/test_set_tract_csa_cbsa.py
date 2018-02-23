import pytest
from django.core.management import call_command
from model_mommy import mommy

from geo.models import Geo


@pytest.mark.django_db
def test_set_tract_cbsa():
    mommy.make(Geo, geoid='11222', geo_type=Geo.COUNTY_TYPE, state='11',
               county='222', csa='987', year='2012')
    mommy.make(Geo, geoid='11223', geo_type=Geo.COUNTY_TYPE, state='11',
               county='223', cbsa='88776', year='2012')
    mommy.make(Geo, geoid='88776', geo_type=Geo.METRO_TYPE, cbsa='88776',
               year='2012')
    mommy.make(Geo, geoid='1122233333', geo_type=Geo.TRACT_TYPE, state='11',
               year='2012', county='222', tract='33333')
    mommy.make(Geo, geoid='1122333333', geo_type=Geo.TRACT_TYPE, state='11',
               year='2012', county='223', tract='33333')
    call_command('set_tract_csa_cbsa')
    tract1 = Geo.objects.filter(geoid='1122233333').get()
    tract2 = Geo.objects.filter(geoid='1122333333').get()
    assert tract1.csa == '987'
    assert tract1.cbsa is None
    assert tract2.csa is None
    assert tract2.cbsa == '88776'
