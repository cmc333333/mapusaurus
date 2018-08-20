import { Map } from "immutable";

import { fetchLar } from "../../apis/lar";
import {
  CountyFactory,
  LARLayerFactory,
  LARPointFactory,
  LenderFactory,
  MetroFactory,
  StateFactory,
} from "../../testUtils/Factory";
import LARLayer, {
  addFilters,
  reducer,
  removeFilter,
  scatterPlotSelector,
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
      const result = reducer(
        layer,
        (addFilters.async.started as any)(LenderFactory.buildList(3)),
      );
      expect(result.lar).toEqual([]);
    });

    it("adds the filters", () => {
      const layer = LARLayerFactory.build({
        filters: [
          LenderFactory.build({ id: "aaa", name: "AAA" }),
          LenderFactory.build({ id: "ccc", name: "CCC" }),
        ],
      });
      const toAdd = [
        LenderFactory.build({ id: "bbb", name: "BBB" }),
        LenderFactory.build({ id: "ccc", name: "CCC Prime" }),
        LenderFactory.build({ id: "ddd", name: "DDD" }),
      ];
      const result = reducer(
        layer,
        (addFilters.async.started as any)(toAdd),
      );
      expect(result.filters.map(f => f.name))
        .toEqual(["AAA", "BBB", "CCC Prime", "DDD"]);
    });
  });

  describe("removing a filter", () => {
    it("clears lar", () => {
      const layer = LARLayerFactory.build({
        lar: LARPointFactory.buildList(2),
      });
      const result = reducer(
        layer,
        (removeFilter.async.started as any)(LenderFactory.build()),
      );
      expect(result.lar).toEqual([]);
    });

    it("removes the filter", () => {
      const layer = LARLayerFactory.build({
        filters: [
          LenderFactory.build({ id: "aaa", name: "AAA" }),
          LenderFactory.build({ id: "ccc", name: "CCC" }),
        ],
      });
      const result = reducer(
        layer,
        (removeFilter.async.started as any)(layer.filters[0]),
      );
      expect(result.filters.map(f => f.name)).toEqual(["CCC"]);
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
        years: [2012, 2010, 2008],
      },
      filters: LenderFactory.buildList(3),
      lar: LARPointFactory.buildList(10),
      year: 2010,
    });
    const result = reducer(larLayer, setYear(2008));
    expect(result.filters).toEqual([]);
    expect(result.lar).toEqual([]);
    expect(result.year).toBe(2008);
    expect(result.available.years).toEqual([2012, 2010, 2008]);
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
    CountyFactory.build({ name: "countyA" }),
    CountyFactory.build({ name: "countyB" }),
  ];
  const lenderB = LenderFactory.build({ id: "b", name: "lenderB" });
  const metro = MetroFactory.build({ name: "metroA" });
  const larLayer = LARLayerFactory.build({
    filters: [...counties, lenderB, metro],
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const lenderC = LenderFactory.build({ id: "c", name: "lenderC" });
    const action = addFilters.action([lenderC]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      ["b", "c"],
      [metro.id],
    );
  });

  it("adds the filters", async () => {
    const lender = LenderFactory.build();
    const county = CountyFactory.build();
    const action = addFilters.action([lender, county]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock.mock.calls[0][0]).toContain(county.id);
    expect(fetchLarMock.mock.calls[0][1]).toContain(lender.id);
  });

  it("can be present already", async () => {
    const replacement = LenderFactory.build({ id: "b" });
    const action = addFilters.action([replacement]) as any;
    await action(jest.fn(), getState);
    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      ["b"],
      [metro.id],
    );
  });

  it("keeps the filters sorted", async () => {
    const lenderA = LenderFactory.build({ name: "A" });
    const action = addFilters.action([lenderA]) as any;
    await action(jest.fn(), getState);
    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      [lenderA.id, "b"],
      [metro.id],
    );
  });
});

describe("removeFilter()", () => {
  const counties = CountyFactory.buildList(2);
  const lenders = LenderFactory.buildList(2);
  const metros = [MetroFactory.build({ entityType: "metro" })];

  const larLayer = LARLayerFactory.build({
    filters: [...counties, ...lenders, ...metros],
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const action = removeFilter.action(lenders[0]) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      [lenders[1].id],
      [metros[0].id],
    );
  });

  it("doesn't have to be present", async () => {
    const action = removeFilter.action(LenderFactory.build()) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      [lenders[0].id, lenders[1].id],
      [metros[0].id],
    );
  });
});
