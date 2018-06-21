import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";
import typography from "../../util/typography";

import { addLayers, removeLayers } from "../../store/actions";
import { Store } from "../../store/store";

function FeatureInputComponent({ addLayers, checked, feature, removeLayers }) {
  return (
    <glamorous.Li margin="0">
      <glamorous.Label
        display="block"
        paddingBottom={typography.rhythm(.25)}
        paddingLeft={typography.rhythm(1)}
        paddingRight={typography.rhythm(1)}
        paddingTop={typography.rhythm(.25)}
      >
        <glamorous.Input
          checked={checked}
          marginRight={typography.rhythm(.4)}
          onChange={checked ? removeLayers : addLayers}
          type="checkbox"
        />
        {feature.name}
      </glamorous.Label>
    </glamorous.Li>
  );
}
const FeatureInput = connect(
  ({ visibleLayers }: Store, { feature }) =>
    ({ checked: !visibleLayers.intersect(feature.ids).isEmpty() }),
  (dispatch, { feature }) => ({
    addLayers: () => dispatch(addLayers(feature.ids)),
    removeLayers: () => dispatch(removeLayers(feature.ids)),
  }),
)(FeatureInputComponent);

export function FeatureSelection({ features }) {
  return (
    <glamorous.Ul margin="0">
      {features.map(f => <FeatureInput key={f.name} feature={f} />)}
    </glamorous.Ul>
  );
}
export default connect(
  ({ config: { features } }: Store) => ({ features }),
)(FeatureSelection);
