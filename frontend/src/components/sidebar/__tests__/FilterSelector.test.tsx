import { shallow } from "enzyme";
import glamorous from "glamorous";
import { OrderedMap, Set } from "immutable";
import * as React from "react";

import { filterChoices, FilterValue, setFilters } from "../../../store/LARLayer";
import { StateFactory } from "../../../testUtils/Factory";
import {
  FilterSelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../FilterSelector";

describe("<FilterSelector />", () => {
  const filterConfig = {
    choices: [
      new FilterValue({ id: "1", name: "Stuff" }),
      new FilterValue({ id: "2", name: "Other" }),
      new FilterValue({ id: "3", name: "Things" }),
    ],
    fieldName: "some_stuff",
    name: "Some Stuff",
  };
  const onChange = jest.fn();
  const rendered = shallow(
    <FilterSelector
      filterConfig={filterConfig}
      onChange={onChange}
      value={["1", "3"]}
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
  state.larLayer.filters.ownerOccupancy = [
    filterChoices.get("ownerOccupancy").choices[1],
    filterChoices.get("ownerOccupancy").choices[2],
  ];

  const result = mapStateToProps(state, { filterId: "ownerOccupancy" });
  expect(result.filterConfig.choices)
    .toEqual(filterChoices.get("ownerOccupancy").choices);
  expect(result.filterConfig.fieldName).toBe("owner_occupancy");
  expect(result.value).toEqual(["2", "3"]);
});
