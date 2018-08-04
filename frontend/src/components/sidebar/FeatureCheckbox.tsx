import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { addLayers, removeLayers } from "../../store/Mapbox";
import State from "../../store/State";
import { largeSpace, mediumSpace, smallSpace } from "../../theme";

export function FeatureCheckbox({ addLayers, checked, feature, removeLayers }) {
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
          onChange={checked ? removeLayers : addLayers}
          type="checkbox"
        />
        {feature.name}
      </glamorous.Label>
    </glamorous.Li>
  );
}

export function mapStateToProps({ mapbox }: State, { feature }) {
  return { checked: !mapbox.visible.intersect(feature.ids).isEmpty() };
}

export function mapDispatchToProps(dispatch, { feature }) {
  return {
    addLayers: () => dispatch(addLayers(feature.ids)),
    removeLayers: () => dispatch(removeLayers(feature.ids)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeatureCheckbox);
