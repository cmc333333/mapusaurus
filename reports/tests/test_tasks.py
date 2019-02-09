from unittest.mock import Mock

import pytest
from model_mommy import mommy

from geo.models import CoreBasedStatisticalArea, County
from reports import tasks


@pytest.mark.django_db
def test_send_email(mailoutbox, monkeypatch, settings):
    mommy.make(County, geoid="aaaaa", name="AaAaA")
    mommy.make(County, geoid="bbbbb", name="bBbBb")
    mommy.make(CoreBasedStatisticalArea, geoid="mmmmm", name="MmMmM")
    settings.DEFAULT_FROM_EMAIL = "noreply@example.com"
    settings.REPORT_EMAIL_KWARGS = {
        "bcc": ["a_b_c@example.com"],
        "cc": ["c_d_e@example.com"],
        "subject": "Some Subject",
    }

    tasks.send_email(b"content", "a_filename", Mock(validated_data={
        "county": ["aaaaa", "bbbbb"],
        "email": "abcdef@exmple.com",
        "metro": ["mmmmm"],
        "year": 1999,
    }))

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
    counties = mommy.make(County, _quantity=6)
    metros = mommy.make(CoreBasedStatisticalArea, _quantity=2)
    monkeypatch.setattr(tasks, "render_to_string", Mock(return_value=""))
    monkeypatch.setattr(tasks, "default_storage", Mock())
    monkeypatch.setattr(tasks, "delete_report", Mock())
    monkeypatch.setattr(tasks, "send_email", Mock())

    tasks.generate_report.now(
        "abcdef",
        {
            "county": [c.pk for c in counties[:3]],
            "email": "xyz@example.com",
            "metro": [m.pk for m in metros],
            "year": 2008,
        },
    )

    divisions = sorted(metros, key=lambda m: m.name) \
        + sorted(counties[:3], key=lambda c: c.name)

    assert tasks.render_to_string.call_args[0][1] == {
        "divisions": divisions,
        "year": 2008,
    }
    assert tasks.delete_report.call_args[0][0] == "abcdef"
    assert tasks.send_email.call_args[0][1] == "abcdef"
