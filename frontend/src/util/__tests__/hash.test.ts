import { Set } from "immutable";

import { deserialize, serialize } from "../hash";

describe("deserialize()", () => {
  it("loads data", () => {
    const result = deserialize(
      "a=param&latitude=11.111&longitude=22&zoom=3&other=stuff",
      { some: "config" },
    );
    expect(result).toEqual({
      config: { some: "config" },
      viewport: {
        latitude: 11.111,
        longitude: 22,
        zoom: 3,
      },
      visibleLayers: Set<string>(),
    });
  });

  it("defaults to NaNs", () => {
    const result = deserialize("", { some: "config" });
    expect(result).toEqual({
      config: { some: "config" },
      viewport: {
        latitude: NaN,
        longitude: NaN,
        zoom: NaN,
      },
      visibleLayers: Set<string>(),
    });
  });
});

describe("serialize()", () => {
  it("serializes the viewport, ignoring other args", () => {
    const result = serialize({
      config: {
        choropleths: [],
        features: [],
        styleName: "aStyle",
        token: "aToken",
      },
      viewport: {
        latitude: 44,
        longitude: 55.55,
        zoom: 6,
      },
      visibleLayers: Set<string>(["aaa", "bbb"]),
    });

    expect(result).toMatch(/\blatitude=44\b/);
    expect(result).toMatch(/\blongitude=55.55\b/);
    expect(result).toMatch(/\bzoom=6\b/);
    expect(result).not.toMatch(/config/);
    expect(result).not.toMatch(/aaa/);
    expect(result).not.toMatch(/aToken/);
  });
});
