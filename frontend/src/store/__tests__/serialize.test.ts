import { Set } from "immutable";
import * as qs from "qs";

import {
  CountyFactory,
  LARLayerFactory,
  LenderFactory,
  MetroFactory,
  StateFactory,
  ViewportFactory,
} from "../../testUtils/Factory";
import serialize, { setupSerialization } from "../serialize";

describe("serialize()", () => {
  it("serializes the viewport, ignoring other args", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({ filters: [] }),
      viewport: ViewportFactory.build({
        latitude: 44,
        longitude: 55.55,
        zoom: 6,
      }),
    }));

    expect(qs.parse(result)).toEqual({
      latitude: "44",
      longitude: "55.55",
      zoom: "6",
    });
  });

  it("serializes lar config", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({
        filters: [
          CountyFactory.build({ id: "aaa" }),
          CountyFactory.build({ id: "bbb" }),
          CountyFactory.build({ id: "ccc" }),
          LenderFactory.build({ id: "12" }),
          LenderFactory.build({ id: "34" }),
          MetroFactory.build({ id: "Z" }),
        ],
      }),
    }));
    expect(result).toMatch(/\bcounties%5B%5D=aaa\b/);
    expect(result).toMatch(/\bcounties%5B%5D=bbb\b/);
    expect(result).toMatch(/\bcounties%5B%5D=ccc\b/);
    expect(result).toMatch(/\blenders%5B%5D=12\b/);
    expect(result).toMatch(/\blenders%5B%5D=34\b/);
    expect(result).toMatch(/\bmetros%5B%5D=Z\b/);
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
