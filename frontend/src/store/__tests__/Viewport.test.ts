import { ViewportFactory } from "../../testUtils/Factory";
import {
  pixelsPerMeterSelector,
  reducer,
  setViewport,
  transitionViewport,
} from "../Viewport";

describe("reducer()", () => {
  it("sets the viewport", () => {
    const viewport = { latitude: 1, longitude: 2, zoom: 3 };
    const result = reducer(ViewportFactory.build(), setViewport(viewport));
    expect(result).toEqual({
      ...viewport,
      transitionDuration: 0,
    });
  });

  it("transitions the viewport", () => {
    const viewport = { latitude: 1, longitude: 2, zoom: 3 };
    const result = reducer(
      ViewportFactory.build(),
      transitionViewport(viewport),
    );
    expect(result).toEqual({
      ...viewport,
      transitionDuration: 3000,
    });
  });
});

test("pixelsPerMeterSelector()", () => {
  const viewport = ViewportFactory.build({
    latitude: 45,
    longitude: 45,
    zoom: 12,
  });
  expect(pixelsPerMeterSelector(viewport).x).toBeCloseTo(.0741);
  expect(pixelsPerMeterSelector(viewport).y).toBeCloseTo(.0741);
});
