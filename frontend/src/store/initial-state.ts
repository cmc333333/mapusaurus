import { Set } from "immutable";
import * as qs from "qs";

import Lar, { SAFE_INIT as larInit } from "./Lar";
import Filters, { homePurchasePreset, refinancePreset } from "./Lar/Filters";
import { Year } from "./Lar/Lookups";
import Points from "./Lar/Points";
import { FilterGroup } from "./Lar/UIOnly";
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
export function toFilterGroup(filters: Filters): FilterGroup {
  const isHomePurchase = Object.keys(homePurchasePreset).every(
    key => filters[key].equals(homePurchasePreset[key]),
  );
  const isRefinance = Object.keys(refinancePreset).every(
    key => filters[key].equals(refinancePreset[key]),
  );
  if (isHomePurchase) {
    return "homePurchase";
  }
  if (isRefinance) {
    return "refinance";
  }
  return "custom";
}

export function deriveLarPoints(parsed: any): Points {
  const scaleFactor =
    Math.min(100, Math.max(1, parseInt(parsed.scaleFactor, 10)))
    || larInit.points.scaleFactor;
  return { ...larInit.points, scaleFactor };
}

export function deriveLar(hash: string, years: Year[]): Lar {
  const parsed = qs.parse(hash, {
    depth: 0, // we don't have any nested properties
    skipNulls: true,
  });

  const filters = { ...larInit.filters };
  Object.keys(filters).forEach(filterName => {
    if (filterName !== "year" && parsed[filterName]) {
      filters[filterName] = toSelected(parsed[filterName]);
    }
  });
  filters.year = parseInt(parsed.year, 10) || (years.length ? years[0] : NaN);
  const lookups = { ...larInit.lookups, years };
  const uiOnly = { ...larInit.uiOnly, group: toFilterGroup(filters) };

  return {
    ...larInit,
    filters,
    lookups,
    uiOnly,
    points: deriveLarPoints(parsed),
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
  return {
    lar: deriveLar(hash, window[configField].years),
    mapbox: deriveMapbox(window[configField]),
    sidebar: sidebarInit,
    viewport: deriveViewport(hash),
    window: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  };
}
