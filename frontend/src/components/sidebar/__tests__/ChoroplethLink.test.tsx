import { mount, shallow } from "enzyme";
import { Set } from "immutable";
import * as React from "react";

import { selectChoropleth } from "../../../store/actions";
import { StoreFactory } from "../../../testUtils/Factory";
import {
  ChoroplethLink,
  mapDispatchToProps,
  mapStateToProps,
} from "../ChoroplethLink";

describe("<ChoroplethLink />", () => {
  it("includes the layer name", () => {
    const result = mount(
      <ChoroplethLink
        isVisible={true}
        layer={{ name: "A Name" }}
        selectChoropleth={jest.fn()}
      />,
    );
    expect(result.text()).toBe("A Name");
  });

  it("is active when visible", () => {
    const result = shallow(
      <ChoroplethLink
        isVisible={true}
        layer={{ name: "A Name" }}
        selectChoropleth={jest.fn()}
      />,
    );
    expect(result.find("glamorous(a)").prop("active")).toBe(true);
  });

  it("is not active when hidden", () => {
    const result = shallow(
      <ChoroplethLink
        isVisible={false}
        layer={{ name: "A Name" }}
        selectChoropleth={jest.fn()}
      />,
    );
    expect(result.find("glamorous(a)").prop("active")).toBe(false);
  });

  it("triggers the selectChoropleth", () => {
    const selectChoropleth = jest.fn();
    const preventDefault = jest.fn();
    const result = shallow(
      <ChoroplethLink
        isVisible={false}
        layer={{ name: "A Name" }}
        selectChoropleth={selectChoropleth}
      />,
    );
    expect(selectChoropleth).not.toHaveBeenCalled();
    result.find("glamorous(a)").simulate("click", { preventDefault });
    expect(selectChoropleth).toHaveBeenCalled();
  });
});

test("mapStateToProps() set isVisible based on the visible set", () => {
  const store = StoreFactory.build({
    visibleLayers: Set<string>(["aaa", "bbb", "ccc"]),
  });
  expect(mapStateToProps(store, { layer: { id: "bbb" } })).toEqual({
    isVisible: true,
  });
  expect(mapStateToProps(store, { layer: { id: "111" } })).toEqual({
    isVisible: false,
  });
});

test("mapDispatchToProps() dispatches selectChoropleth", () => {
  const dispatch = jest.fn();
  const props = mapDispatchToProps(dispatch, { layer: { id: "aaa" } });
  props.selectChoropleth();
  expect(dispatch).toHaveBeenCalledWith(selectChoropleth("aaa"));
});
