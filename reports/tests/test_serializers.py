import pytest
from model_mommy import mommy

from geo.models import CoreBasedStatisticalArea, County, MetroDivision, Tract
from hmda.models import LoanApplicationRecord
from reports import serializers


@pytest.mark.django_db
def test_divisions():
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=4)
    metdivs = mommy.make(MetroDivision, metro=metros[1], _quantity=5)
    mommy.make(MetroDivision, metro=metros[-1])
    counties = mommy.make(County, _quantity=6)

    report_input = serializers.ReportInput(
        county_ids={"12345"} | {c.pk for c in counties[2:]},
        email="someone@example.com",
        lien_status=set(),
        loan_purpose=set(),
        metro_ids={"45678"} | {m.pk for m in metros[:2]},
        owner_occupancy=set(),
        property_type=set(),
        year=1234,
    )

    expected = metros[:1]
    expected.extend(sorted(metdivs, key=lambda m: m.name))
    expected.extend(sorted(counties[2:], key=lambda c: c.name))
    assert report_input.divisions() == expected


@pytest.mark.django_db
def test_lar_queryset():
    county = mommy.make(County)
    tract = mommy.make(Tract, county=county)
    good_params = {
        "action_taken": 1,
        "as_of_year": 2012,
        "lien_status": "1",
        "loan_purpose": 2,
        "owner_occupancy": 3,
        "property_type": "2",
        "tract": tract,
    }
    lar = mommy.make(LoanApplicationRecord, **good_params)
    mommy.make(LoanApplicationRecord, **dict(good_params, action_taken=6))
    mommy.make(LoanApplicationRecord, **dict(good_params, as_of_year=2010))
    mommy.make(LoanApplicationRecord, **dict(good_params, lien_status="2"))
    mommy.make(LoanApplicationRecord, **dict(good_params, loan_purpose=3))
    mommy.make(LoanApplicationRecord, **dict(good_params, owner_occupancy=1))
    mommy.make(
        LoanApplicationRecord, **dict(good_params, tract=mommy.make(Tract)))
    report_input = serializers.ReportInput(
        county_ids={county.pk},
        email="",
        lien_status={"1", "3"},
        loan_purpose={1, 2},
        metro_ids=set(),
        owner_occupancy={2, 3},
        property_type=set(),
        year=2012,
    )
    assert list(report_input.lar_queryset(county)) == [lar]


def test_lar_filter_descs():
    report_input = serializers.ReportInput(
        county_ids=set(),
        email="",
        lien_status={"1", "2"},
        loan_purpose={2, 3},
        metro_ids=set(),
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
