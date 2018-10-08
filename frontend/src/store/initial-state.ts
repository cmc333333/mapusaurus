import { Set } from "immutable";
import * as qs from "qs";

import LARLayer, {
  choiceLookup,
  filterChoices,
  FilterGroup,
  FilterValue,
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
export function toFilterValues(value: any, options: any): FilterValue[] {
  const asFilterValues = `${value || ""}`
    .split(",")
    .filter(s => s.length)
    .map(id => new FilterValue({ id }));
  return asFilterValues.map(fv => (options || {})[fv.id] || fv);
}

/*
 * Inspects the LARFilters to derive a FilterGroup, defaulting to "custom"
 */
export function toFilterGroup(filters: LARFilters): FilterGroup {
  const lienStatus = filters.lienStatus.map(f => f.id).join(",");
  const loanPurpose = filters.loanPurpose.map(f => f.id).join(",");
  const ownerOccupancy = filters.ownerOccupancy.map(f => f.id).join(",");
  const propertyType = filters.propertyType.map(f => f.id).join(",");

  if (lienStatus === "1" && ownerOccupancy === "1" && propertyType === "1") {
    if (loanPurpose === "1") {
      return "homePurchase";
    }
    if (loanPurpose === "3") {
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
  Object.keys(filters).forEach(name => {
    const values = toFilterValues(parsed[name], choiceLookup[name]);
    if (values.length) {
      filters[name] = values;
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
  const { latitude, longitude, zoom } = viewportInit;
  return {
    latitude: parseFloat(parsed.latitude) || latitude,
    longitude: parseFloat(parsed.longitude) || longitude,
    zoom: parseFloat(parsed.zoom) || zoom,
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
