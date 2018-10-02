import { shallow } from "enzyme";
import glamorous from "glamorous";
import { OrderedMap, Set } from "immutable";
import * as React from "react";

import { FilterValue, setFilters } from "../../../store/LARFilters";
import { StateFactory } from "../../../testUtils/Factory";
import {
  FilterSelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../FilterSelector";

describe("<FilterSelector />", () => {
  const filterConfig = {
    choices: OrderedMap([
      ["1", "Stuff"],
      ["2", "Other"],
      ["3", "Things"],
    ]),
    fieldName: "some_stuff",
    name: "Some Stuff",
  };
  const onChange = jest.fn();
  const rendered = shallow(
    <FilterSelector
      filterConfig={filterConfig}
      onChange={onChange}
      value={Set(["1", "3"])}
    />,
  );

  it("includes an Option for only the associated filter configs", () => {
    const options = rendered.find(glamorous.Option);
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
    expect(onChange).not.toBeCalled();
    select.simulate("change");
    expect(onChange).toBeCalled();
  });
});

test("mapStateToProps() pulls the associated filter configs", () => {
  const state = StateFactory.build();
  state.larFilters.ownerOccupancy = Set(["2", "3"]);

  const result = mapStateToProps(state, { filterId: "ownerOccupancy" });
  expect(result.filterConfig.choices.toArray()).toEqual([
    "Owner-occupied",
    "Not Owner-occupied",
    "N/A",
  ]);
  expect(result.filterConfig.fieldName).toBe("owner_occupancy");
  expect(Set(result.value)).toEqual(Set(["2", "3"]));
});

test("mapDispatchToProps() generates an onChange that sets filters", () => {
  const dispatch = jest.fn();
  const result = mapDispatchToProps(dispatch, { filterId: "loanPurpose" });
  const ev = {
    target: {
      options: [
        { selected: true, value: "1" },
        { selected: false, value: "2" },
        { selected: false, value: "3" },
      ],
    },
  };
  result.onChange(ev);
  expect(dispatch).toHaveBeenCalledWith(
    setFilters(["loanPurpose", Set<FilterValue>(["1"])]),
  );
});
