# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-03-17 16:46
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geo', '0009_auto_20180311_2332'),
    ]

    operations = [
        migrations.CreateModel(
            name='CensusTract',
            fields=[
                ('geoid', models.CharField(max_length=11, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=64)),
                ('state', models.PositiveSmallIntegerField()),
                ('county', models.PositiveSmallIntegerField()),
                ('tract', models.PositiveIntegerField()),
                ('geom', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('interior_lat', models.FloatField()),
                ('interior_lon', models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name='TractFeature',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('field_name', models.CharField(max_length=64)),
                ('value_field', models.CharField(max_length=64)),
            ],
        ),
    ]
