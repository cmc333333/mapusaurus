import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

export default interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export const SAFE_INIT: Viewport = {
  latitude: 41.88,
  longitude: -87.64,
  zoom: 13,
};

const actionCreator = actionCreatorFactory("VIEWPORT");

export const setViewport = actionCreator<Viewport>("SET");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(setViewport, (original: Viewport, viewport: Viewport) => viewport)
  .build();
