import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  const { filters, year } = state.larLayer;
  const { latitude, longitude, zoom } = state.viewport;
  const filterValues: any = {};
  Object.keys(filters).forEach(key => {
    const asStr = filters[key].selected.join(",");
    if (asStr) {
      filterValues[key] = asStr;
    }
  });
  return qs.stringify(
    { ...filterValues, latitude, longitude, year, zoom },
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
