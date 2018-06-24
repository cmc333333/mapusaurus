import { Set } from "immutable";
import { createSelector } from "reselect";

export interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapboxStyle {
  center: number[];
  layers: { id: string }[];
  zoom: number;
}

export interface LARPoint {
  houseCount: number;
  latitude: number;
  loanCount: number;
  longitude: number;
}

export interface HMDA {
  config: {
    county?: string,
    lender: string,
    metro?: string,
  };
  lar: LARPoint[];
}

export interface Store {
  config: {
    choropleths: { id: string, name: string }[],
    features: { name: string, ids: Set<string> }[],
    style?: MapboxStyle,
    styleName: string,
    token: string,
  };
  hmda?: HMDA;
  viewport: Viewport;
  visibleLayers: Set<string>;
}

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

export const larData = createSelector(
  (state: Store) => state.hmda && state.hmda.lar,
  lar => lar ? lar : [],
);
