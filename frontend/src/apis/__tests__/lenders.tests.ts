import axios from "axios";

import { fetchLenders, searchLenders } from "../lenders";

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

  it("transforms the result", async () => {
    getMock.mockImplementationOnce(() => ({ data: { results: [
      { institution_id: "abc", name: "AAA" },
      { institution_id: "def", name: "BBB" },
    ]}}));
    const result = await fetchLenders(["2012abcd123"]);

    expect(result).toEqual([
      { entityType: "lender", id: "abc", name: "AAA" },
      { entityType: "lender", id: "def", name: "BBB" },
    ]);
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

    expect(result).toEqual([
      { entityType: "lender", id: "abc", name: "AAA" },
      { entityType: "lender", id: "def", name: "BBB" },
    ]);
  });
});
