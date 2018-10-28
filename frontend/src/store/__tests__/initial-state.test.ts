import { Set } from "immutable";

import { FiltersFactory } from "../../testUtils/Factory";
import {
  deriveLar,
  deriveViewport,
  toFilterGroup,
  toSelected,
} from "../initial-state";

describe("deriveLar()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLar("county=123&lender=456&metro=789", [2009]);
    expect(result.filters).toMatchObject({
      county: Set(["123"]),
      lender: Set(["456"]),
      metro: Set(["789"]),
    });
  });
  it("defaults to reasonable, empty values", () => {
    const result = deriveLar("", [2009, 2008]);
    expect(result.uiOnly.group).toEqual("homePurchase");
    expect(result.filters).toEqual({
      county: Set<string>(),
      lender: Set<string>(),
      lienStatus: Set(["1"]),
      loanPurpose: Set(["1"]),
      metro: Set<string>(),
      ownerOccupancy: Set(["1"]),
      propertyType: Set(["1"]),
      year: 2009,
    });
  });
  it("loads multiple", () => {
    const result = deriveLar("metro=123,456,789", [2009]);
    expect(result.filters.metro).toEqual(Set(["123", "456", "789"]));
  });
  it("loads year", () => {
    const result = deriveLar("year=2012", [2014, 2013, 2012, 2010]);
    expect(result.filters.year).toBe(2012);
  });
  it("adds the available years", () => {
    const years = [2001, 2008];
    const result = deriveLar("", years);
    expect(result.lookups.years).toEqual(years);
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

describe("toFilterGroup()", () => {
  it("can derive homePurchase", () => {
    const filters = FiltersFactory.build({
      lienStatus: Set(["1"]),
      loanPurpose: Set(["1"]),
      ownerOccupancy: Set(["1"]),
      propertyType: Set(["1"]),
    });
    expect(toFilterGroup(filters)).toBe("homePurchase");
  });

  it("can derive refinance", () => {
    const filters = FiltersFactory.build({
      lienStatus: Set(["1"]),
      loanPurpose: Set(["3"]),
      ownerOccupancy: Set(["1"]),
      propertyType: Set(["1"]),
    });
    expect(toFilterGroup(filters)).toBe("refinance");
  });

  it("defaults to custom", () => {
    const filters = FiltersFactory.build({ loanPurpose: Set<string>() });
    expect(toFilterGroup(filters)).toBe("custom");
  });
});

describe("toSelected()", () => {
  it("handles undefined", () => {
    expect(toSelected(undefined)).toEqual(Set<string>());
  });

  it("handles empty strings", () => {
    expect(toSelected("")).toEqual(Set<string>());
  });

  it("splits on commas", () => {
    expect(toSelected("1,4,7")).toEqual(Set(["1", "4", "7"]));
  });
});
