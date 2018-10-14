import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { makeCountySearch } from "../../../apis/geography";
import { setStateFips } from "../../../store/LARLayer";
import { LARLayerFactory, StateFactory } from "../../../testUtils/Factory";
import {
  CountySelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../CountySelector";

jest.mock("../../../apis/geography");
const makeCountySearchMock = makeCountySearch as jest.Mock;

describe("<CountySelector />", () => {
  it("includes both a state and county selector", () => {
    const rendered = shallow(
      <CountySelector
        onChange={jest.fn()}
        searchCounties={jest.fn()}
        stateFips="01"
        states={[]}
      />,
    );
    expect(rendered.find(glamorous.Select)).toHaveLength(1);
    expect(rendered.find("Connect(HMDAFilter)")).toHaveLength(1);
  });

  it("includes an option per state", () => {
    const states = [
      { fips: "01", name: "Oh One" },
      { fips: "02", name: "Two" },
      { fips: "44", name: "FourFour" },
    ];
    const rendered = shallow(
      <CountySelector
        onChange={jest.fn()}
        searchCounties={jest.fn()}
        stateFips="01"
        states={states}
      />,
    );
    expect(rendered.find("option")).toHaveLength(3);
  });

  it("shows the selected state", () => {
    const states = [
      { fips: "01", name: "Oh One" },
      { fips: "02", name: "Two" },
      { fips: "44", name: "FourFour" },
    ];
    const rendered = shallow(
      <CountySelector
        onChange={jest.fn()}
        searchCounties={jest.fn()}
        stateFips="02"
        states={states}
      />,
    );
    expect(rendered.find(glamorous.Select).prop("value")).toBe("02");
  });

  it("triggers the right onChange", () => {
    const onChange = jest.fn();
    const rendered = shallow(
      <CountySelector
        onChange={onChange}
        searchCounties={jest.fn()}
        stateFips="02"
        states={[]}
      />,
    );
    rendered.find(glamorous.Select)
      .simulate("change", { target: { value: "05" } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: "05" } });
  });
});

describe("mapStateToProps()", () => {
  it("creates a search fn by active state", () => {
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({ stateFips: "12" }),
    });
    makeCountySearchMock.mockReturnValueOnce("a return value");

    const result = mapStateToProps(state);
    expect(makeCountySearch).toHaveBeenCalledWith("12");
    expect(result.searchCounties).toBe("a return value");
  });
});

describe("mapDispatchToProps()", () => {
  it("triggers a state change", () => {
    const dispatch = jest.fn();
    const result = mapDispatchToProps(dispatch);
    result.onChange({ target: { value: "53" } });
    expect(dispatch).toHaveBeenCalledWith(setStateFips("53"));
  });
});
