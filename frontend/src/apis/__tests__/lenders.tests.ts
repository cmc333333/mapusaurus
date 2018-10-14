import axios from "axios";
import { Map, Set } from "immutable";

import { fetchLenders, searchLenders } from "../lenders";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchLenders()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
    await fetchLenders(Set(["2012abcd123", "2013bcde234"]));
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/api/respondents/");
    expect(["2012abcd123,2013bcde234", "2013bcde234,2012abcd123"])
      .toContain(options.params.institution_id__in);
  });

  it("handles empty data", async () => {
    const result = await fetchLenders(Set([]));
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(Map<string, string>());
  });

  it("transforms the result", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [
      { institution_id: "abc", name: "AAA" },
      { institution_id: "def", name: "BBB" },
    ]}}));
    const result = await fetchLenders(Set(["2012abcd123"]));

    expect(result).toEqual(Map([["abc", "AAA"], ["def", "BBB"]]));
  });
});

describe("searchLenders()", () => {
  it("hits the right endpoint", async () => {
    getMock.mockImplementationOnce(() => ({ data: { institutions: [] } }));
    await searchLenders("abcd", 2020);
    expect(getMock).toHaveBeenCalled();
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe("/institutions/search/");
    expect(options.params).toEqual({
      auto: 1,
      q: "abcd",
      year: 2020,
    });
  });

  it("transforms the result", async () => {
    getMock.mockImplementationOnce(() => ({ data: { institutions: [
      { institution_id: "abc", name: "AAA" },
      { institution_id: "def", name: "BBB" },
    ]}}));
    const result = await searchLenders("1234", 2000);

    expect(result).toEqual(Map([["abc", "AAA"], ["def", "BBB"]]));
  });
});
