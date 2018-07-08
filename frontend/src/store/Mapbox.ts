import { Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

export interface Choropleth {
  id: string;
  name: string;
}

export interface Feature {
  name: string;
  ids: Set<string>;
}

export interface Config {
  choropleths: Choropleth[];
  features: Feature[];
  styleName: string;
  token: string;
}

export interface MapboxStyle {
  center: number[];
  layers: { id: string }[];
  zoom: number;
}

export default interface Mapbox {
  config: Config;
  style?: MapboxStyle;
  visible: Set<string>;
}

export const SAFE_INIT: Mapbox = {
  config: {
    choropleths: [],
    features: [],
    styleName: "",
    token: "",
  },
  visible: Set<string>(),
};

const actionCreator = actionCreatorFactory("MAPBOX_LAYERS");

export const addLayers = actionCreator<Set<string>>("ADD_LAYERS");
export const removeLayers = actionCreator<Set<string>>("REMOVE_LAYERS");
export const selectChoropleth = actionCreator<string>("SELECT_CHOROPLETH");
export const setStyle = actionCreator<MapboxStyle>("SET_STYLE");

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
    const choroplethIds = original.config.choropleths.map(c => c.id);
    return {
      ...original,
      visible: original.visible.subtract(choroplethIds).add(layerId),
    };
  })
  .case(setStyle, (original: Mapbox, style: MapboxStyle) => {
    const validIds = Set<string>(style.layers.map(l => l.id));
    const config = {
      ...original.config,
      // Remove invalid layer ids
      choropleths: original.config.choropleths.filter(l => validIds.has(l.id)),
      features: original.config.features.map(feature => ({
        ...feature,
        ids: feature.ids.intersect(validIds),
      })),
    };
    let visible = Set<string>();
    config.features.forEach(feature => {
      visible = visible.union(feature.ids);
    });
    if (config.choropleths.length) {
      visible = visible.add(config.choropleths[0].id);
    }
    return { config, style, visible };
  })
  .build();

export const currentStyleSelector = createSelector(
  ({ style }: Mapbox) => style,
  ({ visible }: Mapbox) => visible,
  (style: MapboxStyle, visible: Set<string>) => style && {
    ...style,
    layers: style.layers.filter(l => visible.has(l.id)),
  },
);
