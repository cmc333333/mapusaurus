import { Map } from "immutable";

import { fetchLar } from "../../apis/lar";
import {
  FiltersFactory,
  FilterValueFactory,
  LARLayerFactory,
  LARPointFactory,
  StateFactory,
} from "../../testUtils/Factory";
import LARLayer, {
  addFilters,
  reducer,
  removeFilter,
  scatterPlotSelector,
  setFilters,
  setStateFips,
  setYear,
} from "../LARLayer";

jest.mock("../../apis/lar");

const fetchLarMock = fetchLar as jest.Mock; // hack around Jest typing

afterEach(fetchLarMock.mockReset);

describe("reducer()", () => {
  describe("adding filters", () => {
    it("clears lar", () => {
      const layer = LARLayerFactory.build({
        lar: LARPointFactory.buildList(2),
      });
      const result = reducer(layer, (addFilters.async.started as any)([
        "lender",
        FilterValueFactory.buildList(3),
      ]));
      expect(result.lar).toEqual([]);
    });

    it("adds the filters", () => {
      const layer = LARLayerFactory.build({
        filters: FiltersFactory.build({
          lender: [
            FilterValueFactory.build({ id: "aaa", name: "AAA" }),
            FilterValueFactory.build({ id: "ccc", name: "CCC" }),
          ],
        }),
      });
      const result = reducer(layer, (addFilters.async.started as any)([
        "lender",
        [
          FilterValueFactory.build({ id: "bbb", name: "BBB" }),
          FilterValueFactory.build({ id: "ccc", name: "CCC Prime" }),
          FilterValueFactory.build({ id: "ddd", name: "DDD" }),
        ],
      ]));
      expect(result.filters.lender.map(f => f.name))
        .toEqual(["AAA", "BBB", "CCC Prime", "DDD"]);
    });
  });

  describe("removing a filter", () => {
    it("clears lar", () => {
      const layer = LARLayerFactory.build({
        lar: LARPointFactory.buildList(2),
      });
      const result = reducer(layer, (removeFilter.async.started as any)([
        "lender",
        "should-not-match-anything",
      ]));
      expect(result.lar).toEqual([]);
    });

    it("removes the filter", () => {
      const layer = LARLayerFactory.build({
        filters: FiltersFactory.build({
          lender: [
            FilterValueFactory.build({ id: "aaa", name: "AAA" }),
            FilterValueFactory.build({ id: "ccc", name: "CCC" }),
          ],
        }),
      });
      const result = reducer(layer, (removeFilter.async.started as any)([
        "lender",
        layer.filters.lender[0].id,
      ]));
      expect(result.filters.lender.map(f => f.name)).toEqual(["CCC"]);
    });
  });

  describe("setting lar data", () => {
    const lar = LARPointFactory.buildList(3);
    [addFilters.async.done, removeFilter.async.done].forEach(action => {
      it(`happens for ${action}`, () => {
        const result = reducer(
          LARLayerFactory.build(),
          (action as any)({ result: lar }),
        );
        expect(result.lar).toEqual(lar);
      });
    });
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
      filters: FiltersFactory.build({
        lender: FilterValueFactory.buildList(3),
      }),
      lar: LARPointFactory.buildList(10),
      year: 2010,
    });
    const result = reducer(larLayer, setYear(2008));
    expect(result.filters.county).toEqual([]);
    expect(result.filters.lender).toEqual([]);
    expect(result.filters.metro).toEqual([]);
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
      const result = reducer(layer, (setFilters.async.started as any)({
        lender: FilterValueFactory.buildList(3),
      }));
      expect(result.lar).toEqual([]);
    });

    it("sets the filters", () => {
      const layer = LARLayerFactory.build({
        filters: FiltersFactory.build({
          lender: [
            FilterValueFactory.build({ id: "aaa", name: "AAA" }),
            FilterValueFactory.build({ id: "ccc", name: "CCC" }),
          ],
        }),
      });
      const result = reducer(layer, (setFilters.async.started as any)({
        lender: [
          FilterValueFactory.build({ id: "bbb", name: "BBB" }),
          FilterValueFactory.build({ id: "ccc", name: "CCC Prime" }),
          FilterValueFactory.build({ id: "ddd", name: "DDD" }),
        ],
      }));
      expect(result.filters.lender.map(f => f.name))
        .toEqual(["BBB", "CCC Prime", "DDD"]);
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

describe("addFilters()", () => {
  const counties = [
    FilterValueFactory.build({ name: "countyA" }),
    FilterValueFactory.build({ name: "countyB" }),
  ];
  const lenderB = FilterValueFactory.build({ id: "b", name: "lenderB" });
  const metro = FilterValueFactory.build({ name: "metroA" });
  const larLayer = LARLayerFactory.build({
    filters: FiltersFactory.build({
      county: counties,
      lender: [lenderB],
      metro: [metro],
    }),
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const lenderC = FilterValueFactory.build({ id: "c", name: "lenderC" });
    const action = addFilters.action(["lender", [lenderC]]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith({
      county: [counties[0].id, counties[1].id],
      lender: ["b", "c"],
      metro: [metro.id],
    });
  });

  it("adds the filters", async () => {
    const [lender, county] = FilterValueFactory.buildList(2);
    const action = addFilters.action(["lender", [lender]]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock.mock.calls[0][0].lender).toContain(lender.id);
    expect(fetchLarMock.mock.calls[0][0].county).not.toContain(county.id);
  });

  it("can be present already", async () => {
    const replacement = FilterValueFactory.build({ id: "b" });
    const action = addFilters.action(["lender", [replacement]]) as any;
    await action(jest.fn(), getState);
    expect(fetchLarMock).toHaveBeenCalledWith({
      county: [counties[0].id, counties[1].id],
      lender: ["b"],
      metro: [metro.id],
    });
  });

  it("keeps the filters sorted", async () => {
    const lenderA = FilterValueFactory.build({ name: "A" });
    const action = addFilters.action(["lender", [lenderA]]) as any;
    await action(jest.fn(), getState);
    expect(fetchLarMock).toHaveBeenCalledWith({
      county: [counties[0].id, counties[1].id],
      lender: [lenderA.id, "b"],
      metro: [metro.id],
    });
  });
});

describe("removeFilter()", () => {
  const counties = FilterValueFactory.buildList(2);
  const lenders = FilterValueFactory.buildList(2);
  const metros = FilterValueFactory.buildList(1);

  const larLayer = LARLayerFactory.build({
    filters: FiltersFactory.build({
      county: counties,
      lender: lenders,
      metro: metros,
    }),
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const action = removeFilter.action(["lender", lenders[0].id]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith({
      county: counties.map(c => c.id),
      lender: [lenders[1].id],
      metro: metros.map(m => m.id),
    });
  });

  it("doesn't have to be present", async () => {
    const action = removeFilter.action(["lender", "something-here"]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith({
      county: counties.map(c => c.id),
      lender: lenders.map(l => l.id),
      metro: metros.map(m => m.id),
    });
  });
});
