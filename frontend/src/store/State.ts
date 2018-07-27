import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchGeos } from "../apis/geography";
import { fetchLar } from "../apis/lar";
import { fetchLenders } from "../apis/lenders";
import { fetchStyle } from "../apis/styles";
import LARLayer, {
  setCounties,
  setLarData,
  setLenders,
  setMetros,
} from "./LARLayer";
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
  async (state: State, dispatch) => {
    const countyIds = state.larLayer.counties.map(c => c.id);
    const lenderIds = state.larLayer.lenders.map(l => l.id);
    const metroIds = state.larLayer.metros.map(m => m.id);
    const { styleName, token } = state.mapbox.config;

    await Promise.all([
      fetchGeos(countyIds).then(geos => dispatch(setCounties(geos))),
      fetchLar(countyIds, lenderIds, metroIds).then(
        lar => dispatch(setLarData(lar)),
      ),
      fetchLenders(lenderIds).then(lenders => dispatch(setLenders(lenders))),
      fetchGeos(metroIds).then(geos => dispatch(setMetros(geos))),
      fetchStyle(styleName, token).then(style => dispatch(setStyle(style))),
    ]);
  },
);
