import axios from "axios";

import { setStyle } from "../../store/actions";
import {
  ConfigFactory,
  MapboxStyleFactory,
  StoreFactory,
} from "../../testUtils/Factory";
import { fetchData, fetchStyle } from "../apis";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

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
    const url = getMock.mock.calls[0][0];
    expect(url).toMatch(/\bsome-style\b/);
    expect(url).toMatch(/\baccess_token=some-token\b/);
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
