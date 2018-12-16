import { Map, Set } from "immutable";

import { Geo } from "../../../apis/geography";
import {
  FiltersFactory,
  LarFactory,
  LookupsFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import { reducer, setFilters, zoomToGeos } from "../Filters";

describe("reducer()", () => {
  it("sets the filters", () => {
    const filters = FiltersFactory.build();
    const result = reducer(filters, setFilters({ lender: Set(["bbb", "ddd"]) }));
    expect(result.lender).toEqual(Set(["bbb", "ddd"]));
  });

  describe("zoomToGeos", () => {
    it("does nothing if no geos are present", async () => {
      const dispatch = jest.fn();
      const getState = () => StateFactory.build({
        lar: LarFactory.build({
          filters: FiltersFactory.build({
            county: Set<string>(),
            metro: Set<string>(),
          }),
        }),
      });
      await zoomToGeos.action()(dispatch, getState, {});
      // only called twice (async start, end); no setViewport
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it("works on a single geo", async () => {
      const dispatch = jest.fn();
      const getState = () => StateFactory.build({
        lar: LarFactory.build({
          filters: FiltersFactory.build({
            county: Set(["1234"]),
            metro: Set<string>(),
          }),
          lookups: LookupsFactory.build({
            geos: Map([[
              "1234",
              new Geo("name", { lat: 20, lon: -10 }, { lat: 10, lon: -30 }),
            ]]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(15, 0);
      expect(longitude).toBeCloseTo(-20, 0);
      expect(zoom).toBeCloseTo(2, 0);
    });

    it("works for multiple geos", async () => {
      const dispatch = jest.fn();
      const getState = () => StateFactory.build({
        lar: LarFactory.build({
          filters: FiltersFactory.build({
            county: Set(["1234", "2345"]),
            metro: Set(["3456"]),
          }),
          lookups: LookupsFactory.build({
            geos: Map([
              [
                "1234",
                new Geo("name", { lat: 29, lon: -10 }, { lat: 11, lon: -20 }),
              ],
              [
                "2345",
                new Geo("other", { lat: 29, lon: -11 }, { lat: 10, lon: -19 }),
              ],
              [
                "3456",
                new Geo("another", { lat: 30, lon: -11 }, { lat: 11, lon: -19 }),
              ],
            ]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(20, 0);
      expect(longitude).toBeCloseTo(-15, 0);
      expect(zoom).toBeCloseTo(2, 0);
    });

    it("only cares about selected geos", async () => {
      const dispatch = jest.fn();
      const getState = () => StateFactory.build({
        lar: LarFactory.build({
          filters: FiltersFactory.build({
            county: Set(["1234"]),
            metro: Set<string>(),
          }),
          lookups: LookupsFactory.build({
            geos: Map([
              [
                "1234",
                new Geo("name", { lat: 20, lon: -10 }, { lat: 10, lon: -30 }),
              ],
              [
                "2345",
                new Geo("ignored", { lat: 0, lon: 80 }, { lat: 0, lon: -80 }),
              ],
            ]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(15, 0);
      expect(longitude).toBeCloseTo(-20, 0);
      expect(zoom).toBeCloseTo(2, 0);
    });
  });
});
