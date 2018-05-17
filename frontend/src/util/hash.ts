import { Set } from 'immutable';
import * as queryString from 'query-string';

import { Store } from '../store';

export function deserialize(hash: string): Store {
  const parsed = queryString.parse(hash);
  return {
    allLayers: [],
    lat: parseFloat(parsed.lat) || 41.8,
    lon: parseFloat(parsed.lon) || -87.6,
    mapboxKey: window['__MAPBOX_TOKEN__'],
    mapboxStyle: window['__MAPBOX_STYLE__'],
    visibleLayers: Set(),
    zoom: parseInt(parsed.zoom, 10) || 13,
  };
}

export function serialize({ lat, lon, zoom }: Store): string {
  return queryString.stringify({ lat, lon, zoom });
}
