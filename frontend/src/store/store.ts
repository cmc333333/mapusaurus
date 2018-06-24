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

const CIRCLE_RADIUS_MULTIPLIER = 1 / 5;
/*
 * Derive a circle radius based on the zoom level and number of loans.
 */
export function toCircle(lar: LARPoint, zoom: number) {
  const { geoid, latitude, longitude } = lar;

  const zoomMultiplier = Math.pow(2, zoom);
  const volume = lar.houseCount ? lar.loanCount / lar.houseCount : 0;
  // Area of a circle = pi * r * r, but since pi is a constant and we're only
  // displaying relative values, we can ignore it.
  const radius = Math.sqrt(volume) * zoomMultiplier * CIRCLE_RADIUS_MULTIPLIER;
  return { geoid, latitude, longitude, radius };
}

export const larCircles = createSelector(
  ({ hmda }: Store) => hmda && hmda.lar,
  ({ viewport }: Store) => viewport.zoom,
  (lar, zoom) => lar ? lar.map(l => toCircle(l, zoom)) : [],
);
