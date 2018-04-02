from django.contrib.gis.db import models


class Geo(models.Model):
    STATE_TYPE, COUNTY_TYPE, TRACT_TYPE, METRO_TYPE, MICRO_TYPE = range(1, 6)
    METDIV_TYPE, = range(6, 7)
    TYPES = [(STATE_TYPE, 'State'), (COUNTY_TYPE, 'County'),
             (TRACT_TYPE, 'Census Tract'), (METRO_TYPE, 'Metropolitan'),
             (MICRO_TYPE, 'Micropolitan'),
             (METDIV_TYPE, 'Metropolitan Division')]

    geoid = models.CharField(max_length=20, primary_key=True)
    geo_type = models.PositiveIntegerField(choices=TYPES, db_index=True)
    name = models.CharField(max_length=50)

    state = models.CharField(max_length=2, blank=True, null=True)
    county = models.CharField(max_length=3, blank=True, null=True)
    tract = models.CharField(max_length=6, blank=True, null=True)
    csa = models.CharField(max_length=3, blank=True, null=True,
                           help_text='Combined Statistical Area')
    cbsa = models.CharField(max_length=5, blank=True, null=True,
                            help_text='Core Based Statistical Area')
    metdiv = models.CharField(max_length=5, blank=True, null=True,
                              help_text='Metro Division')

    geom = models.MultiPolygonField(srid=4269)

    year = models.SmallIntegerField(db_index=True)

    minlat = models.FloatField()
    maxlat = models.FloatField()
    minlon = models.FloatField()
    maxlon = models.FloatField()
    centlat = models.FloatField()
    centlon = models.FloatField()

    objects = models.GeoManager()

    class Meta:
        index_together = [("geo_type", "minlat", "minlon", "year"),
                          ("geo_type", "minlat", "maxlon", "year"),
                          ("geo_type", "maxlat", "minlon", "year"),
                          ("geo_type", "maxlat", "maxlon", "year"),
                          ("geo_type", "centlat", "centlon", "year"),
                          ("geo_type", "cbsa", "year"),
                          ("state", "year")]

    def update_from_geom(self):
        points = [point
                  for polygon in self.geom.coords
                  for line in polygon
                  for point in line]
        lons, lats = zip(*points)   # unzips into pairs

        self.minlat = min(lats)
        self.maxlat = max(lats)
        self.minlon = min(lons)
        self.maxlon = max(lons)


class CensusTract(models.Model):
    geoid = models.CharField(max_length=11, primary_key=True)
    name = models.CharField(max_length=64)

    state = models.PositiveSmallIntegerField()
    county = models.PositiveSmallIntegerField()
    tract = models.PositiveIntegerField()

    geom = models.MultiPolygonField()
    interior_lat = models.FloatField()
    interior_lon = models.FloatField()


class TractProperty(models.Model):
    relation_field = models.CharField(max_length=64, primary_key=True)
