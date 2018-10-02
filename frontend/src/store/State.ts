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
    const { token } = state.mapbox;

    await Promise.all([
      fetchGeos(state.larLayer.filters.county.map(c => c.id))
        .then(geos => dispatch(addFilters.action(["county", geos]))),
      fetchLenders(state.larLayer.filters.lender.map(l => l.id))
        .then(lenders => dispatch(addFilters.action(["lender", lenders]))),
      fetchGeos(state.larLayer.filters.metro.map(m => m.id))
        .then(geos => dispatch(addFilters.action(["metro", geos]))),
    ]);
  },
);
