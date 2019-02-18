import pytest
from rest_framework.test import APIClient

from geo.tests.factories import CBSAFactory, CountyFactory

client = APIClient()


@pytest.mark.django_db
def test_search_metro_name():
    chicago = CBSAFactory(metro=True, name="Chicago")
    result = client.get("/api/metro/", {"q": "cago"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert geoids == {chicago.pk}

    CBSAFactory.create_batch(100, metro=True)
    result = client.get("/api/metro/", {"q": "cago"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert chicago.pk in geoids


@pytest.mark.django_db
def test_search_county_name():
    cook = CountyFactory(name="Cook")
    result = client.get("/api/county/", {"q": "Coo"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert geoids == {cook.pk}

    CountyFactory.create_batch(100)
    result = client.get("/api/county/", {"q": "Coo"})
    geoids = {geo["geoid"] for geo in result.data["results"]}
    assert cook.pk in geoids
