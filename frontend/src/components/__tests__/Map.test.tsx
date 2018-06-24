import { shallow } from "enzyme";
import * as React from "react";

import {
  ConfigFactory,
  MapboxStyleFactory,
  ViewportFactory,
} from "../../testUtils/Factory";
import { Map } from "../Map";

describe("<Map />", () => {
  it("displays nothing when there is no style", () => {
    const changeViewport = () => null;
    const result = shallow(
      <Map
        changeViewport={changeViewport}
        circles={[]}
        config={ConfigFactory.build()}
        mapStyle={undefined}
        viewport={ViewportFactory.build()}
      />,
    );

    expect(result.name()).toBe("div");
    expect(result.text()).toBe("Loading...");
  });

  it("passed correct properties on the resulting ReactMapGL", () => {
    const changeViewport = () => null;
    const viewport = {
      latitude: 1.1,
      longitude: -22.22,
      zoom: 3,
    };
    const config = ConfigFactory.build({ token: "A Token!" });
    const result = shallow(
      <Map
        changeViewport={changeViewport}
        circles={[]}
        config={config}
        mapStyle={MapboxStyleFactory.build()}
        viewport={viewport}
      />,
    );

    expect(result.prop("mapboxApiAccessToken")).toBe("A Token!");
    expect(result.prop("latitude")).toBe(1.1);
    expect(result.prop("longitude")).toBe(-22.22);
    expect(result.prop("zoom")).toBe(3);
  });

  it("has as many LoanMarkers as circles", () => {
    const changeViewport = () => null;
    const circles = [{ geoid: "1" }, { geoid: "2" }, { geoid: "3" }];
    const result = shallow(
      <Map
        changeViewport={changeViewport}
        circles={circles}
        config={ConfigFactory.build()}
        mapStyle={MapboxStyleFactory.build()}
        viewport={ViewportFactory.build()}
      />,
    );

    expect(result.find("LoanMarker")).toHaveLength(3);
  });
});
