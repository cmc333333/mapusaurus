import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";
import typography from "../../util/typography";

import { addLayers, removeLayers } from "../../store/Mapbox";
import State from "../../store/State";

export function FeatureCheckbox({ addLayers, checked, feature, removeLayers }) {
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
