# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-03-18 01:43
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('geo', '0010_censustract_tractfeature'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='tractfeature',
            unique_together=set([('field_name', 'value_field')]),
        ),
        migrations.AlterIndexTogether(
            name='tractfeature',
            index_together=set([('field_name', 'value_field')]),
        ),
    ]