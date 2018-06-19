import { Set } from 'immutable';
import * as queryString from 'query-string';

import { Store } from '../store';

export function deserialize(hash: string): Store {
  const parsed = queryString.parse(hash);
  return {
    allLayers: [],
    lat: parseFloat(parsed.lat),
    lon: parseFloat(parsed.lon),
    spaConfig: window['__SPA_CONFIG__'],
    visibleLayers: Set<string>(),
    zoom: parseInt(parsed.zoom, 10),
  };
}

export function serialize({ lat, lon, zoom }: Store): string {
  return queryString.stringify({ lat, lon, zoom });
}
