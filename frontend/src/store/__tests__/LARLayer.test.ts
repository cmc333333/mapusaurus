import { Map, Set } from "immutable";

import { Geo } from "../../apis/geography";
import { fetchLar } from "../../apis/lar";
import {
  LARFiltersFactory,
  LARLayerFactory,
  LARPointFactory,
  StateFactory,
} from "../../testUtils/Factory";
import LARLayer, {
  homePurchase,
  reducer,
  refinance,
  scatterPlotSelector,
  selectFilters,
  setFilterGroup,
  setStateFips,
  setYear,
  zoomToGeos,
} from "../LARLayer";
import { setViewport } from "../Viewport";

jest.mock("../../apis/lar");

const fetchLarMock = fetchLar as jest.Mock; // hack around Jest typing

afterEach(fetchLarMock.mockReset);

describe("reducer()", () => {
  describe("setting lar data", () => {
    const lar = LARPointFactory.buildList(3);
    const result = reducer(
      LARLayerFactory.build(),
      (selectFilters.async.done as any)({ result: lar }),
    );
    expect(result.lar).toEqual(lar);
  });

  describe("setting year", () => {
    const larLayer = LARLayerFactory.build({
      available: {
        states: [
          { fips: "01", name: "Alabama" },
          { fips: "10", name: "Deleware" },
        ],
        years: [2012, 2010, 2008],
      },
      lar: LARPointFactory.buildList(10),
      year: 2010,
    });
    expect(larLayer.filters.county.selected.size).toBeGreaterThan(0);
    expect(larLayer.filters.lender.selected.size).toBeGreaterThan(0);
    expect(larLayer.filters.metro.selected.size).toBeGreaterThan(0);
    const result = reducer(larLayer, setYear(2008));
    expect(result.filters.county.selected.size).toBe(0);
    expect(result.filters.lender.selected.size).toBe(0);
    expect(result.filters.metro.selected.size).toBe(0);
    expect(result.lar).toEqual([]);
    expect(result.year).toBe(2008);
    expect(result.available.years).toEqual([2012, 2010, 2008]);
  });

  describe("setting fips", () => {
    const larLayer = LARLayerFactory.build({ stateFips: "22" });
    const result = reducer(larLayer, setStateFips("31"));
    expect(result.stateFips).toEqual("31");
  });

  describe("setting filters", () => {
    it("clears lar", () => {
      const layer = LARLayerFactory.build({
        lar: LARPointFactory.buildList(2),
      });
      const result = reducer(layer, (selectFilters.async.started as any)({
        lender: Set(["4444", "2222", "6666"]),
      }));
      expect(result.lar).toEqual([]);
    });

    it("sets the filters", () => {
      const layer = LARLayerFactory.build();
      const result = reducer(layer, (selectFilters.async.started as any)({
        lender: Set(["bbb", "ddd"]),
      }));
      expect(result.filters.lender.selected).toEqual(Set(["bbb", "ddd"]));
    });
  });

  describe("setting filterGroup", () => {
    it("immediately sets the filterGroup", () => {
      const layer = LARLayerFactory.build({ filterGroup: "custom" });
      const result = reducer(
        layer,
        (setFilterGroup.async.started as any)("refinance"),
      );
      expect(result.filterGroup).toBe("refinance");
    });
    it("also dispatches a call to selectFilters for homePurchase", async () => {
      const [outerDisp, innerDisp] = [jest.fn(), jest.fn()];
      await setFilterGroup.action("homePurchase")(outerDisp, jest.fn(), {});
      expect(outerDisp).toHaveBeenCalledTimes(3);

      await outerDisp.mock.calls[1][0](
        innerDisp,
        () => StateFactory.build(),
        {},
      );
      expect(innerDisp).toHaveBeenCalledTimes(2);
      expect(innerDisp.mock.calls[0]).toEqual([
        (selectFilters.async.started as any)(homePurchase),
      ]);
    });
    it("also dispatches a call to setFilters for refinance", async () => {
      const [outerDisp, innerDisp] = [jest.fn(), jest.fn()];
      await setFilterGroup.action("refinance")(outerDisp, jest.fn(), {});
      expect(outerDisp).toHaveBeenCalledTimes(3);

      await outerDisp.mock.calls[1][0](
        innerDisp,
        () => StateFactory.build(),
        {},
      );
      expect(innerDisp).toHaveBeenCalledTimes(2);
      expect(innerDisp.mock.calls[0]).toEqual([
        (selectFilters.async.started as any)(refinance),
      ]);
    });
    it("does not dispatches a call to setFilters for custom", async () => {
      const dispatch = jest.fn();
      await setFilterGroup.action("custom")(dispatch, jest.fn(), {});
      expect(dispatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("zoomToGeos", () => {
    it("does nothing if no geos are present", async () => {
      const dispatch = jest.fn();
      const getState = () => StateFactory.build({
        larLayer: LARLayerFactory.build({
          filters: LARFiltersFactory.build({}, {
            countySet: { options: Map<string, Geo>(), selected: Set<string>() },
            metroSet: { options: Map<string, Geo>(), selected: Set<string>() },
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
        larLayer: LARLayerFactory.build({
          filters: LARFiltersFactory.build({}, {
            countySet: {
              options: Map([["1234", new Geo("name", -60, -40, 20, 30)]]),
              selected: Set(["1234"]),
            },
            metroSet: { options: Map<string, Geo>(), selected: Set<string>() },
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
        larLayer: LARLayerFactory.build({
          filters: LARFiltersFactory.build({}, {
            countySet: {
              options: Map([
                ["1234", new Geo("name", -60, -41, 20, 29)],
                ["2345", new Geo("other", -59, -40, 21, 29)],
              ]),
              selected: Set(["1234", "2345"]),
            },
            metroSet: {
              options: Map([
                ["3456", new Geo("another", -59, -41, 21, 30)],
              ]),
              selected: Set(["3456"]),
            },
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
        larLayer: LARLayerFactory.build({
          filters: LARFiltersFactory.build({}, {
            countySet: {
              options: Map([
                ["1234", new Geo("name", -60, -40, 30, 20)],
                ["2345", new Geo("ignored", -80, 0, 80, 0)],
              ]),
              selected: Set(["1234"]),
            },
            metroSet: { options: Map<string, Geo>(), selected: Set<string>() },
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

describe("scatterPlotSelector", () => {
  it("transforms the data", () => {
    const lar = [
      LARPointFactory.build({
        houseCount: 1,
        latitude: 11,
        loanCount: 4,
        longitude: 22,
      }),
      LARPointFactory.build({
        houseCount: 3,
        latitude: 33.33,
        loanCount: 75,
        longitude: 44.44,
      }),
    ];

    const circles = scatterPlotSelector(LARLayerFactory.build({ lar }));
    expect(circles).toEqual([
      { radius: 2, position: [22, 11] },
      { radius: 5, position: [44.44, 33.33] },
    ]);
  });
});

test("selectFilters() triggers a fetch with appropriate params", async () => {
  const larLayer = LARLayerFactory.build({
    filters: LARFiltersFactory.build({}, {
      countySet: {
        options: Map([["1", "countyA"], ["2", "countyB"]]),
        selected: Set(["1", "2"]),
      },
      lenderSet: {
        options: Map([["b", "lenderB"], ["c", "lenderC"]]),
        selected: Set(["b"]),
      },
      lienStatusSet: Set<string>(),
      loanPurposeSet: Set(["1", "2"]),
      metroSet: {
        options: Map([["3", "metroA"]]),
        selected: Set(["3"]),
      },
      ownerOccupancySet: Set<string>(),
      propertyTypeSet: Set(["3"]),
    }),
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));
  const action: any = selectFilters.action({
    county: Set(["1"]),
    lender: Set(["b", "c"]),
  });
  await action(jest.fn(), getState);

  expect(fetchLarMock).toHaveBeenCalledWith({
    county: Set(["1"]),
    lender: Set(["b", "c"]),
    lienStatus: Set<string>(),
    loanPurpose: Set(["1", "2"]),
    metro: Set(["3"]),
    ownerOccupancy: Set<string>(),
    propertyType: Set(["3"]),
  });
});
