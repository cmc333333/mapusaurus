import pytest
from model_mommy import mommy
from rest_framework.test import APIClient

from ffiec.models import TractDemographics
from geo.models import CoreBasedStatisticalArea, County, Tract
from hmda.models import LoanApplicationRecord

client = APIClient()


@pytest.mark.django_db
def test_filter_to_metro():
    first = mommy.make(CoreBasedStatisticalArea, geoid="11111", metro=True)
    second = mommy.make(CoreBasedStatisticalArea, geoid="22222", metro=True)
    mommy.make(LoanApplicationRecord, as_of_year=2010,
               tract__county__cbsa=first, _quantity=5)
    mommy.make(LoanApplicationRecord, as_of_year=2010,
               tract__county__cbsa=second, _quantity=3)
    mommy.make(LoanApplicationRecord, as_of_year=2011,
               tract__county__cbsa=first, _quantity=7)
    for tract in Tract.objects.all():
        mommy.make(TractDemographics, tract=tract, year=2010)
        mommy.make(TractDemographics, tract=tract, year=2011)

    result = client.get("/api/lar/", {"metro": first.pk})
    assert len(result.data) == 5 + 7

    result = client.get("/api/lar/", {"metro": first.pk, "year": "2010"})
    assert len(result.data) == 5

    result = client.get("/api/lar/", {"metro": second.pk, "year": "2010"})
    assert len(result.data) == 3

    result = client.get(
        "/api/lar/", {"metro": f"{first.pk},{second.pk}", "year": "2010"})
    assert len(result.data) == 5 + 3


@pytest.mark.django_db
def test_filter_to_county():
    first = mommy.make(County, geoid="11111")
    second = mommy.make(County, geoid="22222")
    mommy.make(LoanApplicationRecord, as_of_year=2010, tract__county=first,
               _quantity=5)
    mommy.make(LoanApplicationRecord, as_of_year=2010, tract__county=second,
               _quantity=3)
    mommy.make(LoanApplicationRecord, as_of_year=2011, tract__county=first,
               _quantity=7)
    for tract in Tract.objects.all():
        mommy.make(TractDemographics, tract=tract, year=2010)
        mommy.make(TractDemographics, tract=tract, year=2011)

    result = client.get("/api/lar/", {"county": first.pk})
    assert len(result.data) == 5 + 7

    result = client.get("/api/lar/", {"county": first.pk, "year": "2010"})
    assert len(result.data) == 5

    result = client.get("/api/lar/", {"county": second.pk, "year": "2010"})
    assert len(result.data) == 3

    result = client.get(
        "/api/lar/", {"county": f"{first.pk},{second.pk}", "year": "2010"})
    assert len(result.data) == 5 + 3
