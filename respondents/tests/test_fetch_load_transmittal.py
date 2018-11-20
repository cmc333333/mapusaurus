from collections import Counter
from io import BytesIO
from unittest.mock import MagicMock, Mock

import pytest
import requests
from django.core.management import call_command

from respondents.management.commands import fetch_load_transmittals


def test_handle_no_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_transmittals, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_transmittals.fetch_and_unzip_file
    fetch_call.return_value.__enter__.return_value = BytesIO(b"")
    monkeypatch.setattr(fetch_load_transmittals, 'load_from_csv', Mock())
    monkeypatch.setattr(fetch_load_transmittals, 'save_batches', Mock())
    monkeypatch.setattr(fetch_load_transmittals, 'Agency', Mock())
    monkeypatch.setattr(fetch_load_transmittals.csv, "reader", Mock())
    call_command('fetch_load_transmittals')

    assert fetch_call.call_count == 6
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    for year in range(2013, 2018):
        assert any(str(year) in url for url in called_urls)

    assert fetch_load_transmittals.load_from_csv.call_count == 6
    assert fetch_load_transmittals.save_batches.call_count == 6
    replace = fetch_load_transmittals.save_batches.call_args[0][2]
    assert not replace

    delimiters = Counter(
        args[1]['delimiter']
        for args in fetch_load_transmittals.csv.reader.call_args_list
    )
    assert delimiters[","] == 1
    assert delimiters["\t"] == 5


def test_handle_specific_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_transmittals, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_transmittals.fetch_and_unzip_file
    fetch_call.return_value.__enter__.return_value = BytesIO(b"")
    monkeypatch.setattr(fetch_load_transmittals, 'load_from_csv', Mock())
    monkeypatch.setattr(fetch_load_transmittals, 'save_batches', Mock())
    monkeypatch.setattr(fetch_load_transmittals, 'Agency', Mock())
    call_command(
        'fetch_load_transmittals',
        '--year', '2014', '2017',
        '--replace',
    )

    assert fetch_call.call_count == 2
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    assert '2014' in called_urls[0]
    assert '2017' in called_urls[1]

    assert fetch_load_transmittals.save_batches.call_count == 2
    replace = fetch_load_transmittals.save_batches.call_args[0][2]
    assert replace


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_handle_404(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_transmittals, 'Agency', Mock())
    monkeypatch.setattr(
        fetch_load_transmittals, 'fetch_and_unzip_file', MagicMock())
    monkeypatch.setattr(fetch_load_transmittals, 'logger', Mock())
    fetch_call = fetch_load_transmittals.fetch_and_unzip_file
    fetch_call.return_value.__enter__.side_effect = exception
    call_command('fetch_load_transmittals', '--year', '2013', '2015')

    assert fetch_call.return_value.__enter__.call_count == 2
    assert fetch_load_transmittals.logger.exception.call_count == 2
