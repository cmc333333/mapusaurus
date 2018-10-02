import { Set } from "immutable";
import * as qs from "qs";

import {
  FiltersFactory,
  LARFilterFactory,
  LARLayerFactory,
  StateFactory,
  ViewportFactory,
} from "../../testUtils/Factory";
import serialize, { setupSerialization } from "../serialize";

describe("serialize()", () => {
  it("serializes the viewport, ignoring other args", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({
        filters: FiltersFactory.build({
          county: [],
          lender: [],
          metro: [],
        }),
        year: 2002,
      }),
      viewport: ViewportFactory.build({
        latitude: 44,
        longitude: 55.55,
        zoom: 6,
      }),
    }));

    expect(qs.parse(result)).toEqual({
      latitude: "44",
      longitude: "55.55",
      year: "2002",
      zoom: "6",
    });
  });

  it("serializes lar config", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({
        filters: FiltersFactory.build({
          county: [
            LARFilterFactory.build({ id: "aaa" }),
            LARFilterFactory.build({ id: "bbb" }),
            LARFilterFactory.build({ id: "ccc" }),
          ],
          lender: [
            LARFilterFactory.build({ id: "12" }),
            LARFilterFactory.build({ id: "34" }),
          ],
          metro: [LARFilterFactory.build({ id: "Z" })],
        }),
        year: 2004,
      }),
    }));
    expect(result).toMatch(/\bcounties%5B%5D=aaa\b/);
    expect(result).toMatch(/\bcounties%5B%5D=bbb\b/);
    expect(result).toMatch(/\bcounties%5B%5D=ccc\b/);
    expect(result).toMatch(/\blenders%5B%5D=12\b/);
    expect(result).toMatch(/\blenders%5B%5D=34\b/);
    expect(result).toMatch(/\bmetros%5B%5D=Z\b/);
    expect(result).toMatch(/\byear=2004\b/);
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
