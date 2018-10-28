import { Set } from "immutable";

import mapStyle from "../../mapStyle";
import { MapboxFactory } from "../../testUtils/Factory";
import {
  addLayers,
  currentStyleSelector,
  mapKeyColorsSelector,
  reducer,
  removeLayers,
  selectChoropleth,
} from "../Mapbox";

describe("reducer()", () => {
  it("sets choropleth layers", () => {
    const mapbox = MapboxFactory.build({
      visible: Set<string>(["admin-country", "building", "income"]),
    });

    const result = reducer(mapbox, selectChoropleth("msa-minority"));
    expect(result.visible).toEqual(
      Set<string>(["admin-country", "building", "msa-minority"]),
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
    const mapbox = MapboxFactory.build({
      visible: Set<string>(["background", "pedestrian-path"]),
    });

    const result = currentStyleSelector(mapbox);
    expect(result.layers).toHaveLength(2);
    expect(result.layers[0].type).toBe("background");
    expect(result.layers[1]["source-layer"]).toBe("road");
  });
});

describe("mapKeyColorsSelector", () => {
  it("includes the colors of selected layers", () => {
    const mapbox = MapboxFactory.build({
      visible: Set(["minority-fifty", "landuse"]),
    });
    const result = mapKeyColorsSelector(mapbox);
    const layer: any = mapStyle.layers.find(l => l.id === "minority-fifty");
    expect(result).toEqual(layer.metadata.keyColors);
  });
});
