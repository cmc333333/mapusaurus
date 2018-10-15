import { Set } from "immutable";
import * as qs from "qs";

import LARLayer, {
  FilterGroup,
  LARFilters,
  SAFE_INIT as larInit,
  USState,
} from "./LARLayer";
import Mapbox, { SAFE_INIT as mapboxInit } from "./Mapbox";
import { SAFE_INIT as sidebarInit } from "./Sidebar";
import State from "./State";
import Viewport, { SAFE_INIT as viewportInit } from "./Viewport";

/*
 * Convert the string (or array) we received from the url into a FilterValue,
 * potentially looking it up in a provided list.
 */
export function toSelected(value: any): Set<string> {
  return Set(
    `${value || ""}`
    .split(",")
    .filter(s => s.length),
  );
}

/*
 * Inspects the LARFilters to derive a FilterGroup, defaulting to "custom"
 */
export function toFilterGroup(filters: LARFilters): FilterGroup {
  if (filters.lienStatus.selected.equals(Set(["1"]))
      && filters.ownerOccupancy.selected.equals(Set(["1"]))
      && filters.propertyType.selected.equals(Set(["1"]))) {
    if (filters.loanPurpose.selected.equals(Set(["1"]))) {
      return "homePurchase";
    }
    if (filters.loanPurpose.selected.equals(Set(["3"]))) {
      return "refinance";
    }
  }
  return "custom";
}

export function deriveLARLayer(
  hash: string,
  states: USState[],
  years: number[],
): LARLayer {
  const parsed = qs.parse(hash, {
    depth: 0, // we don't have any nested properties
    skipNulls: true,
  });

  const filters = { ...larInit.filters };
  Object.keys(filters).forEach(filterName => {
    if (parsed[filterName]) {
      filters[filterName] = {
        ...filters[filterName],
        selected: toSelected(parsed[filterName]),
      };
    }
  });

  return {
    ...larInit,
    filters,
    available: { states, years },
    filterGroup: toFilterGroup(filters),
    stateFips: states.length ? states[0].fips : "",
    year: parseInt(parsed.year, 10) || (years.length ? years[0] : NaN),
  };
}

export function deriveMapbox(windowConfig): Mapbox {
  const { token } = windowConfig;
  return {
    ...mapboxInit,
    token,
  };
}

export function deriveViewport(hash: string): Viewport {
  const parsed = qs.parse(hash);
  return {
    ...viewportInit,
    latitude: parseFloat(parsed.latitude) || viewportInit.latitude,
    longitude: parseFloat(parsed.longitude) || viewportInit.longitude,
    zoom: parseFloat(parsed.zoom) || viewportInit.zoom,
  };
}

const configField = "__SPA_CONFIG__";

export default function initialState(window): State {
  const hash = window.location.hash.substr(1);
  const larLayer = deriveLARLayer(
    hash,
    window[configField].states,
    window[configField].years,
  );
  return {
    larLayer,
    mapbox: deriveMapbox(window[configField]),
    sidebar: sidebarInit,
    viewport: deriveViewport(hash),
    window: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  };
}
