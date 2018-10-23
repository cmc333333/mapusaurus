import { fetchLar } from "../../../apis/lar";
import {
  LarFactory,
  LARPointFactory,
  StateFactory,
} from "../../../testUtils/Factory";
import { reducer, scatterPlotSelector, updatePoints } from "../Points";

jest.mock("../../../apis/lar");
const fetchLarMock = fetchLar as jest.Mock; // hack around Jest typing
afterEach(fetchLarMock.mockReset);

describe("reducer()", () => {
  it("clears lar data", () => {
    const result = reducer(
      { raw: LARPointFactory.buildList(3) },
      (updatePoints.async.started as any)(),
    );
    expect(result.raw).toEqual([]);
  });
  it("sets lar data", () => {
    const raw = LARPointFactory.buildList(3);
    const result = reducer(
      { raw: [] },
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

describe("scatterPlotSelector", () => {
  it("transforms the data", () => {
    const raw = [
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

    const circles = scatterPlotSelector({ raw });
    expect(circles).toEqual([
      { radius: 2, position: [22, 11] },
      { radius: 5, position: [44.44, 33.33] },
    ]);
  });
});
