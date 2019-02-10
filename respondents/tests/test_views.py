import pytest
from django.core.management import call_command
from django.urls import reverse
from model_mommy import mommy

from respondents.models import Institution


@pytest.fixture
def data_setup(db):
    call_command('loaddata', 'agency', 'fake_respondents', 'fake_hierarchy',
                 'fake_branches')


def fetch_search(client, query, **kwargs):
    return client.get(
        reverse('respondents:search_results'),
        dict(kwargs, format='json', q=query),
    ).json()


def fetch_institutions(client, query, **kwargs):
    return fetch_search(client, query, **kwargs)['institutions']


@pytest.mark.usefixtures('data_setup')
def test_branch_locations(client):
    resp = client.get(
        reverse('branchLocations'),
        {'lender': '201391000000001',
         'neLat': '1',
         'neLon': '1',
         'swLat': '0',
         'swLon': '0'},
    ).json()
    assert resp['features'][0]['properties']['institution_id'] == \
        '201391000000001'
    assert resp['features'][0]['properties']['name'] == 'Dev Test Branch 2'
    assert resp['features'][1]['properties']['institution_id'] == \
        '201391000000001'
    assert resp['features'][1]['properties']['name'] == 'Dev Test Branch 1'


@pytest.mark.usefixtures('data_setup')
def test_search_empty(client):
    mommy.make(Institution, name='AAAAA', year=2010, num_loans=1)

    result = client.get(
        reverse('respondents:search_results'), {'format': 'json'}
    ).json()['institutions']
    assert result == []

    assert fetch_institutions(client, '', year='2010') == []
    assert fetch_institutions(client, '     ', year='') == []


@pytest.mark.django_db
def test_search_requires_hmda(client):
    mommy.make(Institution, name='AAAAA', year=2010, num_loans=1)
    mommy.make(Institution, name='AAAAA AAAAA', year=2010, num_loans=0)
    assert len(fetch_institutions(client, 'aaaaa', year='2010')) == 1


@pytest.mark.django_db
def test_search_name(client):
    mommy.make(Institution, name='Some Bank', year=2013, num_loans=1)
    mommy.make(Institution, name='Bank & Loan', year=2013, num_loans=1)

    assert len(fetch_institutions(client, 'Bank', year='2013')) == 2
    assert len(fetch_institutions(client, 'Loan', year='2013')) == 1


@pytest.mark.django_db
def test_search_trigram(client):
    mommy.make(Institution, name='This is a bank', year=2013, num_loans=1)
    assert len(fetch_institutions(client, 'that bank', year='2013')) == 1
    assert fetch_institutions(client, 'xxxx', year='2013') == []


@pytest.mark.usefixtures('load_agencies')
def test_search_id(client):
    bank = mommy.make(
        Institution, agency_id=3, institution_id='201331234543210',
        name='Some Bank', respondent_id='123454321', year=2013, num_loans=1)

    assert fetch_institutions(client, bank.respondent_id, year='2013') == []

    bank.respondent_id = '1234543210'     # now ten chars
    bank.save()
    assert len(
        fetch_institutions(client, bank.respondent_id, year='2013')) == 1

    for q in ('1234543210', 'Some Bank (31234543210)'):
        assert len(fetch_institutions(client, q, year='2013')) == 1


@pytest.mark.django_db
def test_search_sort(client):
    mommy.make(Institution, name='aaa', assets=1111, year=2013, num_loans=2)
    mommy.make(Institution, name='aaa bbb', assets=2222, year=2013,
               num_loans=1)

    results = fetch_institutions(client, 'aaa', year='2013')
    assert [r['name'] for r in results] == ['aaa', 'aaa bbb']

    results = fetch_institutions(
        client, 'aaa', sort='another-sort', year='2013')
    assert [r['name'] for r in results] == ['aaa', 'aaa bbb']

    results = fetch_institutions(client, 'aaa', sort='assets', year='2013')
    assert [r['name'] for r in results] == ['aaa', 'aaa bbb']
    results = fetch_institutions(client, 'aaa', sort='-assets', year='2013')
    assert [r['name'] for r in results] == ['aaa bbb', 'aaa']
    results = fetch_institutions(client, 'aaa', sort='num_loans', year='2013')
    assert [r['name'] for r in results] == ['aaa bbb', 'aaa']
    results = fetch_institutions(client, 'aaa', sort='-num_loans', year='2013')
    assert [r['name'] for r in results] == ['aaa', 'aaa bbb']


@pytest.mark.django_db
def test_search_pagination(client):
    mommy.make(Institution, name='ccc', year=2013, num_loans=1, _quantity=10)
    # page number should default to 1
    results = fetch_search(client, 'ccc', num_results='2', year='2013')
    assert results['page_num'] == 1

    results = fetch_search(
        client, 'ccc', num_results='2', page='5', year='2013')
    assert results['page_num'] == 5
    assert results['next_page'] == 0
    assert results['prev_page'] == 4

    results = fetch_search(
        client, 'ccc', num_results='2', page='str', year='2013')
    assert results['page_num'] == 1


@pytest.mark.usefixtures('load_agencies')
def test_search_num_results(client):
    mommy.make(Institution, name='ddd', year=2013, num_loans=1, _quantity=30)
    results = fetch_search(client, 'ddd', year='2013')
    # number of results should default to 25
    assert results['num_results'] == 25

    results = fetch_search(client, 'ddd', num_results='10', year='2013')
    assert results['num_results'] == 10

    results = fetch_search(client, 'ddd', num_results='str', year='2013')
    assert results['num_results'] == 25
