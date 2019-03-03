from django.db import connection, models


class MaterializedView(models.Model):
    class Meta:
        abstract = True
        managed = False

    @classmethod
    def rebuild_all(cls):
        with connection.cursor() as cursor:
            cursor.execute(f"REFRESH MATERIALIZED VIEW {cls._meta.db_table}")
