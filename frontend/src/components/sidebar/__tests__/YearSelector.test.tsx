import { shallow } from "enzyme";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";

import { setFilters } from "../../../store/Lar/Filters";
import { mapDispatchToProps, YearSelector } from "../YearSelector";

describe("<YearSelector />", () => {
  it("includes all of the years", () => {
    const years = [2012, 2010, 2009, 2005, 2004, 2002];
    const options = shallow(
      <YearSelector
        onChange={jest.fn()}
        year={2004}
        years={years}
      />,
    ).find("option");
    expect(options).toHaveLength(6);
    expect(options.map(o => o.prop("value"))).toEqual(years);
    expect(options.map(o => o.text())).toEqual(years.map(y => y.toString()));
  });

  it("selects the active one", () => {
    const rendered = shallow(
      <YearSelector
        onChange={jest.fn()}
        year={2004}
        years={[2005, 2004, 2003]}
      />,
    );
    expect(rendered.find(glamorous.Select).prop("value")).toBe(2004);
  });

  it("triggers the correct handler", () => {
    const onChange = jest.fn();
    const select = shallow(
      <YearSelector onChange={onChange} year={2004} years={[2004, 2003]} />,
    ).find(glamorous.Select);
    select.simulate("change");

    expect(onChange).toHaveBeenCalled();
  });
});

test("mapDispatchToProps()", () => {
  const dispatch = jest.fn();
  mapDispatchToProps(dispatch).onChange({ target: { value: "2001" } });

  expect(dispatch).toHaveBeenCalledTimes(2);
  expect(dispatch).toHaveBeenCalledWith(setFilters({
    county: Set<string>(),
    lender: Set<string>(),
    metro: Set<string>(),
    year: 2001,
  }));
});
