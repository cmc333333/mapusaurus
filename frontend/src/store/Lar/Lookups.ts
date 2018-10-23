import { Map } from "immutable";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchGeos, Geo } from "../../apis/geography";
import { fetchLenders } from "../../apis/lenders";

export type GeoId = string;
export type LenderId = string;
export type Year = number;

export default interface Lookups {
  geos: Map<GeoId, Geo>;
  lenders: Map<LenderId, string>;
  years: Year[];
}

export const SAFE_INIT: Lookups = {
  geos: Map<GeoId, Geo>(),
  lenders: Map<LenderId, string>(),
  years: [],
};

const actionCreator = actionCreatorFactory("LAR/LOOKUPS");
const asyncActionCreator = asyncFactory<Lookups>(actionCreator);

export const addGeos = actionCreator<Map<GeoId, Geo>>("ADD_GEOS");
export const addLenders = actionCreator<Map<LenderId, string>>("ADD_LENDERS");
export const initGeos = asyncActionCreator<void, Map<GeoId, Geo>>(
  "INIT_GEOS",
  (_, dispatch, getState: () => any) => {
    const { lar: { filters: { county, metro } } } = getState();
    return fetchGeos(county.union(metro));
  },
);
export const initLenders = asyncActionCreator<void, Map<LenderId, string>>(
  "INIT_LENDERS",
  (_, dispatch, getState: () => any) => {
    const { lar: { filters: { lender } } } = getState();
    return fetchLenders(lender);
  },
);

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(addGeos, (original, geos) => ({
    ...original,
    geos: original.geos.merge(geos),
  }))
  .case(addLenders, (original, lenders) => ({
    ...original,
    lenders: original.lenders.merge(lenders),
  }))
  .case(initGeos.async.done, (original, { result }) => ({
    ...original,
    geos: original.geos.merge(result),
  }))
  .case(initLenders.async.done, (original, { result }) => ({
    ...original,
    lenders: original.lenders.merge(result),
  }))
  .build();
