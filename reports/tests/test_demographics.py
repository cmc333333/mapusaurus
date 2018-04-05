import pytest
from model_mommy import mommy

from censusdata.models import (Census2010HispanicOrigin, Census2010Race,
                               Census2010RaceStats, Census2010Sex)
from geo.models import Geo


@pytest.mark.django_db
def test_valid_metro(client):
    tract = mommy.make(Geo, geo_type=Geo.TRACT_TYPE)
    result = client.get('/reports/population-demographics/'
                        f'?year=2000&metro={tract.pk}')
    assert result.status_code == 404
    result = client.get('/reports/population-demographics/'
                        f'?year=2000&metro=12345')
    assert result.status_code == 404


@pytest.mark.django_db
def test_spotcheck_data(client):
    metro = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='12345', year=1990)
    tract1, tract2 = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa=metro.cbsa,
                                year=1990, _quantity=2)
    other = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, year=1990)
    mommy.make(Census2010Race, total_pop=100, white_alone=10, black_alone=20,
               amind_alone=30, asian_alone=40, pacis_alone=0, other_alone=0,
               two_or_more=0, geoid=tract1)
    mommy.make(Census2010Race, total_pop=245, white_alone=65, black_alone=55,
               amind_alone=45, asian_alone=35, pacis_alone=25, other_alone=15,
               two_or_more=5, geoid=tract2)
    mommy.make(Census2010Race, total_pop=111, geoid=other)
    mommy.make(Census2010HispanicOrigin, hispanic=123, geoid=tract1)
    mommy.make(Census2010HispanicOrigin, hispanic=234, geoid=tract2)
    mommy.make(Census2010HispanicOrigin, hispanic=345, geoid=other)
    mommy.make(Census2010RaceStats, total_pop=555, non_hisp_white_only=222,
               geoid=tract1)
    mommy.make(Census2010RaceStats, total_pop=999, non_hisp_white_only=333,
               geoid=tract2)
    mommy.make(Census2010RaceStats, total_pop=4, non_hisp_white_only=1,
               geoid=other)
    mommy.make(Census2010Sex, female=7, geoid=tract1)
    mommy.make(Census2010Sex, female=8, geoid=tract2)
    mommy.make(Census2010Sex, female=9, geoid=other)

    result = client.get('/reports/population-demographics/'
                        f'?year=1990&metro={metro.pk}')

    assert len(result.data['fields']) == 3
    assert [row['Population Demographics'] for row in result.data['data']] ==\
        ['Total Population', 'White', 'Black', 'Hispanic/Latino',
         'Native American', 'Asian', 'HOPI', 'Other Races',
         'Two or More Races', 'Total Minority', 'Females']
    assert result.data['data'][0]['Number'] == 100 + 245
    assert result.data['data'][1]['Percent'] == (10 + 65) / (100 + 245)
    assert result.data['data'][9]['Number'] == (555 + 999) - (222 + 333)
    assert result.data['data'][10]['Percent'] == (7 + 8) / (100 + 245)
