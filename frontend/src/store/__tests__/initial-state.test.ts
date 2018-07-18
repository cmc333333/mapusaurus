import { Set } from "immutable";

import { deriveLARLayer, deriveViewport } from "../initial-state";

describe("deriveLARLayer()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLARLayer("counties[]=123&lenders[]=456&metros[]=789");
    expect(result.config).toEqual({
      counties: Set<string>(["123"]),
      lenders: Set<string>(["456"]),
      metros: Set<string>(["789"]),
    });
  });
  it("defaults to empty values", () => {
    const result = deriveLARLayer("");
    expect(result.config).toEqual({
      counties: Set<string>([]),
      lenders: Set<string>([]),
      metros: Set<string>([]),
    });
  });
  it("loads multiple", () => {
    const result = deriveLARLayer("metros[]=123&metros[]=456&metros[]=789");
    expect(result.config).toEqual({
      counties: Set<string>([]),
      lenders: Set<string>([]),
      metros: Set<string>(["123", "456", "789"]),
    });
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
