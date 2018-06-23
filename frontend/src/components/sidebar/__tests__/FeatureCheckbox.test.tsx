import { mount, shallow } from "enzyme";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";

import { addLayers, removeLayers } from "../../../store/actions";
import { StoreFactory } from "../../../testUtils/Factory";
import {
  FeatureCheckbox,
  mapDispatchToProps,
  mapStateToProps,
} from "../FeatureCheckbox";

describe("<FeatureCheckbox />", () => {
  it("includes the feature name", () => {
    const result = mount(
      <FeatureCheckbox
        addLayers={jest.fn()}
        checked={true}
        feature={{ name: "A Name" }}
        removeLayers={jest.fn()}
      />,
    );
    expect(result.text()).toBe("A Name");
  });

  it("checks the wrapped input if the container is", () => {
    const result = shallow(
      <FeatureCheckbox
        addLayers={jest.fn()}
        checked={true}
        feature={{ name: "A Name" }}
        removeLayers={jest.fn()}
      />,
    );
    expect(result.find(glamorous.Input).prop("checked")).toBe(true);
  });

  it("doesn't check the wrapped input if the container is not", () => {
    const result = shallow(
      <FeatureCheckbox
        addLayers={jest.fn()}
        checked={false}
        feature={{ name: "A Name" }}
        removeLayers={jest.fn()}
      />,
    );
    expect(result.find(glamorous.Input).prop("checked")).toBe(false);
  });

  it("triggers an add if not checked", () => {
    const addLayers = jest.fn();
    const removeLayers = jest.fn();
    const result = shallow(
      <FeatureCheckbox
        addLayers={addLayers}
        checked={false}
        feature={{ name: "A Name" }}
        removeLayers={removeLayers}
      />,
    );
    result.find(glamorous.Input).simulate("change");
    expect(addLayers).toHaveBeenCalled();
    expect(removeLayers).not.toHaveBeenCalled();
  });

  it("triggers a remove if checked", () => {
    const addLayers = jest.fn();
    const removeLayers = jest.fn();
    const result = shallow(
      <FeatureCheckbox
        addLayers={addLayers}
        checked={true}
        feature={{ name: "A Name" }}
        removeLayers={removeLayers}
      />,
    );
    result.find(glamorous.Input).simulate("change");
    expect(addLayers).not.toHaveBeenCalled();
    expect(removeLayers).toHaveBeenCalled();
  });
});

test("mapStateToProps() set checked based on the visible set", () => {
  const store = StoreFactory.build({
    visibleLayers: Set<string>(["aaa", "bbb", "ccc"]),
  });
  const visibleFeature = { ids: Set<string>(["bbb", "111"]) };
  const hiddenFeature = { ids: Set<string>(["111", "222", "333"]) };
  expect(mapStateToProps(store, { feature: visibleFeature })).toEqual({
    checked: true,
  });
  expect(mapStateToProps(store, { feature: hiddenFeature })).toEqual({
    checked: false,
  });
});

describe("mapDispatchToProps()", () => {
  const feature = { ids: Set<string>(["aaa", "bbb", "ccc"]) };
  it("dispatches addLayers", () => {
    const dispatch = jest.fn();
    const props = mapDispatchToProps(dispatch, { feature });
    props.addLayers();
    expect(dispatch).toHaveBeenCalledWith(addLayers(feature.ids));
  });

  it("dispatches removeLayers", () => {
    const dispatch = jest.fn();
    const props = mapDispatchToProps(dispatch, { feature });
    props.removeLayers();
    expect(dispatch).toHaveBeenCalledWith(removeLayers(feature.ids));
  });
});
