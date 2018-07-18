import * as qs from "qs";

import State from "./State";

/*
 * Serialize relevant portions of the state tree into a string
 */
export default function serialize(state: State): string {
  return qs.stringify(
    {
      ...state.viewport,
      counties: state.larLayer.config.counties.toArray(),
      lenders: state.larLayer.config.lenders.toArray(),
      metros: state.larLayer.config.metros.toArray(),
    },
    { arrayFormat: "brackets" },
  );
}
