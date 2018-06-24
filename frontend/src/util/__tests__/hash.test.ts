import { Set } from "immutable";

import { LARPointFactory, StoreFactory } from "../../testUtils/Factory";
import { deserialize, serialize } from "../hash";

describe("deserialize()", () => {
  it("loads viewport data", () => {
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

  it("defaults viewport to NaNs", () => {
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

  it("loads HMDA data", () => {
    const result = deserialize("lender=1234&metro=678&county=910", {});
    expect(result.hmda).toEqual({
      config: {
        county: "910",
        lender: "1234",
        metro: "678",
      },
      lar: [],
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

  it("serializes hmda config", () => {
    const result = serialize(StoreFactory.build({
      hmda: {
        config: {
          county: "aaaa",
          lender: "bbbb",
          metro: "cccc",
        },
        lar: [LARPointFactory.build()],
      },
    }));

    expect(result).toMatch(/\bcounty=aaaa\b/);
    expect(result).toMatch(/\blender=bbbb\b/);
    expect(result).toMatch(/\bmetro=cccc\b/);
    expect(result).not.toMatch(/lar/);
  });
});
