import logging
from contextlib import contextmanager
from io import BytesIO
from typing import Any, Iterator, List, Type, TypeVar
from typing_extensions import Protocol
from zipfile import ZipFile

import requests
from django.db import transaction

logger = logging.getLogger(__name__)
T = TypeVar('T')


class DjangoModel(Protocol):
    _meta: Any
    objects: Any

    @property
    def pk(self) -> int:
        pass


@contextmanager
def fetch_and_unzip_file(url: str):
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    resp_buffer = BytesIO(response.content)
    with ZipFile(resp_buffer) as archive:
        file_name = archive.namelist().pop()
        with archive.open(file_name) as unzipped_file:
            yield unzipped_file


def batches(elts: Iterator[T], batch_size: int = 100) -> Iterator[List[T]]:
    """Split an iterator of elements into an iterator of batches."""
    batch: List[T] = []
    for elt in elts:
        if len(batch) == batch_size:
            yield batch
            batch = []
        batch.append(elt)
    yield batch


def save_batches(models: Iterator[DjangoModel], model_class: Type[DjangoModel],
                 replace: bool = False, filter_fn=None, batch_size: int = 100,
                 log=True):
    """Save (optionally, replacing) batches of models."""
    count_saved, count_skipped = 0, 0
    for batch_idx, batch in enumerate(batches(models, batch_size)):
        with transaction.atomic():
            if log:
                logger.info(
                    'Processing batch %s (%s - %s)',
                    batch_idx + 1,
                    batch_idx * batch_size + 1,
                    batch_idx * batch_size + batch_size,
                )
            if filter_fn:
                batch = filter_fn(batch)
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
    if log:
        logger.info(
            '%s new %s, %s skipped',
            count_saved, model_class._meta.verbose_name_plural, count_skipped,
        )
