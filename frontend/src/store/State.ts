import { Map, Set } from "immutable";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import {
  fetchCountyNames,
  fetchLar,
  fetchLenderNames,
  fetchMetroNames,
  fetchStyle ,
} from "../util/apis";
import LARLayer from "./LARLayer";
import Mapbox from "./Mapbox";
import Viewport from "./Viewport";

export default interface State {
  larLayer: LARLayer;
  mapbox: Mapbox;
  viewport: Viewport;
}

const asyncActionCreator = asyncFactory<State>(actionCreatorFactory("ROOT"));

export const initCalls = asyncActionCreator<State, void>(
  "INIT_CALLS",
  /*
   * Kickoff fetch/load of data from the API.
   */
  async (state: State, dispatch) => {
    await Promise.all([
      fetchCountyNames(state).then(dispatch),
      fetchLar(state).then(dispatch),
      fetchLenderNames(state).then(dispatch),
      fetchMetroNames(state).then(dispatch),
      fetchStyle(state).then(dispatch),
    ]);
  },
);
