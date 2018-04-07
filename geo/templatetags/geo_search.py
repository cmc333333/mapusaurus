from django.template import Library
from us import STATES_AND_TERRITORIES

register = Library()


@register.inclusion_tag('geo/search.html')
def geo_search(institution_id, year):
    return {
        'institution_id': institution_id,
        'states': STATES_AND_TERRITORIES,
        'year': year,
    }
