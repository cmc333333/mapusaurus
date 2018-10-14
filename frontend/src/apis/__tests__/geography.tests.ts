import axios from "axios";
import { Map, Set } from "immutable";

import { fetchGeos } from "../geography";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchGeos()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchGeos(Set(["2012abcd123", "2013bcde234"]));
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/geo/");
    expect(["2012abcd123,2013bcde234", "2013bcde234,2012abcd123"])
      .toContain(options.params.geoid__in);
  });

  it("handles empty data", async () => {
    const result = await fetchGeos(Set([]));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(Map<string, string>());
  });
});
