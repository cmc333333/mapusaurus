# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2018-12-29 04:39
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('respondents', '0013_auto_20181113_2323'),
    ]

    operations = [
        migrations.AlterField(
            model_name='institution',
            name='non_reporting_parent',
            field=models.ForeignKey(blank=True, help_text='Non-HMDA reporting parent', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='respondents.ParentInstitution'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='parent',
            field=models.ForeignKey(blank=True, help_text='The parent institution', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='respondents.Institution'),
        ),
        migrations.AlterField(
            model_name='institution',
            name='top_holder',
            field=models.ForeignKey(blank=True, help_text='The company at the top of the ownership chain.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='descendants', to='respondents.ParentInstitution'),
        ),
    ]
