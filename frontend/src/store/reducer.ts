import { Set } from "immutable";

import {
  Action,
  ADD_LAYERS,
  CHANGE_VIEWPORT,
  LOAD_STYLE,
  REMOVE_LAYERS,
  SELECT_CHOROPLETH,
} from "./actions";
import { choroplethIds, Store } from "./store";

export default function reducer(state: Store, action: Action): Store {
  switch (action.type) {
    case CHANGE_VIEWPORT: {
      return {
        ...state,
        viewport: action.viewport,
      };
    }
    case LOAD_STYLE: {
      const validIds = Set(action.style.layers.map(l => l.id));
      const config = {
        ...state.config,
        // Remove invalid layer ids
        choropleths: state.config.choropleths.filter(l => validIds.has(l.id)),
        features: state.config.features.map(feature => ({
          ...feature,
          ids: feature.ids.intersect(validIds),
        })),
        style: action.style,
      };
      const viewport = {
        ...state.viewport,
        latitude: state.viewport.latitude || action.style.center[1],
        longitude: state.viewport.longitude || action.style.center[0],
        zoom: state.viewport.zoom || action.style.zoom,
      };
      let visibleLayers = Set<string>();
      config.features.forEach(feature => {
        visibleLayers = visibleLayers.union(feature.ids);
      });
      if (config.choropleths) {
        visibleLayers = visibleLayers.add(config.choropleths[0].id);
      }
      return {
        ...state,
        config,
        viewport,
        visibleLayers,
      };
    }
    case SELECT_CHOROPLETH: {
      let visibleLayers = state.visibleLayers.subtract(choroplethIds(state));
      visibleLayers = visibleLayers.add(action.layerId);

      return {
        ...state,
        visibleLayers,
      };
    }
    case ADD_LAYERS: {
      return {
        ...state,
        visibleLayers: state.visibleLayers.union(action.layerIds),
      };
    }
    case REMOVE_LAYERS: {
      return {
        ...state,
        visibleLayers: state.visibleLayers.subtract(action.layerIds),
      };
    }
    default:
      return state;
  }
}
