from unittest.mock import Mock

import pytest

from geo.tests.factories import CBSAFactory, CountyFactory
from reports import tasks
from reports.tests.factories import ReportInputFactory


@pytest.mark.django_db
def test_send_email(mailoutbox, monkeypatch, settings):
    CountyFactory(geoid="aaaaa", name="AaAaA")
    CountyFactory(geoid="bbbbb", name="bBbBb")
    CBSAFactory(geoid="mmmmm", name="MmMmM")
    settings.DEFAULT_FROM_EMAIL = "noreply@example.com"
    settings.REPORT_EMAIL_KWARGS = {
        "bcc": ["a_b_c@example.com"],
        "cc": ["c_d_e@example.com"],
        "subject": "Some Subject",
    }

    tasks.send_email(b"content", "a_filename", ReportInputFactory(
        county_ids={"aaaaa", "bbbbb"},
        email="abcde100f@example.com",
        metro_ids={"mmmmm"},
        year=1999,
    ))

    assert len(mailoutbox) == 1
    message = mailoutbox[0]
    assert message.bcc == ["a_b_c@example.com"]
    assert message.cc == ["c_d_e@example.com"]
    assert message.from_email == "noreply@example.com"
    assert message.subject == "Some Subject"
    assert len(message.alternatives) == 1
    assert message.alternatives[0][1] == "text/html"

    for txts in (message.body, message.alternatives[0][0]):
        assert "AaAaA" in txts
        assert "bBbBb" in txts
        assert "MmMmM" in txts
        assert "1999" in txts
        assert "a_filename" in txts
    assert message.attachments \
        == [("report.pdf", b"content", "application/pdf")]


@pytest.mark.django_db
def test_generate_report(monkeypatch):
    counties = CountyFactory.create_batch(6)
    metros = CBSAFactory.create_batch(2)
    monkeypatch.setattr(tasks, "render_to_string", Mock(return_value=""))
    monkeypatch.setattr(tasks, "default_storage", Mock())
    monkeypatch.setattr(tasks, "delete_report", Mock())
    monkeypatch.setattr(tasks, "send_email", Mock())

    tasks.generate_report.now(
        "abcdef",
        {
            "county": [c.pk for c in counties[:3]],
            "email": "xyz@example.com",
            "loanPurpose": [2, 3],
            "metro": [m.pk for m in metros],
            "propertyType": ["3", "1"],
            "year": 2008,
        },
    )

    assert tasks.render_to_string.call_args[0][1] == {
        "report_input": ReportInputFactory(
            county_ids={c.pk for c in counties[:3]},
            email="xyz@example.com",
            loan_purpose={2, 3},
            metro_ids={m.pk for m in metros},
            property_type={"1", "3"},
            year=2008,
        ),
    }
    assert tasks.delete_report.call_args[0][0] == "abcdef"
    assert tasks.send_email.call_args[0][1] == "abcdef"
