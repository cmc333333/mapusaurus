import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  const {
    lar: { filters, points: { scaleFactor } },
    mapbox: { choropleth, features },
    viewport: { latitude, longitude, zoom },
  } = state;
  const { year } = filters;
  const filterValues: any = {};
  Object.keys(filters)
    .filter(key => key !== "year" && filters[key].size)
    .forEach(key => {
      filterValues[key] = filters[key].join(",");
    });
  return qs.stringify(
    {
      ...filterValues,
      choropleth,
      latitude,
      longitude,
      scaleFactor,
      year,
      zoom,
      features: features.join(","),
    },
    { encode: false, skipNulls: true },
  );
}

export function setupSerialization(window, store) {
  let timer;
  store.subscribe(() => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(
      () => { window.location.hash = serialize(store.getState()); },
      1000,
    );
  });
}
