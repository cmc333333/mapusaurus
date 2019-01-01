import pytest
from model_mommy import mommy

from geo.models import Tract
from ffiec.models import TractDemographics
from reports import models


@pytest.mark.django_db
def test_population_report():
    demographics = mommy.make(TractDemographics, year=2010, _quantity=10)
    # Wrong year
    mommy.make(TractDemographics, year=2011, _quantity=3)
    # Ignored by tract query
    mommy.make(TractDemographics, tract__pk="1234567890", year=2010)
    result = models.PopulationReport.load(
        Tract.objects.exclude(pk="1234567890"), 2010)

    assert result.total > 0
    assert result.total == sum(d.persons for d in demographics)
    assert result.white == sum(d.non_hispanic_white for d in demographics)
    assert result.hispanic == sum(d.hispanic_only for d in demographics)
    assert result.black == sum(d.black for d in demographics)
    assert result.asian == sum(d.asian for d in demographics)
    assert result.unemployed == (
        sum(d.male_adult for d in demographics)
        - sum(d.male_employed for d in demographics)
        + sum(d.female_adult for d in demographics)
        - sum(d.female_employed for d in demographics)
    )
    assert result.poverty == sum(d.poverty for d in demographics)


@pytest.mark.django_db
def test_home_report():
    demographics = mommy.make(TractDemographics, year=2010, _quantity=10)
    # Wrong year
    mommy.make(TractDemographics, year=2011, _quantity=3)
    # Ignored by tract query
    mommy.make(TractDemographics, tract__pk="1234567890", year=2010)
    result = models.HomeReport.load(
        Tract.objects.exclude(pk="1234567890"), 2010)

    assert result.single_family_homes > 0
    assert result.single_family_homes == \
        sum(d.single_family_homes for d in demographics)
    assert result.single_family_occupied == \
        sum(d.single_family_occupied for d in demographics)


@pytest.fixture
def tract_reports(db):
    return {
        "low_white": mommy.make(
            TractDemographics,
            income_indicator="low",
            non_hispanic_white=8,
            persons=10,
            year=2010,
            _quantity=2,
        ),
        "mod_minority": mommy.make(
            TractDemographics,
            income_indicator="mod",
            non_hispanic_white=2,
            persons=5,
            year=2010,
            _quantity=3,
        ),
        "mid_white": mommy.make(
            TractDemographics,
            income_indicator="mid",
            non_hispanic_white=9,
            persons=11,
            year=2010,
            _quantity=4,
        ),
        "high_minority": mommy.make(
            TractDemographics,
            income_indicator="high",
            non_hispanic_white=4,
            persons=20,
            year=2010,
            _quantity=5,
        ),
    }


def test_tract_report(tract_reports):
    # Wrong year
    mommy.make(TractDemographics, year=2011, _quantity=3)
    # Ignored by tract query
    mommy.make(TractDemographics, tract__pk="1234567890", year=2010)
    result = models.TractReport.load(
        Tract.objects.exclude(pk="1234567890"), 2010)

    assert result.total == (
        len(tract_reports["low_white"])
        + len(tract_reports["mod_minority"])
        + len(tract_reports["mid_white"])
        + len(tract_reports["high_minority"])
    )
    assert result.lmi == (
        len(tract_reports["low_white"])
        + len(tract_reports["mod_minority"])
    )
    assert result.minority == (
        len(tract_reports["mod_minority"])
        + len(tract_reports["high_minority"])
    )


def test_pop_report(tract_reports):
    # Wrong year
    mommy.make(TractDemographics, year=2011, _quantity=3)
    # Ignored by tract query
    mommy.make(TractDemographics, tract__pk="1234567890", year=2010)
    result = models.PopulationByTractReport.load(
        Tract.objects.exclude(pk="1234567890"), 2010)

    assert result.total == (
        sum(d.persons for d in tract_reports["low_white"])
        + sum(d.persons for d in tract_reports["mod_minority"])
        + sum(d.persons for d in tract_reports["mid_white"])
        + sum(d.persons for d in tract_reports["high_minority"])
    )
    assert result.in_lmi == (
        sum(d.persons for d in tract_reports["low_white"])
        + sum(d.persons for d in tract_reports["mod_minority"])
    )
    assert result.in_minority == (
        sum(d.persons for d in tract_reports["mod_minority"])
        + sum(d.persons for d in tract_reports["high_minority"])
    )
