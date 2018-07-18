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

export interface ApiConfig {
  counties: Set<string>;
  lenders: Set<string>;
  metros: Set<string>;
}

export default interface LARLayer {
  config: ApiConfig;
  countyNames: Map<string, string>;
  lar: LARPoint[];
  lenderNames: Map<string, string>;
  metroNames: Map<string, string>;
}

export const SAFE_INIT: LARLayer = {
  config: {
    counties: Set<string>(),
    lenders: Set<string>(),
    metros: Set<string>(),
  },
  countyNames: Map<string, string>(),
  lar: [],
  lenderNames: Map<string, string>(),
  metroNames: Map<string, string>(),
};

const actionCreator = actionCreatorFactory("LAR_LAYER");

export const addCountyNames = actionCreator<Map<string, string>>("ADD_COUNTY_NAMES");
export const addLenderNames = actionCreator<Map<string, string>>("ADD_LENDER_NAMES");
export const addMetroNames = actionCreator<Map<string, string>>("ADD_METRO_NAMES");
export const setLarData = actionCreator<LARPoint[]>("SET_LAR_DATA");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(addCountyNames, (original: LARLayer, names: Map<string, string>) => ({
    ...original,
    countyNames: original.countyNames.merge(names),
  }))
  .case(addLenderNames, (original: LARLayer, names: Map<string, string>) => ({
    ...original,
    lenderNames: original.lenderNames.merge(names),
  }))
  .case(addMetroNames, (original: LARLayer, names: Map<string, string>) => ({
    ...original,
    metroNames: original.metroNames.merge(names),
  }))
  .case(setLarData, (original: LARLayer, lar: LARPoint[]) => ({
    ...original,
    lar,
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

export function reduceToNames(
  ids: Set<string>,
  nameMap: Map<string, string>,
): string[] {
  return ids.toArray()
    .filter(id => nameMap.has(id))
    .map(id => nameMap.get(id))
    .sort();
}

export const countyNamesSelector = createSelector(
  ({ config }: LARLayer) => config.counties,
  ({ countyNames }: LARLayer) => countyNames,
  reduceToNames,
);

export const lenderNamesSelector = createSelector(
  ({ config }: LARLayer) => config.lenders,
  ({ lenderNames }: LARLayer) => lenderNames,
  reduceToNames,
);

export const metroNamesSelector = createSelector(
  ({ config }: LARLayer) => config.metros,
  ({ metroNames }: LARLayer) => metroNames,
  reduceToNames,
);
