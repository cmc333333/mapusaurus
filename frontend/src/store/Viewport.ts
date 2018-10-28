import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { getDistanceScales } from "viewport-mercator-project";

interface StaticViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export default interface Viewport extends StaticViewport {
  transitionDuration: number;
}

export const SAFE_INIT: Viewport = {
  latitude: 41.88,
  longitude: -87.64,
  transitionDuration: 0,
  zoom: 12,
};

const actionCreator = actionCreatorFactory("VIEWPORT");

export const setViewport = actionCreator<StaticViewport>("SET");
export const transitionViewport = actionCreator<StaticViewport>("TRANSITION");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(setViewport, (_, { latitude, longitude, zoom }) => ({
    latitude,
    longitude,
    transitionDuration: 0,
    zoom: Math.min(zoom, 12),
  }))
  .case(transitionViewport, (_, { latitude, longitude, zoom }) => ({
    latitude,
    longitude,
    transitionDuration: 3000,
    zoom: Math.min(zoom, 12),
  }))
  .build();

export const pixelsPerMeterSelector = createSelector(
  ({ latitude, longitude, zoom }) => ({ latitude, longitude, zoom }),
  viewport => {
    const { pixelsPerMeter: [x, y] } = getDistanceScales(viewport);
    return { x: Math.abs(x), y: Math.abs(y) };
  },
);
