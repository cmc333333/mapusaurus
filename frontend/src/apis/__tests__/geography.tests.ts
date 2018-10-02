import axios from "axios";

import { fetchGeos } from "../geography";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchGeos()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchGeos(["2012abcd123", "2013bcde234"]);
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/geo/");
    expect(options.params).toEqual({
      geoid__in: "2012abcd123,2013bcde234",
    });
  });

  it("handles empty data", async () => {
    const result = await fetchGeos([]);
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
