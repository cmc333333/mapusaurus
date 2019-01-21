import pytest
from model_mommy import mommy

from geo.models import MetroDivision
from ffiec.models import TractDemographics
from reports import models


@pytest.mark.django_db
def test_population_report():
    metdiv = mommy.make(MetroDivision)
    demographics = mommy.make(
        TractDemographics,
        year=2010, tract__county__metdiv=metdiv, _quantity=10,
    )
    # Wrong year
    mommy.make(
        TractDemographics,
        year=2011, tract__county__metdiv=metdiv, _quantity=3,
    )
    # Not in metdiv
    mommy.make(TractDemographics, year=2010)
    total = sum(d.persons for d in demographics)
    white = sum(d.non_hispanic_white for d in demographics)
    hispanic = sum(d.hispanic_only for d in demographics)
    black = sum(d.black for d in demographics)
    asian = sum(d.asian for d in demographics)
    unemployed = sum(
        d.male_adult - d.male_employed + d.female_adult - d.female_employed
        for d in demographics
    )
    poverty = sum(d.poverty for d in demographics)
    assert total != 0
    assert white != 0
    assert hispanic != 0
    assert black != 0
    assert asian != 0
    assert unemployed != 0
    assert poverty != 0

    assert list(models.PopulationReportRow.generate_for(metdiv, 2010)) == [
        ("All Population", total, 100),
        ("White", white, white * 100 // total),
        ("Hispanic/Latino", hispanic, hispanic * 100 // total),
        ("Black", black, black * 100 // total),
        ("Asian", asian, asian * 100 // total),
        ("Minority", total - white, (total - white) * 100 // total),
        ("Unemployed 16+", unemployed, unemployed * 100 // total),
        ("People living in Poverty", poverty, poverty * 100 // total),
    ]


@pytest.mark.django_db
def test_income_housing_report():
    metdiv = mommy.make(MetroDivision)
    low_white = mommy.make(
        TractDemographics,
        income_indicator="low", non_hispanic_white=8, persons=10,
        tract__county__metdiv=metdiv, year=2010, _quantity=2,
    )
    mod_minority = mommy.make(
        TractDemographics,
        income_indicator="mod", non_hispanic_white=2, persons=6,
        tract__county__metdiv=metdiv, year=2010, _quantity=3,
    )
    mid_white = mommy.make(
        TractDemographics,
        income_indicator="mid", non_hispanic_white=9, persons=11,
        tract__county__metdiv=metdiv, year=2010, _quantity=4,
    )
    high_minority = mommy.make(
        TractDemographics,
        income_indicator="high", non_hispanic_white=4, persons=20,
        tract__county__metdiv=metdiv, year=2010, _quantity=5,
    )
    demographics = low_white + mod_minority + mid_white + high_minority
    # Wrong year
    mommy.make(
        TractDemographics,
        tract__county__metdiv=metdiv, year=2011, _quantity=3)
    # Not part of the metdiv
    mommy.make(TractDemographics, year=2010)

    homes = sum(d.single_family_homes for d in demographics)
    occupied = sum(d.single_family_occupied for d in demographics)
    count_lmi = len(low_white) + len(mod_minority)
    count_minority = len(mod_minority) + len(high_minority)
    persons_lmi = sum(d.persons for d in low_white)\
        + sum(d.persons for d in mod_minority)
    persons_minority = sum(d.persons for d in mod_minority)\
        + sum(d.persons for d in high_minority)
    all_persons = sum(d.persons for d in demographics)
    assert homes != 0
    assert occupied != 0
    assert count_lmi > 0
    assert count_minority > 0
    assert persons_lmi != 0
    assert persons_minority != 0

    assert list(models.IncomeHousingReportRow.generate_for(metdiv, 2010)) == [
        ("Single Family Homes", homes, 100),
        ("Owner Occupied Homes", occupied, occupied * 100 // homes),
        ("LMI Tracts in Geography",
            count_lmi, count_lmi * 100 // len(demographics)),
        ("Minority Tracts in Geography",
            count_minority, count_minority * 100 // len(demographics)),
        ("Population in LMI Tracts",
            persons_lmi, persons_lmi * 100 // all_persons),
        ("Population in Minority Tracts",
            persons_minority, persons_minority * 100 // all_persons),
    ]
