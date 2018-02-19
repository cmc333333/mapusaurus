from io import BytesIO
from unittest.mock import MagicMock, Mock
from zipfile import ZipFile

import pytest
import requests
import requests_mock
from django.core.management import call_command
from freezegun import freeze_time

from respondents.management.commands import fetch_load_transmittals


def test_fetch_and_unzip_file():
    content = BytesIO()
    with ZipFile(content, 'w') as archive:
        with archive.open('contents.txt', 'w') as contained_file:
            contained_file.write(b'Some contents')

    with requests_mock.mock() as api:
        api.get(requests_mock.ANY, content=content.getvalue())
        url = 'http://example.com/something.zip'
        with fetch_load_transmittals.fetch_and_unzip_file(url) as unzipped:
            assert unzipped.read() == b'Some contents'


def test_handle_no_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_transmittals, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_transmittals.fetch_and_unzip_file
    monkeypatch.setattr(fetch_load_transmittals, 'load_save_batches', Mock())
    monkeypatch.setattr(fetch_load_transmittals, 'Agency', Mock())
    with freeze_time('2018-01-01'):
        call_command('fetch_load_transmittals')

    assert fetch_call.call_count == 5
    called_urls = [call[0][0] for call in fetch_call.call_args_list]
    for year in range(2013, 2018):
        assert any(str(year) in url for url in called_urls)

    assert fetch_load_transmittals.load_save_batches.call_count == 5
    replace = fetch_load_transmittals.load_save_batches.call_args[0][2]
    assert not replace


def test_handle_specific_args(monkeypatch):
    monkeypatch.setattr(
        fetch_load_transmittals, 'fetch_and_unzip_file', MagicMock())
    fetch_call = fetch_load_transmittals.fetch_and_unzip_file
    monkeypatch.setattr(fetch_load_transmittals, 'load_save_batches', Mock())
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

    assert fetch_load_transmittals.load_save_batches.call_count == 2
    replace = fetch_load_transmittals.load_save_batches.call_args[0][2]
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