import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { toggleFeature } from "../../store/Mapbox";
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

export function mergeProps({ features }, { dispatch }, { name }) {
  return {
    name,
    checked: features.has(name),
    onChange: () => dispatch(toggleFeature(name)),
  };
}

export default connect(
  ({ mapbox: { features } }) => ({ features }),
  dispatch => ({ dispatch }),
  mergeProps,
)(FeatureCheckbox);
