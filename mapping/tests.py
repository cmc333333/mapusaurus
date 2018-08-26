import json
from unittest.mock import Mock
from urllib.parse import unquote

import pytest
from django.core.urlresolvers import reverse
from django.test import TestCase
from model_mommy import mommy

from censusdata.models import Census2010Households
from geo.models import Geo
from hmda.models import HMDARecord, Year
from mapping import views
from mapping.models import Category, Layer
from respondents.models import Institution


class ViewTest(TestCase):
    fixtures = ['agency', 'fake_respondents']

    def setUp(self):
        self.respondent = Institution.objects.get(institution_id="1970922-333")
        self.metro = Geo.objects.create(
            geoid='12121', cbsa='12345', geo_type=Geo.METRO_TYPE,
            name='MetMetMet',
            geom="MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))", minlat=0.11,
            minlon=0.22, maxlat=1.33, maxlon=1.44, centlat=45.4545,
            centlon=67.6767, year='2012')
        self.year = Year.objects.create(hmda_year=2012, census_year=2010,
                                        geo_year=2011)

    def tearDown(self):
        self.metro.delete()

    def test_home(self):
        resp = self.client.get(reverse('map'))
        self.assertNotContains(resp, 'lender-info')
        resp = self.client.get(reverse('map'), {'some': 'thing'})
        self.assertNotContains(resp, 'lender-info')
        resp = self.client.get(reverse('map'), {'lender': 'thing'})
        self.assertNotContains(resp, 'lender-info')
        resp = self.client.get(reverse('map'), {'lender': '"1970922-33"89'})
        self.assertNotContains(resp, 'lender-info')

        resp = self.client.get(reverse('map'), {'lender': '1970922-333'})
        self.assertContains(resp, 'lender-info')
        self.assertContains(resp, 'Some Bank')
        self.assertContains(resp, '1970')
        self.assertContains(resp, 'Somewhere')
        self.assertContains(resp, 'NE')

    def test_center(self):
        resp = self.client.get(reverse('map'), {'metro': '12121'})
        self.assertContains(resp, '45.4545')
        self.assertContains(resp, '67.6767')
        self.assertContains(resp, '10')
        self.assertContains(resp, '12')
        self.assertContains(resp, 'MetMetMet')
        self.assertContains(resp, 'year')

    def test_make_download_url(self):
        self.assertEqual(
            "https://api.consumerfinance.gov/data/hmda/slice/hmda_lar.csv?"
            "%24where=&%24limit=0",
            views.make_download_url(None, None),
        )
        url = views.make_download_url(self.respondent, None)
        self.assertTrue('22-333' in url)
        self.assertTrue('1' in url)
        self.assertFalse('msamd' in url)

        url = views.make_download_url(self.respondent, self.metro)
        self.assertTrue('msamd="12345"' in unquote(url))

        div1 = Geo.objects.create(
            geoid='123123', geo_type=Geo.METDIV_TYPE, name='MetMetMet',
            geom="MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))", minlat=0.11,
            minlon=0.22, maxlat=1.33, maxlon=1.44, centlat=45.4545,
            centlon=67.6767, cbsa='12345', metdiv='98989', year='2012')
        div2 = Geo.objects.create(
            geoid='123124', geo_type=Geo.METDIV_TYPE, name='MetMetMet',
            geom="MULTIPOLYGON (((0 0, 0 1, 1 1, 0 0)))", minlat=0.11,
            minlon=0.22, maxlat=1.33, maxlon=1.44, centlat=45.4545,
            centlon=67.6767, cbsa='12345', metdiv='78787', year='2012')

        url = views.make_download_url(self.respondent, self.metro)
        self.assertFalse('12121' in url)
        self.assertTrue(
            'msamd+IN+("78787","98989")' in unquote(url)
            or 'msamd+IN+("98989","78787")' in unquote(url))

        div1.delete()
        div2.delete()


@pytest.mark.django_db
def test_add_layer_attrs():
    fruit = mommy.make(Category, name='Fruit', weight=0)
    veggie = mommy.make(Category, name='Veggie', weight=1)
    grain = mommy.make(Category, name='Grain', weight=2)
    mommy.make(Layer, category=fruit, name='Apple', weight=0,
               active_years=(2000, None), short_name='apple')
    mommy.make(Layer, category=fruit, name='Orange', weight=1,
               active_years=(2008, 2012), short_name='orange')
    mommy.make(Layer, category=fruit, name='Grape', weight=2,
               active_years=(2014, None), short_name='grape')
    mommy.make(Layer, category=veggie, name='Carrot', weight=0,
               active_years=(2001, 2003), short_name='carrot')
    mommy.make(Layer, category=veggie, name='Potato', weight=1,
               active_years=(2000, None), short_name='potato')
    mommy.make(Layer, category=grain, name='Bread', weight=0,
               active_years=(2012, None), short_name='bread')
    mommy.make(Layer, name='Background One', weight=0, interaction='base',
               active_years=(2000, None), short_name='bg1')
    mommy.make(Layer, name='Background Two', weight=1, interaction='base',
               active_years=(2000, None), short_name='bg2')

    context = {}
    views.add_layer_attrs(context, 2010)

    assert [c['name'] for c in context['layer_categories']] == [
        'Fruit', 'Veggie']  # Grain is missing as it has no relevant layers
    assert [l['name'] for l in context['layer_categories'][0]['layers']] == [
        'Apple', 'Orange']  # Grape is missing as it begins too late
    assert [l['name'] for l in context['layer_categories'][1]['layers']] == [
        'Potato']   # Carrot is missing it ends too early

    layer_attrs = json.loads(context['layer_attrs'])
    assert set(layer_attrs.keys()) == {'apple', 'orange', 'potato'}
    assert layer_attrs['apple']['name'] == 'Apple'

    assert [l['name'] for l in json.loads(context['base_layer_attrs'])] == [
        'Background One', 'Background Two']


