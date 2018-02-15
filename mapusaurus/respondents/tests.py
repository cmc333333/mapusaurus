import json
import os
from tempfile import NamedTemporaryFile

from django.core.management import call_command
from django.core.urlresolvers import reverse
from django.test import TestCase
from mock import Mock, patch
from model_mommy import mommy

from geo.models import Geo
from hmda.models import HMDARecord
from respondents import views, zipcode_utils
from respondents.models import Agency, Institution, ZipcodeCityStateYear
from respondents.management.commands import load_reporter_panel
from respondents.management.commands import load_transmittal

class ZipcodeUtilsTests(TestCase):
    def test_createzipcode(self):
        ZipcodeCityStateYear.objects.all().delete()
        zipcode_utils.create_zipcode('20852', 'Rockville', 'MD', '2013')

        results = ZipcodeCityStateYear.objects.filter(state='MD')
        self.assertEqual(1, len(results))

        self.assertEqual(results[0].zip_code, 20852)
        self.assertEqual(results[0].city, 'Rockville')
        self.assertEqual(results[0].state, 'MD')
        self.assertEqual(results[0].year, 2013)


    def test_duplicate_entries(self):
        """ We insert a duplicate entry, and check that it wasn't in fact
        duplicated. """
        zipcode_utils.create_zipcode('20852', 'Rockville', 'MD','2013')
        results = ZipcodeCityStateYear.objects.filter(state='MD')
        self.assertEqual(1, len(results))


class ReporterPanelLoadingTests(TestCase):
    def test_parseline(self):
        reporter_line = "201400000555471                                                                   0312328543920FIRST FAKE BK NA                                                      TERRE HAUTE              CA                    0001208595FIRST FC                      TERRE HAUTE              CAUNITED STATES                           0000693345001234000018"
        reporter_row = load_reporter_panel.parse_line(reporter_line)
        self.assertEqual('2014', reporter_row.year)
        self.assertEqual('0000055547', reporter_row.respondent_id)
        self.assertEqual(1, reporter_row.agency_code)
        self.assertEqual('', reporter_row.parent_id)


class LoadTransmittalTests(TestCase):
    fixtures = ['agency']

    def test_handle(self):
        with NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"2013\t0000055547\t1\tTAXIDHERE\tFIRST FAKE BK NA\t"
                      b"1122 S 3RD ST\tTERRE HAUTE\tCA\t90210\t"
                      b"FIRST FAKE CORPORATION\tONE ADDR\tTERRE HAUTE\tCA\t"
                      b"90210\tFIRST FAKE BK NA\tTERRE HAUTE\tCA\t121212\t0\t"
                      b"3\t3657\tN")
            tmp.close()

            call_command('load_transmittal', tmp.name)
        os.remove(tmp.name)

        query = Institution.objects.all()
        self.assertEqual(query.count(), 1)
        inst = query[0]
        self.assertEqual(inst.name, 'FIRST FAKE BK NA')
        self.assertEqual(inst.respondent_id, '0000055547')
        self.assertEqual(inst.agency_id, 1)
        self.assertEqual(inst.assets, 121212)

