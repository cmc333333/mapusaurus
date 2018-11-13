import { mount, shallow } from "enzyme";
import { Set } from "immutable";
import * as React from "react";

import { selectChoropleth } from "../../../store/Mapbox";
import { MapboxFactory, StateFactory } from "../../../testUtils/Factory";
import {
  ChoroplethLink,
  mapDispatchToProps,
  mapStateToProps,
} from "../ChoroplethLink";

describe("<ChoroplethLink />", () => {
  it("includes the layer name", () => {
    const result = mount(
      <ChoroplethLink isVisible={true} name="A Name" onClick={jest.fn()} />,
    );
    expect(result.text()).toBe("A Name");
  });

  it("is active when visible", () => {
    const result = shallow(
      <ChoroplethLink isVisible={true} name="A Name" onClick={jest.fn()} />,
    );
    expect(result.find("glamorous(a)").prop("active")).toBe(true);
  });

  it("is not active when hidden", () => {
    const result = shallow(
      <ChoroplethLink isVisible={false} name="A Name" onClick={jest.fn()} />,
    );
    expect(result.find("glamorous(a)").prop("active")).toBe(false);
  });

  it("triggers the onClick", () => {
    const onClick = jest.fn();
    const result = shallow(
      <ChoroplethLink isVisible={false} name="A Name" onClick={onClick} />,
    );
    expect(onClick).not.toHaveBeenCalled();
    result.find("glamorous(a)").simulate("click");
    expect(onClick).toHaveBeenCalled();
  });
});

test("mapStateToProps() set isVisible based on the visible set", () => {
  const state = StateFactory.build({
    mapbox: MapboxFactory.build({
      choropleth: "bbb",
    }),
  });
  expect(mapStateToProps(state, { layerId: "bbb" })).toEqual({
    isVisible: true,
  });
  expect(mapStateToProps(state, { layerId: "111" })).toEqual({
    isVisible: false,
  });
});

test("mapDispatchToProps() dispatches onClick", () => {
  const dispatch = jest.fn();
  const props = mapDispatchToProps(dispatch, { layerId: "aaa" });
  props.onClick({ preventDefault: jest.fn() });
  expect(dispatch).toHaveBeenCalledWith(selectChoropleth("aaa"));
});
