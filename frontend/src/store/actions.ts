import { Set } from "immutable";

import { LARPoint, MapboxStyle, Store, Viewport } from "./store";

export const ADD_LAYERS = "ADD_LAYERS";
export const CHANGE_VIEWPORT = "CHANGE_VIEWPORT";
export const REMOVE_LAYERS = "REMOVE_LAYERS";
export const SELECT_CHOROPLETH = "SELECT_CHOROPLETH";
export const SET_GEO = "SET_GEO";
export const SET_LAR = "SET_LAR";
export const SET_LENDER = "SET_LENDER";
export const SET_STYLE = "SET_STYLE";

export type Action = {
  type: "ADD_LAYERS",
  layerIds: Set<string>,
} | {
  type: "CHANGE_VIEWPORT",
  viewport: Viewport,
} | {
  type: "REMOVE_LAYERS",
  layerIds: Set<string>,
} | {
  type: "SELECT_CHOROPLETH",
  layerId: string,
} | {
  type: "SET_GEO",
  geoName: string,
} | {
  type: "SET_LAR",
  lar: LARPoint[],
} | {
  type: "SET_LENDER",
  lenderName: string,
} | {
  type: "SET_STYLE",
  style: MapboxStyle,
};

export function addLayers(layerIds: Set<string>): Action {
  return { layerIds, type: ADD_LAYERS };
}

export function changeViewport(
  latitude: number,
  longitude: number,
  zoom: number,
): Action {
  return { viewport: { latitude, longitude, zoom }, type: CHANGE_VIEWPORT };
}

export function removeLayers(layerIds: Set<string>): Action {
  return { layerIds, type: REMOVE_LAYERS };
}

export function selectChoropleth(layerId: string): Action {
  return { layerId, type: SELECT_CHOROPLETH };
}

export function setGeo(geoName: string): Action {
  return { geoName, type: SET_GEO };
}

export function setLar(lar: LARPoint[]): Action {
  return { lar, type: SET_LAR };
}

export function setLender(lenderName: string): Action {
  return { lenderName, type: SET_LENDER };
}

export function setStyle(style: MapboxStyle): Action {
  return { style, type: SET_STYLE };
}
