import pytest
from rest_framework.test import APIClient

from ffiec.tests.factories import TractDemFactory
from geo.models import Tract
from geo.tests.factories import CBSAFactory, CountyFactory
from hmda.tests.factories import LARFactory

client = APIClient()


@pytest.mark.django_db
def test_filter_to_metro():
    first = CBSAFactory(geoid="11111", metro=True)
    second = CBSAFactory(geoid="22222", metro=True)
    LARFactory.create_batch(5, as_of_year=2010, tract__county__cbsa=first)
    LARFactory.create_batch(3, as_of_year=2010, tract__county__cbsa=second)
    LARFactory.create_batch(7, as_of_year=2011, tract__county__cbsa=first)
    for tract in Tract.objects.all():
        TractDemFactory(year=2010, tract=tract)
        TractDemFactory(year=2011, tract=tract)

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
    first = CountyFactory(geoid="11111")
    second = CountyFactory(geoid="22222")
    LARFactory.create_batch(5, as_of_year=2010, tract__county=first)
    LARFactory.create_batch(3, as_of_year=2010, tract__county=second)
    LARFactory.create_batch(7, as_of_year=2011, tract__county=first)
    for tract in Tract.objects.all():
        TractDemFactory(tract=tract, year=2010)
        TractDemFactory(tract=tract, year=2011)

    result = client.get("/api/lar/", {"county": first.pk})
    assert len(result.data) == 5 + 7

    result = client.get("/api/lar/", {"county": first.pk, "year": "2010"})
    assert len(result.data) == 5

    result = client.get("/api/lar/", {"county": second.pk, "year": "2010"})
    assert len(result.data) == 3

    result = client.get(
        "/api/lar/", {"county": f"{first.pk},{second.pk}", "year": "2010"})
    assert len(result.data) == 5 + 3
