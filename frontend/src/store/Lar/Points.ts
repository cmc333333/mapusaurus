import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { asyncFactory } from "typescript-fsa-redux-thunk";

import { fetchLar, LARPoint } from "../../apis/lar";

export default interface Points {
  raw: LARPoint[];
  scaleFactor: number;
}

export const SAFE_INIT: Points = {
  raw: [],
  scaleFactor: 25,
};

const actionCreator = actionCreatorFactory("LAR/POINTS");
const asyncActionCreator = asyncFactory<Points>(actionCreator);

export const setScaleFactor = actionCreator<number>("SET_SCALE_FACTOR");
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
  .case(setScaleFactor, (original, scaleFactor) => ({
    ...original,
    scaleFactor,
  }))
  .build();

export function radius(area: number) {
  // Area of a circle = pi * r * r
  return Math.sqrt(area) / Math.PI;
}

export const scalarSelector = createSelector(
  (points: Points) => points,
  ({ raw, scaleFactor }) => {
    if (!raw.length) {
      return NaN;
    }
    const median = raw[Math.floor((raw.length - 1) / 2)];
    return median.normalizedLoans * Math.pow(1.1, 250 + scaleFactor);
  },
);

export const scatterPlotSelector = createSelector(
  ({ raw }: Points) => raw,
  scalarSelector,
  (raw, scalar) => raw.map(pt => ({
    position: [pt.longitude, pt.latitude],
    radius: radius(pt.normalizedLoans * scalar),
  })),
);
