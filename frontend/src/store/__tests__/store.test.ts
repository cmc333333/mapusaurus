import { Set } from "immutable";

import { choroplethIds, larData, mapboxStyleSelector } from "../store";

import {
  ConfigFactory,
  HMDAFactory,
  LARPointFactory,
  MapboxStyleFactory,
  StoreFactory,
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

describe("larData", () => {
  it("grabs data if present", () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];
    const state = StoreFactory.build({
      hmda: HMDAFactory.build({ lar }),
    });
    expect(larData(state)).toEqual(lar);
  });

  it("is empty when HMDA's not set", () => {
    const state = StoreFactory.build();
    delete state.hmda;
    expect(larData(state)).toEqual([]);
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
