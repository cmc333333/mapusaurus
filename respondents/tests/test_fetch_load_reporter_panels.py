from unittest.mock import MagicMock, Mock, call

import pytest
import requests
from django.core.management import call_command
from freezegun import freeze_time

from respondents.management.commands import fetch_load_reporter_panels


def test_handle_no_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_reporter_panels, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_reporter_panels.fetch_and_unzip_file
    fetch_call.return_value.__enter__.return_value = ['line1', 'line2']
    monkeypatch.setattr(fetch_load_reporter_panels, 'ReporterRow', Mock())
    with freeze_time('2018-01-01'):
        call_command('fetch_load_reporter_panels')

    assert fetch_call.call_count == 6
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    for year in range(2012, 2018):
        assert any(str(year) in url for url in called_urls)

    from_line_calls = fetch_load_reporter_panels.ReporterRow.from_line\
        .call_args_list
    assert from_line_calls == [call('line1'), call('line2')] * 6


def test_handle_specific_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_reporter_panels, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_reporter_panels.fetch_and_unzip_file
    monkeypatch.setattr(fetch_load_reporter_panels, 'ReporterRow', Mock())
    call_command('fetch_load_reporter_panels', '--year', '2014', '2017')

    assert fetch_call.call_count == 2
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    assert '2014' in called_urls[0]
    assert '2017' in called_urls[1]


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_handle_404(monkeypatch, exception):
    monkeypatch.setattr(
        fetch_load_reporter_panels, 'fetch_and_unzip_file', MagicMock())
    monkeypatch.setattr(fetch_load_reporter_panels, 'logger', Mock())
    fetch_call = fetch_load_reporter_panels.fetch_and_unzip_file
    fetch_call.return_value.__enter__.side_effect = exception
    call_command('fetch_load_reporter_panels', '--year', '2013', '2015')

    assert fetch_call.return_value.__enter__.call_count == 2
    assert fetch_load_reporter_panels.logger.exception.call_count == 2
