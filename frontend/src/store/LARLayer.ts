import { Map, OrderedMap, Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import { fitBounds } from "viewport-mercator-project";

import { Geo } from "../apis/geography";
import { fetchLar } from "../apis/lar";
import { transitionViewport } from "./Viewport";

export interface LARPoint {
  geoid: string;
  houseCount: number;
  latitude: number;
  loanCount: number;
  longitude: number;
}

export type FilterGroup = "homePurchase" | "refinance" | "custom";
export const homePurchase = {
  lienStatus: Set(["1"]),
  loanPurpose: Set(["1"]),
  ownerOccupancy: Set(["1"]),
  propertyType: Set(["1"]),
};
export const refinance = {
  ...homePurchase,
  loanPurpose: Set(["3"]),
};

export interface FilterConfig<V> {
  label: string;
  options: Map<string, V>;
  selected: Set<string>;
}
export interface LARFilters {
  county: FilterConfig<Geo>;
  lender: FilterConfig<string>;
  lienStatus: FilterConfig<string>;
  loanPurpose: FilterConfig<string>;
  metro: FilterConfig<Geo>;
  ownerOccupancy: FilterConfig<string>;
  propertyType: FilterConfig<string>;
}
export interface FilterSelection {
  county?: Set<string>;
  lender?: Set<string>;
  lienStatus?: Set<string>;
  loanPurpose?: Set<string>;
  metro?: Set<string>;
  ownerOccupancy?: Set<string>;
  propertyType?: Set<string>;
}
export interface FilterOptions {
  county?: Map<string, Geo>;
  lender?: Map<string, string>;
  metro?: Map<string, Geo>;
}

export interface USState {
  abbr: string;
  fips: string;
  name: string;
}

export default interface LARLayer {
  available: {
    states: USState[];
    years: number[];
  };
  filterGroup: FilterGroup;
  filters: LARFilters;
  lar: LARPoint[];
  stateFips: string;
  year: number;
}

export const SAFE_INIT: LARLayer = {
  available: { states: [], years: [] },
  filterGroup: "homePurchase",
  filters: {
    county: {
      label: "County",
      options: Map<string, Geo>(),
      selected: Set<string>(),
    },
    lender: {
      label: "Lender",
      options: Map<string, string>(),
      selected: Set<string>(),
    },
    lienStatus: {
      label: "Lien Status",
      options: OrderedMap([
        ["1", "First"], ["2", "Subordinate"], ["3", "No Lien"], ["4", "N/A"],
      ]),
      selected: homePurchase.lienStatus,
    },
    loanPurpose: {
      label: "Loan Purpose",
      options: OrderedMap([
        ["1", "Home Purchase"], ["2", "Home Improvement"], ["3", "Refinance"],
      ]),
      selected: homePurchase.loanPurpose,
    },
    metro: {
      label: "Metro",
      options: Map<string, Geo>(),
      selected: Set<string>(),
    },
    ownerOccupancy: {
      label: "Owner Occupancy",
      options: OrderedMap([
        ["1", "Owner-occupied"], ["2", "Not Owner-occupied"], ["3", "N/A"],
      ]),
      selected: homePurchase.ownerOccupancy,
    },
    propertyType: {
      label: "Property Type",
      options: OrderedMap([
        ["1", "One to Four-family"],
        ["2", "Manufactured"],
        ["3", "Multi-family"],
      ]),
      selected: homePurchase.propertyType,
    },
  },
  lar: [],
  stateFips: "",
  year: NaN,
};

const actionCreator = actionCreatorFactory("LAR_LAYER");

export const setStateFips = actionCreator<string>("SET_STATE_FIPS");
export const setYear = actionCreator<number>("SET_YEAR");
export const addOptions = actionCreator<FilterOptions>("ADD_OPTIONS");

const asyncActionCreator = asyncFactory<LARLayer>(actionCreator);

export const selectFilters = asyncActionCreator<FilterSelection, LARPoint[]>(
  "SELECT_FILTERS",
  (selection, dispatch, getState: () => any) => {
    const asIds: FilterSelection = {};
    const { filters } = getState().larLayer;
    Object.keys(filters).forEach(filterName => {
      asIds[filterName] = selection[filterName] || filters[filterName].selected;
    });
    return fetchLar(asIds);
  },
);
export const setFilterGroup = asyncActionCreator<FilterGroup, void>(
  "SET_FILTER_GROUP",
  (filterGroup, dispatch) => {
    if (filterGroup === "homePurchase") {
      dispatch(selectFilters.action(homePurchase));
    } else if (filterGroup === "refinance") {
      dispatch(selectFilters.action(refinance));
    }
  },
);
export const zoomToGeos = asyncActionCreator<void, void>(
  "ZOOM_TO_GEOS",
  (_, dispatch, getState: () => any) => {
    const { larLayer, window: { height, width } } = getState();
    const { filters } = larLayer;
    const countyGeos: Geo[] = filters.county.selected.toArray().map(
      id => filters.county.options.get(id),
    );
    const metroGeos: Geo[] = filters.metro.selected.toArray().map(
      id => filters.metro.options.get(id),
    );
    const geos = countyGeos.concat(metroGeos);
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

function mergeFilters(filters: LARFilters, selection: FilterSelection): LARFilters {
  const result = { ...filters };
  Object.keys(selection).forEach(filterName => {
    result[filterName] = {
      ...filters[filterName],
      selected: selection[filterName],
    };
  });
  return result;
}
function mergeOptions(filters: LARFilters, options: FilterOptions): LARFilters {
  const result = { ...filters };
  Object.keys(options).forEach(filterName => {
    result[filterName] = {
      ...filters[filterName],
      options: filters[filterName].options.merge(options[filterName]),
    };
  });
  return result;
}

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    addOptions,
    (original: LARLayer, options: FilterOptions) => ({
      ...original,
      filters: mergeOptions(original.filters, options),
    }),
  ).case(
    selectFilters.async.started,
    (original: LARLayer, selection) => ({
      ...original,
      filters: mergeFilters(original.filters, selection),
      lar: [],
    }),
  ).case(
    selectFilters.async.done,
    (original: LARLayer, { result }) => ({
      ...original,
      lar: result,
    }),
  ).case(
    setFilterGroup.async.started,
    (original: LARLayer, filterGroup: FilterGroup) => ({
      ...original,
      filterGroup,
    }),
  ).case(
    setStateFips,
    (original: LARLayer, stateFips: string) => ({
      ...original,
      stateFips,
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
        filters: mergeFilters(
          original.filters,
          {
            county: Set<string>(),
            lender: Set<string>(),
            metro: Set<string>(),
          },
        ),
        lar: [],
      };
    },
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
