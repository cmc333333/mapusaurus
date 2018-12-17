import pytest
from model_mommy import mommy
from rest_framework.test import APIClient

from geo.models import CoreBasedStatisticalArea, County

client = APIClient()


@pytest.mark.django_db
def test_search_metro_name():
    chicago = mommy.make(
        CoreBasedStatisticalArea, metro=True, name="Chicago")
    result = client.get("/api/metro/", {"q": "cago"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert geoids == {chicago.pk}

    mommy.make(CoreBasedStatisticalArea, metro=True, _quantity=100)
    result = client.get("/api/metro/", {"q": "cago"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert chicago.pk in geoids


@pytest.mark.django_db
def test_search_county_name():
    cook = mommy.make(County, name="Cook")
    result = client.get("/api/county/", {"q": "Coo"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert geoids == {cook.pk}

    mommy.make(County, _quantity=100)
    result = client.get("/api/county/", {"q": "Coo"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert cook.pk in geoids
