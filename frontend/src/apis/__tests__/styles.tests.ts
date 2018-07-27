import axios from "axios";

import { MapboxStyleFactory } from "../../testUtils/Factory";
import { fetchStyle } from "../styles";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchStyle()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: null }));
    await fetchStyle("some-style", "some-token");
    expect(getMock).toHaveBeenCalled();
    const [path, options] = getMock.mock.calls[0];
    expect(path).toMatch(/\bsome-style\b/);
    expect(options).toEqual({ params: { access_token: "some-token" } });
  });

  it("creates an action based on the result", async () => {
    const style = MapboxStyleFactory.build();
    getMock.mockImplementationOnce(() => ({ data: style }));
    expect(await fetchStyle("a", "b")).toEqual(style);
  });
});
