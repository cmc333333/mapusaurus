import { OrderedMap } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchLar } from "../apis/lar";

export interface LARPoint {
  geoid: string;
  houseCount: number;
  latitude: number;
  loanCount: number;
  longitude: number;
}

export class FilterValue {
  public id: string;
  public name?: string;

  constructor(initParams: Partial<FilterValue>) {
    Object.assign(this, initParams);
  }

  public compareNameWith(other: FilterValue): number {
    return (this.name || "").localeCompare(other.name || "");
  }
}

export interface LARFilterConfig {
  choices: FilterValue[];
  fieldName: string;
  name: string;
}

export interface USState {
  abbr: string;
  fips: string;
  name: string;
}

interface LARFilters {
  county: FilterValue[];
  lender: FilterValue[];
  lienStatus: FilterValue[];
  loanPurpose: FilterValue[];
  metro: FilterValue[];
  ownerOccupancy: FilterValue[];
  propertyType: FilterValue[];
}

export const filterChoices = OrderedMap<keyof LARFilters, LARFilterConfig>([
  ["lienStatus", {
    choices: [
      new FilterValue({ id: "1", name: "First" }),
      new FilterValue({ id: "2", name: "Subordinate" }),
      new FilterValue({ id: "3", name: "No Lien" }),
      new FilterValue({ id: "4", name: "N/A" }),
    ],
    fieldName: "lien_status",
    name: "Lien Status",
  }],
  ["loanPurpose", {
    choices: [
      new FilterValue({ id: "1", name: "Home Purchase" }),
      new FilterValue({ id: "2", name: "Home Improvement" }),
      new FilterValue({ id: "3", name: "Refinance" }),
    ],
    fieldName: "loan_purpose",
    name: "Loan Purpose",
  }],
  ["ownerOccupancy", {
    choices: [
      new FilterValue({ id: "1", name: "Owner-occupied" }),
      new FilterValue({ id: "2", name: "Not Owner-occupied" }),
      new FilterValue({ id: "3", name: "N/A" }),
    ],
    fieldName: "owner_occupancy",
    name: "Ownership",
  }],
  ["propertyType", {
    choices: [
      new FilterValue({ id: "1", name: "One to Four-family" }),
      new FilterValue({ id: "2", name: "Manufactured" }),
      new FilterValue({ id: "3", name: "Multi-family" }),
    ],
    fieldName: "property_type",
    name: "Property Type",
  }],
]);

export default interface LARLayer {
  available: {
    states: USState[];
    years: number[];
  };
  filters: LARFilters;
  lar: LARPoint[];
  stateFips: string;
  year: number;
}

export const SAFE_INIT: LARLayer = {
  available: { states: [], years: [] },
  filters: {
    county: [],
    lender: [],
    lienStatus: filterChoices.get("lienStatus").choices,
    loanPurpose: filterChoices.get("loanPurpose").choices,
    metro: [],
    ownerOccupancy: filterChoices.get("ownerOccupancy").choices,
    propertyType: filterChoices.get("propertyType").choices,
  },
  lar: [],
  stateFips: "",
  year: NaN,
};

const actionCreator = actionCreatorFactory("LAR_LAYER");

export const setStateFips = actionCreator<string>("SET_STATE_FIPS");
export const setYear = actionCreator<number>("SET_YEAR");

const asyncActionCreator = asyncFactory<LARLayer>(actionCreator);

export function orderedUnion(
  oldEntries: FilterValue[],
  toAdd: FilterValue[],
): FilterValue[] {
  const removed = oldEntries.filter(
    existing => !toAdd.some(added => added.id === existing.id),
  );
  // Ensure order is preserved
  return [...removed, ...toAdd].sort((l, r) => l.compareNameWith(r));
}

function filtersToLar(original: LARFilters, overrides: Partial<LARFilters>) {
  const asIds: any = {};
  Object.keys(original).forEach(
    key => asIds[key] = original[key].map(f => f.id),
  );
  Object.keys(overrides).forEach(
    key => asIds[key] = overrides[key].map(f => f.id),
  );
  filterChoices.forEach((config, filterName) => {
    if (config && filterName) {
      asIds[config.fieldName] = asIds[filterName];
      delete asIds[filterName];
    }
  });
  return fetchLar(asIds);
}

export const addFilters =
  asyncActionCreator<[keyof LARFilters, FilterValue[]], LARPoint[]>(
    "ADD_FILTERS",
    ([filterName, values], dispatch, getState: () => any) => filtersToLar(
      getState().larLayer.filters,
      { [filterName]:
          orderedUnion(getState().larLayer.filters[filterName], values),
      },
    ),
  );
export const removeFilter =
  asyncActionCreator<[keyof LARFilters, string], LARPoint[]>(
    "REMOVE_FITLER",
    ([filterName, filterId], dispatch, getState: () => any) => filtersToLar(
      getState().larLayer.filters,
      { [filterName]:
          getState().larLayer.filters[filterName].filter(f => f.id !== filterId),
      },
    ),
  );
export const setFilters = asyncActionCreator<Partial<LARFilters>, LARPoint[]>(
    "SET_FILTERS",
    (overrides, dispatch, getState: () => any) => filtersToLar(
      getState().larLayer.filters,
      overrides,
    ),
  );

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    addFilters.async.started,
    (original: LARLayer, [filterName, values]) => ({
      ...original,
      filters: {
        ...original.filters,
        [filterName]: orderedUnion(original.filters[filterName], values),
      },
      lar: [],
    }),
  ).case(
    removeFilter.async.started,
    (original: LARLayer, [filterName, filterId]) => ({
      ...original,
      filters: {
        ...original.filters,
        [filterName]: original.filters[filterName]
          .filter(e => e.id !== filterId),
      },
      lar: [],
    }),
  ).case(
    setFilters.async.started,
    (original: LARLayer, overrides) => ({
      ...original,
      filters: {
        ...original.filters,
        ...overrides,
      },
      lar: [],
    }),
  ).cases(
    [addFilters.async.done, removeFilter.async.done, setFilters.async.done],
    (original: LARLayer, { result }) => ({
      ...original,
      lar: result,
    }),
  ).case(
    setYear,
    (original: LARLayer, year: number) => {
      if (year === original.year) {
        return original;
      }
      return {
        ...original,
        year,
        filters: {
          ...original.filters,
          county: [],
          lender: [],
          metro: [],
        },
        lar: [],
      };
    },
  ).case(
    setStateFips,
    (original: LARLayer, stateFips: string) => ({
      ...original,
      stateFips,
    }),
  ).build();

export function toScatterPlot({
  houseCount,
  latitude,
  loanCount,
  longitude,
}: LARPoint) {
  const volume = houseCount ? loanCount / houseCount : 0;
  // Area of a circle = pi * r * r, but since pi is a constant and we're only
  // displaying relative values, we can ignore it.
  const radius = Math.sqrt(volume);
  return {
    radius,
    position: [longitude, latitude],
  };
}

export const scatterPlotSelector = createSelector(
  ({ lar }: LARLayer) => lar,
  lar => lar.map(toScatterPlot),
);
