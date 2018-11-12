import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  const { lar: { filters, points: { scaleFactor } } } = state;
  const { viewport: { latitude, longitude, zoom } } = state;
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
      latitude,
      longitude,
      scaleFactor,
      year,
      zoom,
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
