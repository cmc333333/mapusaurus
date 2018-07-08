import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import State from "../../store/State";
import ChoroplethLink from "./ChoroplethLink";

export function ChoroplethSelection({ choropleths }) {
  return (
    <glamorous.Ul margin="0">
      {choropleths.map(layer => <ChoroplethLink key={layer.id} layer={layer} />)}
    </glamorous.Ul>
  );
}
export default connect(
  ({ mapbox: { config: { choropleths } } }: State) => ({ choropleths }),
)(ChoroplethSelection);
