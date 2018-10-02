import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchGeos } from "../apis/geography";
import { fetchLenders } from "../apis/lenders";
import LARFilters from "./LARFilters";
import LARLayer, { addFilters } from "./LARLayer";
import Mapbox from "./Mapbox";
import Sidebar from "./Sidebar";
import Viewport from "./Viewport";
import Window from "./Window";

export default interface State {
  larFilters: LARFilters;
  larLayer: LARLayer;
  mapbox: Mapbox;
  sidebar: Sidebar;
  viewport: Viewport;
  window: Window;
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
    const { token } = state.mapbox;

    await Promise.all([
      fetchGeos(countyIds.concat(metroIds))
        .then(geos => dispatch(addFilters.action(geos))),
      fetchLenders(lenderIds)
        .then(lenders => dispatch(addFilters.action(lenders))),
    ]);
  },
);
