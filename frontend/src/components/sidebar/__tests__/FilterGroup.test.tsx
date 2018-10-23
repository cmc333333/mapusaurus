import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import {
  homePurchasePreset,
  refinancePreset,
  setFilters,
} from "../../../store/Lar/Filters";
import { setGroup } from "../../../store/Lar/UIOnly";
import { StateFactory } from "../../../testUtils/Factory";
import {
  FilterGroup,
  mapDispatchToProps,
  mapStateToProps,
} from "../FilterGroup";

describe("<FilterGroup />", () => {
  it("sets attributes on children", () => {
    const result = shallow(
      <FilterGroup checked={true} name="A Name" onChange={jest.fn()}>
        <p>Some content</p>
      </FilterGroup>,
    );
    expect(result.find("FormInput").prop("name")).toBe("A Name");
    expect(result.find(glamorous.Input).prop("checked")).toBe(true);
    expect(result.find("p").text()).toBe("Some content");
  });

  it("triggers the onChange event", () => {
    const onChange = jest.fn();
    const result = shallow(
      <FilterGroup checked={true} name="Ignored" onChange={onChange} />,
    );
    expect(onChange).not.toHaveBeenCalled();
    result.find(glamorous.Input).simulate("change", {});
    expect(onChange).toHaveBeenCalled();
  });
});

describe("mapStateToProps()", () => {
  const state = StateFactory.build();
  state.lar.uiOnly.group = "refinance";

  it("sets checked and includes children if selected", () => {
    const result = mapStateToProps(
      state,
      { children: <p>stuff</p>, filterGroup: "refinance" },
    );
    expect(result.checked).toBe(true);
    expect(result.children).toEqual(<p>stuff</p>);
  });

  it("doesn't set checked and doesn't include children if not", () => {
    const result = mapStateToProps(
      state,
      { children: <p>stuff</p>, filterGroup: "homePurchase" },
    );
    expect(result.checked).toBe(false);
    expect(result.children).toBe(null);
  });
});

describe("mapDispatchToProps()", () => {
  it("dispatches message when settings to homePurchase", () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch, { filterGroup: "homePurchase" }).onChange();
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch.mock.calls[0]).toEqual([setGroup("homePurchase")]);
    expect(dispatch.mock.calls[1]).toEqual([setFilters(homePurchasePreset)]);
  });

  it("dispatches messages when setting to refinance", () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch, { filterGroup: "refinance" }).onChange();
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch.mock.calls[0]).toEqual([setGroup("refinance")]);
    expect(dispatch.mock.calls[1]).toEqual([setFilters(refinancePreset)]);
  });

  it("dispatches messages when setting to custom", () => {
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch, { filterGroup: "custom" }).onChange();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setGroup("custom"));
  });
});
