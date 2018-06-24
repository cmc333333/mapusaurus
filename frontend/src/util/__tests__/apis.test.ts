import axios from "axios";

import { SET_LAR, setLar, setStyle } from "../../store/actions";
import {
  ConfigFactory,
  HMDAFactory,
  MapboxStyleFactory,
  StoreFactory,
} from "../../testUtils/Factory";
import { fetchData, fetchLar, fetchStyle } from "../apis";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchStyle()", () => {
  it("hits the right endpoint", async () => {
    const state = StoreFactory.build({
      config: ConfigFactory.build({
        styleName: "some-style",
        token: "some-token",
      }),
    });
    getMock.mockImplementationOnce(() => ({ data: null }));
    await fetchStyle(state);
    expect(getMock).toHaveBeenCalled();
    const [path, options] = getMock.mock.calls[0];
    expect(path).toMatch(/\bsome-style\b/);
    expect(options).toEqual({ params: { access_token: "some-token" } });
  });

  it("creates an action based on the result", async () => {
    const style = MapboxStyleFactory.build();
    getMock.mockImplementationOnce(() => ({ data: style }));
    const state = StoreFactory.build({
      config: ConfigFactory.build({
        styleName: "some-style",
        token: "some-token",
      }),
    });
    const result = await fetchStyle(StoreFactory.build());
    expect(result).toEqual(setStyle(style));
  });
});

describe("fetchLar()", () => {
  it("hits the right endpoint", async () => {
    const state = StoreFactory.build({
      hmda: HMDAFactory.build({
        config: {
          lender: "2012abcd123",
          metro: "333",
        },
      }),
    });
    getMock.mockImplementationOnce(() => ({ data: {} }));
    await fetchLar(state);
    expect(getMock).toHaveBeenCalled();
    const options = getMock.mock.calls[0][1];
    expect(options.params).toEqual({
      action_taken: "1,2,3,4,5",
      lender: "2012abcd123",
      lh: "false",
      metro: "333",
      peers: "false",
      year: "2012",
    });
  });

  it("handles non-hmda displays", async () => {
    const state = StoreFactory.build();
    delete state.hmda;
    const result = await fetchLar(state);
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(setLar([]));
  });

  it("creates an action in the right format", async () => {
    const state = StoreFactory.build({
      hmda: HMDAFactory.build(),
    });
    getMock.mockImplementationOnce(() => ({
      data: {
        aaaaaaaa: {
          centlat: 3.3,
          centlon: -4.4,
          num_households: 2,
          volume: 1,
        },
        bbbbbbbb: {
          centlat: -7.7,
          centlon: 8.8,
          num_households: 6,
          volume: 5,
        },
        cccccccc: {
          centlat: 11,
          centlon: -12,
          num_households: 10,
          volume: 9,
        },
      } ,
    }));
    const result = await fetchLar(state);

    expect(result.type).toBe(SET_LAR);
    // switch-case for Typescript gymnastics
    switch (result.type) {
      case SET_LAR:
        const lar = (result as any).lar;
        // Ensure a consistent order
        lar.sort((l, r) => l.loanCount - r.loanCount);

        expect(lar).toEqual([
          { houseCount: 2, latitude: 3.3, loanCount: 1, longitude: -4.4 },
          { houseCount: 6, latitude: -7.7, loanCount: 5, longitude: 8.8 },
          { houseCount: 10, latitude: 11, loanCount: 9, longitude: -12 },
        ]);
    }
  });
});
