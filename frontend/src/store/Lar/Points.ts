import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchLar, LARPoint } from "../../apis/lar";

export default interface Points {
  raw: LARPoint[];
}

export const SAFE_INIT: Points = {
  raw: [],
};

const actionCreator = actionCreatorFactory("LAR/POINTS");
const asyncActionCreator = asyncFactory<Points>(actionCreator);

export const updatePoints = asyncActionCreator<void, LARPoint[]>(
  "UPDATE_POINTS",
  (_, dispatch, getState: () => any) => fetchLar(getState().lar.filters),
);

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(updatePoints.async.started, original => ({
    ...original,
    raw: [],
  }))
  .case(updatePoints.async.done, (original, { result }) => ({
    ...original,
    raw: result,
  }))
  .build();

function normalize({ houseCount, loanCount }: LARPoint): number {
  return houseCount ? loanCount / houseCount : 0;
}

export function toScatterPlot(point: LARPoint) {
  const { latitude, longitude } = point;
  // Area of a circle = pi * r * r, but since pi is a constant and we're only
  // displaying relative values, we can ignore it.
  const radius = Math.sqrt(normalize(point));
  return {
    radius,
    position: [longitude, latitude],
  };
}

export const scatterPlotSelector = createSelector(
  ({ raw }: Points) => raw,
  raw => raw.map(toScatterPlot),
);
