# Generated by Django 2.1.7 on 2019-02-18 22:50
from typing import List

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies: List[str] = [
    ]

    operations = [
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW reports_populationreport AS
            (SELECT
                year || county_id AS compound_id,
                year,
                county_id,
                SUM(persons) AS total,
                SUM(non_hispanic_white) AS white,
                SUM(hispanic_only) AS hispanic,
                SUM(black) AS black,
                SUM(asian) AS asian,
                SUM(persons - non_hispanic_white) AS minority,
                SUM(poverty) AS poverty
                FROM ffiec_tractdemographics d
                INNER JOIN geo_tract ON (tract_id = geoid)
                GROUP BY year, county_id
            )
            """,
            "DROP MATERIALIZED VIEW reports_populationreport",
        ),
        migrations.RunSQL(
            """
            CREATE INDEX reports_populationreport_idx
            ON reports_populationreport (year, county_id)
            """,
            "DROP INDEX reports_populationreport_idx",
        ),
    ]
