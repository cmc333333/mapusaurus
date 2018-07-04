import { Set } from "immutable";

import { choroplethIds, larScatterPlot, mapboxStyleSelector } from "../store";

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

describe("larScatterPlot", () => {
  it("transforms the data", () => {
    const lar = [
      LARPointFactory.build({
        houseCount: 1,
        latitude: 11,
        loanCount: 4,
        longitude: 22,
      }),
      LARPointFactory.build({
        houseCount: 3,
        latitude: 33.33,
        loanCount: 75,
        longitude: 44.44,
      }),
    ];

    const circles = larScatterPlot(StoreFactory.build({
      hmda: HMDAFactory.build({ lar }),
    }));
    expect(circles).toEqual([
      { radius: 2, position: [22, 11] },
      { radius: 5, position: [44.44, 33.33] },
    ]);
  });

  it("is empty when HMDA's not set", () => {
    const state = StoreFactory.build();
    delete state.hmda;
    expect(larScatterPlot(state)).toEqual([]);
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
