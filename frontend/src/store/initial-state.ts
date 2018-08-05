import { Set } from "immutable";
import * as qs from "qs";

import LARLayer, { FilterEntity, SAFE_INIT as larInit } from "./LARLayer";
import Mapbox, { SAFE_INIT as mapboxInit } from "./Mapbox";
import { SAFE_INIT as sidebarInit } from "./Sidebar";
import State from "./State";
import Viewport, { SAFE_INIT as viewportInit } from "./Viewport";

export function deriveLARLayer(hash: string): LARLayer {
  const parsed = qs.parse(hash);
  const counties =
    (Array.isArray(parsed.counties) ? parsed.counties : [])
    .map(id => new FilterEntity({ entityType: "county", id: `${id}` }));
  const lenders =
    (Array.isArray(parsed.lenders) ? parsed.lenders : [])
    .map(id => new FilterEntity({ entityType: "lender", id: `${id}` }));
  const metros =
    (Array.isArray(parsed.metros) ? parsed.metros : [])
    .map(id => new FilterEntity({ entityType: "metro", id: `${id}` }));
  return {
    ...larInit,
    filters: [...counties, ...lenders, ...metros],
  };
}

export function deriveMapbox(windowConfig): Mapbox {
  const { choropleths, features, styleName, token } = windowConfig;
  features.forEach(feature => {
    feature.ids = Set(feature.ids);
  });
  return {
    ...mapboxInit,
    config: {
      choropleths,
      features,
      styleName,
      token,
    },
  };
}

export function deriveViewport(hash: string): Viewport {
  const parsed = qs.parse(hash);
  return {
    ...viewportInit,
    latitude: parseFloat(parsed.latitude),
    longitude: parseFloat(parsed.longitude),
    zoom: parseFloat(parsed.zoom),
  };
}

const configField = "__SPA_CONFIG__";

export default function initialState(window): State {
  const hash = window.location.hash.substr(1);
  return {
    larLayer: deriveLARLayer(hash),
    mapbox: deriveMapbox(window[configField]),
    sidebar: sidebarInit,
    viewport: deriveViewport(hash),
    window: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  };
}
