import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { makeCountySearch } from "../../../apis/geography";
import { setStateFips } from "../../../store/LARLayer";
import {
  CountyFactory,
  LARLayerFactory,
  LenderFactory,
  MetroFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import {
  CountySelector,
  mapDispatchToProps,
  mapStateToProps,
} from "../CountySelector";
import HMDAFilter from "../HMDAFilter";

jest.mock("../../../apis/geography");
const makeCountySearchMock = makeCountySearch as jest.Mock;

describe("<CountySelector />", () => {
  it("includes both a state and county selector", () => {
    const rendered = shallow(
      <CountySelector
        counties={[]}
        onChange={jest.fn()}
        searchCounties={jest.fn()}
        stateFips="01"
        states={[]}
      />,
    );
    expect(rendered.find(glamorous.Select)).toHaveLength(1);
    expect(rendered.find(HMDAFilter)).toHaveLength(1);
  });

  it("includes an option per state", () => {
    const states = [
      { fips: "01", name: "Oh One" },
      { fips: "02", name: "Two" },
      { fips: "44", name: "FourFour" },
    ];
    const rendered = shallow(
      <CountySelector
        counties={[]}
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
        counties={[]}
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
        counties={[]}
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
  it("filters to the counties", () => {
    const counties = CountyFactory.buildList(2);
    const lenders = LenderFactory.buildList(4);
    const metros = MetroFactory.buildList(3);
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({
        filters: [...counties, ...lenders, ...metros],
      }),
    });

    const result = mapStateToProps(state);
    expect(result.counties).toHaveLength(2);
    expect(result.counties.map(c => c.entityType)).toEqual(["county", "county"]);
  });

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
