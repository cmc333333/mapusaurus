import glamorous from "glamorous";
import * as React from "react";

import { allFeatures, FeatureName, LayerId } from "../../mapStyle";
import FeatureCheckbox from "./FeatureCheckbox";

export default function FeatureSelection() {
  const checkBoxes = allFeatures.keySeq().toArray()
    .map(name => <FeatureCheckbox key={name} name={name} />);
  return <glamorous.Ul margin="0">{checkBoxes}</glamorous.Ul>;
}
