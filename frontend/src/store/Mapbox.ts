import { Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import mapStyle, {
  allChoropleths,
  allFeatures,
  FeatureName,
  LayerId,
  MapKeyColor,
  mapKeyColors,
} from "../mapStyle";

export default interface Mapbox {
  choropleth: LayerId;
  features: Set<FeatureName>;
  token: string;
}

export const SAFE_INIT: Mapbox = {
  choropleth: allChoropleths.keySeq().get(0),
  features: Set(allFeatures.keys()),
  token: "",
};

const actionCreator = actionCreatorFactory("MAPBOX_LAYERS");

export const toggleFeature = actionCreator<string>("TOGGLE_FEATURE");
export const selectChoropleth = actionCreator<string>("SELECT_CHOROPLETH");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(toggleFeature, (original: Mapbox, feature: string) => ({
    ...original,
    features:
      original.features.has(feature) ?
      original.features.remove(feature) : original.features.add(feature),
  }))
  .case(selectChoropleth, (original: Mapbox, choropleth: string) => ({
    ...original,
    choropleth,
  }))
  .build();

export const visibleIdSelector = createSelector(
  ({ choropleth }: Mapbox) => choropleth,
  ({ features }: Mapbox) => features,
  (choropleth: LayerId, features: Set<FeatureName>) => features.reduce(
    (soFar: Set<LayerId>, feature: FeatureName) =>
      soFar.union(allFeatures.get(feature)),
    Set([choropleth]),
  ),
);

export const currentStyleSelector = createSelector(
  visibleIdSelector,
  (visible: Set<string>) => ({
    ...mapStyle,
    layers: mapStyle.layers.filter(l => visible.has(l.id)),
  }),
);

export const mapKeyColorsSelector = createSelector(
  ({ choropleth }: Mapbox) => choropleth,
  (choropleth: string) => mapKeyColors.get(choropleth),
);
