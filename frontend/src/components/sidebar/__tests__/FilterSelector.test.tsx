import { shallow } from "enzyme";
import glamorous from "glamorous";
import { Map, Set } from "immutable";
import * as React from "react";

import { LienStatus, setFilters } from "../../../store/Lar/Filters";
import { StateFactory } from "../../../testUtils/Factory";
import {
  FilterSelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../FilterSelector";

describe("<FilterSelector />", () => {
  const props = {
    label: "Some Stuff",
    nameMapping: { 1: "Stuff", 2: "Other", 3: "Things" },
    onChange: jest.fn(),
    value: Set(["1", "3"]),
  };
  const rendered = shallow(<FilterSelector {...props} />);

  it("includes an Option for only the associated filter configs", () => {
    const options = rendered.find("glamorous(option)");
    expect(options).toHaveLength(3);

    expect(options.at(0).dive().text()).toBe("Stuff");
    expect(options.at(0).prop("value")).toBe("1");

    expect(options.at(1).dive().text()).toBe("Other");
    expect(options.at(1).prop("value")).toBe("2");

    expect(options.at(2).dive().text()).toBe("Things");
    expect(options.at(2).prop("value")).toBe("3");
  });

  it("triggers the onChange", () => {
    const select = rendered.find(glamorous.Select);
    expect(props.onChange).not.toBeCalled();
    select.simulate("change");
    expect(props.onChange).toBeCalled();
  });
});

test("mapStateToProps() pulls the associated filter configs", () => {
  const state = StateFactory.build();
  state.lar.filters.ownerOccupancy = Set(["2", "3"]);

  const result = mapStateToProps(state, { filterId: "ownerOccupancy" });
  expect(result.nameMapping).toEqual({
    1: "Owner-occupied",
    2: "Not Owner-occupied",
    3: "N/A",
  });
  expect(result.value.sort()).toEqual(["2", "3"]);
});

test("mapDispatchToProps() triggers a setFilters", () => {
  const dispatch = jest.fn();
  mapDispatchToProps(dispatch, { filterId: "lienStatus" }).onChange({
    target: {
      options: [
        { selected: false, value: "1" },
        { selected: true, value: "2" },
        { selected: false, value: "3" },
        { selected: true, value: "4" },
      ],
    },
  });

  expect(dispatch).toHaveBeenCalledTimes(2);
  expect(dispatch.mock.calls[0]).toEqual([
    setFilters({ lienStatus: Set<LienStatus>(["2", "4"]) }),
  ]);
});
