from typing import Union

import us
from django.contrib.gis.db import models
from django.core.validators import RegexValidator
from django.db.models import QuerySet


class GeoModel(models.Model):
    """Base for new geo models."""
    name = models.CharField(max_length=64)
    geom = models.MultiPolygonField()
    interior_lat = models.FloatField()
    interior_lon = models.FloatField()
    min_lat = models.FloatField()
    max_lat = models.FloatField()
    min_lon = models.FloatField()
    max_lon = models.FloatField()

    class Meta:
        abstract = True

    def autofields(self):
        points = [point
                  for polygon in self.geom.coords
                  for line in polygon
                  for point in line]
        lons, lats = zip(*points)   # unzips into pairs

        self.min_lat = min(lats)
        self.max_lat = max(lats)
        self.min_lon = min(lons)
        self.max_lon = max(lons)


class State(GeoModel):
    geoid = models.CharField(
        choices=[(state.fips, state.name)
                 for state in us.states.STATES + us.states.TERRITORIES],
        max_length=2,
        primary_key=True,
    )


class CoreBasedStatisticalArea(GeoModel):
    geoid = models.CharField(
        validators=[RegexValidator(r"\d{5}")], max_length=5, primary_key=True)
    metro = models.BooleanField()   # metro- vs micro-politan

    @property
    def tract_set(self) -> QuerySet:
        return Tract.objects.filter(county__cbsa=self)

    @property
    def counties(self) -> QuerySet:
        return self.county_set.all()


class MetroDivision(GeoModel):
    # shares the same namespace as CBSAs
    geoid = models.CharField(
        validators=[RegexValidator(r"\d{5}")], max_length=5, primary_key=True)
    metro = models.ForeignKey(CoreBasedStatisticalArea, models.CASCADE)

    @property
    def tract_set(self) -> QuerySet:
        return Tract.objects.filter(county__metdiv=self)

    @property
    def counties(self) -> QuerySet:
        return self.county_set.all()


class County(GeoModel):
    geoid = models.CharField(
        validators=[RegexValidator(r"\d{5}")], max_length=5, primary_key=True)
    state = models.ForeignKey(State, models.CASCADE)
    county_only = models.CharField(
        validators=[RegexValidator(r"\d{3}")], max_length=3)
    cbsa = models.ForeignKey(
        CoreBasedStatisticalArea, models.SET_NULL, blank=True, null=True)
    metdiv = models.ForeignKey(
        MetroDivision, models.SET_NULL, blank=True, null=True)

    @property
    def counties(self) -> QuerySet:
        return self.__class__.objects.filter(pk=self.pk)


Division = Union[CoreBasedStatisticalArea, County, MetroDivision]


class Tract(GeoModel):
    geoid = models.CharField(
        validators=[RegexValidator(r"\d{11}")],
        max_length=11,
        primary_key=True,
    )
    county = models.ForeignKey(County, models.CASCADE)
    tract_only = models.CharField(
        validators=[RegexValidator(r"\d{6}")], max_length=6)
