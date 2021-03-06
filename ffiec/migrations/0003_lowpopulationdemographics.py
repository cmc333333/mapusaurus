# Generated by Django 2.1.4 on 2019-01-12 17:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('geo', '0001_squashed_0018_auto_20181229_0439'),
        ('ffiec', '0002_auto_20190101_1925'),
    ]

    operations = [
        migrations.CreateModel(
            name='LowPopulationDemographics',
            fields=[
                ('composite_key', models.CharField(max_length=6, primary_key=True, serialize=False)),
                ('year', models.PositiveSmallIntegerField(db_index=True)),
                ('median_family_income', models.PositiveIntegerField()),
                ('median_household_income', models.PositiveIntegerField()),
                ('ffiec_est_med_fam_income', models.PositiveIntegerField(help_text='FFIEC Estimated Median Family Income')),
                ('state', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='low_pop_demographics', to='geo.State')),
            ],
        ),
    ]
