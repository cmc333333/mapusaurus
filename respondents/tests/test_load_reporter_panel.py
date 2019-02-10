import pytest
from model_mommy import mommy

from respondents.management.commands import load_reporter_panel
from respondents.models import Institution, ZipcodeCityStateYear


def test_from_line():
    reporter_line = "201400000555471                                                                   0312328543920FIRST FAKE BK NA                                                      TERRE HAUTE              CA                    0001208595FIRST FC                      TERRE HAUTE              CAUNITED STATES                           0000693345001234000018"     # noqa
    reporter_row = load_reporter_panel.ReporterRow.from_line(reporter_line)
    assert reporter_row.year == "2014"
    assert reporter_row.respondent_id == "0000055547"
    assert reporter_row.agency_code == 1
    assert reporter_row.parent_id == ""


@pytest.mark.usefixtures("load_agencies")
def test_institution():
    bank1 = mommy.make(
        Institution, year=2011, agency_id=3, respondent_id="1122334455")
    bank2 = mommy.make(
        Institution, year=2011, agency_id=3, respondent_id="1111111111")
    bank3 = mommy.make(
        Institution, year=2011, agency_id=1, respondent_id="1122334455")
    bank4 = mommy.make(
        Institution, year=2013, agency_id=3, respondent_id="1122334455")

    assert load_reporter_panel.ReporterRow.from_line(
        "201111223344553" + " "*325).institution().pk == bank1.pk
    assert load_reporter_panel.ReporterRow.from_line(
        "201111111111113" + " "*325).institution().pk == bank2.pk
    assert load_reporter_panel.ReporterRow.from_line(
        "201111223344551" + " "*325).institution().pk == bank3.pk
    assert load_reporter_panel.ReporterRow.from_line(
        "201311223344553" + " "*325).institution().pk == bank4.pk
    assert load_reporter_panel.ReporterRow.from_line(
        "201511223344553" + " "*325).institution() is None


@pytest.mark.usefixtures("load_agencies")
def test_parent():
    zip_code = mommy.make(ZipcodeCityStateYear)
    parent = mommy.make(Institution, year=2012, respondent_id="9988776655",
                        zip_code=zip_code)
    mommy.make(Institution, _quantity=5)    # random other institutions
    row = load_reporter_panel.ReporterRow.from_line("1"*340)
    row = row._replace(year="2012", parent_id="9988776655",
                       parent_state=zip_code.state)
    assert row.parent().pk == parent.pk


@pytest.mark.usefixtures("load_agencies")
def test_parent_rssd_id():
    parent = mommy.make(Institution, year=2012, rssd_id="0011223344")
    mommy.make(Institution, _quantity=5)    # random other institutions
    row = load_reporter_panel.ReporterRow.from_line("1"*340)
    row = row._replace(year="2012", parent_rssd_id="0011223344")
    assert row.parent().pk == parent.pk
