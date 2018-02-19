import pytest

from respondents.management.commands import load_reporter_panel


@pytest.mark.django_db
def test_parseline():
    reporter_line = "201400000555471                                                                   0312328543920FIRST FAKE BK NA                                                      TERRE HAUTE              CA                    0001208595FIRST FC                      TERRE HAUTE              CAUNITED STATES                           0000693345001234000018"     # noqa
    reporter_row = load_reporter_panel.parse_line(reporter_line)
    assert reporter_row.year == '2014'
    assert reporter_row.respondent_id == '0000055547'
    assert reporter_row.agency_code == 1
    assert reporter_row.parent_id == ''
