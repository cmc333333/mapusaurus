from typing import Any, Callable, Iterator, List, Optional, Type, TypeVar
from typing_extensions import Protocol

from django.db import transaction

T = TypeVar('T')
FilterFn = Callable[[List["DjangoModel"]], List["DjangoModel"]]


class DjangoModel(Protocol):
    _meta: Any
    objects: Any

    @property
    def pk(self) -> int:
        pass


def batches(elts: Iterator[T], batch_size: int = 100) -> Iterator[List[T]]:
    """Split an iterator of elements into an iterator of batches."""
    batch: List[T] = []
    for elt in elts:
        if len(batch) == batch_size:
            yield batch
            batch = []
        batch.append(elt)
    yield batch


def save_batches(models: Iterator[DjangoModel], replace: bool = False,
                 filter_fn: Optional[FilterFn] = None, batch_size: int = 100):
    """Save (optionally, replacing) batches of models."""
    for batch_idx, batch in enumerate(batches(models, batch_size)):
        with transaction.atomic():
            if filter_fn:
                batch = filter_fn(batch)
            pks = {m.pk for m in batch}
            if not batch:
                continue

            model_class = batch[0].__class__
            existing = model_class.objects.filter(pk__in=pks)
            if replace:
                existing.delete()
            else:
                existing_ids = set(existing.values_list('pk', flat=True))
                batch = [m for m in batch if m.pk not in existing_ids]
            model_class.objects.bulk_create(batch)


def make_filter_fn(
        FkModel: Type[DjangoModel], fk_field: str = "pk") -> FilterFn:
    """Generate a save_batches-compatible filter function based on entries in
    the database."""
    def fn(batch: List[DjangoModel]) -> List[DjangoModel]:
        ids = set(
            FkModel.objects
            .filter(pk__in={getattr(m, fk_field) for m in batch})
            .values_list('pk', flat=True)
            .distinct()
        )
        return [m for m in batch if getattr(m, fk_field) in ids]
    return fn
