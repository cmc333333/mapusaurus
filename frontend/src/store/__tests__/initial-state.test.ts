import { Set } from "immutable";

import {
  LARFiltersFactory,
  USStateFactory,
} from "../../testUtils/Factory";
import {
  deriveLARLayer,
  deriveViewport,
  toFilterGroup,
  toSelected,
} from "../initial-state";

describe("deriveLARLayer()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLARLayer(
      "county=123&lender=456&metro=789",
      [],
      [2009],
    );
    expect(result.filters.county.selected).toEqual(Set(["123"]));
    expect(result.filters.lender.selected).toEqual(Set(["456"]));
    expect(result.filters.metro.selected).toEqual(Set(["789"]));
  });
  it("defaults to reasonable, empty values", () => {
    const result = deriveLARLayer("", [], [2009, 2008]);
    expect(result.filterGroup).toEqual("homePurchase");
    expect(result.filters.county.selected).toEqual(Set<string>());
    expect(result.filters.lender.selected).toEqual(Set<string>());
    expect(result.filters.lienStatus.selected).toEqual(Set(["1"]));
    expect(result.filters.loanPurpose.selected).toEqual(Set(["1"]));
    expect(result.filters.metro.selected).toEqual(Set<string>());
    expect(result.filters.ownerOccupancy.selected).toEqual(Set(["1"]));
    expect(result.filters.propertyType.selected).toEqual(Set(["1"]));
    expect(result.year).toBe(2009);
  });
  it("loads multiple", () => {
    const result = deriveLARLayer("metro=123,456,789", [], [2009]);
    expect(result.filters.metro.selected).toEqual(Set(["123", "456", "789"]));
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

describe("toFilterGroup()", () => {
  it("can derive homePurchase", () => {
    const filters = LARFiltersFactory.build({}, {
      lienStatusSet: Set(["1"]),
      loanPurposeSet: Set(["1"]),
      ownerOccupancySet: Set(["1"]),
      propertyTypeSet: Set(["1"]),
    });
    expect(toFilterGroup(filters)).toBe("homePurchase");
  });

  it("can derive refinance", () => {
    const filters = LARFiltersFactory.build({}, {
      lienStatusSet: Set(["1"]),
      loanPurposeSet: Set(["3"]),
      ownerOccupancySet: Set(["1"]),
      propertyTypeSet: Set(["1"]),
    });
    expect(toFilterGroup(filters)).toBe("refinance");
  });

  it("defaults to custom", () => {
    const filters = LARFiltersFactory.build({}, {
      loanPurposeSet: Set<string>(),
    });
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
