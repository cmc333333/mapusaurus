import pytest
from model_mommy import mommy

from hmda.models import LARYear, LoanApplicationRecord


@pytest.mark.django_db
def test_lar_year_rebuild_all():
    assert not LARYear.objects.all().exists()
    mommy.make(LoanApplicationRecord, as_of_year=2010, _quantity=2)
    mommy.make(LoanApplicationRecord, as_of_year=2012, _quantity=4)
    mommy.make(LoanApplicationRecord, as_of_year=2017)

    LARYear.rebuild_all()

    assert LARYear.objects.all().count() == 3
    assert list(LARYear.objects.values_list("year", flat=True)) == [
        2017, 2012, 2010]
