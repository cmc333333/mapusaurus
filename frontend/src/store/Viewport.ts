import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import { MapboxStyle, setStyle } from "./Mapbox";

export default interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export const SAFE_INIT: Viewport = {
  latitude: NaN,
  longitude: NaN,
  zoom: NaN,
};

const actionCreator = actionCreatorFactory("VIEWPORT");

export const setViewport = actionCreator<Viewport>("SET");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(setViewport, (original: Viewport, viewport: Viewport) => viewport)
  .case(setStyle, (original: Viewport, style: MapboxStyle) => ({
    latitude: original.latitude || style.center[1],
    longitude: original.longitude || style.center[0],
    zoom: original.zoom || style.zoom,
  }))
  .build();
