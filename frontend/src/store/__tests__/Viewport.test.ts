import { ViewportFactory } from "../../testUtils/Factory";
import { reducer, setViewport } from "../Viewport";

describe("reducer()", () => {
  it("changes the viewport", () => {
    const viewport = { latitude: 1, longitude: 2, zoom: 3 };
    const result = reducer(ViewportFactory.build(), setViewport(viewport));
    expect(result).toEqual(viewport);
  });
});
