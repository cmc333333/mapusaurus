import { Set } from "immutable";

import mapStyle from "../../mapStyle";
import { MapboxFactory } from "../../testUtils/Factory";
import {
  currentStyleSelector,
  mapKeyColorsSelector,
  reducer,
  selectChoropleth,
  toggleFeature,
} from "../Mapbox";

describe("reducer()", () => {
  it("sets choropleth layers", () => {
    const mapbox = MapboxFactory.build({
      choropleth: "income",
    });

    const result = reducer(mapbox, selectChoropleth("msa-minority"));
    expect(result.choropleth).toBe("msa-minority");
  });

  it("adds and removes features", () => {
    const mapbox = MapboxFactory.build({
      features: Set(["aaa", "bbb", "ccc"]),
    });
    const subtractResult = reducer(mapbox, toggleFeature("ccc"));
    expect(subtractResult.features).toEqual(Set(["aaa", "bbb"]));

    const addResult = reducer(mapbox, toggleFeature("ddd"));
    expect(addResult.features).toEqual(Set(["aaa", "bbb", "ccc", "ddd"]));
  });
});

describe("currentStyleSelector", () => {
  it("filters to the appropriate layers", () => {
    const mapbox = MapboxFactory.build({
      choropleth: "income",
      features: Set(["Geography"]),
    });

    const result = currentStyleSelector(mapbox);
    expect(result.layers.map(l => l.id)).toEqual(
      ["background", "income", "national_park", "landuse", "waterway", "water"],
    );
  });
});

describe("mapKeyColorsSelector", () => {
  it("includes the colors of selected layers", () => {
    const mapbox = MapboxFactory.build({
      choropleth: "minority-fifty",
    });
    const result = mapKeyColorsSelector(mapbox);
    expect(result.map(k => k.description)).toEqual(
      ["≥ 50% Minority", "< 50% Minority"],
    );
  });
});
