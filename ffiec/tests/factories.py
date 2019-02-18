import factory

from ffiec.models import (
    CBSADemographics, MetDivDemographics, TractDemographics)
from geo.tests.factories import CBSAFactory, MetDivFactory, TractFactory


class TractDemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TractDemographics

    composite_key = factory.Faker("numerify", text="#" * 15)
    tract = factory.SubFactory(TractFactory)
    year = factory.Faker("year")
    income_indicator = factory.Faker(
        "random_element", elements=("low", "mod", "mid", "high"))
    median_age = factory.Faker("pyint")
    median_year_house_built = factory.Faker("year")
    median_household_income = factory.Faker("pyint")
    median_family_income = factory.Faker("pyint")
    median_gross_rent = factory.Faker("pyint")
    median_oo_housing_value = factory.Faker("pyint")
    female_median_age = factory.Faker("pyint")
    male_median_age = factory.Faker("pyint")
    avg_family_income = factory.Faker("pyint")
    poverty_distressed = factory.Faker("pybool")
    unemployment_distressed = factory.Faker("pybool")
    population_distressed = factory.Faker("pybool")
    rural_underserved = factory.Faker("pybool")
    previous_distressed = factory.Faker("pybool")
    previous_underserved = factory.Faker("pybool")
    households = factory.Faker("pyint")
    single_family_homes = factory.Faker("pyint")
    single_family_occupied = factory.Faker("pyint")
    poverty_households = factory.Faker("pyint")
    one_to_four_households = factory.Faker("pyint")
    families = factory.Faker("pyint")
    poverty_families = factory.Faker("pyint")
    persons = factory.Faker("pyint")
    females = factory.Faker("pyint")
    males = factory.Faker("pyint")
    non_white = factory.Faker("pyint")
    hispanic_only = factory.Faker("pyint")
    non_hispanic_white = factory.Faker("pyint")
    black = factory.Faker("pyint")
    american_indian = factory.Faker("pyint")
    asian = factory.Faker("pyint")
    pacific_islander = factory.Faker("pyint")
    in_households = factory.Faker("pyint")
    poverty = factory.Faker("pyint")
    male_adult = factory.Faker("pyint")
    male_employed = factory.Faker("pyint")
    female_adult = factory.Faker("pyint")
    female_employed = factory.Faker("pyint")


class CBSADemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CBSADemographics

    composite_key = factory.Faker("numerify", text="#" * 9)
    cbsa = factory.SubFactory(CBSAFactory)
    year = factory.Faker("year")
    median_family_income = factory.Faker("pyint")
    median_household_income = factory.Faker("pyint")
    ffiec_est_med_fam_income = factory.Faker("pyint")


class MetDivDemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MetDivDemographics

    composite_key = factory.Faker("numerify", text="#" * 9)
    metdiv = factory.SubFactory(MetDivFactory)
    year = factory.Faker("year")
    median_family_income = factory.Faker("pyint")
    median_household_income = factory.Faker("pyint")
    ffiec_est_med_fam_income = factory.Faker("pyint")
