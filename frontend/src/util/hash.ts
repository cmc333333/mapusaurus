import { Set } from "immutable";
import * as queryString from "query-string";

import { Store } from "../store/store";

const configField = "__SPA_CONFIG__";

export function deserialize(hash: string): Store {
  const parsed = queryString.parse(hash);
  const config = window[configField];
  config.features.forEach(feature => {
    feature.ids = Set(feature.ids);
  });
  return {
    config,
    viewport: {
      latitude: parseFloat(parsed.latitude),
      longitude: parseFloat(parsed.longitude),
      zoom: parseFloat(parsed.zoom),
    },
    visibleLayers: Set<string>(),
  };
}

export function serialize({ viewport }: Store): string {
  return queryString.stringify({
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    zoom: viewport.zoom,
  });
}
