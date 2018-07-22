import axios from "axios";

import { fetchLenders } from "../lenders";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchLenders()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchLenders(["2012abcd123", "2013bcde234"]);
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/respondents/");
    expect(options.params).toEqual({
      institution_id__in: "2012abcd123,2013bcde234",
    });
  });

  it("handles empty data", async () => {
    const result = await fetchLenders([]);
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("creates an action in the right format", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [
      { institution_id: "abc", name: "AAA" },
      { institution_id: "def", name: "BBB" },
    ]}}));
    const result = await fetchLenders(["2012abcd123"]);

    expect(result).toEqual([
      { id: "abc", name: "AAA" },
      { id: "def", name: "BBB" },
    ]);
  });
});
