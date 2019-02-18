import factory

from geo.tests.factories import TractFactory
from hmda.models import LoanApplicationRecord
from respondents.tests.factories import InstitutionFactory


class LARFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = LoanApplicationRecord

    hmda_record_id = factory.Faker("numerify", text="#" * 23)
    as_of_year = factory.Faker("year")
    respondent_id = factory.Faker("numerify", text="#" * 10)
    agency_code = factory.Faker("numerify", text="#")
    loan_type = factory.Faker("random_element", elements=(1, 2, 3, 4))
    property_type = factory.Faker("random_element", elements="123")
    loan_purpose = factory.Faker("random_element", elements=(1, 2, 3))
    owner_occupancy = factory.Faker("random_element", elements=(1, 2, 3))
    loan_amount_000s = factory.Faker("random_int", min=5, max=999999)
    preapproval = factory.Faker("random_element", elements="123")
    action_taken = factory.Faker("random_element", elements=range(1, 9))
    applicant_ethnicity = factory.Faker("random_element", elements="12345")
    co_applicant_ethnicity = factory.Faker("random_element", elements="12345")
    applicant_race_1 = factory.Faker("random_element", elements="1234567")
    co_applicant_race_1 = factory.Faker("random_element", elements="12345678")
    applicant_sex = factory.Faker("random_element", elements=(1, 2, 3, 4))
    co_applicant_sex = factory.Faker(
        "random_element", elements=(1, 2, 3, 4, 5))
    applicant_income_000s = factory.Faker("random_int", min=10, max=100000)
    purchaser_type = factory.Faker("random_element", elements="0123456789")
    rate_spread = factory.Faker("numerify", text="###")
    hoepa_status = factory.Faker("random_element", elements="12")
    lien_status = factory.Faker("random_element", elements="1234")
    sequence_number = factory.Faker("numerify", text="#" * 8)
    application_date_indicator = "0"
    institution = factory.SubFactory(InstitutionFactory)
    tract = factory.SubFactory(TractFactory)


class NormalLARFactory(LARFactory):
    action_taken = factory.Faker("random_element", elements=(1, 2))
    applicant_ethnicity = factory.Faker("random_element", elements="12")
    applicant_race_1 = factory.Faker("random_element", elements="12345")
