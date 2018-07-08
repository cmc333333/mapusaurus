import { Set } from "immutable";
import * as qs from "qs";

import LARLayer, { SAFE_INIT as larInit } from "./LARLayer";
import Mapbox, { SAFE_INIT as mapboxInit } from "./Mapbox";
import State from "./State";
import Viewport, { SAFE_INIT as viewportInit } from "./Viewport";

export function deriveLARLayer(hash: string): LARLayer {
  const parsed = qs.parse(hash);
  return {
    ...larInit,
    config: {
      counties: parsed.counties || [],
      lenders: parsed.lenders || [],
      metros: parsed.metros || [],
    },
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
    viewport: deriveViewport(hash),
  };
}
