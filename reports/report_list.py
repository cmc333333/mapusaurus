from typing import Callable, NamedTuple

from django.http import HttpRequest
from django.utils.text import slugify
from rest_framework.response import Response

from reports.views.actions import approvals, denials
from reports.views.applicants import applications, originations
from reports.views.demographics import demographics


class Report(NamedTuple):
    label: str
    fn: Callable[[HttpRequest], Response]

    @property
    def slug(self):
        return slugify(self.label)


report_list = (
    Report('Population Demographics', demographics),
    Report('Applications', applications),
    Report('Originations', originations),
    Report('Approvals', approvals),
    Report('Denials', denials),
)
