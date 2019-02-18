import factory

from reports.serializers import ReportInput


class ReportInputFactory(factory.Factory):
    class Meta:
        model = ReportInput

    county_ids = factory.LazyFunction(set)
    email = factory.Faker("email")
    lender_ids = factory.LazyFunction(set)
    lien_status = factory.LazyFunction(set)
    loan_purpose = factory.LazyFunction(set)
    metro_ids = factory.LazyFunction(set)
    owner_occupancy = factory.LazyFunction(set)
    property_type = factory.LazyFunction(set)
    year = factory.Faker("year")
