from unittest.mock import call, MagicMock, Mock

import pytest
import requests
from django.management import call_command
from freezegun import freeze_time

from ffiec.management.commands import fetch_load_demographics


def test_default_args(monkeypatch):
    monkeypatch.setattr(fetch_load_demographics, "load_demographics", Mock())
    with freeze_time("2019-01-02"):
        call_command("fetch_load_demographics")
    years = [
        call[0][0] for call in
        fetch_load_demographics.load_demographics.call_args_list
    ]
    assert years == [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
    assert fetch_load_demographics.load_demographics.call_args == \
        call(2019, True, True, False)


def test_custom_args(monkeypatch):
    monkeypatch.setattr(fetch_load_demographics, "load_demographics", Mock())
    call_command("fetch_load_demographics", "--year", "2013", "2014",
                 "--no-cbsa", "--replace")
    assert fetch_load_demographics.load_demographics.call_count == 2
    assert fetch_load_demographics.load_demographics.call_args == \
        call(2014, True, False, True)


@pytest.mark.parametrize("exception", (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_fetch_csv_exceptions(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_demographics, "logger", Mock())
    monkeypatch.setattr(fetch_load_demographics, "fetch_and_unzip_dir",
                        MagicMock())
    fetch_load_demographics.fetch_and_unzip_demographics.side_effect = \
        exception
    fetch_load_demographics.fetch_csv(1234)
    assert fetch_load_demographics.logger.exception.called
