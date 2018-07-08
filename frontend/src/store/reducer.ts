import { combineReducers } from "redux";

import { reducer as larLayer } from "./LARLayer";
import { reducer as mapbox } from "./Mapbox";
import { reducer as viewport } from "./Viewport";

export default combineReducers({
  larLayer,
  mapbox,
  viewport,
});

/*
import { Set } from "immutable";

import {
  Action,
  ADD_LAYERS,
  CHANGE_VIEWPORT,
  REMOVE_LAYERS,
  SELECT_CHOROPLETH,
  SET_GEO,
  SET_LAR,
  SET_LENDER,
  SET_STYLE,
} from "./actions";
import { choroplethIds, Store } from "./store";

export default function reducer(state: Store, action: Action): Store {
  switch (action.type) {
    case ADD_LAYERS: {
      return {
        ...state,
        visibleLayers: state.visibleLayers.union(action.layerIds),
      };
    }
    case CHANGE_VIEWPORT: {
      return {
        ...state,
        viewport: action.viewport,
      };
    }
    case REMOVE_LAYERS: {
      return {
        ...state,
        visibleLayers: state.visibleLayers.subtract(action.layerIds),
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
    case SET_GEO: {
      if (state.hmda) {
        return {
          ...state,
          hmda: {
            ...state.hmda,
            geoName: action.geoName,
          },
        };
      }
      return state;
    }
    case SET_LAR: {
      if (state.hmda) {
        return {
          ...state,
          hmda: {
            ...state.hmda,
            lar: action.lar,
          },
        };
      }
      return state;
    }
    case SET_LENDER: {
      if (state.hmda) {
        return {
          ...state,
          hmda: {
            ...state.hmda,
            lenderName: action.lenderName,
          },
        };
      }
      return state;
    }
    case SET_STYLE: {
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
      if (config.choropleths.length) {
        visibleLayers = visibleLayers.add(config.choropleths[0].id);
      }
      return {
        ...state,
        config,
        viewport,
        visibleLayers,
      };
    }
    default:
      return state;
  }
}
*/
