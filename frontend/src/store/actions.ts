import { Set } from "immutable";

import { MapboxStyle, Store, Viewport } from "./store";

export const CHANGE_VIEWPORT = "CHANGE_VIEWPORT";
export const SET_STYLE = "SET_STYLE";
export const SELECT_CHOROPLETH = "SELECT_CHOROPLETH";
export const REMOVE_LAYERS = "REMOVE_LAYERS";
export const ADD_LAYERS = "ADD_LAYERS";

export type Action = {
  type: "CHANGE_VIEWPORT",
  viewport: Viewport,
} | {
  type: "SET_STYLE",
  style: MapboxStyle,
} | {
  type: "SELECT_CHOROPLETH",
  layerId: string,
} | {
  type: "REMOVE_LAYERS",
  layerIds: Set<string>,
} | {
  type: "ADD_LAYERS",
  layerIds: Set<string>,
};

export function changeViewport(viewport: Viewport): Action {
  return { viewport, type: CHANGE_VIEWPORT };
}

export function setStyle(style: MapboxStyle): Action {
  return { style, type: SET_STYLE };
}

export function selectChoropleth(layerId: string): Action {
  return { layerId, type: SELECT_CHOROPLETH };
}

export function removeLayers(layerIds: Set<string>): Action {
  return { layerIds, type: REMOVE_LAYERS };
}

export function addLayers(layerIds: Set<string>): Action {
  return { layerIds, type: ADD_LAYERS };
}
