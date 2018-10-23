import { shallow } from "enzyme";
import glamorous from "glamorous";
import { Map, Set } from "immutable";
import * as React from "react";

import HMDAFilter from "../HMDAFilter";
import RemovableFilter from "../RemovableFilter";

describe("<HMDAFilter />", () => {
  it("includes the title", () => {
    const formEl = shallow(
      <HMDAFilter
        existing={[]}
        fetchFn={jest.fn()}
        fieldName="county"
        label="Some Title"
        setValue={jest.fn()}
      />,
    ).find("FormInput");
    expect(formEl.prop("name")).toBe("Some Title");
  });

  it("includes an Autocomplete", () => {
    const fetchFn = jest.fn(str => [str, str]);
    const setValue = jest.fn();
    const autocomplete = shallow(
      <HMDAFilter
        existing={[]}
        fetchFn={fetchFn}
        fieldName="county"
        label="Title Here"
        setValue={setValue}
      />,
    ).find("Autocomplete");
    const props = autocomplete.props() as any;
    expect(props.fetchFn("input")).toEqual(["input", "input"]);
    expect(props.setValue).toBe(setValue);
  });

  it("includes an RemovableFilter per item", () => {
    const lis = shallow(
      <HMDAFilter
        existing={["a", "b", "c"]}
        fetchFn={jest.fn()}
        fieldName="metro"
        label="Title Here"
        setValue={jest.fn()}
      />,
    ).find(RemovableFilter);
    expect(lis).toHaveLength(3);
    expect(lis.at(0).props()).toMatchObject({ id: "a", filterName: "metro" });
    expect(lis.at(1).props()).toMatchObject({ id: "b", filterName: "metro" });
    expect(lis.at(2).props()).toMatchObject({ id: "c", filterName: "metro" });
  });
});
