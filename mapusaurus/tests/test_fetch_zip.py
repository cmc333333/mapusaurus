from io import BytesIO
from zipfile import ZipFile

import requests_mock

from mapusaurus import fetch_zip


def test_fetch_and_unzip_file():
    content = BytesIO()
    with ZipFile(content, 'w') as archive:
        with archive.open('contents.txt', 'w') as contained_file:
            contained_file.write(b'Some contents')

    with requests_mock.mock() as api:
        api.get(requests_mock.ANY, content=content.getvalue())
        url = 'http://example.com/something.zip'
        with fetch_zip.fetch_and_unzip_file(url) as unzipped:
            assert unzipped.read() == b'Some contents'


def test_unzip_archive_is_recursive():
    outer, middle, inner = BytesIO(), BytesIO(), BytesIO()
    with ZipFile(inner, "w") as archive:
        with archive.open("file1.txt", "w") as f:
            f.write(b"oneoneone")
        with archive.open("file2.txt", "w") as f:
            f.write(b"twotwotwo")
        with archive.open("file3.txt", "w") as f:
            f.write(b"threethree")

    with ZipFile(middle, "w") as archive:
        with archive.open("middlefile.txt", "w") as f:
            f.write(b"midmid")
        with archive.open("a_zip.zip", "w") as f:
            f.write(inner.getvalue())

    with ZipFile(outer, "w") as archive:
        with archive.open("zipzipzipzip.ZIP", "w") as f:
            f.write(middle.getvalue())
        with archive.open("outerfile.txt", "w") as f:
            f.write(b"outout")

    with fetch_zip.unzip_archive(outer) as dirpath:
        assert len(list(dirpath.iterdir()))
        with (dirpath / "file1.txt").open() as f:
            assert f.read() == "oneoneone"
        with (dirpath / "file2.txt").open() as f:
            assert f.read() == "twotwotwo"
        with (dirpath / "file3.txt").open() as f:
            assert f.read() == "threethree"
