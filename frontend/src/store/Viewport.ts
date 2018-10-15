import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

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
  zoom: 13,
};

const actionCreator = actionCreatorFactory("VIEWPORT");

export const setViewport = actionCreator<StaticViewport>("SET");
export const transitionViewport = actionCreator<StaticViewport>("TRANSITION");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(setViewport, (_, { latitude, longitude, zoom }) => ({
    latitude,
    longitude,
    zoom,
    transitionDuration: 0,
  }))
  .case(transitionViewport, (_, { latitude, longitude, zoom }) => ({
    latitude,
    longitude,
    zoom,
    transitionDuration: 3000,
  }))
  .build();
