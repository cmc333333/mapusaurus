import pytest
from django.core.management import call_command


@pytest.fixture()
def load_agencies(db):
    call_command('loaddata', 'agency')
