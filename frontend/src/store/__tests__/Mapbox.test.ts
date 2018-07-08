import { Set } from "immutable";

import {
  ConfigFactory,
  MapboxFactory,
  MapboxStyleFactory,
} from "../../testUtils/Factory";
import {
  addLayers,
  currentStyleSelector,
  reducer,
  removeLayers,
  selectChoropleth,
  setStyle,
} from "../Mapbox";

describe("reducer()", () => {
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
      const result = reducer(MapboxFactory.build(), setStyle(style));
      expect(result.style).toEqual(style);
    });

    it("removes invalid styles", () => {
      const style = MapboxStyleFactory.build({
        layers: [{ id: "bbb" }, { id: "ccc" }],
      });

      const result = reducer(MapboxFactory.build({ config }), setStyle(style));
      expect(result.config.choropleths).toEqual([
        { id: "bbb", name: "BBB" },
        { id: "ccc", name: "CCC" },
      ]);
      expect(result.config.features).toEqual([
        { name: "A Feature", ids: Set<string>(["bbb", "ccc"]) },
        { name: "B Feature", ids: Set<string>(["ccc"]) },
      ]);

    });

    it("sets visible layers", () => {
      const style = MapboxStyleFactory.build({
        layers: [{ id: "aaa" }, { id: "bbb" }, { id: "ccc" }],
      });

      const result = reducer(MapboxFactory.build({ config }), setStyle(style));
      expect(result.visible).toEqual(Set<string>(["aaa", "bbb", "ccc"]));
    });
  });

  it("sets choropleth layers", () => {
    const mapbox = MapboxFactory.build({
      config: ConfigFactory.build({
        choropleths: [
          { id: "111", name: "One" },
          { id: "222", name: "Two" },
          { id: "333", name: "Three" },
        ],
      }),
      visible: Set<string>(["aaa", "bbb", "ccc", "111"]),
    });

    const result = reducer(mapbox, selectChoropleth("333"));
    expect(result.visible).toEqual(
      Set<string>(["aaa", "bbb", "ccc", "333"]),
    );
  });

  it("adds and removes layers", () => {
    const mapbox = MapboxFactory.build({
      visible: Set<string>(["aaa", "bbb", "ccc"]),
    });
    const addResult = reducer(
      mapbox,
      addLayers(Set<string>(["ccc", "ddd", "eee"])),
    );
    const subResult = reducer(
      mapbox,
      removeLayers(Set<string>(["111", "bbb"])),
    );

    expect(addResult.visible).toEqual(
      Set<string>(["aaa", "bbb", "ccc", "ddd", "eee"]),
    );
    expect(subResult.visible).toEqual(Set<string>(["aaa", "ccc"]));
  });
});

describe("currentStyleSelector", () => {
  it("filters to the appropriate layers", () => {
    const style = MapboxStyleFactory.build({
      layers: [
        { id: "aaa", some: "stuff" },
        { id: "bbb", other: "things" },
        { id: "ccc", once: "again" },
        { id: "ddd", and: "end" },
      ],
    });
    const mapbox = MapboxFactory.build({
      style,
      config: ConfigFactory.build({ style }),
      visible: Set<string>(["bbb", "ccc"]),
    });

    const result = currentStyleSelector(mapbox);
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
    expect(currentStyleSelector(MapboxFactory.build())).toBeUndefined();
  });
});
