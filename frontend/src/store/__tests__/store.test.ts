import { Set } from "immutable";

import { choroplethIds, larCircles, mapboxStyleSelector } from "../store";

import {
  ConfigFactory,
  HMDAFactory,
  LARPointFactory,
  MapboxStyleFactory,
  StoreFactory,
  ViewportFactory,
} from "../../testUtils/Factory";

describe("choroplethIds", () => {
  it("pulls the right configs", () => {
    const config = ConfigFactory.build({
      choropleths: [
        { id: "aaa", name: "AAA" },
        { id: "bbb", name: "BBB" },
        { id: "ccc", name: "CCC" },
      ],
    });
    const state = StoreFactory.build({ config });

    expect(choroplethIds(state)).toEqual(["aaa", "bbb", "ccc"]);
  });
});

describe("larCircles", () => {
  describe("radius addition", () => {
    const lar = [
      LARPointFactory.build({ houseCount: 1, loanCount: 4 }),
      LARPointFactory.build({ houseCount: 3, loanCount: 75 }),
    ];
    const scaleConstant = 1 / 5;

    it("adds a radius based on loan volume", () => {
      const circles = larCircles(StoreFactory.build({
        hmda: HMDAFactory.build({ lar }),
        viewport: ViewportFactory.build({ zoom: 0 }),
      }));
      const zoomFactor = 1;
      expect(circles.map(l => l.radius)).toEqual([
        2 * zoomFactor * scaleConstant,
        5 * zoomFactor * scaleConstant,
      ]);
    });

    it("adds a radius based on zoom level", () => {
      const circles = larCircles(StoreFactory.build({
        hmda: HMDAFactory.build({ lar }),
        viewport: ViewportFactory.build({ zoom: 3 }),
      }));
      const zoomFactor = 2 * 2 * 2; // 2^3
      expect(circles.map(l => l.radius)).toEqual([
        2 * zoomFactor * scaleConstant,
        5 * zoomFactor * scaleConstant,
      ]);
    });
  });

  it("is empty when HMDA's not set", () => {
    const state = StoreFactory.build();
    delete state.hmda;
    expect(larCircles(state)).toEqual([]);
  });
});

describe("mapboxStyleSelector", () => {
  it("filters to the appropriate layers", () => {
    const style = MapboxStyleFactory.build({
      layers: [
        { id: "aaa", some: "stuff" },
        { id: "bbb", other: "things" },
        { id: "ccc", once: "again" },
        { id: "ddd", and: "end" },
      ],
    });
    const state = StoreFactory.build({
      config: ConfigFactory.build({ style }),
      visibleLayers: Set<string>(["bbb", "ccc"]),
    });

    const result = mapboxStyleSelector(state);
    expect(result).toBeDefined();
    if (result) {
      expect(result.layers).toEqual([
        { id: "bbb", other: "things" },
        { id: "ccc", once: "again" },
      ]);
      expect(result.center).toEqual(style.center);
    }
  });

  it("does nothing when the style isn't defined", () => {
    expect(mapboxStyleSelector(StoreFactory.build())).toBeUndefined();
  });
});
