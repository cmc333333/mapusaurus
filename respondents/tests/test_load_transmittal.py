from unittest.mock import Mock

import pytest
from django.core.management import call_command
from model_mommy import mommy

from respondents.management.commands import load_transmittal
from respondents.models import Institution


@pytest.mark.usefixtures("load_agencies")
def test_handle(tmpdir):
    data_file = tmpdir.join("somefile.dat")
    data_file.write(b"2013\t0000055547\t1\tTAXIDHERE\tFIRST FAKE BK NA\t"
                    b"1122 S 3RD ST\tTERRE HAUTE\tCA\t90210\t"
                    b"FIRST FAKE CORPORATION\tONE ADDR\tTERRE HAUTE\tCA\t"
                    b"90210\tFIRST FAKE BK NA\tTERRE HAUTE\tCA\t121212\t0\t"
                    b"3\t3657\tN")
    call_command("load_transmittal", str(data_file))

    query = Institution.objects.all()
    assert query.count() == 1
    inst = query[0]
    assert inst.name == "FIRST FAKE BK NA"
    assert inst.respondent_id == "0000055547"
    assert inst.agency_id == 1
    assert inst.assets == 121212


@pytest.mark.usefixtures("load_agencies")
def test_handle_replacements(monkeypatch, tmpdir):
    v1 = mommy.make(Institution)
    v2 = mommy.prepare(
        Institution,
        agency=v1.agency,
        institution_id=v1.institution_id,
        zip_code=v1.zip_code,
    )
    monkeypatch.setattr(load_transmittal, "load_from_csv", Mock())
    load_transmittal.load_from_csv.return_value = [v2]
    assert v1.name != v2.name

    data_file = tmpdir.join("somefile.dat")
    data_file.write(b"")
    call_command("load_transmittal", str(data_file))
    from_db = Institution.objects.get(institution_id=v1.institution_id)
    assert from_db.name == v1.name

    call_command("load_transmittal", str(data_file), "--replace")
    from_db = Institution.objects.get(institution_id=v1.institution_id)
    assert from_db.name == v2.name
