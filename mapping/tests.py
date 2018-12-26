from unittest.mock import Mock

import pytest

from hmda.models import LARYear
from mapping import views


@pytest.mark.django_db
def test_spa_contains_years():
    LARYear.objects.create(year=2010)
    LARYear.objects.create(year=2011)
    LARYear.objects.create(year=2013)

    result = views.single_page_app(Mock())
    assert b"[2013, 2011, 2010]" in result.content
