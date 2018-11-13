import { fetchLar, LARPoint } from "../../../apis/lar";
import {
  LarFactory,
  LARPointFactory,
  PointsFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import {
  medianSelector,
  reducer,
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

describe("medianSelector", () => {
  it("returns an appropriate median", () => {
    const raw: LARPoint[] = [];
    const points = PointsFactory.build({ raw });
    expect(medianSelector(points)).toBe(NaN);

    raw.push(LARPointFactory.build({ normalizedLoans: 1 }));
    expect(medianSelector({ ...points, raw: [...raw] })).toBe(1);

    raw.push(LARPointFactory.build({ normalizedLoans: 2 }));
    expect(medianSelector({ ...points, raw: [...raw] })).toBe(1);

    raw.push(LARPointFactory.build({ normalizedLoans: 4 }));
    expect(medianSelector({ ...points, raw: [...raw] })).toBe(2);

    raw.push(LARPointFactory.build({ normalizedLoans: 8 }));
    expect(medianSelector({ ...points, raw: [...raw] })).toBe(2);

    raw.push(LARPointFactory.build({ normalizedLoans: 16 }));
    expect(medianSelector({ ...points, raw: [...raw] })).toBe(4);
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
        houseCount: 2000,
        latitude: 33.33,
        loanCount: 5,
        longitude: 44.44,
      }),
    ];
    const points = PointsFactory.build({ raw, scaleFactor: 21 });

    const circles = scatterPlotSelector(points);
    const median = 4 / 1000;
    expect(circles).toEqual([
      {
        position: [22, 11],
        radius: Math.sqrt(4 / 1000 * 21 * 4000 / median) / Math.PI,
      },
      {
        position: [44.44, 33.33],
        radius: Math.sqrt(5 / 2000 * 21 * 4000 / median) / Math.PI,
      },
    ]);
  });
});
