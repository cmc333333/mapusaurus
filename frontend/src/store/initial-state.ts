import { Set } from "immutable";
import * as qs from "qs";

import LARFilters, { SAFE_INIT as larFiltersInit } from "./LARFilters";
import LARLayer, {
  FilterValue,
  SAFE_INIT as larInit,
  USState,
} from "./LARLayer";
import Mapbox, { SAFE_INIT as mapboxInit } from "./Mapbox";
import { SAFE_INIT as sidebarInit } from "./Sidebar";
import State from "./State";
import Viewport, { SAFE_INIT as viewportInit } from "./Viewport";

export function deriveLARLayer(
  hash: string,
  states: USState[],
  years: number[],
): LARLayer {
  const parsed = qs.parse(hash);
  const filters = {
    ...larInit.filters,
    county: (Array.isArray(parsed.counties) ? parsed.counties : [])
      .map(id => new FilterValue({ id: `${id}` })),
    lender: (Array.isArray(parsed.lenders) ? parsed.lenders : [])
      .map(id => new FilterValue({ id: `${id}` })),
    metro: (Array.isArray(parsed.metros) ? parsed.metros : [])
      .map(id => new FilterValue({ id: `${id}` })),
  };
  return {
    ...larInit,
    filters,
    available: { states, years },
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
    larFilters: larFiltersInit,
    mapbox: deriveMapbox(window[configField]),
    sidebar: sidebarInit,
    viewport: deriveViewport(hash),
    window: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  };
}
