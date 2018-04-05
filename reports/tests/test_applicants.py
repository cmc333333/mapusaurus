import pytest
import webargs
from model_mommy import mommy

from geo.models import Geo
from hmda.models import HMDARecord
from reports.views import applicants
from respondents.models import Institution


@pytest.mark.django_db
def test_valid_lender():
    with pytest.raises(webargs.ValidationError):
        applicants.valid_lender('abcd')


@pytest.mark.django_db
def test_spotcheck_data(client):
    metro = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='1111', year=1999)
    tract1, tract2 = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa=metro.cbsa,
                                year=1999, _quantity=2)
    lender1, lender2 = mommy.make(Institution, year=1999, _quantity=2)
    other = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, year=1999)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='1',
               geo=tract1, loan_amount_000s=111, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=1)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='2',
               geo=tract2, loan_amount_000s=222, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=2)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='3',
               geo=other, loan_amount_000s=333, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=3)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='4',
               geo=tract1, loan_amount_000s=444, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=4)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='5',
               geo=tract2, loan_amount_000s=555, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=5)
    mommy.make(HMDARecord, applicant_ethnicity='2', applicant_race_1='6',
               geo=other, loan_amount_000s=666, applicant_sex=1,
               institution=lender1, action_taken=1, _quantity=6)
    mommy.make(HMDARecord, applicant_ethnicity='1', geo=tract1,
               loan_amount_000s=777, applicant_sex=1, institution=lender1,
               action_taken=1, _quantity=7)
    mommy.make(HMDARecord, applicant_ethnicity='3', geo=tract2,
               loan_amount_000s=888, applicant_sex=1, institution=lender1,
               action_taken=1, _quantity=8)
    mommy.make(HMDARecord, applicant_sex=2, geo=other,
               loan_amount_000s=999, institution=lender1, action_taken=1,
               _quantity=9)
    # different lender; these will be ignored
    mommy.make(HMDARecord, institution=lender2, action_taken=1, geo=tract1,
               _quantity=25)
    # different action; these will be ignored
    mommy.make(HMDARecord, institution=lender1, action_taken=2, geo=tract1,
               loan_amount_000s=123, _quantity=30)

    result = client.get(f'/reports/originations/?lender={lender1.pk}'
                        f'&metro={metro.pk}')

    assert len(result.data['fields']) == 5
    assert [
        row['Applicant characteristics'] for row in result.data['data']
    ] == ['White', 'Black', 'Hispanic/Latino', 'Native American', 'Asian',
          'HOPI', 'Minority', 'No Demographic Data', 'Female']
    total_count = 1 + 2 + 4 + 5 + 7 + 8
    total_volume = 1*111 + 2*222 + 4*444 + 5*555 + 7*777 + 8*888
    assert result.data['data'][0]['Originations'] == 5
    assert result.data['data'][1]['Volume of Loans'] == 0
    assert result.data['data'][2]['Percent of Originations'] == \
        7 / total_count
    assert result.data['data'][3]['Percent of Volume'] == \
        1*111 / total_volume
    assert result.data['data'][4]['Originations'] == 2
    assert result.data['data'][5]['Volume of Loans'] == 4*444
    assert result.data['data'][6]['Percent of Originations'] == \
        (1 + 2 + 4 + 7 + 8) / total_count
    assert result.data['data'][7]['Percent of Volume'] == \
        (8*888) / total_volume
    assert result.data['data'][8]['Originations'] == 0
