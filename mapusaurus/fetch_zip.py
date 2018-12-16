from contextlib import contextmanager
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import BinaryIO, cast, Iterator
from zipfile import ZipFile

import requests


@contextmanager
def unzip_archive(buff: BinaryIO) -> Iterator[Path]:
    """Recursively unzips archives."""
    with ZipFile(buff) as archive:
        with TemporaryDirectory() as tmp_dir_str:
            tmp_dir = Path(tmp_dir_str)
            archive.extractall(tmp_dir)
            zips = [f for f in tmp_dir.iterdir() if f.suffix.lower() == ".zip"]
            if zips:
                with zips[0].open("rb") as inner_zip, \
                        unzip_archive(cast(BinaryIO, inner_zip)) as inner_dir:
                    yield inner_dir
            else:
                yield tmp_dir


@contextmanager
def fetch_and_unzip_dir(url: str) -> Iterator[Path]:
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    with unzip_archive(BytesIO(response.content)) as unzipped_path:
        yield unzipped_path


@contextmanager
def fetch_and_unzip_file(url: str):
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    resp_buffer = BytesIO(response.content)
    with ZipFile(resp_buffer) as archive:
        file_name = archive.namelist().pop()
        with archive.open(file_name) as unzipped_file:
            yield unzipped_file
