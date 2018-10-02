import { USStateFactory } from "../../testUtils/Factory";
import { deriveLARLayer, deriveViewport } from "../initial-state";

describe("deriveLARLayer()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLARLayer(
      "counties[]=123&lenders[]=456&metros[]=789",
      [],
      [2009],
    );
    expect(result.filters.county).toEqual([{ id: "123" }]);
    expect(result.filters.lender).toEqual([{ id: "456" }]);
    expect(result.filters.metro).toEqual([{ id: "789" }]);
  });
  it("defaults to empty values", () => {
    const result = deriveLARLayer("", [], [2009, 2008]);
    expect(result.filters).toEqual({
      county: [],
      lender: [],
      metro: [],
    });
    expect(result.year).toBe(2009);
  });
  it("loads multiple", () => {
    const result = deriveLARLayer(
      "metros[]=123&metros[]=456&metros[]=789",
      [],
      [2009],
    );
    expect(result.filters.metro).toEqual([
      { id: "123" },
      { id: "456" },
      { id: "789" },
    ]);
  });
  it("loads year", () => {
    const result = deriveLARLayer("year=2012", [], [2014, 2013, 2012, 2010]);
    expect(result.year).toBe(2012);
  });
  it("adds the available states and years", () => {
    const states = USStateFactory.buildList(3);
    const years = [2001, 2008];
    const result = deriveLARLayer("", states, years);
    expect(result.available).toEqual({ states, years });
  });
});

describe("deriveViewport()", () => {
  it("loads viewport data", () => {
    const result = deriveViewport("a=param&latitude=11.111&longitude=22&zoom=3");
    expect(result.latitude).toBe(11.111);
    expect(result.longitude).toBe(22);
    expect(result.zoom).toBe(3);
  });

  it("defaults viewport to Chicago", () => {
    const result = deriveViewport("");
    expect(result.latitude).toBe(41.88);
    expect(result.longitude).toBe(-87.64);
    expect(result.zoom).toBe(13);
  });
});
