import { Set } from 'immutable';

interface LayerConfig { id: string };
interface MapConfig { layers: LayerConfig[] };

export type Action = {
  type: 'CHANGE_VIEWPORT',
  lat: number,
  lon: number,
  zoom: number,
} | {
  type: 'CONFIGURE_MAP',
  mapConfig: MapConfig,
} | {
  type: 'SHOW_LAYER',
  layerId: string,
} | {
  type: 'HIDE_LAYER',
  layerId: string,
};

export function changeViewport({ latitude, longitude, zoom }): Action {
  return {
    type: 'CHANGE_VIEWPORT',
    lat: latitude,
    lon: longitude,
    zoom,
  };
}

export function configureMap(mapConfig: MapConfig): Action {
  return { type: 'CONFIGURE_MAP', mapConfig };
}

export function showLayer(layerId: string): Action {
  return { type: 'SHOW_LAYER', layerId };
}

export function hideLayer(layerId: string): Action {
  return { type: 'HIDE_LAYER', layerId };
}

export type Store = {
  allLayers: LayerConfig[],
  lat: number,
  lon: number,
  mapboxKey: string,
  mapboxStyle: string,
  mapConfig?: MapConfig,
  visibleLayers: Set<string>,
  zoom: number,
};

function updateVisible(state: Store, visibleLayers: Set<string>): Store {
  if (!state.mapConfig) {
    return { ...state, visibleLayers };
  }
  return {
    ...state,
    visibleLayers,
    mapConfig: {
      ...state.mapConfig,
      layers: state.allLayers.filter(l =>
        visibleLayers.includes(l.id)),
    },
  };
}

export default function reducer(state: Store, action: Action): Store {
  switch (action.type) {
    case 'CHANGE_VIEWPORT':
      return {
        ...state,
        lat: action.lat,
        lon: action.lon,
        zoom: action.zoom,
      };
    case 'CONFIGURE_MAP':
      return {
        ...state,
        allLayers: action.mapConfig.layers,
        mapConfig: action.mapConfig,
        visibleLayers: Set(action.mapConfig.layers.map(l => l.id)),
      };
    case 'SHOW_LAYER':
      return updateVisible(state, state.visibleLayers.add(action.layerId));
    case 'HIDE_LAYER':
      return updateVisible(state, state.visibleLayers.delete(action.layerId));
    default:
      return state;
  }
}
