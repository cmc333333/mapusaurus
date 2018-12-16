from django.db import models

from geo.models import CoreBasedStatisticalArea, Tract

INCOME_CHOICES = [
    ("low", "Low"), ("mod", "Moderate"), ("mid", "Middle"), ("high", "High")]


class TractDemographics(models.Model):
    composite_key = models.CharField(max_length=4 + 11, primary_key=True)
    tract = models.ForeignKey(
        Tract, models.CASCADE, related_name="demographics")
    year = models.PositiveSmallIntegerField(db_index=True)

    income_indicator = models.CharField(
        choices=INCOME_CHOICES, max_length=4)
    median_age = models.PositiveSmallIntegerField()
    median_year_house_built = models.PositiveSmallIntegerField()
    median_household_income = models.PositiveIntegerField()
    median_family_income = models.PositiveIntegerField()
    median_gross_rent = models.PositiveIntegerField()
    median_oo_housing_value = models.PositiveIntegerField(
        help_text="Median value (dollars) for all owner occupied housing unit")
    female_median_age = models.PositiveSmallIntegerField()
    male_median_age = models.PositiveSmallIntegerField()
    avg_family_income = models.PositiveIntegerField()
    poverty_distressed = models.BooleanField(
        help_text="Meets current year's poverty CRA distressed criteria")
    unemployment_distressed = models.BooleanField(
        help_text="Meets current year's unemployment CRA distressed criteria")
    population_distressed = models.BooleanField(
        help_text="Meets current year's population CRA distressed criteria")
    rural_underserved = models.BooleanField(
        help_text="Meets current year's remote rural CRA underserved criteria")
    previous_distressed = models.BooleanField(
        help_text="Meets previous year's CRA distressed criterion")
    previous_underserved = models.BooleanField(
        help_text="Meets previous year's CRA distressed criterion")

    # households
    households = models.PositiveIntegerField()
    households_with_employment = models.PositiveIntegerField(
        help_text="Total households with wage or salary income")
    self_employed_households = models.PositiveIntegerField(
        help_text="Total households with self employment income")
    public_assistance = models.PositiveIntegerField(
        help_text="Total households with public assistance income")
    poverty_households = models.PositiveIntegerField()
    occupied = models.PositiveIntegerField()
    owner_occupied = models.PositiveIntegerField()
    one_to_four_households = models.PositiveIntegerField(
        help_text="Total housing unit - 1 to 4")

    # families
    families = models.PositiveIntegerField()
    poverty_families = models.PositiveIntegerField()

    # populations
    persons = models.PositiveIntegerField()
    females = models.PositiveIntegerField()
    males = models.PositiveIntegerField()
    non_white = models.PositiveIntegerField(
        help_text="Total population minus white alone population")
    hispanic_only = models.PositiveIntegerField()
    non_hispanic = models.PositiveIntegerField()
    black = models.PositiveIntegerField()
    american_indian = models.PositiveIntegerField(
        help_text="Total population American Indian / Alaska Native")
    asian = models.PositiveIntegerField()
    pacific_islander = models.PositiveIntegerField(
        help_text="Total population Native Hawaiian / other Pacific Islander")
    in_households = models.PositiveIntegerField()
    poverty = models.PositiveIntegerField()
    male_adult = models.PositiveIntegerField(
        help_text="Total male population 16 and over")
    male_employed = models.PositiveIntegerField(
        help_text="Total male population 16 and over - employed")
    female_adult = models.PositiveIntegerField(
        help_text="Total female population 16 and over")
    female_employed = models.PositiveIntegerField(
        help_text="Total female population 16 and over - employed")


class CBSADemographics(models.Model):
    composite_key = models.CharField(max_length=4 + 5, primary_key=True)
    cbsa = models.ForeignKey(
        CoreBasedStatisticalArea, models.CASCADE, related_name="demographics")
    year = models.PositiveSmallIntegerField(db_index=True)

    median_family_income = models.PositiveIntegerField()
    median_household_income = models.PositiveIntegerField()
    ffiec_est_med_fam_income = models.PositiveIntegerField(
        help_text="FFIEC Estimated Median Family Income")