class LenderHierarchyTest(TestCase):
    fixtures = ['agency', 'fake_respondents', 'fake_hierarchy']

    def test_get_lender_hierarchy(self):
        """Case: Institution has no hierarchy"""
        institution = Institution.objects.filter(institution_id="11000000002").first()
        hierarchy_list = institution.get_lender_hierarchy(False, False, 2013)
        self.assertEqual(len(hierarchy_list), 0) 
        
        """Case: Institution has no hierarchy but itself. 
           Returns itself when exclude=False; Returns empy list when exclude=True
        """
        institution = Institution.objects.filter(institution_id="91000000003").first()
        hierarchy_list = institution.get_lender_hierarchy(False, False, 2013)
        self.assertEqual(len(hierarchy_list), 1)
        self.assertEqual(hierarchy_list[0].institution_id, "91000000003")
        hierarchy_list_exclude = institution.get_lender_hierarchy(True, False, 2013)
        self.assertEqual(len(hierarchy_list_exclude), 0)

        """Case: Institution has valid hierarchy and returns it""" 
        institution = Institution.objects.filter(institution_id="91000000001").first()
        hierarchy_list = institution.get_lender_hierarchy(False, False,2013)
        self.assertEqual(len(hierarchy_list), 3)
        hierarchy_list_exclude = institution.get_lender_hierarchy(True, False, 2013)
        self.assertEqual(len(hierarchy_list_exclude), 2)
        hierarchy_list_order = institution.get_lender_hierarchy(False, True, 2013)
        self.assertEqual(hierarchy_list_order[0].institution_id, "91000000001")
        hierarchy_list_exclude_order = institution.get_lender_hierarchy(True, True, 2013)
        self.assertEqual(hierarchy_list_exclude_order[0].institution_id, "91000000002")        
        self.assertEqual(len(hierarchy_list_exclude_order), 2)


