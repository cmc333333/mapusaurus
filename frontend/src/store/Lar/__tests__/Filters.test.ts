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
            geos: Map([["1234", new Geo("name", -60, -40, 20, 30)]]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(25, 0);
      expect(longitude).toBeCloseTo(-50, 0);
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
              ["1234", new Geo("name", -60, -41, 20, 29)],
              ["2345", new Geo("other", -59, -40, 21, 29)],
              ["3456", new Geo("another", -59, -41, 21, 30)],
            ]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(25, 0);
      expect(longitude).toBeCloseTo(-50, 0);
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
              ["1234", new Geo("name", -60, -40, 30, 20)],
              ["2345", new Geo("ignored", -80, 0, 80, 0)],
            ]),
          }),
        }),
        window: { height: 100, width: 100 },
      });
      await zoomToGeos.action()(dispatch, getState, {});
      expect(dispatch).toHaveBeenCalledTimes(3);
      const { latitude, longitude, zoom } = dispatch.mock.calls[1][0].payload;
      expect(latitude).toBeCloseTo(25, 0);
      expect(longitude).toBeCloseTo(-50, 0);
      expect(zoom).toBeCloseTo(2, 0);
    });
  });
});
