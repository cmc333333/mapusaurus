import { Map, Set } from "immutable";
import * as qs from "qs";

import {
  FiltersFactory,
  LarFactory,
  MapboxFactory,
  PointsFactory,
  StateFactory,
  ViewportFactory,
} from "../../testUtils/Factory";
import serialize, { setupSerialization } from "../serialize";

describe("serialize()", () => {
  it("serializes the viewport, ignoring other args", () => {
    const result = serialize(StateFactory.build({
      lar: LarFactory.build({
        filters: FiltersFactory.build({
          county: Set<string>(),
          lender: Set<string>(),
          lienStatus: Set<string>(),
          loanPurpose: Set<string>(),
          metro: Set<string>(),
          ownerOccupancy: Set<string>(),
          propertyType: Set<string>(),
          year: 2002,
        }),
        points: PointsFactory.build({
          scaleFactor: 44,
        }),
      }),
      mapbox: MapboxFactory.build({
        choropleth: "a-choropleth",
        features: Set(["f1"]),
      }),
      viewport: ViewportFactory.build({
        latitude: 44,
        longitude: 55.55,
        zoom: 6,
      }),
    }));

    expect(qs.parse(result)).toEqual({
      choropleth: "a-choropleth",
      features: "f1",
      latitude: "44",
      longitude: "55.55",
      scaleFactor: "44",
      year: "2002",
      zoom: "6",
    });
  });

  it("serializes lar config", () => {
    const result = serialize(StateFactory.build({
      lar: LarFactory.build({
        filters: FiltersFactory.build({
          county: Set(["aaa", "bbb"]),
          year: 2004,
        }),
      }),
    }));
    expect(result).toMatch(/\bcounty=(aaa,bbb|bbb,aaa)\b/);
    expect(result).toMatch(/\byear=2004\b/);
  });

  it("serializes features", () => {
    const result = serialize(StateFactory.build({
      mapbox: MapboxFactory.build({
        features: Set(["aaa", "bbb"]),
      }),
    }));
    expect(result).toMatch(/\bfeatures=(aaa,bbb|bbb,aaa)\b/);
  });
});

describe("setupSerialization()", () => {
  it("will serialize the state", () => {
    const window = {
      location: { hash: "initialVal" },
      setTimeout: fn => fn(), // call the fn immediately
    };
    const state = StateFactory.build();
    const store = {
      getState: () => state,
      subscribe: fn => fn(), // call the fn immediately
    };
    setupSerialization(window, store);
    expect(window.location.hash).toBe(serialize(state));
  });

  it("is is triggered by a store event", () => {
    const window = {
      location: { hash: "initialVal" },
      setTimeout: fn => fn(), // call the fn immediately
    };
    const state = StateFactory.build();
    const store = {
      getState: () => state,
      subscribe: jest.fn(),
    };
    setupSerialization(window, store);
    expect(window.location.hash).toBe("initialVal");
    expect(store.subscribe).toHaveBeenCalled();
    store.subscribe.mock.calls[0][0]();
    expect(window.location.hash).toBe(serialize(state));
  });

  it("clears existing timeouts", () => {
    const window = {
      clearTimeout: jest.fn(),
      location: { hash: "initialVal" },
      setTimeout: () => "timeout-id",
    };
    const store = { subscribe: jest.fn() };
    setupSerialization(window, store);
    expect(window.clearTimeout).not.toHaveBeenCalled();

    store.subscribe.mock.calls[0][0]();
    expect(window.clearTimeout).not.toHaveBeenCalled();

    store.subscribe.mock.calls[0][0]();
    expect(window.clearTimeout).toHaveBeenCalledWith("timeout-id");
  });
});
