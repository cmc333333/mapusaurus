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
        config={ConfigFactory.build()}
        mapStyle={undefined}
        viewport={ViewportFactory.build()}
      />,
    );

    expect(result.name()).toBe("div");
    expect(result.text()).toBe("Loading...");
  });

  it("passed correct properties on the resulting", () => {
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
});
