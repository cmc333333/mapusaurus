# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2018-12-29 04:44
from __future__ import unicode_literals
from typing import List

import django.contrib.gis.db.models.fields
import django.contrib.postgres.operations
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    replaces = [('geo', '0001_initial'), ('geo', '0002_auto_20160219_2009'), ('geo', '0003_auto_20160222_1706'), ('geo', '0004_auto_20160222_2155'), ('geo', '0005_auto_20180214_0325'), ('geo', '0006_auto_20180218_1817'), ('geo', '0007_auto_20180222_1416'), ('geo', '0008_auto_20180309_0358'), ('geo', '0009_auto_20180311_2332'), ('geo', '0010_censustract_tractfeature'), ('geo', '0011_auto_20180318_0143'), ('geo', '0012_auto_20180318_1605'), ('geo', '0013_auto_20180319_0331'), ('geo', '0014_auto_20180403_0127'), ('geo', '0015_auto_20180404_0412'), ('geo', '0016_auto_20181209_1800'), ('geo', '0017_auto_20181218_0321'), ('geo', '0018_auto_20181229_0439')]

    initial = True

    dependencies: List[str] = []

    operations = [
        django.contrib.postgres.operations.TrigramExtension(
        ),
        migrations.RunSQL(
            sql='CREATE EXTENSION IF NOT EXISTS btree_gin',
        ),
        migrations.CreateModel(
            name='CoreBasedStatisticalArea',
            fields=[
                ('name', models.CharField(max_length=64)),
                ('geom', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('interior_lat', models.FloatField()),
                ('interior_lon', models.FloatField()),
                ('min_lat', models.FloatField()),
                ('max_lat', models.FloatField()),
                ('min_lon', models.FloatField()),
                ('max_lon', models.FloatField()),
                ('geoid', models.CharField(max_length=5, primary_key=True, serialize=False, validators=[django.core.validators.RegexValidator('\\d{5}')])),
                ('metro', models.BooleanField()),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='County',
            fields=[
                ('name', models.CharField(max_length=64)),
                ('geom', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('interior_lat', models.FloatField()),
                ('interior_lon', models.FloatField()),
                ('min_lat', models.FloatField()),
                ('max_lat', models.FloatField()),
                ('min_lon', models.FloatField()),
                ('max_lon', models.FloatField()),
                ('geoid', models.CharField(max_length=5, primary_key=True, serialize=False, validators=[django.core.validators.RegexValidator('\\d{5}')])),
                ('county_only', models.CharField(max_length=3, validators=[django.core.validators.RegexValidator('\\d{3}')])),
                ('cbsa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='geo.CoreBasedStatisticalArea')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='State',
            fields=[
                ('name', models.CharField(max_length=64)),
                ('geom', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('interior_lat', models.FloatField()),
                ('interior_lon', models.FloatField()),
                ('min_lat', models.FloatField()),
                ('max_lat', models.FloatField()),
                ('min_lon', models.FloatField()),
                ('max_lon', models.FloatField()),
                ('geoid', models.CharField(choices=[('01', 'Alabama'), ('02', 'Alaska'), ('04', 'Arizona'), ('05', 'Arkansas'), ('06', 'California'), ('08', 'Colorado'), ('09', 'Connecticut'), ('10', 'Delaware'), ('11', 'District of Columbia'), ('12', 'Florida'), ('13', 'Georgia'), ('15', 'Hawaii'), ('16', 'Idaho'), ('17', 'Illinois'), ('18', 'Indiana'), ('19', 'Iowa'), ('20', 'Kansas'), ('21', 'Kentucky'), ('22', 'Louisiana'), ('23', 'Maine'), ('24', 'Maryland'), ('25', 'Massachusetts'), ('26', 'Michigan'), ('27', 'Minnesota'), ('28', 'Mississippi'), ('29', 'Missouri'), ('30', 'Montana'), ('31', 'Nebraska'), ('32', 'Nevada'), ('33', 'New Hampshire'), ('34', 'New Jersey'), ('35', 'New Mexico'), ('36', 'New York'), ('37', 'North Carolina'), ('38', 'North Dakota'), ('39', 'Ohio'), ('40', 'Oklahoma'), ('41', 'Oregon'), ('42', 'Pennsylvania'), ('44', 'Rhode Island'), ('45', 'South Carolina'), ('46', 'South Dakota'), ('47', 'Tennessee'), ('48', 'Texas'), ('49', 'Utah'), ('50', 'Vermont'), ('51', 'Virginia'), ('53', 'Washington'), ('54', 'West Virginia'), ('55', 'Wisconsin'), ('56', 'Wyoming'), ('60', 'American Samoa'), ('66', 'Guam'), ('69', 'Northern Mariana Islands'), ('72', 'Puerto Rico'), ('78', 'Virgin Islands')], max_length=2, primary_key=True, serialize=False)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Tract',
            fields=[
                ('name', models.CharField(max_length=64)),
                ('geom', django.contrib.gis.db.models.fields.MultiPolygonField(srid=4326)),
                ('interior_lat', models.FloatField()),
                ('interior_lon', models.FloatField()),
                ('min_lat', models.FloatField()),
                ('max_lat', models.FloatField()),
                ('min_lon', models.FloatField()),
                ('max_lon', models.FloatField()),
                ('geoid', models.CharField(max_length=11, primary_key=True, serialize=False, validators=[django.core.validators.RegexValidator('\\d{11}')])),
                ('tract_only', models.CharField(max_length=6, validators=[django.core.validators.RegexValidator('\\d{6}')])),
                ('county', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='geo.County')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='county',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='geo.State'),
        ),
        migrations.AlterField(
            model_name='county',
            name='cbsa',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='geo.CoreBasedStatisticalArea'),
        ),
    ]
