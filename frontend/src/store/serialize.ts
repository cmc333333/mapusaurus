import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  return qs.stringify(
    {
      ...state.viewport,
      counties: state.larLayer.counties.map(c => c.id),
      lenders: state.larLayer.lenders.map(l => l.id),
      metros: state.larLayer.metros.map(m => m.id),
    },
    { arrayFormat: "brackets" },
  );
}
