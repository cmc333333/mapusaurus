import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchLar } from "../apis/lar";

export interface LARPoint {
  geoid: string;
  houseCount: number;
  latitude: number;
  loanCount: number;
  longitude: number;
}

export interface Lender {
  id: string;
  name?: string;
}

export interface Geography {
  id: string;
  name?: string;
}

export default interface LARLayer {
  counties: Geography[];
  lar: LARPoint[];
  lenders: Lender[];
  metros: Geography[];
}

export const SAFE_INIT: LARLayer = {
  counties: [],
  lar: [],
  lenders: [],
  metros: [],
};

const actionCreator = actionCreatorFactory("LAR_LAYER");
const asyncActionCreator = asyncFactory<LARLayer>(actionCreator);

export const setCounties = actionCreator<Geography[]>("SET_COUNTIES");
export const setLenders = actionCreator<Lender[]>("SET_LENDERS");
export const setLarData = actionCreator<LARPoint[]>("SET_LAR_DATA");
export const setMetros = actionCreator<Geography[]>("SET_METROS");

export const addLender = asyncActionCreator<Lender, Lender[]>(
  "ADD_LENDER",
  async (lender: Lender, dispatch, getState: () => any) => {
    const old = getState().larLayer;
    const oldLenders = old.lenders.filter(l => l.id !== lender.id);
    // Ensure order is preserved
    const lenders = [...oldLenders, lender].sort(
      (l, r) => (l.name || "").localeCompare(r.name || ""),
    );
    const lar = await fetchLar(
      old.counties.map(c => c.id),
      lenders.map(l => l.id),
      old.metros.map(m => m.id),
    );
    dispatch(setLarData(lar));
    return lenders;
  },
);

export const removeLender = asyncActionCreator<string, Lender[]>(
  "REMOVE_LENDER",
  async (id: string, dispatch, getState: () => any) => {
    const old = getState().larLayer;
    const lenders = old.lenders.filter(l => l.id !== id);
    const lar = await fetchLar(
      old.counties.map(c => c.id),
      lenders.map(l => l.id),
      old.metros.map(m => m.id),
    );
    dispatch(setLarData(lar));
    return lenders;
  },
);

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(setCounties, (original: LARLayer, counties: Geography[]) => ({
    ...original,
    counties,
  }))
  .case(setLarData, (original: LARLayer, lar: LARPoint[]) => ({
    ...original,
    lar,
  }))
  .case(setLenders, (original: LARLayer, lenders: Lender[]) => ({
    ...original,
    lenders,
  }))
  .case(setMetros, (original: LARLayer, metros: Geography[]) => ({
    ...original,
    metros,
  }))
  .cases(
    [addLender.async.started, removeLender.async.started],
    (original: LARLayer) => ({ ...original, lar: [] }),
  )
  .cases(
    [addLender.async.done, removeLender.async.done],
    (original: LARLayer, { result: lenders }) => ({ ...original, lenders }),
  )
  .build();

export function toScatterPlot({
  houseCount,
  latitude,
  loanCount,
  longitude,
}: LARPoint) {
  const volume = houseCount ? loanCount / houseCount : 0;
  // Area of a circle = pi * r * r, but since pi is a constant and we're only
  // displaying relative values, we can ignore it.
  const radius = Math.sqrt(volume);
  return {
    radius,
    position: [longitude, latitude],
  };
}

export const scatterPlotSelector = createSelector(
  ({ lar }: LARLayer) => lar,
  lar => lar.map(toScatterPlot),
);

export const lenderSelector = createSelector(
  ({ lenders }: LARLayer) => lenders,
  lenders => lenders.filter(l => l.name),
);
