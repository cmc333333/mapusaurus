import pytest

from hmda.models import LARYear
from hmda.tests.factories import LARFactory


@pytest.mark.django_db
def test_lar_year_rebuild_all():
    assert not LARYear.objects.all().exists()
    LARFactory.create_batch(2, as_of_year=2010)
    LARFactory.create_batch(4, as_of_year=2012)
    LARFactory(as_of_year=2017)

    LARYear.rebuild_all()

    assert LARYear.objects.all().count() == 3
    assert list(LARYear.objects.values_list("year", flat=True)) == [
        2017, 2012, 2010]
