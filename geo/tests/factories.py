import factory
from django.contrib.gis.geos import MultiPolygon, Polygon
from faker import Faker

from geo.models import (
    CoreBasedStatisticalArea, County, MetroDivision, State, Tract)

_example_geom = MultiPolygon(
    Polygon(((0, 0), (0, 1), (1, 1), (0, 0))),
    Polygon(((1, 1), (1, 2), (2, 2), (1, 1))),
)


class CBSAFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CoreBasedStatisticalArea

    geoid = factory.Faker("numerify", text="#" * 5)
    metro = factory.Faker("pybool")
    name = factory.Faker("city")
    geom = _example_geom
    interior_lat = factory.Faker("latitude")
    interior_lon = factory.Faker("longitude")
    min_lat = factory.Faker("latitude")
    max_lat = factory.Faker("latitude")
    min_lon = factory.Faker("longitude")
    max_lon = factory.Faker("longitude")


class StateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = State

    geoid = factory.Faker("numerify", text="##")
    name = factory.Faker("state")
    geom = _example_geom
    interior_lat = factory.Faker("latitude")
    interior_lon = factory.Faker("longitude")
    min_lat = factory.Faker("latitude")
    max_lat = factory.Faker("latitude")
    min_lon = factory.Faker("longitude")
    max_lon = factory.Faker("longitude")


class MetDivFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MetroDivision

    geoid = factory.Faker("numerify", text="#" * 5)
    metro = factory.SubFactory(CBSAFactory)
    name = factory.Faker("city")
    geom = _example_geom
    interior_lat = factory.Faker("latitude")
    interior_lon = factory.Faker("longitude")
    min_lat = factory.Faker("latitude")
    max_lat = factory.Faker("latitude")
    min_lon = factory.Faker("longitude")
    max_lon = factory.Faker("longitude")


class CountyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = County

    geoid = factory.Faker("numerify", text="#" * 5)
    county_only = factory.Faker("numerify", text="###")
    name = factory.Faker("city")
    geom = _example_geom
    interior_lat = factory.Faker("latitude")
    interior_lon = factory.Faker("longitude")
    min_lat = factory.Faker("latitude")
    max_lat = factory.Faker("latitude")
    min_lon = factory.Faker("longitude")
    max_lon = factory.Faker("longitude")

    @factory.lazy_attribute
    def state(self):
        state_id = Faker().numerify(text="##")
        state = State.objects.filter(geoid=state_id).first()
        return state or StateFactory(geoid=state_id)


class TractFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tract

    geoid = factory.Faker("numerify", text="#" * 11)
    county = factory.SubFactory(CountyFactory)
    tract_only = factory.Faker("numerify", text="#" * 6)
    name = factory.Faker("city")
    geom = _example_geom
    interior_lat = factory.Faker("latitude")
    interior_lon = factory.Faker("longitude")
    min_lat = factory.Faker("latitude")
    max_lat = factory.Faker("latitude")
    min_lon = factory.Faker("longitude")
    max_lon = factory.Faker("longitude")
