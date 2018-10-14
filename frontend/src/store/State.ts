import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchGeos } from "../apis/geography";
import { fetchLenders } from "../apis/lenders";
import LARLayer, { addOptions, FilterSelection, selectFilters } from "./LARLayer";
import Mapbox from "./Mapbox";
import Sidebar from "./Sidebar";
import Viewport from "./Viewport";
import Window from "./Window";

export default interface State {
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

    const asIds: FilterSelection = {};
    const { larLayer: { filters } }  = state;
    Object.keys(filters).forEach(filterName => {
      asIds[filterName] = filters[filterName].selected;
    });
    dispatch(selectFilters.action(asIds));

    await Promise.all([
      fetchGeos(state.larLayer.filters.county.selected)
        .then(geos => dispatch(addOptions({ county: geos }))),
      fetchLenders(state.larLayer.filters.lender.selected)
        .then(lenders => dispatch(addOptions({ lender: lenders }))),
      fetchGeos(state.larLayer.filters.metro.selected)
        .then(geos => dispatch(addOptions({ metro: geos }))),
    ]);
  },
);
