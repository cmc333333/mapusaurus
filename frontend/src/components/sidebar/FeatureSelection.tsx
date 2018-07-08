import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import State from "../../store/State";
import FeatureCheckbox from "./FeatureCheckbox";

export function FeatureSelection({ features }) {
  return (
    <glamorous.Ul margin="0">
      {features.map(f => <FeatureCheckbox key={f.name} feature={f} />)}
    </glamorous.Ul>
  );
}
export default connect(
  ({ mapbox: { config: { features } } }: State) => ({ features }),
)(FeatureSelection);
