import { Set } from "immutable";

import LARFilters, { FilterValue, reducer, setFilters } from "../LARFilters";

describe("reducer()", () => {
  it("allows filters to be added", () => {
    let filters: LARFilters = {
      lienStatus: Set([]),
      loanPurpose: Set([]),
      ownerOccupancy: Set([]),
      propertyType: Set([]),
    };

    filters = reducer(
      filters,
      setFilters(["loanPurpose", Set<FilterValue>(["2", "4"])]),
    );
    expect(filters).toEqual({
      lienStatus: Set([]),
      loanPurpose: Set(["2", "4"]),
      ownerOccupancy: Set([]),
      propertyType: Set([]),
    });

    filters = reducer(
      filters,
      setFilters(["propertyType", Set<FilterValue>(["1"])]),
    );
    expect(filters).toEqual({
      lienStatus: Set([]),
      loanPurpose: Set(["2", "4"]),
      ownerOccupancy: Set([]),
      propertyType: Set(["1"]),
    });

    filters = reducer(
      filters,
      setFilters(["propertyType", Set<FilterValue>(["2", "3"])]),
    );
    expect(filters).toEqual({
      lienStatus: Set([]),
      loanPurpose: Set(["2", "4"]),
      ownerOccupancy: Set([]),
      propertyType: Set(["2", "3"]),
    });
  });
});
