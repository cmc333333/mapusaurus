from django.template import Library

register = Library()


@register.inclusion_tag('geo/search.html')
def geo_search(institution_id, year):
    return {
        'institution_id': institution_id,
        'year': year,
    }
