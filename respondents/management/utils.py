import logging
from contextlib import contextmanager
from io import BytesIO
from typing import Iterator, List, Type, TypeVar
from zipfile import ZipFile

import requests

logger = logging.getLogger(__name__)


@contextmanager
def fetch_and_unzip_file(url: str):
    response = requests.get(url, stream=True, timeout=120)
    response.raise_for_status()
    resp_buffer = BytesIO(response.content)
    with ZipFile(resp_buffer) as archive:
        file_name = archive.namelist().pop()
        with archive.open(file_name) as unzipped_file:
            yield unzipped_file


T = TypeVar('T')


def batches(elts: Iterator[T], batch_size: int=100) -> Iterator[List[T]]:
    """Split an iterator of elements into an iterator of batches."""
    batch = []
    for elt in elts:
        if len(batch) == batch_size:
            yield batch
            batch = []
        batch.append(elt)
    yield batch


def save_batches(models: Iterator[T], model_class: Type[T],
                 replace: bool=False):
    """Save (optionally, replacing) batches of models."""
    count_saved, count_skipped = 0, 0
    for batch_idx, batch in enumerate(batches(models)):
        logger.info('Processing batch %s', batch_idx + 1)
        pks = {m.pk for m in batch}
        existing = model_class.objects.filter(pk__in=pks)
        if replace:
            existing.delete()
        else:
            existing_ids = set(existing.values_list('pk', flat=True))
            original_batch_size = len(batch)
            batch = [m for m in batch if m.pk not in existing_ids]
            count_skipped += original_batch_size - len(batch)
        model_class.objects.bulk_create(batch)
        count_saved += len(batch)
    logger.info(
        '%s new %s, %s skipped',
        count_saved, model_class._meta.verbose_name_plural, count_skipped,
    )
