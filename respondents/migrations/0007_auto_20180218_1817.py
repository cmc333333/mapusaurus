# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-02-18 18:17
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('respondents', '0006_auto_20180212_0524'),
    ]

    operations = [
        migrations.AlterField(
            model_name='branch',
            name='lat',
            field=models.FloatField(help_text='y'),
        ),
        migrations.AlterField(
            model_name='branch',
            name='lon',
            field=models.FloatField(help_text='x'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='assets',
            field=models.BigIntegerField(default=0, help_text='Prior year reported assets in thousands of dollars'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='non_reporting_parent',
            field=models.ForeignKey(help_text='Non-HMDA reporting parent', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='respondents.ParentInstitution'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='parent',
            field=models.ForeignKey(help_text='The parent institution', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='respondents.Institution'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='rssd_id',
            field=models.CharField(help_text='From Reporter Panel. Id on the National Information Center repository', max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name='institution',
            name='top_holder',
            field=models.ForeignKey(help_text='The company at the top of the ownership chain.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='descendants', to='respondents.ParentInstitution'),
        ),
        migrations.AlterField(
            model_name='parentinstitution',
            name='rssd_id',
            field=models.CharField(help_text='Id on the National Information Center repository', max_length=10, null=True),
        ),
    ]