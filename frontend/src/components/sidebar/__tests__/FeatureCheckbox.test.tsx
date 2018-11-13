import { mount, shallow } from "enzyme";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";

import { toggleFeature } from "../../../store/Mapbox";
import { MapboxFactory, StateFactory } from "../../../testUtils/Factory";
import { FeatureCheckbox, mergeProps } from "../FeatureCheckbox";

describe("<FeatureCheckbox />", () => {
  it("includes the feature name", () => {
    const result = mount(
      <FeatureCheckbox checked={true} name="A Name" onChange={jest.fn()} />,
    );
    expect(result.text()).toBe("A Name");
  });

  it("checks the wrapped input if the container is", () => {
    const result = shallow(
      <FeatureCheckbox checked={true} name="" onChange={jest.fn()} />,
    );
    expect(result.find(glamorous.Input).prop("checked")).toBe(true);
  });

  it("doesn't check the wrapped input if the container is not", () => {
    const result = shallow(
      <FeatureCheckbox checked={false} name="" onChange={jest.fn()} />,
    );
    expect(result.find(glamorous.Input).prop("checked")).toBe(false);
  });
});

describe("mergeProps()", () => {
  const features = Set(["aaa", "bbb", "ccc"]);
  const dispatch = jest.fn();
  it("derives 'checked' based on overlap; triggers a remove", () => {
    const result = mergeProps({ features }, { dispatch }, { name: "aaa" });
    expect(result.checked).toBe(true);
    result.onChange();
    expect(dispatch).toHaveBeenCalledWith(toggleFeature("aaa"));
  });

  it("triggers an add if not checked", () => {
    const result = mergeProps({ features }, { dispatch }, { name: "xxx" });
    expect(result.checked).toBe(false);
    result.onChange();
    expect(dispatch).toHaveBeenCalledWith(toggleFeature("xxx"));
  });
});
