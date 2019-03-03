from itertools import product

import pytest

from ffiec.tests.factories import (
    CBSADemFactory, MetDivDemFactory, TractDemFactory)
from geo.tests.factories import CBSAFactory, MetDivFactory, TractFactory
from hmda.tests.factories import LARFactory, NormalLARFactory
from reports import models
from reports.tests.factories import ReportInputFactory
from respondents.tests.factories import InstitutionFactory


@pytest.mark.django_db
def test_population_report():
    metdiv = MetDivFactory()
    demographics = TractDemFactory.create_batch(
        10, year=2010, tract__county__metdiv=metdiv)
    # Wrong year
    TractDemFactory.create_batch(3, year=2011, tract__county__metdiv=metdiv)
    # Not in metdiv
    TractDemFactory(year=2010)
    total = sum(d.persons for d in demographics)
    white = sum(d.non_hispanic_white for d in demographics)
    hispanic = sum(d.hispanic_only for d in demographics)
    black = sum(d.black for d in demographics)
    asian = sum(d.asian for d in demographics)
    poverty = sum(d.poverty for d in demographics)
    assert total != 0
    assert white != 0
    assert hispanic != 0
    assert black != 0
    assert asian != 0
    assert poverty != 0

    models.PopulationReport.rebuild_all()
    assert list(models.PopulationReport.generate_for(metdiv, 2010)) == [
        ("All Population", total, 100),
        ("White", white, white * 100 // total),
        ("Hispanic/Latino", hispanic, hispanic * 100 // total),
        ("Black", black, black * 100 // total),
        ("Asian", asian, asian * 100 // total),
        ("Minority", total - white, (total - white) * 100 // total),
        ("People Living in Poverty", poverty, poverty * 100 // total),
    ]


@pytest.mark.django_db
def test_income_housing_report():
    metdiv = MetDivFactory()
    low_white = TractDemFactory.create_batch(
        2, income_indicator="low", non_hispanic_white=8, persons=10,
        tract__county__metdiv=metdiv, year=2010,
    )
    mod_minority = TractDemFactory.create_batch(
        3, income_indicator="mod", non_hispanic_white=2, persons=6,
        tract__county__metdiv=metdiv, year=2010,
    )
    mid_white = TractDemFactory.create_batch(
        4, income_indicator="mid", non_hispanic_white=9, persons=11,
        tract__county__metdiv=metdiv, year=2010,
    )
    high_minority = TractDemFactory.create_batch(
        5, income_indicator="high", non_hispanic_white=4, persons=20,
        tract__county__metdiv=metdiv, year=2010,
    )
    demographics = low_white + mod_minority + mid_white + high_minority
    # Wrong year
    TractDemFactory.create_batch(3, tract__county__metdiv=metdiv, year=2011)
    # Not part of the metdiv
    TractDemFactory(year=2010)

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


@pytest.mark.django_db
def test_disparity_row_applicant():
    metdiv = MetDivFactory()
    lar = NormalLARFactory.create_batch(
        100, as_of_year=2010, tract__county__metdiv=metdiv)

    # Wrong year
    NormalLARFactory(as_of_year=2011, tract__county__metdiv=metdiv)
    # Not in metdiv
    NormalLARFactory(as_of_year=2010)
    non_hispanic = {l for l in lar if l.applicant_ethnicity == "2"}
    white = {l for l in non_hispanic if l.applicant_race_1 == "5"}
    black = {l for l in non_hispanic if l.applicant_race_1 == "3"}
    hispanic = {l for l in lar if l.applicant_ethnicity == "1"}
    asian = {l for l in non_hispanic if l.applicant_race_1 == "2"}
    minority = set(lar) - white
    men = {l for l in lar if l.applicant_sex == 1}
    women = {l for l in lar if l.applicant_sex == 2}

    assert len(white) > 0
    assert len(black) > 0
    assert len(hispanic) > 0
    assert len(asian) > 0
    assert len(minority) > 0
    assert len(men) > 0
    assert len(women) > 0

    report_input = ReportInputFactory(metro_ids={metdiv.metro_id}, year=2010)
    result = list(models.DisparityRow.groups_for(metdiv, report_input))
    assert len(result) == 4
    assert result[0] == (
        "White borrowers",
        [
            (
                "White", len(white),
                len([l for l in white if l.action_taken == 1]),
                len(lar), len(white),
                len([l for l in white if l.action_taken == 1]),
            ),
            (
                "Black", len(black),
                len([l for l in black if l.action_taken == 1]),
                len(lar), len(white),
                len([l for l in white if l.action_taken == 1]),
            ),
            (
                "Hispanic/Latino", len(hispanic),
                len([l for l in hispanic if l.action_taken == 1]),
                len(lar), len(white),
                len([l for l in white if l.action_taken == 1]),
            ),
            (
                "Asian", len(asian),
                len([l for l in asian if l.action_taken == 1]),
                len(lar), len(white),
                len([l for l in white if l.action_taken == 1]),
            ),
            (
                "Minority", len(minority),
                len([l for l in minority if l.action_taken == 1]),
                len(lar), len(white),
                len([l for l in white if l.action_taken == 1]),
            ),
        ],
    )
    assert result[1] == (
        "Male",
        [
            (
                "Female", len(women),
                len([l for l in women if l.action_taken == 1]),
                len(lar), len(men),
                len([l for l in men if l.action_taken == 1]),
            ),
        ],
    )


@pytest.mark.django_db
def test_disparity_row_lmi_applicant():
    metdiv = MetDivFactory()
    lar = NormalLARFactory.create_batch(
        25, as_of_year=2010, tract__county__metdiv=metdiv)
    avg_income = sum(l.applicant_income_000s for l in lar) // len(lar)
    MetDivDemFactory(
        metdiv=metdiv, year=2010, ffiec_est_med_fam_income=avg_income * 1000)
    # Wrong year
    MetDivDemFactory(metdiv=metdiv, year=2011)
    below = {
        l for l in lar if l.applicant_income_000s < avg_income * .8}
    above = {
        l for l in lar if l.applicant_income_000s >= avg_income * .8}
    assert len(below) > 0
    assert len(above) > 0

    report_input = ReportInputFactory(metro_ids={metdiv.metro_id}, year=2010)
    result = list(models.DisparityRow.groups_for(metdiv, report_input))
    assert len(result) == 5
    assert result[1] == (
        "MUI Borrowers",
        [(
            "LMI Applicant", len(below),
            len([l for l in below if l.action_taken == 1]),
            len(lar), len(above),
            len([l for l in above if l.action_taken == 1]),
        )],
    )


@pytest.mark.django_db
def test_disparity_row_tracts():
    metdiv = MetDivFactory()
    TractDemFactory(year=2011, tract__county__metdiv=metdiv)    # wrong year

    lm_lar = NormalLARFactory.create_batch(
        10, as_of_year=2010, tract=TractDemFactory(
            year=2010, income_indicator="low", persons=10,
            non_hispanic_white=2, tract__county__metdiv=metdiv,
        ).tract,
    )
    mw_lar = NormalLARFactory.create_batch(
        12, as_of_year=2010, tract=TractDemFactory(
            year=2010, income_indicator="mod", persons=15,
            non_hispanic_white=10, tract__county__metdiv=metdiv,
        ).tract,
    )
    mm_lar = NormalLARFactory.create_batch(
        14, as_of_year=2010, tract=TractDemFactory(
            year=2010, income_indicator="mid", persons=20,
            non_hispanic_white=5, tract__county__metdiv=metdiv,
        ).tract,
    )
    hw_lar = NormalLARFactory.create_batch(
        16, as_of_year=2010, tract=TractDemFactory(
            year=2010, income_indicator="high", persons=25,
            non_hispanic_white=20, tract__county__metdiv=metdiv,
        ).tract,
    )

    report_input = ReportInputFactory(metro_ids={metdiv.metro_id}, year=2010)
    result = list(models.DisparityRow.groups_for(metdiv, report_input))
    assert result[-2:] == [
        (
            "MUI Tracts",
            [(
                "Applicant in LMI Tract", 10 + 12,
                len([l for l in lm_lar + mw_lar if l.action_taken == 1]),
                10 + 12 + 14 + 16, 14 + 16,
                len([l for l in mm_lar + hw_lar if l.action_taken == 1]),
            )],
        ),
        (
            "White Majority Tracts",
            [(
                "Applicant in Minority Tract", 10 + 14,
                len([l for l in lm_lar + mm_lar if l.action_taken == 1]),
                10 + 12 + 14 + 16, 12 + 16,
                len([l for l in mw_lar + hw_lar if l.action_taken == 1]),
            )],
        ),
    ]


@pytest.mark.parametrize("feature, compare, expected", [
    ((75, 100), (100, 200), "0.5"),     # 25% compared to 50%
    ((0, 100), (100, 200), "2.0"),      # 100% compared to 50%
    ((100, 100), (100, 200), "0.0"),    # 0% compared to 50%
    ((0, 0), (100, 200), "N/A"),
    ((70, 100), (0, 200), "0.3"),       # 30% compared to 100%
    ((75, 100), (200, 200), "N/A"),     # 25% compared to 0%
    ((75, 100), (0, 0), "N/A"),
])
def test_disparity_row_disparity_ratio(feature, compare, expected):
    row = models.DisparityRow(
        "AAA", feature[1], feature[0], 1000, compare[1], compare[0])
    assert row.disparity_ratio() == expected


@pytest.mark.django_db
def test_top_lender_lender_selection():
    lenders = InstitutionFactory.create_batch(6)
    tracts = TractFactory.create_batch(2)
    LARFactory.create_batch(
        5, action_taken=1, as_of_year=2012, tract=tracts[0],
        institution=lenders[0])
    LARFactory.create_batch(
        6, action_taken=1, as_of_year=2012, tract=tracts[0],
        institution=lenders[1])
    LARFactory.create_batch(
        4, action_taken=1, as_of_year=2012, tract=tracts[0],
        institution=lenders[2])
    LARFactory.create_batch(
        3, action_taken=1, as_of_year=2012, tract=tracts[0],
        institution=lenders[3])
    # wrong year
    LARFactory.create_batch(
        10, action_taken=1, as_of_year=2011, tract=tracts[0],
        institution=lenders[4])
    # wrong division
    LARFactory.create_batch(
        10, action_taken=1, as_of_year=2012, tract=tracts[1],
        institution=lenders[5])
    report_input = ReportInputFactory(lender_ids={lenders[3].pk}, year=2012)

    rows = list(models.TopLenderRow.generate_for(
        tracts[0].county, report_input, count=2))

    assert len(rows) == 3
    assert rows[0].lender_rank == 1
    assert rows[0].name == lenders[1].name
    assert rows[0].applications == 6
    assert rows[0].requested is False
    assert rows[1].lender_rank == 2
    assert rows[1].name == lenders[0].name
    assert rows[1].applications == 5
    assert rows[1].requested is False
    assert rows[2].lender_rank == 4
    assert rows[2].name == lenders[3].name
    assert rows[2].applications == 3
    assert rows[2].requested is True


@pytest.mark.django_db
def test_top_lender_stats():
    lender = InstitutionFactory()
    metro = CBSAFactory()
    CBSADemFactory(cbsa=metro, ffiec_est_med_fam_income=100000, year=2010)
    low_white = TractDemFactory(
        income_indicator="low", non_hispanic_white=8, persons=10,
        tract__county__cbsa=metro, year=2010,
    )
    mod_minority = TractDemFactory(
        income_indicator="mod", non_hispanic_white=2, persons=6,
        tract__county__cbsa=metro, year=2010,
    )
    mid_white = TractDemFactory(
        income_indicator="mid", non_hispanic_white=9, persons=11,
        tract__county__cbsa=metro, year=2010,
    )
    high_minority = TractDemFactory(
        income_indicator="high", non_hispanic_white=4, persons=20,
        tract__county__cbsa=metro, year=2010,
    )

    applications, approvals, lmit, lmib, mint, minb = 0, 0, 0, 0, 0, 0
    configurations = product(
        (low_white, mod_minority, mid_white, high_minority),
        (1, 2),
        (60, 90),
        ("1", "5"),
    )
    for idx, (dem, action_taken, income, race) in enumerate(configurations):
        quantity = idx + 5
        LARFactory.create_batch(
            quantity, action_taken=action_taken, as_of_year=2010,
            tract=dem.tract, institution=lender, applicant_ethnicity="2",
            applicant_income_000s=income, applicant_race_1=race,
        )
        applications += quantity
        if action_taken == 1:
            approvals += quantity
            lmit += quantity if dem in (low_white, mod_minority) else 0
            lmib += quantity if income == 60 else 0
            mint += quantity if dem in (mod_minority, high_minority) else 0
            minb += quantity if race == "1" else 0

    report_input = ReportInputFactory(year=2010)

    rows = list(models.TopLenderRow.generate_for(metro, report_input))

    assert rows == [models.TopLenderRow(
        lender_rank=1,
        requested=False,
        name=lender.name,
        applications=applications,
        approval_rate=100 * approvals // applications,
        lmit_pct=100 * lmit // approvals,
        lmib_pct=100 * lmib // approvals,
        mint_pct=100 * mint // approvals,
        minb_pct=100 * minb // approvals,
    )]
