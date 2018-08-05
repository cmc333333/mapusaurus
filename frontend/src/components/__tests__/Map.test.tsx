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
        height={10}
        mapStyle={undefined}
        mapboxApiAccessToken=""
        scatterPlot={[]}
        viewport={ViewportFactory.build()}
        width={10}
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
    const result = shallow(
      <Map
        changeViewport={changeViewport}
        height={10}
        mapStyle={MapboxStyleFactory.build()}
        mapboxApiAccessToken="A Token!"
        scatterPlot={[]}
        viewport={viewport}
        width={10}
      />,
    );

    expect(result.prop("mapboxApiAccessToken")).toBe("A Token!");
    expect(result.prop("latitude")).toBe(1.1);
    expect(result.prop("longitude")).toBe(-22.22);
    expect(result.prop("zoom")).toBe(3);
  });

  it("has two Scatterplots with the correct data", () => {
    const changeViewport = () => null;
    const scatterPlot = [
      { coordinates: [1, 2], radius: 3 },
      { coordinates: [4, 5], radius: 6 },
      { coordinates: [7, 8], radius: 9 },
    ];

    const layers = shallow(
      <Map
        changeViewport={changeViewport}
        height={10}
        mapStyle={MapboxStyleFactory.build()}
        mapboxApiAccessToken=""
        scatterPlot={scatterPlot}
        viewport={ViewportFactory.build()}
        width={10}
      />,
    ).find("DeckGL").prop("layers");

    expect(layers).toHaveLength(2);
    expect(layers[0].props.data).toBe(scatterPlot);
    expect(layers[0].props.data).toBe(layers[1].props.data);
    expect(layers[0].props.radiusScale).toBe(layers[1].props.radiusScale);
    expect(layers[0].props.outline).toBeFalsy();
    expect(layers[1].props.outline).toBeTruthy();
  });
});
