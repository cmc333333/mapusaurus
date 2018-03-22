import json
from urllib.parse import unquote

import pytest
from django.core.urlresolvers import reverse
from django.test import TestCase
from mock import Mock, patch
from model_mommy import mommy

from hmda.models import Year
from geo.models import Geo
from mapping.models import Category, Layer
from mapping.views import add_layer_attrs, lookup_median, make_download_url
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
            make_download_url(None, None),
        )
        url = make_download_url(self.respondent, None)
        self.assertTrue('22-333' in url)
        self.assertTrue('1' in url)
        self.assertFalse('msamd' in url)

        url = make_download_url(self.respondent, self.metro)
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

        url = make_download_url(self.respondent, self.metro)
        self.assertFalse('12121' in url)
        self.assertTrue(
            'msamd+IN+("78787","98989")' in unquote(url)
            or 'msamd+IN+("98989","78787")' in unquote(url))

        div1.delete()
        div2.delete()

    @patch('mapping.views.LendingStats')
    @patch('mapping.views.calculate_median_loans')
    def test_lookup_median(self, calc, LendingStats):
        lender_str = self.respondent.institution_id
        # No lender
        self.assertEqual(None, lookup_median(None, None))
        # All of the US
        lookup_median(self.respondent, None)
        self.assertEqual(calc.call_args[0], (lender_str, None))
        # Entry in the db
        mock_obj = Mock()
        mock_obj.lar_median = 9898
        LendingStats.objects.filter.return_value.first.return_value = mock_obj
        self.assertEqual(9898, lookup_median(self.respondent, self.metro))
        # No entry in db
        LendingStats.objects.filter.return_value.first.return_value = None
        lookup_median(self.respondent, self.metro)
        self.assertEqual(calc.call_args[0], (lender_str, self.metro))


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
    add_layer_attrs(context, 2010)

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
