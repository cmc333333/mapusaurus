from io import BytesIO
from unittest.mock import MagicMock, Mock, call

import pytest
import requests
from django.core.management import call_command

from respondents.management.commands import fetch_load_reporter_panels


def test_handle_no_args(monkeypatch):
    monkeypatch.setattr(fetch_load_reporter_panels, 'fetch_post_2016', Mock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'fetch_pre_2017', Mock())
    call_command('fetch_load_reporter_panels')

    assert fetch_load_reporter_panels.fetch_post_2016.call_count == 1
    assert fetch_load_reporter_panels.fetch_pre_2017.call_count == 5


def test_handle_specific_args(monkeypatch):
    monkeypatch.setattr(fetch_load_reporter_panels, 'fetch_post_2016', Mock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'fetch_pre_2017', Mock())
    call_command('fetch_load_reporter_panels', '--year', '2014', '2017')

    assert fetch_load_reporter_panels.fetch_post_2016.call_count == 1
    assert fetch_load_reporter_panels.fetch_pre_2017.call_count == 1


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_handle_404(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_reporter_panels, 'fetch_pre_2017', Mock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'logger', Mock())
    fetch_load_reporter_panels.fetch_pre_2017.side_effect = exception
    call_command('fetch_load_reporter_panels', '--year', '2013', '2015')

    assert fetch_load_reporter_panels.fetch_pre_2017.call_count == 2
    assert fetch_load_reporter_panels.logger.exception.call_count == 2


def test_fetch_pre_2017(monkeypatch):
    monkeypatch.setattr(
        fetch_load_reporter_panels, 'fetch_and_unzip_file', MagicMock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'ReporterRow', Mock())
    fetch_mock = fetch_load_reporter_panels.fetch_and_unzip_file
    fetch_mock.return_value.__enter__.return_value = ["line1", "line2"]

    fetch_load_reporter_panels.fetch_pre_2017(2015)

    assert "2015" in fetch_mock.call_args[0][0]
    assert fetch_load_reporter_panels.ReporterRow.from_line.call_args_list ==\
        [call("line1"), call("line2")]


def test_fetch_post_2016(monkeypatch):
    monkeypatch.setattr(
        fetch_load_reporter_panels, 'fetch_and_unzip_file', MagicMock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'ReporterRow', Mock())
    fetch_mock = fetch_load_reporter_panels.fetch_and_unzip_file
    fetch_mock.return_value.__enter__.return_value = \
        BytesIO(b"one,two,three\nfour,five,six\n")

    fetch_load_reporter_panels.fetch_post_2016(2020)

    assert "2020" in fetch_mock.call_args[0][0]
    args = fetch_load_reporter_panels.ReporterRow.from_csv_row.call_args_list
    assert args == \
        [call(["one", "two", "three"]), call(["four", "five", "six"])]
