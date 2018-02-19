import pytest

from respondents import zipcode_utils
from respondents.models import ZipcodeCityStateYear


@pytest.mark.django_db
def test_createzipcode():
    zipcode_utils.create_zipcode('20852', 'Rockville', 'MD', '2013')

    results = ZipcodeCityStateYear.objects.filter(state='MD')
    assert results.count() == 1

    assert results[0].zip_code == 20852
    assert results[0].city == 'Rockville'
    assert results[0].state == 'MD'
    assert results[0].year == 2013


@pytest.mark.django_db
def test_duplicate_entries():
    """We insert a duplicate entry, and check that it wasn't in fact
    duplicated."""
    zipcode_utils.create_zipcode('20852', 'Rockville', 'MD', '2013')
    results = ZipcodeCityStateYear.objects.filter(state='MD')
    assert results.count() == 1

    zipcode_utils.create_zipcode('20852', 'Rockville', 'MD', '2013')
    results = ZipcodeCityStateYear.objects.filter(state='MD')
    assert results.count() == 1
