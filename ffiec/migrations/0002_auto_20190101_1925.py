# Generated by Django 2.1.4 on 2019-01-01 19:25

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ffiec', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='tractdemographics',
            old_name='non_hispanic',
            new_name='non_hispanic_white',
        ),
        migrations.RenameField(
            model_name='tractdemographics',
            old_name='occupied',
            new_name='single_family_homes',
        ),
        migrations.RenameField(
            model_name='tractdemographics',
            old_name='owner_occupied',
            new_name='single_family_occupied',
        ),
        migrations.RemoveField(
            model_name='tractdemographics',
            name='households_with_employment',
        ),
        migrations.RemoveField(
            model_name='tractdemographics',
            name='public_assistance',
        ),
        migrations.RemoveField(
            model_name='tractdemographics',
            name='self_employed_households',
        ),
    ]
