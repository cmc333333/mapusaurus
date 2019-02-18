import factory
from faker import Faker

from respondents.models import Agency, Institution, ZipcodeCityStateYear


class AgencyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Agency

    hmda_id = factory.Faker("pyint")
    acronym = factory.Faker("pystr", min_chars=3, max_chars=10)
    full_name = factory.Faker("company")


class ZipcodeCityStateYearFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ZipcodeCityStateYear

    zip_code = factory.Faker("zipcode")
    city = factory.Faker("city")
    state = factory.Faker("state_abbr")
    year = factory.Faker("year")


class InstitutionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Institution

    year = factory.Faker("year")
    respondent_id = factory.Faker("numerify", text="#" * 10)
    institution_id = factory.Faker("numerify", text="#" * 15)
    tax_id = factory.Faker("numerify", text="#" * 10)
    name = factory.Faker("company")
    mailing_address = factory.Faker("street_address")
    zip_code = factory.SubFactory(ZipcodeCityStateYearFactory)
    assets = factory.Faker("pyint")
    rssd_id = factory.Faker("numerify", text="#" * 10)
    num_loans = factory.Faker("pyint")

    @factory.lazy_attribute
    def agency(self):
        hmda_id = Faker().pyint()
        agency = Agency.objects.filter(hmda_id=hmda_id).first()
        return agency or AgencyFactory(hmda_id=hmda_id)
