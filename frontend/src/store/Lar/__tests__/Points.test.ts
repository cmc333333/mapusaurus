import { fetchLar, LARPoint } from "../../../apis/lar";
import {
  LarFactory,
  LARPointFactory,
  PointsFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import {
  radius,
  reducer,
  scalarSelector,
  scatterPlotSelector,
  updatePoints,
} from "../Points";

jest.mock("../../../apis/lar");
const fetchLarMock = fetchLar as jest.Mock; // hack around Jest typing
afterEach(fetchLarMock.mockReset);

describe("reducer()", () => {
  it("clears lar data", () => {
    const result = reducer(
      PointsFactory.build({ raw: LARPointFactory.buildList(3) }),
      (updatePoints.async.started as any)(),
    );
    expect(result.raw).toEqual([]);
  });
  it("sets lar data", () => {
    const raw = LARPointFactory.buildList(3);
    const result = reducer(
      PointsFactory.build({ raw: [] }),
      (updatePoints.async.done as any)({ result: raw }),
    );
    expect(result.raw).toEqual(raw);
  });
});

test("updatePoints() triggers a fetch with appropriate params", async () => {
  const lar = LarFactory.build();
  const getState = jest.fn(() => StateFactory.build({ lar }));
  const action: any = updatePoints.action();
  await action(jest.fn(), getState);

  expect(fetchLarMock).toHaveBeenCalledWith(lar.filters);
});

describe("scalarSelector", () => {
  it("returns an appropriate median", () => {
    const raw: LARPoint[] = [];
    // Remove the 250 offset
    const mkPts = () => PointsFactory.build({ raw, scaleFactor: -250 });
    expect(scalarSelector(mkPts())).toBe(NaN);

    raw.push(LARPointFactory.build({ normalizedLoans: 1 }));
    expect(scalarSelector(mkPts())).toBe(1);

    raw.push(LARPointFactory.build({ normalizedLoans: 2 }));
    expect(scalarSelector(mkPts())).toBe(1);

    raw.push(LARPointFactory.build({ normalizedLoans: 4 }));
    expect(scalarSelector(mkPts())).toBe(2);

    raw.push(LARPointFactory.build({ normalizedLoans: 8 }));
    expect(scalarSelector(mkPts())).toBe(2);

    raw.push(LARPointFactory.build({ normalizedLoans: 16 }));
    expect(scalarSelector(mkPts())).toBe(4);
  });

  it("uses the scaleFactor", () => {
    let points = PointsFactory.build({
      raw: [LARPointFactory.build({ normalizedLoans: 1 })],
      scaleFactor: 0,
    });
    expect(scalarSelector(points)).toBe(Math.pow(1.1, 250));

    points = { ...points, scaleFactor: 100 };
    expect(scalarSelector(points)).toBe(Math.pow(1.1, 350));
  });
});

describe("scatterPlotSelector", () => {
  it("transforms the data", () => {
    const raw = [
      LARPointFactory.build({
        houseCount: 1000,
        latitude: 11,
        loanCount: 4,
        longitude: 22,
      }),
      LARPointFactory.build({
        houseCount: 1000,
        latitude: 33.33,
        loanCount: 5,
        longitude: 44.44,
      }),
    ];
    const points = PointsFactory.build({ raw });
    const scalar = scalarSelector(points);

    const circles = scatterPlotSelector(points);
    expect(circles).toEqual([
      { radius: radius((4 / 1000) * scalar), position: [22, 11] },
      { radius: radius((5 / 1000) * scalar), position: [44.44, 33.33] },
    ]);
  });
});
