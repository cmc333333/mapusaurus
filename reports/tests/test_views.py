from unittest.mock import Mock

from reports import views


def test_create_report(client, monkeypatch, settings):
    monkeypatch.setattr(views, "generate_report", Mock())
    settings.MEDIA_URL = "/some/path/here/"
    result = client.post(
        "/api/reports/",
        {"county": ["1", "2"], "metro": ["3", "4", "5"], "year": 123},
        "application/json",
    )

    filename = views.generate_report.call_args[1].get("filename")
    assert filename
    assert views.generate_report.call_args[1]["county_ids"] == ["1", "2"]
    assert views.generate_report.call_args[1]["metro_ids"] == ["3", "4", "5"]
    assert views.generate_report.call_args[1]["year"] == 123

    assert result.data == {"url": f"/some/path/here/{filename}.pdf"}
