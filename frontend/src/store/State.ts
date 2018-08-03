import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchGeos } from "../apis/geography";
import { fetchLenders } from "../apis/lenders";
import { fetchStyle } from "../apis/styles";
import LARLayer, { addFilters } from "./LARLayer";
import Mapbox, { setStyle } from "./Mapbox";
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
  async (state: State, dispatch: any) => {
    const countyIds = state.larLayer.filters
      .filter(e => e.entityType === "county").map(e => e.id);
    const lenderIds = state.larLayer.filters
      .filter(e => e.entityType === "lender").map(e => e.id);
    const metroIds = state.larLayer.filters
      .filter(e => e.entityType === "metro").map(e => e.id);
    const { styleName, token } = state.mapbox.config;

    await Promise.all([
      fetchGeos(countyIds.concat(metroIds))
        .then(geos => dispatch(addFilters.action(geos))),
      fetchLenders(lenderIds)
        .then(lenders => dispatch(addFilters.action(lenders))),
      fetchStyle(styleName, token).then(style => dispatch(setStyle(style))),
    ]);
  },
);
