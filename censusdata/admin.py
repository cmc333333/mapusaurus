from typing import List

from django.contrib import admin

from censusdata.models import (
    Census2010Age, Census2010HispanicOrigin, Census2010Households,
    Census2010Race, Census2010RaceStats, Census2010Sex,
)


class Census2010RaceAdmin(admin.ModelAdmin):
    actions = None


class Census2010HispanicOriginAdmin(admin.ModelAdmin):
    readonly_fields: List[str] = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions


# Register your models here.
admin.site.register(Census2010Race, Census2010RaceAdmin)
admin.site.register(Census2010HispanicOrigin, Census2010HispanicOriginAdmin)
admin.site.register(Census2010Sex)
admin.site.register(Census2010Age)
admin.site.register(Census2010RaceStats)
admin.site.register(Census2010Households)
