import { choiceLookup, filterChoices, FilterValue } from "../../store/LARLayer";
import {
  FilterValueFactory,
  LARFilterFactory,
  USStateFactory,
} from "../../testUtils/Factory";
import {
  deriveLARLayer,
  deriveViewport,
  toFilterGroup,
  toFilterValues,
} from "../initial-state";

describe("deriveLARLayer()", () => {
  it("loads county, lender, and metro", () => {
    const result = deriveLARLayer(
      "county=123&lender=456&metro=789",
      [],
      [2009],
    );
    expect(result.filters.county).toEqual([{ id: "123" }]);
    expect(result.filters.lender).toEqual([{ id: "456" }]);
    expect(result.filters.metro).toEqual([{ id: "789" }]);
  });
  it("defaults to reasonable, empty values", () => {
    const result = deriveLARLayer("", [], [2009, 2008]);
    expect(result.filterGroup).toEqual("homePurchase");
    expect(result.filters).toEqual({
      county: [],
      lender: [],
      lienStatus: [filterChoices.get("lienStatus").choices[0]],
      loanPurpose: [filterChoices.get("loanPurpose").choices[0]],
      metro: [],
      ownerOccupancy: [filterChoices.get("ownerOccupancy").choices[0]],
      propertyType: [filterChoices.get("propertyType").choices[0]],
    });
    expect(result.year).toBe(2009);
  });
  it("loads multiple", () => {
    const result = deriveLARLayer("metro=123,456,789", [], [2009]);
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

describe("toFilterGroup()", () => {
  it("can derive homePurchase", () => {
    const filters = LARFilterFactory.build({
      lienStatus: [choiceLookup.lienStatus["1"]],
      loanPurpose: [choiceLookup.loanPurpose["1"]],
      ownerOccupancy: [choiceLookup.ownerOccupancy["1"]],
      propertyType: [choiceLookup.propertyType["1"]],
    });
    expect(toFilterGroup(filters)).toBe("homePurchase");
  });

  it("can derive refinance", () => {
    const filters = LARFilterFactory.build({
      lienStatus: [choiceLookup.lienStatus["1"]],
      loanPurpose: [choiceLookup.loanPurpose["3"]],
      ownerOccupancy: [choiceLookup.ownerOccupancy["1"]],
      propertyType: [choiceLookup.propertyType["1"]],
    });
    expect(toFilterGroup(filters)).toBe("refinance");
  });

  it("defaults to custom", () => {
    const filters = LARFilterFactory.build({ loanPurpose: [] });
    expect(toFilterGroup(filters)).toBe("custom");
  });
});

describe("toFilterValues()", () => {
  it("handles undefined", () => {
    expect(toFilterValues(undefined, undefined)).toEqual([]);
  });

  it("handles empty strings", () => {
    expect(toFilterValues("", undefined)).toEqual([]);
  });

  it("splits on commas", () => {
    expect(toFilterValues("1,4,7", undefined)).toEqual([
      new FilterValue({ id: "1" }),
      new FilterValue({ id: "4" }),
      new FilterValue({ id: "7" }),
    ]);
  });

  it("will look values up", () => {
    const filterTwo = FilterValueFactory.build({ id: "2" });
    const filterThree = FilterValueFactory.build({ id: "3" });
    const lookup = { 2: filterTwo, 3: filterThree };
    expect(toFilterValues("1,2,3,4", lookup)).toEqual([
      new FilterValue({ id: "1" }),
      filterTwo,
      filterThree,
      new FilterValue({ id: "4" }),
    ]);
  });
});
