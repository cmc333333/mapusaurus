import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  const { filters, year } = state.larLayer;
  const counties = filters.filter(f => f.entityType === "county").map(f => f.id);
  const lenders = filters.filter(f => f.entityType === "lender").map(f => f.id);
  const metros = filters.filter(f => f.entityType === "metro").map(f => f.id);
  return qs.stringify(
    {
      ...state.viewport,
      counties,
      lenders,
      metros,
      year,
    },
    { arrayFormat: "brackets" },
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
