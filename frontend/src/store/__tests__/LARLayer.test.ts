import { Map } from "immutable";

import { fetchLar } from "../../apis/lar";
import {
  GeoFactory,
  LARLayerFactory,
  LARPointFactory,
  LenderFactory,
  StateFactory,
} from "../../testUtils/Factory";
import LARLayer, {
  addLender,
  reducer,
  removeLender,
  scatterPlotSelector,
  setCounties,
  setLarData,
  setLenders,
  setMetros,
} from "../LARLayer";

jest.mock("../../apis/lar");

const fetchLarMock = fetchLar as jest.Mock<{}>;

describe("reducer()", () => {
  it("sets lar data", () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];

    const result = reducer(LARLayerFactory.build(), setLarData(lar));
    expect(result.lar).toEqual(lar);
  });

  it("sets counties", () => {
    const counties = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setCounties(counties));
    expect(result.counties).toEqual(counties);
  });

  it("sets lenders", () => {
    const lenders = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setLenders(lenders));
    expect(result.lenders).toEqual(lenders);
  });

  it("sets metros", () => {
    const metros = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setMetros(metros));
    expect(result.metros).toEqual(metros);
  });

  [addLender.async.started, removeLender.async.started].forEach(action => {
    it(`clears lar for ${action}`, () => {
      const lar = [LARPointFactory.build(), LARPointFactory.build()];
      const result = reducer(LARLayerFactory.build({ lar }), action);
      expect(result.lar).toEqual([]);
    });
  });

  [addLender.async.done, removeLender.async.done].forEach(action => {
    it(`sets lenders when ${action}`, () => {
      const lenders = [LenderFactory.build(), LenderFactory.build()];
      const result = reducer(
        LARLayerFactory.build({ lender: [] }),
        (action as any)({ result: lenders }),
      );
      expect(result.lenders).toEqual(lenders);
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

describe("addLender()", () => {
  const counties = [GeoFactory.build(), GeoFactory.build()];
  const lenderB = LenderFactory.build({ id: "b", name: "B" });
  const metros = [GeoFactory.build()];

  const larLayer = LARLayerFactory.build({
    counties,
    metros,
    lenders: [lenderB],
  });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const lenderC = LenderFactory.build({ id: "c", name: "C" });
    const action = addLender.action(lenderC) as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      ["b", "c"],
      [metros[0].id],
    );
  });

  it("adds the lender", async () => {
    const lender = LenderFactory.build();
    const action = addLender.action(lender) as any;
    const result = await action(jest.fn(), getState);

    expect(result).toContain(lender);
  });

  it("can be present already", async () => {
    const replacement = LenderFactory.build({ id: "b" });
    const action = addLender.action(replacement) as any;
    const result = await action(jest.fn(), getState);

    expect(result).toEqual([replacement]);
  });

  it("keeps the lenders sorted", async () => {
    const lenderA = LenderFactory.build({ name: "A" });
    const action = addLender.action(lenderA) as any;
    const result = await action(jest.fn(), getState);

    expect(result).toEqual([lenderA, lenderB]);
  });

  it("dispatches setLarData results", async () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];
    fetchLarMock.mockReturnValueOnce(lar);
    const dispatch = jest.fn();
    const action = addLender.action(LenderFactory.build()) as any;
    await action(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith(setLarData(lar));
  });
});

describe("removeLender()", () => {
  const counties = [GeoFactory.build(), GeoFactory.build()];
  const lenders = [LenderFactory.build({ id: "b" }), LenderFactory.build()];
  const metros = [GeoFactory.build()];

  const larLayer = LARLayerFactory.build({ counties, lenders, metros });
  const getState = jest.fn(() => StateFactory.build({ larLayer }));

  it("triggers a fetch with appropriate params", async () => {
    const action = removeLender.action("b") as any;
    await action(jest.fn(), getState);

    expect(fetchLarMock).toHaveBeenCalledWith(
      [counties[0].id, counties[1].id],
      [lenders[1].id],
      [metros[0].id],
    );
  });

  it("removes the lender", async () => {
    const action = removeLender.action("b") as any;
    const result = await action(jest.fn(), getState);

    expect(result).toEqual([lenders[1]]);
  });

  it("doesn't have to be present", async () => {
    const action = removeLender.action("not-present") as any;
    const result = await action(jest.fn(), getState);

    expect(result).toEqual(lenders);
  });

  it("dispatches setLarData results", async () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];
    fetchLarMock.mockReturnValueOnce(lar);
    const dispatch = jest.fn();
    const action = removeLender.action("b") as any;
    await action(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith(setLarData(lar));
  });
});
