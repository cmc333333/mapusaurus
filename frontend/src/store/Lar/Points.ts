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

export const medianSelector = createSelector(
  ({ raw }: Points) => raw,
  raw => {
    if (!raw.length) {
      return NaN;
    }
    const median = raw[Math.floor((raw.length - 1) / 2)];
    return median.normalizedLoans;
  },
);

export const radiusFnSelector = createSelector(
  ({ scaleFactor }: Points) => scaleFactor,
  medianSelector,
  (scaleFactor, median) => (
    (point: LARPoint) =>
      // Area of a circle = pi * r * r
      Math.sqrt(point.normalizedLoans * scaleFactor * 4000 / median) / Math.PI
  ),
);

export const scatterPlotSelector = createSelector(
  (points: Points) => points,
  radiusFnSelector,
  (points, radiusFn) => points.raw.map(point => ({
    position: [point.longitude, point.latitude],
    radius: radiusFn(point),
  })),
);
