import { Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import mapStyle, { choropleths, features } from "../mapStyle";

export default interface Mapbox {
  token: string;
  visible: Set<string>;
}

export const SAFE_INIT: Mapbox = {
  token: "",
  visible: features.valueSeq().reduce(
    (soFar: Set<string>, layerIds: Set<string>) => soFar.union(layerIds),
    Set<string>([choropleths.keySeq().get(0)]),
  ),
};

const actionCreator = actionCreatorFactory("MAPBOX_LAYERS");

export const addLayers = actionCreator<Set<string>>("ADD_LAYERS");
export const removeLayers = actionCreator<Set<string>>("REMOVE_LAYERS");
export const selectChoropleth = actionCreator<string>("SELECT_CHOROPLETH");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(addLayers, (original: Mapbox, layerIds: Set<string>) => ({
    ...original,
    visible: original.visible.union(layerIds),
  }))
  .case(removeLayers, (original: Mapbox, layerIds: Set<string>) => ({
    ...original,
    visible: original.visible.subtract(layerIds),
  }))
  .case(selectChoropleth, (original: Mapbox, layerId: string) => {
    return {
      ...original,
      visible: original.visible.subtract(choropleths.keySeq()).add(layerId),
    };
  })
  .build();

export const currentStyleSelector = createSelector(
  ({ visible }: Mapbox) => visible,
  (visible: Set<string>) => ({
    ...mapStyle,
    layers: mapStyle.layers.filter(l => visible.has(l.id)),
  }),
);