class ViewTest(TestCase):
    fixtures = ['agency', 'fake_respondents', 'fake_hierarchy', 'fake_branches', 'fake_year']

    def fetch_search(self, query, **kwargs):
        return self.client.get(
            reverse('respondents:search_results'),
            dict(kwargs, format='json', q=query),
        ).json()

    def fetch_institutions(self, query, **kwargs):
        return self.fetch_search(query, **kwargs)['institutions']
 
    def test_branch_locations(self):
        resp = self.client.get(reverse('branchLocations'), 
            {'lender':'91000000001',
            'neLat':'1',
            'neLon':'1',
            'swLat':'0',
            'swLon':'0'})
        resp = json.loads(resp.content)
        self.assertEquals('91000000001', resp['features'][0]['properties']['institution_id'])
        self.assertEquals('Dev Test Branch 2', resp['features'][0]['properties']['name'])
        self.assertEquals('91000000001', resp['features'][1]['properties']['institution_id'])
        self.assertEquals('Dev Test Branch 1', resp['features'][1]['properties']['name'])

    def test_select_metro(self):
        results = self.client.get(
            reverse('respondents:select_metro',
                    kwargs={'agency_id': '0', 'respondent': '0987654321', 'year': 2013}))
        self.assertEqual(404, results.status_code)

        zipcode = ZipcodeCityStateYear.objects.create(
            zip_code=12345, city='City', state='IL', year=1234)
        inst = Institution.objects.create(
            year=1234, respondent_id='9879879870', agency=Agency.objects.get(pk=9),
            tax_id='1111111111', name='Institution', mailing_address='mail',
            zip_code=zipcode)

        results = self.client.get(
            reverse('respondents:select_metro',
                    kwargs={'agency_id': '9', 'respondent': '9879879870', 'year': 1234}))
        self.assertEqual(200, results.status_code)

        inst.delete()
        zipcode.delete()

    def test_search_empty(self):
        a10 = mommy.make(Institution, name='AAAAA', year=2010)
        mommy.make(HMDARecord, institution_id=a10.institution_id)

        result = self.client.get(
            reverse('respondents:search_results'), {'format': 'json'}
        ).json()['institutions']
        self.assertEqual(result, [])

        self.assertEqual(self.fetch_institutions('', year='2010'), [])
        self.assertEqual(self.fetch_institutions('     ', year=''), [])

    def test_search_requires_hmda(self):
        a10 = mommy.make(Institution, name='AAAAA', year=2010)
        mommy.make(Institution, name='AAAAA AAAAA', year=2010)
        mommy.make(HMDARecord, institution_id=a10.institution_id)
        self.assertEqual(len(self.fetch_institutions('aaaaa', year='2010')), 1)

    def test_search_name(self):
        bank1 = mommy.make(Institution, name='Some Bank', year=2013)
        mommy.make(HMDARecord, institution_id=bank1.institution_id)
        bank2 = mommy.make(Institution, name='Bank & Loan', year=2013)
        mommy.make(HMDARecord, institution_id=bank2.institution_id)

        self.assertEqual(len(self.fetch_institutions('Bank', year='2013')), 2)
        self.assertEqual(len(self.fetch_institutions('Loan', year='2013')), 1)

    def test_search_trigram(self):
        bank = mommy.make(Institution, name='This is a bank', year=2013)
        mommy.make(HMDARecord, institution_id=bank.institution_id)
        self.assertEqual(
            len(self.fetch_institutions('that bank', year='2013')),
            1,
        )
        self.assertEqual(self.fetch_institutions('xxxx', year='2013'), [])

    def test_search_id(self):
        bank = mommy.make(
            Institution,
            agency_id=3,
            institution_id='201331234543210',
            name='Some Bank',
            respondent_id='123454321',
            year=2013,
        )
        mommy.make(HMDARecord, institution_id=bank.institution_id)

        self.assertEqual(
            self.fetch_institutions(bank.respondent_id, year='2013'),
             [],
        )

        bank.respondent_id='1234543210'     # now ten chars
        bank.save()
        self.assertEqual(
            len(self.fetch_institutions(bank.respondent_id, year='2013')),
            1,
        )

        for q in ('1234543210', 'Some Bank (31234543210)'):
            self.assertEqual(len(self.fetch_institutions(q, year='2013')), 1)

    def test_search_sort(self):
        bank1 = mommy.make(Institution, name='aaa', assets=1111, year=2013)
        mommy.make(HMDARecord, institution_id=bank1.institution_id)
        mommy.make(HMDARecord, institution_id=bank1.institution_id)
        bank2 = mommy.make(Institution, name='aaa bbb', assets=2222, year=2013)
        mommy.make(HMDARecord, institution_id=bank2.institution_id)

        results = self.fetch_institutions('aaa', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa', 'aaa bbb'])

        results = self.fetch_institutions(
            'aaa', sort='another-sort', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa', 'aaa bbb'])

        results = self.fetch_institutions('aaa', sort='assets', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa', 'aaa bbb'])
        results = self.fetch_institutions('aaa', sort='-assets', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa bbb', 'aaa'])
        results = self.fetch_institutions('aaa', sort='num_loans', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa bbb', 'aaa'])
        results = self.fetch_institutions('aaa', sort='-num_loans', year='2013')
        self.assertEqual([r['name'] for r in results], ['aaa', 'aaa bbb'])

    def test_search_pagination(self):
        for _ in range(10):
            bank = mommy.make(Institution, name='ccc', year=2013)
            mommy.make(HMDARecord, institution_id=bank.institution_id)
        # page number should default to 1
        results = self.fetch_search('ccc', num_results='2', year='2013')
        self.assertEqual(results['page_num'], 1)

        results = self.fetch_search(
            'ccc', num_results='2', page='5', year='2013')
        self.assertEqual(results['page_num'], 5)
        self.assertEqual(results['next_page'], 0)
        self.assertEqual(results['prev_page'], 4)

        results = self.fetch_search(
            'ccc', num_results='2', page='str', year='2013')
        self.assertEqual(results['page_num'], 1)

    def test_search_num_results(self):
        for _ in range(30):
            bank = mommy.make(Institution, name='ddd', year=2013)
            mommy.make(HMDARecord, institution_id=bank.institution_id)
        results = self.fetch_search('ddd', year='2013')
        # number of results should default to 25
        self.assertEqual(results['num_results'], 25)

        results = self.fetch_search('ddd', num_results='10', year='2013')
        self.assertEqual(results['num_results'], 10)

        results = self.fetch_search('ddd', num_results='str', year='2013')
        self.assertEqual(results['num_results'], 25)
