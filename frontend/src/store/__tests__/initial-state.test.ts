import { deriveLARLayer, deriveViewport } from "../initial-state";

describe("deriveLARLayer()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLARLayer(
      "counties[]=123&lenders[]=456&metros[]=789",
      [2009],
    );
    expect(result.filters).toEqual([
      { entityType: "county", id: "123" },
      { entityType: "lender", id: "456" },
      { entityType: "metro", id: "789" },
    ]);
  });
  it("defaults to empty values", () => {
    const result = deriveLARLayer("", [2009, 2008]);
    expect(result.filters).toEqual([]);
    expect(result.year).toBe(2009);
  });
  it("loads multiple", () => {
    const result = deriveLARLayer(
      "metros[]=123&metros[]=456&metros[]=789",
      [2009],
    );
    expect(result.filters).toEqual([
      { entityType: "metro", id: "123" },
      { entityType: "metro", id: "456" },
      { entityType: "metro", id: "789" },
    ]);
  });
  it("loads year", () => {
    const result = deriveLARLayer("year=2012", [2014, 2013, 2012, 2010]);
    expect(result.year).toBe(2012);
  });
});

describe("deriveViewport()", () => {
  it("loads viewport data", () => {
    const result = deriveViewport("a=param&latitude=11.111&longitude=22&zoom=3");
    expect(result.latitude).toBe(11.111);
    expect(result.longitude).toBe(22);
    expect(result.zoom).toBe(3);
  });

  it("defaults viewport to NaNs", () => {
    const result = deriveViewport("");
    expect(result.latitude).toBe(NaN);
    expect(result.longitude).toBe(NaN);
    expect(result.zoom).toBe(NaN);
  });
});
