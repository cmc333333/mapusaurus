import { shallow } from "enzyme";
import glamorous from "glamorous";
import { Map, Set } from "immutable";
import * as React from "react";

import { SAFE_INIT } from "../../../store/LARLayer";
import {
  LARFiltersFactory,
  LARLayerFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import {
  FilterSelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../FilterSelector";

describe("<FilterSelector />", () => {
  const filterConfig = {
    fieldName: "some_stuff",
    label: "Some Stuff",
    options: Map([["1", "Stuff"], ["2", "Other"], ["3", "Things"]]),
    selected: Set(["1", "3"]),
  };
  const onChange = jest.fn();
  const rendered = shallow(
    <FilterSelector filterConfig={filterConfig} onChange={onChange} />,
  );

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
    expect(onChange).not.toBeCalled();
    select.simulate("change");
    expect(onChange).toBeCalled();
  });
});

test("mapStateToProps() pulls the associated filter configs", () => {
  const state = StateFactory.build({
    larLayer: LARLayerFactory.build({
      filters: LARFiltersFactory.build({}, {
        ownerOccupancySet: Set(["2", "3"]),
      }),
    }),
  });

  const result = mapStateToProps(state, { filterId: "ownerOccupancy" });
  expect(result.filterConfig.options)
    .toEqual(SAFE_INIT.filters.ownerOccupancy.options);
  expect(result.filterConfig.selected).toEqual(Set(["2", "3"]));
});
