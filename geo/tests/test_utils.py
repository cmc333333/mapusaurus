from geo.utils import check_bounds


def test_check_bounds():
    assert check_bounds('100', '100', '100', '') is None
    assert check_bounds('-100', '100', '200', 'asdf') is None
    expected_bounds = (
        float('10.0'),
        float('40.1234'),
        float('20.20'),
        float('-10.123456'),
    )
    actual_bounds = check_bounds('10.0', '-10.123456', '20.20', '40.1234')
    assert actual_bounds == expected_bounds
