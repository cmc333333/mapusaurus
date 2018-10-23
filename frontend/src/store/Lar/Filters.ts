import { Set } from "immutable";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import { fitBounds } from "viewport-mercator-project";

import { transitionViewport } from "../Viewport";
import { GeoId, LenderId, Year } from "./Lookups";

const lienStatusNames = {
  1: "First",
  2: "Subordinate",
  3: "No Lien",
  4: "N/A",
};
export type LienStatus = keyof typeof lienStatusNames;

const loanPurposeNames = {
  1: "Home Purchase",
  2: "Home Improvement",
  3: "Refinance",
};
export type LoanPurpose = keyof typeof loanPurposeNames;

const ownerOccupancyNames = {
  1: "Owner-occupied",
  2: "Not Owner-occupied",
  3: "N/A",
};
export type OwnerOccupancy = keyof typeof ownerOccupancyNames;

const propertyTypeNames = {
  1: "One to Four-family",
  2: "Manufactured",
  3: "Multi-family",
};
export type PropertyType = keyof typeof propertyTypeNames;

export const nameLookups = {
  lienStatus: lienStatusNames,
  loanPurpose: loanPurposeNames,
  ownerOccupancy: ownerOccupancyNames,
  propertyType: propertyTypeNames,
};

export const homePurchasePreset = {
  lienStatus: Set<LienStatus>(["1"]),
  loanPurpose: Set<LoanPurpose>(["1"]),
  ownerOccupancy: Set<OwnerOccupancy>(["1"]),
  propertyType: Set<PropertyType>(["1"]),
};
export const refinancePreset = {
  ...homePurchasePreset,
  loanPurpose: Set<LoanPurpose>(["3"]),
};

export default interface Filters {
  county: Set<GeoId>;
  lender: Set<LenderId>;
  lienStatus: Set<LienStatus>;
  loanPurpose: Set<LoanPurpose>;
  metro: Set<GeoId>;
  ownerOccupancy: Set<OwnerOccupancy>;
  propertyType: Set<PropertyType>;
  year: Year;
}
interface AddRemoveFilter {
  county?: GeoId;
  lender?: LenderId;
  metro?: GeoId;
}

export const SAFE_INIT: Filters = {
  ...homePurchasePreset,
  county: Set<GeoId>(),
  lender: Set<LenderId>(),
  metro: Set<GeoId>(),
  year: NaN,
};

const actionCreator = actionCreatorFactory("LAR/FILTERS");
const asyncActionCreator = asyncFactory<Filters>(actionCreator);

export const addFilter = actionCreator<AddRemoveFilter>("ADD_FILTER");
export const removeFilter = actionCreator<AddRemoveFilter>("REMOVE_FILTER");
export const setFilters = actionCreator<Partial<Filters>>("SET_FILTERS");

export const zoomToGeos = asyncActionCreator<void, void>(
  "ZOOM_TO_GEOS",
  (_, dispatch, getState: () => any) => {
    const { lar, window: { height, width } } = getState();
    const { filters, lookups } = lar;
    const geos = filters.county.toArray().map(id => lookups.geos.get(id))
      .concat(filters.metro.toArray().map(id => lookups.geos.get(id)));

    if (geos.length) {
      const bounds = [
        [
          Math.max(...geos.map(g => g.maxlon)),
          Math.min(...geos.map(g => g.minlat)),
        ],
        [
          Math.min(...geos.map(g => g.minlon)),
          Math.max(...geos.map(g => g.maxlat)),
        ],
      ];

      const { latitude, longitude, zoom } = fitBounds({
        bounds,
        height,
        width,
      });
      dispatch(transitionViewport({ latitude, longitude, zoom }));
    }
  },
);

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    addFilter,
    (original, filters) => {
      const result = { ...original };
      Object.keys(filters).forEach(filterName => {
        result[filterName] = result[filterName].add(filters[filterName]);
      });
      return result;
    },
  )
  .case(
    removeFilter,
    (original, filters) => {
      const result = { ...original };
      Object.keys(filters).forEach(filterName => {
        result[filterName] = result[filterName].remove(filters[filterName]);
      });
      return result;
    },
  )
  .case(setFilters, (original, filters) => ({ ...original, ...filters }))
  .build();
