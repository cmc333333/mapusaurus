import pytest

from geo.tests.factories import (
    CBSAFactory, CountyFactory, MetDivFactory, TractFactory)
from hmda.tests.factories import LARFactory
from reports.tests.factories import ReportInputFactory


@pytest.mark.django_db
def test_divisions():
    metros = CBSAFactory.create_batch(4)
    metdivs = MetDivFactory.create_batch(5, metro=metros[1])
    MetDivFactory(metro=metros[-1])
    counties = CountyFactory.create_batch(6)

    report_input = ReportInputFactory(
        county_ids={"12345"} | {c.pk for c in counties[2:]},
        email="someone@example.com",
        metro_ids={"45678"} | {m.pk for m in metros[:2]},
        year=1234,
    )

    expected = metros[:1]
    expected.extend(sorted(metdivs, key=lambda m: m.name))
    expected.extend(sorted(counties[2:], key=lambda c: c.name))
    assert report_input.divisions() == expected


@pytest.mark.django_db
def test_lar_queryset():
    county = CountyFactory()
    tract = TractFactory(county=county)
    good_params = {
        "action_taken": 1,
        "as_of_year": 2012,
        "lien_status": "1",
        "loan_purpose": 2,
        "owner_occupancy": 3,
        "property_type": "2",
        "tract": tract,
    }
    lar = LARFactory(**good_params)
    LARFactory(**dict(good_params, action_taken=6))
    LARFactory(**dict(good_params, as_of_year=2010))
    LARFactory(**dict(good_params, lien_status="2"))
    LARFactory(**dict(good_params, loan_purpose=3))
    LARFactory(**dict(good_params, owner_occupancy=1))
    LARFactory(**dict(good_params, tract=TractFactory()))
    report_input = ReportInputFactory(
        county_ids={county.pk},
        lien_status={"1", "3"},
        loan_purpose={1, 2},
        owner_occupancy={2, 3},
        year=2012,
    )
    assert list(report_input.lar_queryset(county)) == [lar]


def test_lar_filter_descs():
    report_input = ReportInputFactory(
        lien_status={"1", "2"},
        loan_purpose={2, 3},
        owner_occupancy={3, 1},
        property_type={"2"},
        year=1234,
    )
    assert report_input.lar_filter_descs == [
        ("Action Taken", [
            "Loan originated",
            "Application approved but not accepted",
            "Application denied by financial institution",
            "Application withdrawn by applicant",
            "File closed for incompleteness",
        ]),
        ("Loan Purpose", ["Home improvement", "Refinancing"]),
        ("Property Type", ["Manufactured housing"]),
        ("Owner Occupancy", [
            "Owner-occupied as a principal dwelling",
            "Not applicable",
        ]),
        ("Lien Status", [
            "Secured by a first lien",
            "Secured by a subordinate lien",
        ]),
    ]
