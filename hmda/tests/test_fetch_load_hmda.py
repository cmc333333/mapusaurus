from unittest.mock import MagicMock, Mock

import pytest
import requests
from django.core.management import call_command
from freezegun import freeze_time

from hmda.management.commands import fetch_load_hmda


def test_handle_no_args(monkeypatch):
    monkeypatch.setattr(fetch_load_hmda, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_hmda.fetch_and_unzip_file
    monkeypatch.setattr(fetch_load_hmda, 'load_from_csv', Mock())
    monkeypatch.setattr(fetch_load_hmda, 'save_batches', Mock())
    with freeze_time('2018-01-01'):
        call_command('fetch_load_hmda')

    assert fetch_call.call_count == 5
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    for year in range(2013, 2018):
        assert any(str(year) in url for url in called_urls)

    assert fetch_load_hmda.load_from_csv.call_count == 5
    assert fetch_load_hmda.save_batches.call_count == 5
    replace = fetch_load_hmda.save_batches.call_args[0][2]
    assert not replace


def test_handle_specific_args(monkeypatch):
    monkeypatch.setattr(fetch_load_hmda, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_hmda.fetch_and_unzip_file
    monkeypatch.setattr(fetch_load_hmda, 'load_from_csv', Mock())
    monkeypatch.setattr(fetch_load_hmda, 'save_batches', Mock())
    call_command(
        'fetch_load_hmda',
        '--year', '2014', '2017',
        '--replace',
    )

    assert fetch_call.call_count == 2
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    assert '2014' in called_urls[0]
    assert '2017' in called_urls[1]

    assert fetch_load_hmda.save_batches.call_count == 2
    replace = fetch_load_hmda.save_batches.call_args[0][2]
    assert replace


@pytest.mark.parametrize('exception', (
    requests.exceptions.ConnectionError(),
    requests.exceptions.ConnectTimeout(),
    requests.exceptions.ReadTimeout(),
    requests.exceptions.HTTPError(),
))
def test_handle_404(monkeypatch, exception):
    monkeypatch.setattr(fetch_load_hmda, 'fetch_and_unzip_file', MagicMock())
    monkeypatch.setattr(fetch_load_hmda, 'logger', Mock())
    fetch_call = fetch_load_hmda.fetch_and_unzip_file
    fetch_call.return_value.__enter__.side_effect = exception
    call_command('fetch_load_hmda', '--year', '2013', '2015')

    assert fetch_call.return_value.__enter__.call_count == 2
    assert fetch_load_hmda.logger.exception.call_count == 2
