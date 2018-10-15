import { ViewportFactory } from "../../testUtils/Factory";
import { reducer, setViewport, transitionViewport } from "../Viewport";

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
