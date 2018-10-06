import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { LARLayerFactory, StateFactory } from "../../../testUtils/Factory";
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
  const state = StateFactory.build({
    larLayer: LARLayerFactory.build({ filterGroup: "refinance" }),
  });

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
