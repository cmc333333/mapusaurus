# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2018-12-29 04:39
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('mapping', '0002_auto_20180322_2222'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='layer',
            name='category',
        ),
        migrations.DeleteModel(
            name='Category',
        ),
        migrations.DeleteModel(
            name='Layer',
        ),
    ]
