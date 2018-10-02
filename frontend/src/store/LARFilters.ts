import { OrderedMap, Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

export type FilterValue = "1" | "2" | "3" | "4";

export default interface LARFilters {
  lienStatus: Set<FilterValue>;
  loanPurpose: Set<FilterValue>;
  ownerOccupancy: Set<FilterValue>;
  propertyType: Set<FilterValue>;
}

export const SAFE_INIT: LARFilters = {
  lienStatus: Set<FilterValue>(["1", "2", "3", "4"]),
  loanPurpose: Set<FilterValue>(["1", "2", "3"]),
  ownerOccupancy: Set<FilterValue>(["1", "2", "3"]),
  propertyType: Set<FilterValue>(["1", "2", "3"]),
};

export interface LARFilterConfig {
  choices: OrderedMap<FilterValue, string>;
  fieldName: string;
  name: string;
}

export const filterChoices = OrderedMap<keyof LARFilters, LARFilterConfig>([
  ["lienStatus", {
    choices: OrderedMap([
      ["1", "First"],
      ["2", "Subordinate"],
      ["3", "No Lien"],
      ["4", "N/A"],
    ]),
    fieldName: "lien_status",
    name: "Lien Status",
  }],
  ["loanPurpose", {
    choices: OrderedMap([
      ["1", "Home Purchase"],
      ["2", "Home Improvement"],
      ["3", "Refinance"],
    ]),
    fieldName: "loan_purpose",
    name: "Loan Purpose",
  }],
  ["ownerOccupancy", {
    choices: OrderedMap([
      ["1", "Owner-occupied"],
      ["2", "Not Owner-occupied"],
      ["3", "N/A"],
    ]),
    fieldName: "owner_occupancy",
    name: "Ownership",
  }],
  ["propertyType", {
    choices: OrderedMap([
      ["1", "One to Four-family"],
      ["2", "Manufactured"],
      ["3", "Multi-family"],
    ]),
    fieldName: "property_type",
    name: "Property Type",
  }],
]);

const actionCreator = actionCreatorFactory("LAR_FILTERS");

export const setFilters =
  actionCreator<[keyof LARFilters, Set<FilterValue>]>("SET_FILTERS");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    setFilters,
    (original: LARFilters, [filterName, values]) => ({
      ...original,
      [filterName]: values,
    }),
  ).build();
