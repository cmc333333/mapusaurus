import axios from "axios";
import { OrderedMap, Set } from "immutable";

import { fetchCounties, fetchMetros } from "../geography";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchCounties()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchCounties(Set(["2012abcd123", "2013bcde234"]));
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/county/");
    expect(["2012abcd123,2013bcde234", "2013bcde234,2012abcd123"])
      .toContain(options.params.geoid__in);
  });

  it("handles empty data", async () => {
    const result = await fetchCounties(Set([]));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(OrderedMap<string, string>());
  });
});

describe("fetchMetros()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchMetros(Set(["2012abcd123", "2013bcde234"]));
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/metro/");
    expect(["2012abcd123,2013bcde234", "2013bcde234,2012abcd123"])
      .toContain(options.params.geoid__in);
  });

  it("handles empty data", async () => {
    const result = await fetchMetros(Set([]));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(OrderedMap<string, string>());
  });
});
