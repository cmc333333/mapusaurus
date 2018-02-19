from contextlib import contextmanager
from io import BytesIO
from zipfile import ZipFile

import requests


@contextmanager
def fetch_and_unzip_file(url: str):
    response = requests.get(url, stream=True, timeout=120)
    response.raise_for_status()
    resp_buffer = BytesIO(response.content)
    with ZipFile(resp_buffer) as archive:
        file_name = archive.namelist().pop()
        with archive.open(file_name) as unzipped_file:
            yield unzipped_file
