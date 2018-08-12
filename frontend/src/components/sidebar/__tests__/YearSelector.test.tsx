import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { setYear } from "../../../store/LARLayer";
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
  const result = mapDispatchToProps(dispatch);
  result.onChange({ target: { value: "2001" } });

  expect(dispatch).toHaveBeenCalledWith(setYear(2001));
});
