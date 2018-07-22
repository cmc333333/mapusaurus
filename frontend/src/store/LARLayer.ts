import { Map, Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

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

export const setCounties = actionCreator<Geography[]>("SET_COUNTIES");
export const setLenders = actionCreator<Lender[]>("SET_LENDERS");
export const setLarData = actionCreator<LARPoint[]>("SET_LAR_DATA");
export const setMetros = actionCreator<Geography[]>("SET_METROS");


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

export const countyNamesSelector = createSelector(
  ({ counties }: LARLayer) => counties,
  (counties: Geography[]) => counties.filter(c => c.name).map(c => c.name).sort(),
);

export const lenderNamesSelector = createSelector(
  ({ lenders }: LARLayer) => lenders,
  (lenders: Lender[]) => lenders.filter(l => l.name).map(l => l.name).sort(),
);

export const metroNamesSelector = createSelector(
  ({ metros }: LARLayer) => metros,
  (metros: Geography[]) => metros.filter(m => m.name).map(m => m.name).sort(),
);
