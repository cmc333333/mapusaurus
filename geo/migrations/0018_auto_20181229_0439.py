# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2018-12-29 04:39
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('geo', '0017_auto_20181218_0321'),
    ]

    operations = [
        migrations.AlterField(
            model_name='county',
            name='cbsa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='geo.CoreBasedStatisticalArea'),
        ),
    ]
