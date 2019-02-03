from unittest.mock import Mock

from reports import views


def test_create_report(client, monkeypatch, settings):
    settings.MEDIA_URL = "http://example.com/a/path/"
    monkeypatch.setattr(views, "generate_report", Mock())
    request_data = {
        "county_ids": ["1", "2"],
        "email": "someone@example.com",
        "metro_ids": ["3", "4", "5"],
        "other": "value",
        "year": 123,
    }
    result = client.post("/api/reports/", request_data, "application/json")

    file_id = views.generate_report.call_args[1].get("file_id")
    assert file_id
    assert views.generate_report.call_args[1].get("request_params")\
        == request_data

    assert result.data == {"url": f"http://example.com/a/path/{file_id}.pdf"}
