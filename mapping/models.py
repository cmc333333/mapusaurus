from django.contrib.postgres.fields.ranges import IntegerRangeField
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=64, primary_key=True)
    weight = models.SmallIntegerField()
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['weight']


class Layer(models.Model):
    short_name = models.CharField(max_length=32)
    category = models.ForeignKey(Category)
    name = models.CharField(max_length=64)
    weight = models.SmallIntegerField()
    layer_type = models.CharField(max_length=16, choices=(
        ('v4', 'Old Style (v4)'),
        ('short_name', 'Short Name'),
        ('api_style', 'Api Style (Modern)'),
    ))
    style_name = models.CharField(max_length=64)
    active_years = IntegerRangeField()

    class Meta:
        ordering = ['weight']
