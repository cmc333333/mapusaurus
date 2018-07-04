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
  geoid: string;
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
  lenderName: string;
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

export const larScatterPlot = createSelector(
  ({ hmda }: Store) => hmda && hmda.lar,
  lar => lar ? lar.map(toScatterPlot) : [],
);
