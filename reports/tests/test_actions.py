import pytest
from model_mommy import mommy

from geo.models import Geo
from hmda.models import HMDARecord
from respondents.models import Institution


@pytest.mark.django_db
def test_spotcheck_data(client):
    metro = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='1111', year=2000)
    tract = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa=metro.cbsa,
                       year=2000)
    lender = mommy.make(Institution, year=2000)
    for race_id in range(1, 7):
        mommy.make(HMDARecord, applicant_ethnicity='2',
                   applicant_race_1=race_id, geo=tract, applicant_sex=1,
                   institution=lender, action_taken=1,
                   _quantity=10*race_id)
        mommy.make(HMDARecord, applicant_ethnicity='2',
                   applicant_race_1=race_id, geo=tract, applicant_sex=1,
                   institution=lender, action_taken=3, _quantity=race_id)
    mommy.make(HMDARecord, applicant_ethnicity='1', geo=tract,
               applicant_sex=1, institution=lender, action_taken=1,
               _quantity=70)
    mommy.make(HMDARecord, applicant_ethnicity='1', geo=tract,
               applicant_sex=1, institution=lender, action_taken=3,
               _quantity=7)
    mommy.make(HMDARecord, applicant_ethnicity='3', geo=tract,
               applicant_sex=1, institution=lender, action_taken=1,
               _quantity=80)
    mommy.make(HMDARecord, applicant_ethnicity='3', geo=tract,
               applicant_sex=1, institution=lender, action_taken=3,
               _quantity=8)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='5',
               applicant_sex=2, geo=tract, institution=lender, action_taken=1,
               _quantity=90)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='5',
               applicant_sex=2, geo=tract, institution=lender, action_taken=3,
               _quantity=9)

    result = client.get(f'/reports/denials/?lender={lender.pk}'
                        f'&metro={metro.pk}')

    assert len(result.data['fields']) == 4
    assert [
        row['Applicant characteristics'] for row in result.data['data']
    ] == ['White', 'Black', 'Hispanic/Latino', 'Native American', 'Asian',
          'HOPI', 'Minority', 'No Demographic Data', 'Female']
    white_percent = (5 + 9) / (55 + 99)
    assert result.data['data'][0]['Denials'] == 5 + 9
    assert result.data['data'][1]['Percent'] == 3 / (30 + 3)
    assert result.data['data'][2]['Disparity Index'] == \
        (7 / 77) / white_percent
    assert result.data['data'][3]['Denials'] == 1
    assert result.data['data'][4]['Percent'] == 2 / (20 + 2)
    assert result.data['data'][5]['Disparity Index'] == \
        (4 / 44) / white_percent
    assert result.data['data'][6]['Denials'] == 1 + 2 + 3 + 4 + 6 + 7 + 8
    assert result.data['data'][7]['Percent'] == 8 / (80 + 8)
    assert result.data['data'][8]['Disparity Index'] == \
        (9 / 99) / white_percent
