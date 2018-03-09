# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-03-09 03:58
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('geo', '0007_auto_20180222_1416'),
    ]

    operations = [migrations.RunSQL(
        """ CREATE INDEX geo_city_search
            ON geo_geo(year, name)
            WHERE geo_type = 3
        """,
        """ DROP INDEX geo_city_search """,
    )]
