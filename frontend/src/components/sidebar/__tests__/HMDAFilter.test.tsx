import { shallow } from "enzyme";
import glamorous from "glamorous";
import { Map, Set } from "immutable";
import * as React from "react";

import {
  LARFiltersFactory,
  LARLayerFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import { ExistingFilter, HMDAFilter, mergeProps } from "../HMDAFilter";

describe("<ExistingFilter />", () => {
  it("renders the correct name", () => {
    const rendered = shallow(
      <ExistingFilter name="NameName" onClick={jest.fn()} />,
    );
    expect(rendered.dive().text()).toMatch("NameName");
  });

  it("calls the remove fn when clicked", () => {
    const onClick = jest.fn();
    const rendered = shallow(
      <ExistingFilter name="" onClick={onClick} />,
    ).find(glamorous.A);
    rendered.simulate("click", { some: "stuff" });
    expect(onClick).toHaveBeenCalledWith({ some: "stuff" });
  });
});

describe("<HMDAFilter />", () => {
  it("includes the title", () => {
    const formEl = shallow(
      <HMDAFilter
        existing={[]}
        fetchFn={jest.fn()}
        label="Some Title"
        setValue={jest.fn()}
        toValue={jest.fn()}
      />,
    ).find("FormInput");
    expect(formEl.prop("name")).toBe("Some Title");
  });

  it("includes an Autocomplete", () => {
    const fetchFn = jest.fn(str => [str, str]);
    const [setValue, toValue] = [jest.fn(), jest.fn()];
    const autocomplete = shallow(
      <HMDAFilter
        existing={[]}
        fetchFn={fetchFn}
        label="Title Here"
        setValue={setValue}
        toValue={toValue}
      />,
    ).find("Autocomplete");
    const props = autocomplete.props() as any;
    expect(props.fetchFn("input")).toEqual(["input", "input"]);
    expect(props.setValue).toBe(setValue);
    expect(props.toValue).toBe(toValue);
  });

  it("includes an ExistingFilter per item", () => {
    const onClick = jest.fn();
    const existing = [
      { onClick, id: "a", name: "AName" },
      { onClick, id: "b", name: "BName" },
      { onClick, id: "c", name: "CName" },
    ];
    const lis = shallow(
      <HMDAFilter
        existing={existing}
        fetchFn={jest.fn()}
        label="Title Here"
        setValue={jest.fn()}
        toValue={jest.fn()}
      />,
    ).find(ExistingFilter);
    expect(lis).toHaveLength(3);
    expect(lis.at(0).prop("name")).toBe("AName");
    expect(lis.at(1).prop("name")).toBe("BName");
    expect(lis.at(2).prop("name")).toBe("CName");
  });
});

describe("mergeProps()", () => {
  it("transforms the existing filters", () => {
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({
        filters: LARFiltersFactory.build({}, {
          lenderSet: {
            options: Map([
              ["111", "OneOneOne"],
              ["222", "TwoTwoTwo"],
              ["333", "ThreeThreeThree"],
              ["444", "FourFourFour"],
            ]),
            selected: Set(["111", "333", "444"]),
          },
        }),
      }),
    });

    const { existing } = mergeProps(
      state,
      { dispatch: jest.fn() },
      { filterName: "lender", searchFn: jest.fn() },
    );

    expect(existing).toHaveLength(3);
    expect(existing[0]).toMatchObject({ id: "444", name: "FourFourFour" });
    expect(existing[1]).toMatchObject({ id: "111", name: "OneOneOne" });
    expect(existing[2]).toMatchObject({ id: "333", name: "ThreeThreeThree" });
  });

  it("creates an appropriate fetchFn", () => {
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({ year: 2004 }),
    });
    const searchFn = jest.fn();

    const { fetchFn } = mergeProps(
      state,
      { dispatch: jest.fn() },
      { searchFn, filterName: "county" },
    );
    fetchFn("some text");

    expect(searchFn).toHaveBeenCalledWith("some text", 2004);
  });

  it("sets an approproate label", () => {
    const { label } = mergeProps(
      StateFactory.build(),
      { dispatch: jest.fn() },
      { filterName: "metro", searchFn: jest.fn() },
    );
    expect(label).toBe("Metro");
  });
});
