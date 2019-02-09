import pytest
from model_mommy import mommy

from geo.models import CoreBasedStatisticalArea, County, MetroDivision
from reports import serializers


@pytest.mark.django_db
def test_divisions():
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=4)
    metdivs = mommy.make(MetroDivision, metro=metros[1], _quantity=5)
    mommy.make(MetroDivision, metro=metros[-1])
    counties = mommy.make(County, _quantity=6)

    serializer = serializers.ReportSerializer(data={
        "county": ["12345"] + [c.pk for c in counties[2:]],
        "email": "someone@example.com",
        "metro": ["45678"] + [m.pk for m in metros[:2]],
        "year": 1234,
    })
    assert serializer.is_valid()
    expected = metros[:1]
    expected.extend(sorted(metdivs, key=lambda m: m.name))
    expected.extend(sorted(counties[2:], key=lambda c: c.name))
    assert serializer.divisions() == expected
