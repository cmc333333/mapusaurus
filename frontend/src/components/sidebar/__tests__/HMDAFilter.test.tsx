import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import HMDAFilter, { ExistingFilter } from "../HMDAFilter";

describe("<ExistingFilter />", () => {
  it("renders the correct name", () => {
    const rendered = shallow(
      <ExistingFilter id="abc" name="NameName" removeFn={jest.fn()} />,
    );
    expect(rendered.text()).toMatch("NameName");
  });

  it("calls the remove fn when clicked", () => {
    const removeFn = jest.fn();
    const rendered = shallow(
      <ExistingFilter id="abc" name="NameName" removeFn={removeFn} />,
    ).find(glamorous.A);
    rendered.simulate("click", { preventDefault: jest.fn() });
    expect(removeFn).toHaveBeenCalledWith("abc");
  });
});

describe("<HMDAFilter />", () => {
  it("includes the title", () => {
    const titleEl = shallow(
      <HMDAFilter
        addFn={jest.fn()}
        items={[]}
        removeFn={jest.fn()}
        searchFn={jest.fn()}
        title="Some Title"
      />,
    ).find(glamorous.H3);
    expect(titleEl.children().text()).toMatch("Some Title");
  });

  it("includes an Autocomplete", () => {
    const addFn = jest.fn();
    const searchFn = jest.fn((value, year) => [value, year]);
    const autocomplete = shallow(
      <HMDAFilter
        addFn={addFn}
        items={[]}
        removeFn={jest.fn()}
        searchFn={searchFn}
        title="Title Here"
      />,
    ).find("Autocomplete");
    const props = autocomplete.props() as any;
    expect(props.fetchFn("input")).toEqual(["input", 2016]);
    expect(props.setValue).toBe(addFn);
    expect(props.toValue({ name: "eman" })).toBe("eman");
    expect(props.toValue({})).toBe("");
  });

  it("includes an ExistingFilter per item", () => {
    const items = [
      { id: "abc", name: "ABC" },
      { id: "111", name: "one" },
      { id: "222", name: "zZz" },
    ];
    const removeFn = jest.fn();
    const lis = shallow(
      <HMDAFilter
        addFn={jest.fn()}
        items={items}
        removeFn={removeFn}
        searchFn={jest.fn()}
        title="Title Here"
      />,
    ).find(ExistingFilter);
    expect(lis).toHaveLength(3);
    lis.map(li => expect(li.prop("removeFn")).toBe(removeFn));
    expect(lis.at(1).prop("id")).toBe("111");
    expect(lis.at(2).prop("name")).toBe("zZz");
  });
});
