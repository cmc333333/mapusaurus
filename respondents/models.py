import json

from django.db import models
from django.template import defaultfilters
from localflavor.us.models import USStateField

from respondents.managers import AgencyManager


class ZipcodeCityStateYear(models.Model):
    """ For each zipcode, maintain the city, state information by year. """
    zip_code = models.IntegerField()
    plus_four = models.IntegerField(blank=True, null=True)
    city = models.CharField(max_length=25)
    state = USStateField()
    year = models.SmallIntegerField()

    class Meta:
        unique_together = ("zip_code", "city", "year")

    @property
    def unique_name(self):
        return f"{self.city}, {self.state} {self.zip_code} {self.year}"

    def __unicode__(self):
        return self.unique_name


class Agency(models.Model):
    """ Agencies of the government that are referenced in the HMDA dataset. """

    hmda_id = models.IntegerField(primary_key=True)
    acronym = models.CharField(max_length=10)
    full_name = models.CharField(max_length=50)

    objects = AgencyManager()

    def __unicode__(self):
        return self.acronym


class ParentInstitution(models.Model):
    """ Parent and top holder institutions need to be stored a bit differently
    because (1) they can be international and (2) they might not report HMDA so
    we have fewer details. If we have an RSSD ID we try and store it here. """

    year = models.SmallIntegerField(db_index=True)
    name = models.CharField(max_length=128)
    city = models.CharField(max_length=25)
    state = models.CharField(max_length=2, blank=True, null=True)
    country = models.CharField(max_length=40, blank=True, null=True)
    rssd_id = models.CharField(
        max_length=10,
        help_text="Id on the National Information Center repository",
        blank=True,
        null=True)

    class Meta:
        unique_together = ("rssd_id", "year")

    def __unicode__(self):
        return self.name


class Institution(models.Model):
    """ An institution"s (aka respondent) details. These can change per year.
    """

    year = models.SmallIntegerField(db_index=True)
    respondent_id = models.CharField(max_length=10)
    agency = models.ForeignKey("Agency", models.CASCADE)
    institution_id = models.CharField(max_length=15, primary_key=True)
    tax_id = models.CharField(max_length=10)
    name = models.CharField(max_length=128)
    mailing_address = models.CharField(max_length=64)
    zip_code = models.ForeignKey(
        "ZipCodeCityStateYear", models.CASCADE, null=False)
    assets = models.BigIntegerField(
        blank=True,
        help_text="Prior year reported assets in thousands of dollars",
        null=True,
    )
    rssd_id = models.CharField(
        blank=True,
        max_length=10,
        null=True,
        help_text=("From Reporter Panel. Id on the National Information "
                   "Center repository"),
    )
    parent = models.ForeignKey(
        "self",
        models.SET_NULL,
        blank=True,
        null=True,
        related_name="children",
        help_text="The parent institution")
    non_reporting_parent = models.ForeignKey(
        "ParentInstitution",
        models.SET_NULL,
        blank=True,
        null=True,
        related_name="children",
        help_text="Non-HMDA reporting parent")
    top_holder = models.ForeignKey(
        "ParentInstitution",
        models.SET_NULL,
        related_name="descendants",
        blank=True,
        null=True,
        help_text="The company at the top of the ownership chain.")
    num_loans = models.PositiveIntegerField(default=0)

    def formatted_name(self):
        formatted = defaultfilters.title(self.name) + " ("
        formatted += str(self.agency_id) + self.respondent_id + ")"
        return formatted

    def get_lender_hierarchy(self, exclude, order):
        """Returns a list of related institutions for the selected
        institution. Allows to exclude selected institution/lender and order
        by institution"s assets """
        lender_hierarchy = self.lenderhierarchy_set.first()
        if lender_hierarchy:
            org_id = lender_hierarchy.organization_id
            hierarchy_list = LenderHierarchy.objects\
                .select_related("institution")\
                .filter(organization_id=org_id, institution__year=self.year)
            if exclude:
                hierarchy_list = hierarchy_list.exclude(institution=self)
            if order:
                hierarchy_list = hierarchy_list.order_by(
                    "-institution__assets")
            return hierarchy_list
        return LenderHierarchy.objects.none()

    def __str__(self):
        return self.name


class LenderHierarchy(models.Model):
    institution = models.ForeignKey(
        "Institution", models.CASCADE, to_field="institution_id")
    organization_id = models.IntegerField()


class Branch(models.Model):
    year = models.SmallIntegerField()
    institution = models.ForeignKey(
        "Institution", models.CASCADE, to_field="institution_id")
    name = models.CharField(max_length=100)
    street = models.CharField(max_length=100)
    city = models.CharField(max_length=25)
    state = USStateField()
    zipcode = models.IntegerField()
    lat = models.FloatField(help_text="y")
    lon = models.FloatField(help_text="x")

    def branch_as_geojson(self):
        """Convert this model into a geojson string"""
        geojson = {"type": "Feature",
                   "properties": {
                       "year": self.year,
                       "institution_id": self.institution_id,
                       "name": self.name,
                       "street": self.street,
                       "city": self.city,
                       "state": self.state,
                       "zipcode": self.zipcode,
                       "lat": self.lat,
                       "lon": self.lon}}
        geojson = json.dumps(geojson)
        return geojson
