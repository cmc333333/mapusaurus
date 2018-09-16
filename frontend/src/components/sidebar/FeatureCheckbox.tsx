import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { addLayers, removeLayers } from "../../store/Mapbox";
import State from "../../store/State";
import { largeSpace, mediumSpace, smallSpace } from "../../theme";

export function FeatureCheckbox({ checked, name, onChange }) {
  return (
    <glamorous.Li margin="0">
      <glamorous.Label
        display="block"
        paddingBottom={smallSpace}
        paddingLeft={largeSpace}
        paddingRight={largeSpace}
        paddingTop={smallSpace}
      >
        <glamorous.Input
          checked={checked}
          marginRight={mediumSpace}
          onChange={onChange}
          type="checkbox"
        />
        {name}
      </glamorous.Label>
    </glamorous.Li>
  );
}

export function mergeProps({ mapbox }, { dispatch }, { layerIds, name }) {
  const checked = !mapbox.visible.intersect(layerIds).isEmpty();
  return {
    checked,
    name,
    onChange: () => dispatch(
      checked ?  removeLayers(layerIds) : addLayers(layerIds),
    ),
  };
}

export default connect(
  ({ mapbox }) => ({ mapbox }),
  dispatch => ({ dispatch }),
  mergeProps,
)(FeatureCheckbox);
