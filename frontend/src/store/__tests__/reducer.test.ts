import { Set } from "immutable";

import {
  addLayers,
  changeViewport,
  removeLayers,
  selectChoropleth,
  setStyle,
} from "../actions";
import reducer from "../reducer";

import {
  ConfigFactory,
  MapboxStyleFactory,
  StoreFactory,
} from "../../testUtils/Factory";

describe("reducer()", () => {
  it("changes the viewport", () => {
    const viewport = { latitude: 1, longitude: 2, zoom: 3 };
    const result = reducer(StoreFactory.build(), changeViewport(viewport));
    expect(result.viewport).toEqual(viewport);
  });

  describe("setting styles", () => {
    const config = ConfigFactory.build({
      choropleths: [
        { id: "aaa", name: "AAA" },
        { id: "bbb", name: "BBB" },
        { id: "ccc", name: "CCC" },
        { id: "ddd", name: "DDD" },
      ],
      features: [
        { name: "A Feature", ids: Set<string>(["aaa", "bbb", "ccc"]) },
        { name: "B Feature", ids: Set<string>(["ccc", "ddd", "eee"]) },
      ],
    });

    it("sets the style", () => {
      const style = MapboxStyleFactory.build();
      const result = reducer(StoreFactory.build(), setStyle(style));
      expect(result.config.style).toEqual(style);
    });

    it("removes invalid styles", () => {
      const style = MapboxStyleFactory.build({
        layers: [{ id: "bbb" }, { id: "ccc" }],
      });

      const result = reducer(StoreFactory.build({ config }), setStyle(style));
      expect(result.config.choropleths).toEqual([
        { id: "bbb", name: "BBB" },
        { id: "ccc", name: "CCC" },
      ]);
      expect(result.config.features).toEqual([
        { name: "A Feature", ids: Set<string>(["bbb", "ccc"]) },
        { name: "B Feature", ids: Set<string>(["ccc"]) },
      ]);

    });

    it("sets visibleLayers", () => {
      const style = MapboxStyleFactory.build({
        layers: [{ id: "aaa" }, { id: "bbb" }, { id: "ccc" }],
      });

      const result = reducer(StoreFactory.build({ config }), setStyle(style));
      expect(result.visibleLayers).toEqual(Set<string>(["aaa", "bbb", "ccc"]));
    });

    it("sets viewport vars if necessary", () => {
      const style = MapboxStyleFactory.build({ center: [1, 2], zoom: 3 });
      const stateWithData = StoreFactory.build({
        viewport: { latitude: 7, longitude: 8, zoom: 9 },
      });
      const stateWithNaNs = StoreFactory.build({
        viewport: { latitude: NaN, longitude: NaN, zoom: NaN },
      });

      expect(reducer(stateWithData, setStyle(style)).viewport).toEqual({
        latitude: 7,
        longitude: 8,
        zoom: 9,
      });
      expect(reducer(stateWithNaNs, setStyle(style)).viewport).toEqual({
        latitude: 2,
        longitude: 1,
        zoom: 3,
      });
    });
  });

  it("sets choropleth layers", () => {
    const state = StoreFactory.build({
      config: ConfigFactory.build({
        choropleths: [
          { id: "111", name: "One" },
          { id: "222", name: "Two" },
          { id: "333", name: "Three" },
        ],
      }),
      visibleLayers: Set<string>(["aaa", "bbb", "ccc", "111"]),
    });

    const result = reducer(state, selectChoropleth("333"));
    expect(result.visibleLayers).toEqual(
      Set<string>(["aaa", "bbb", "ccc", "333"]),
    );
  });

  it("adds and removes layers", () => {
    const state = StoreFactory.build({
      visibleLayers: Set<string>(["aaa", "bbb", "ccc"]),
    });
    const addResult = reducer(
      state,
      addLayers(Set<string>(["ccc", "ddd", "eee"])),
    );
    const subResult = reducer(
      state,
      removeLayers(Set<string>(["111", "bbb"])),
    );

    expect(addResult.visibleLayers).toEqual(
      Set<string>(["aaa", "bbb", "ccc", "ddd", "eee"]),
    );
    expect(subResult.visibleLayers).toEqual(Set<string>(["aaa", "ccc"]));
  });
});
