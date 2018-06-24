import { Set } from 'immutable';
import { createSelector } from 'reselect';

export interface Viewport {
  latitude: number,
  longitude: number,
  zoom: number,
}

export interface MapboxStyle {
  center: number[],
  layers: { id: string }[],
  zoom: number,
};

export type Store = {
  config: {
    choropleths: { id: string, name: string }[],
    features: { name: string, ids: Set<string> }[],
    style?: MapboxStyle,
    styleName: string,
    token: string,
  },
  viewport: Viewport,
  visibleLayers: Set<string>,
};

export const mapboxStyleSelector = createSelector(
  (state: Store) => state.config.style,
  (state: Store) => state.visibleLayers,
  (style, visibleLayers) => style && {
    ...style,
    layers: style.layers.filter(l => visibleLayers.has(l.id)),
  },
);

export const choroplethIds = createSelector(
  (state: Store) => state.config.choropleths,
  choropleths => choropleths.map(l => l.id),
);
