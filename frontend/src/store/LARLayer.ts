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

export type EntityType = "county" | "lender" | "metro";
export class FilterEntity {
  public entityType: EntityType;
  public id: string;
  public name?: string;

  constructor(initParams: Partial<FilterEntity>) {
    Object.assign(this, initParams);
  }

  public sameAs(other: FilterEntity): boolean {
    return this.id === other.id && this.entityType === other.entityType;
  }

  public compareNameWith(other: FilterEntity): number {
    return (this.name || "").localeCompare(other.name || "");
  }
}

export default interface LARLayer {
  available: {
    years: number[];
  };
  filters: FilterEntity[];
  lar: LARPoint[];
  year: number;
}

export const SAFE_INIT: LARLayer = {
  available: { years: [] },
  filters: [],
  lar: [],
  year: NaN,
};

const actionCreator = actionCreatorFactory("LAR_LAYER");

export const setYear = actionCreator<number>("SET_YEAR");

const asyncActionCreator = asyncFactory<LARLayer>(actionCreator);

export function orderedUnion(
  oldEntries: FilterEntity[],
  toAdd: FilterEntity[],
): FilterEntity[] {
  const removed = oldEntries.filter(
    existing => !toAdd.some(added => added.sameAs(existing)),
  );
  // Ensure order is preserved
  return [...removed, ...toAdd].sort((l, r) => l.compareNameWith(r));
}

function filtersToLar(entities: FilterEntity[]) {
  return fetchLar(
    entities.filter(e => e.entityType === "county").map(e => e.id),
    entities.filter(e => e.entityType === "lender").map(e => e.id),
    entities.filter(e => e.entityType === "metro").map(e => e.id),
  );
}

export const addFilters = asyncActionCreator<FilterEntity[], LARPoint[]>(
  "ADD_FILTERS",
  (entities: FilterEntity[], dispatch, getState: () => any) => {
    const updated = orderedUnion(getState().larLayer.filters, entities);
    return filtersToLar(updated);
  },
);
export const removeFilter = asyncActionCreator<FilterEntity, LARPoint[]>(
  "REMOVE_FITLER",
  (entity: FilterEntity, dispatch, getState: () => any) => {
    const removed = getState().larLayer.filters.filter(e => !e.sameAs(entity));
    return filtersToLar(removed);
  },
);

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(
    addFilters.async.started,
    (original: LARLayer, toAdd: FilterEntity[]) => ({
      ...original,
      filters: orderedUnion(original.filters, toAdd),
      lar: [],
    }),
  ).case(
    removeFilter.async.started,
    (original: LARLayer, toRemove: FilterEntity) => ({
      ...original,
      filters: original.filters.filter(e => !e.sameAs(toRemove)),
      lar: [],
    }),
  ).cases(
    [addFilters.async.done, removeFilter.async.done],
    (original: LARLayer, { result }) => ({
      ...original,
      lar: result,
    }),
  ).case(
    setYear,
    (original: LARLayer, year: number) => {
      if (year === original.year) {
        return original;
      }
      return {
        ...original,
        year,
        filters: [],
        lar: [],
      };
    },
  ).build();

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
