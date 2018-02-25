import pytest
from django.core.management import call_command

from respondents.models import Institution


@pytest.mark.usefixtures('load_agencies')
def test_get_lender_hierarchy():
    """Case: Institution has no hierarchy"""
    call_command('loaddata', 'fake_respondents', 'fake_hierarchy')
    institution = Institution.objects.filter(
        institution_id="201311000000002").first()
    hierarchy_list = institution.get_lender_hierarchy(False, False, 2013)
    assert len(hierarchy_list) == 0

    """Case: Institution has no hierarchy but itself.
       Returns itself when exclude=False; Returns empy list when exclude=True
    """
    institution = Institution.objects.filter(
        institution_id="201391000000003").first()
    hierarchy_list = institution.get_lender_hierarchy(False, False, 2013)
    assert len(hierarchy_list) == 1
    assert hierarchy_list[0].institution_id == "201391000000003"
    hierarchy_list_exclude = institution.get_lender_hierarchy(
        True, False, 2013)
    assert len(hierarchy_list_exclude) == 0

    """Case: Institution has valid hierarchy and returns it"""
    institution = Institution.objects.filter(
        institution_id="201391000000001").first()
    hierarchy_list = institution.get_lender_hierarchy(False, False, 2013)
    assert len(hierarchy_list) == 3
    hierarchy_list_exclude = institution.get_lender_hierarchy(
        True, False, 2013)
    assert len(hierarchy_list_exclude) == 2
    hierarchy_list_order = institution.get_lender_hierarchy(False, True, 2013)
    assert hierarchy_list_order[0].institution_id == "201391000000001"
    hierarchy_list_exclude_order = institution.get_lender_hierarchy(
        True, True, 2013)
    assert hierarchy_list_exclude_order[0].institution_id == "201391000000002"
    assert len(hierarchy_list_exclude_order) == 2
