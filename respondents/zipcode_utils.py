from respondents.models import ZipcodeCityStateYear


def create_zipcode(
        zip_code: str, city: str, state: str, year: int,
        ) -> ZipcodeCityStateYear:
    plus_four = ""
    if "-" in zip_code:
        zip_code, plus_four = zip_code.split("-")

    if not zip_code.isdigit():
        raise ValueError(f"Invalid zip code: {zip_code}")
    if plus_four and not plus_four.isdigit():
        raise ValueError(f"Invalid plus four: {plus_four}")

    model, _ = ZipcodeCityStateYear.objects.get_or_create(
        zip_code=int(zip_code),
        city=city,
        year=year,
        defaults={
            "plus_four": int(plus_four) if plus_four else None,
            "state": state,
        },
    )
    return model
