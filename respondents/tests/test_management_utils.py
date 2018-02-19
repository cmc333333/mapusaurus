from io import BytesIO
from zipfile import ZipFile

import requests_mock

from respondents.management import utils


def test_fetch_and_unzip_file():
    content = BytesIO()
    with ZipFile(content, 'w') as archive:
        with archive.open('contents.txt', 'w') as contained_file:
            contained_file.write(b'Some contents')

    with requests_mock.mock() as api:
        api.get(requests_mock.ANY, content=content.getvalue())
        url = 'http://example.com/something.zip'
        with utils.fetch_and_unzip_file(url) as unzipped:
            assert unzipped.read() == b'Some contents'
