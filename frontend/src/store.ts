import { Set } from 'immutable';

interface LayerConfig { id: string };
interface MapConfig {
  center: number[],
  layers: LayerConfig[],
  zoom: number,
};
interface SpaConfig {
  choropleth: { id: string, name: string }[],
  features: { name: string, ids: string[] }[],
  style: string,
  token: string,
};

type ChangeViewport = {
  type: 'CHANGE_VIEWPORT',
  lat: number,
  lon: number,
  zoom: number,
};
type ConfigureMap = {
  type: 'CONFIGURE_MAP',
  mapConfig: MapConfig,
};
type ShowLayer = {
  type: 'SHOW_LAYER',
  layerId: string,
};
type RemoveLayers = {
  type: 'REMOVE_LAYERS',
  layerIds: string[],
};
type AddLayers = {
  type: 'ADD_LAYERS',
  layerIds: string[],
};

export type Action =
  ChangeViewport | ConfigureMap | ShowLayer | RemoveLayers | AddLayers;

export function changeViewport({ latitude, longitude, zoom }): ChangeViewport {
  return {
    type: 'CHANGE_VIEWPORT',
    lat: latitude,
    lon: longitude,
    zoom,
  };
}

export function configureMap(mapConfig: MapConfig): ConfigureMap {
  return { type: 'CONFIGURE_MAP', mapConfig };
}

export function showLayer(layerId: string): ShowLayer {
  return { type: 'SHOW_LAYER', layerId };
}

export function removeLayers(layerIds: string[]): RemoveLayers {
  return { type: 'REMOVE_LAYERS', layerIds };
}

export function addLayers(layerIds: string[]): AddLayers {
  return { type: 'ADD_LAYERS', layerIds };
}

export type Store = {
  allLayers: LayerConfig[],
  lat: number,
  lon: number,
  spaConfig: SpaConfig,
  mapConfig?: MapConfig,
  visibleLayers: Set<string>,
  zoom: number,
};

function removeInvalidSpaConfig(spaConfig: SpaConfig, validIds: string[]): SpaConfig {
  return {
    ...spaConfig,
    choropleth: spaConfig.choropleth.filter(l => validIds.includes(l.id)),
    features: spaConfig.features.map((f) => ({
      ...f,
      ids: f.ids.filter(i => validIds.includes(i)),
    })),
  }
}

function defaultLayers(state: Store): Set<string> {
  let result = Set<string>();
  if (state.spaConfig.choropleth.length) {
    result = result.add(state.spaConfig.choropleth[0].id);
  }
  state.spaConfig.features.forEach((f) => {
    result = result.union(f.ids);
  });
  return result;
}

export default function reducer(state: Store, action: Action): Store {
  switch (action.type) {
    case 'CHANGE_VIEWPORT': {
      return {
        ...state,
        lat: action.lat,
        lon: action.lon,
        zoom: action.zoom,
      };
    }
    case 'CONFIGURE_MAP': {
      const validIds = action.mapConfig.layers.map(l => l.id);
      const result = {
        ...state,
        allLayers: action.mapConfig.layers,
        lat: state.lat || action.mapConfig.center[1],
        lon: state.lon || action.mapConfig.center[0],
        mapConfig: action.mapConfig,
        spaConfig: removeInvalidSpaConfig(state.spaConfig, validIds),
        zoom: state.zoom || action.mapConfig.zoom,
      };
      result.visibleLayers = defaultLayers(result);
      result.mapConfig = {
        ...result.mapConfig,
        layers: result.allLayers.filter(l => result.visibleLayers.has(l.id)),
      };
      return result;
    }
    case 'SHOW_LAYER': {
      let visibleLayers = state.visibleLayers;
      visibleLayers = visibleLayers.subtract(
        state.spaConfig.choropleth.map(l => l.id));
      visibleLayers = visibleLayers.add(action.layerId);

      const result = {
        ...state,
        visibleLayers,
      };

      if (state.mapConfig) {
        result.mapConfig = {
          ...state.mapConfig,
          layers: state.allLayers.filter(l => visibleLayers.has(l.id)),
        };
      }
      return result;
    }
    case 'ADD_LAYERS': {
      let visibleLayers = state.visibleLayers;
      visibleLayers = visibleLayers.union(action.layerIds);

      const result = {
        ...state,
        visibleLayers,
      };

      if (state.mapConfig) {
        result.mapConfig = {
          ...state.mapConfig,
          layers: state.allLayers.filter(l => visibleLayers.has(l.id)),
        };
      }
      return result;
    }
    case 'REMOVE_LAYERS': {
      let visibleLayers = state.visibleLayers;
      visibleLayers = visibleLayers.subtract(action.layerIds);

      const result = {
        ...state,
        visibleLayers,
      };

      if (state.mapConfig) {
        result.mapConfig = {
          ...state.mapConfig,
          layers: state.allLayers.filter(l => visibleLayers.has(l.id)),
        };
      }
      return result;
    }
    default:
      return state;
  }
}
