import { MapboxStyleFactory, ViewportFactory } from "../../testUtils/Factory";
import { setStyle } from "../Mapbox";
import { reducer, setViewport } from "../Viewport";

describe("reducer()", () => {
  it("changes the viewport", () => {
    const viewport = { latitude: 1, longitude: 2, zoom: 3 };
    const result = reducer(ViewportFactory.build(), setViewport(viewport));
    expect(result).toEqual(viewport);
  });

  describe("setting styles sets viewport vars if necessary", () => {
    const style = MapboxStyleFactory.build({ center: [1, 2], zoom: 3 });
    const action = setStyle(style);
    expect(reducer({ latitude: 7, longitude: 8, zoom: 9 }, action)).toEqual({
      latitude: 7,
      longitude: 8,
      zoom: 9,
    });
    expect(reducer({ latitude: NaN, longitude: NaN, zoom: NaN }, action)).toEqual({
      latitude: 2,
      longitude: 1,
      zoom: 3,
    });
  });
});