@pytest.mark.django_db
def test_avg_per_thousand_households():
    metro = mommy.make(Geo, geo_type=Geo.METRO_TYPE, cbsa='12345', year=2010)
    in_metro1 = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa=metro.cbsa,
                           year=2010)
    in_metro2 = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa=metro.cbsa,
                           year=2010)
    in_metro_no_loans = mommy.make(Geo, geo_type=Geo.TRACT_TYPE,
                                   cbsa=metro.cbsa, year=2010)
    in_metro_wrong_year = mommy.make(Geo, geo_type=Geo.TRACT_TYPE,
                                     cbsa=metro.cbsa, year=2011)
    out_of_metro = mommy.make(Geo, geo_type=Geo.TRACT_TYPE, cbsa='notit',
                              year=2010)
    mommy.make(Census2010Households, total=1000, geoid=in_metro1)
    mommy.make(Census2010Households, total=3000, geoid=in_metro2)
    mommy.make(Census2010Households, total=5000, geoid=in_metro_wrong_year)
    mommy.make(Census2010Households, total=7000, geoid=out_of_metro)
    mommy.make(Census2010Households, total=11000, geoid=in_metro_no_loans)

    lender1, lender2 = mommy.make(Institution, _quantity=2)
    mommy.make(HMDARecord, geo=in_metro1, institution=lender1, _quantity=11)
    mommy.make(HMDARecord, geo=in_metro1, institution=lender2, _quantity=13)
    mommy.make(HMDARecord, geo=in_metro2, institution=lender1, _quantity=17)
    mommy.make(HMDARecord, geo=in_metro2, institution=lender2, _quantity=19)
    mommy.make(HMDARecord, geo=out_of_metro, institution=lender1, _quantity=23)
    mommy.make(HMDARecord, geo=out_of_metro, institution=lender2, _quantity=29)
    mommy.make(HMDARecord, geo=in_metro_wrong_year, institution=lender1,
               _quantity=31)
    mommy.make(HMDARecord, geo=in_metro_wrong_year, institution=lender2,
               _quantity=37)

    assert views.avg_per_thousand_households(lender1, metro) == (
        1000 * (11 + 17) / (1000 + 3000)
    )


@pytest.mark.django_db
def test_add_county_context_one():
    county = mommy.make(Geo, geo_type=Geo.COUNTY_TYPE, name='Somewhere',
                        centlat=1, centlon=2)
    mommy.make(Geo, geo_type=Geo.COUNTY_TYPE)
    context = {}
    views.add_county_attrs(context, county.pk)

    assert context['geography_names'] == 'Somewhere'
    assert context['map_center'] == {'centlat': 1, 'centlon': 2}


@pytest.mark.django_db
def test_add_county_context_multiple():
    county1 = mommy.make(Geo, geo_type=Geo.COUNTY_TYPE, name='Somewhere',
                         centlat=1, centlon=2)
    county2 = mommy.make(Geo, geo_type=Geo.COUNTY_TYPE, name='Else',
                         centlat=3, centlon=4)
    mommy.make(Geo, geo_type=Geo.COUNTY_TYPE)
    context = {}
    views.add_county_attrs(context, f'{county1.pk},{county2.pk}')

    assert context['geography_names'] == 'Else, Somewhere'
    assert context['map_center'] == {
        'centlat': (1 + 3) / 2, 'centlon': (2 + 4) / 2}


@pytest.mark.django_db
def test_spa_contains_years(monkeypatch):
    monkeypatch.setattr(views, "render", Mock())
    mommy.make(Year, hmda_year=2010, _quantity=3)
    mommy.make(Year, hmda_year=2011)
    mommy.make(Year, hmda_year=2013)

    views.single_page_app(Mock())
    context = views.render.call_args[0][2]
    assert json.loads(context['SPA_CONFIG'])['years'] == [2013, 2011, 2010]


@pytest.mark.django_db
def test_spa_contains_states(monkeypatch):
    monkeypatch.setattr(views, "render", Mock())
    views.single_page_app(Mock())
    context = views.render.call_args[0][2]
    states = json.loads(context["SPA_CONFIG"])["states"]
    assert len(states) >= 50
    assert {"abbr": "IL", "fips": "17", "name": "Illinois"} in states
    assert {"abbr": "NY", "fips": "36", "name": "New York"} in states
